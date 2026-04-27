//! Typed stage events with a single-writer jsonl sink.
//!
//! ## Why
//! Every xtask command has a pipeline of named stages. The existing
//! [`stage`](crate::stage) helpers print to terminal but leave no
//! durable, tool-parseable record. [`EventSink`] fills that gap with
//! a jsonl file at a caller-chosen path, plus an in-memory
//! accumulator read back for end-of-run SUMMARY sections.
//!
//! ## Shape
//! `StageEvent` is the wire type. `StageStatus` is a closed enum of
//! lifecycle transitions. Callers build events via [`EventSink::start`]
//! for timed pairs (returns a [`StageGuard`] that emits `Ok`/`Fail` on
//! drop or via explicit consumption) or [`EventSink::emit`] for one-shots.
//!
//! ## Threading
//! CSP by design. [`EventSink::open`] spawns one writer thread that owns
//! the log file. Every emitter — including threads inside
//! [`monitor_cargo_child`](crate::stage::monitor_cargo_child) and
//! [`exec_tee_log`](crate::workspace::Workspace::exec_tee_log) — holds
//! a cloneable [`EventSender`]. No locks; the channel is the
//! synchronization point. `EventSink::finish` closes the send side,
//! joins the writer, and returns the accumulated events for summary.
//!
//! Terminal output is NOT affected — [`crate::stage`] keeps printing.
//! Events are a parallel telemetry stream, not a replacement.

use anyhow::{Context, Result};
use serde::Serialize;
use std::fs::{File, OpenOptions};
use std::io::{BufWriter, Write};
use std::path::{Path, PathBuf};
use std::sync::mpsc;
use std::thread;
use std::time::{Instant, SystemTime, UNIX_EPOCH};

/// Lifecycle transition for a stage.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum StageStatus {
    /// Stage began. Duration not yet known.
    Start,
    /// Stage completed successfully.
    Ok,
    /// Stage completed with a non-fatal warning.
    Warn,
    /// Stage was skipped (not applicable this run).
    Skip,
    /// Stage failed terminally.
    Fail,
}

impl StageStatus {
    /// Stable lowercase label used in human-readable summaries and
    /// log prefixes. Matches the `serde(rename_all = "snake_case")`
    /// wire form so logs and jsonl emit the same string.
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Start => "start",
            Self::Ok => "ok",
            Self::Warn => "warn",
            Self::Skip => "skip",
            Self::Fail => "fail",
        }
    }
}

/// One stage event — emitted to the jsonl sink and accumulated for summary.
#[derive(Debug, Clone, Serialize)]
pub struct StageEvent {
    /// Unix epoch milliseconds at the moment of emission.
    pub unix_ms: u64,
    /// Monotonic milliseconds since [`EventSink::open`].
    pub elapsed_ms: u64,
    /// Stable stage identifier (e.g. `tauri-bundle`, `sccache-init`, `preflight`).
    pub stage_id: String,
    /// Lifecycle transition.
    pub status: StageStatus,
    /// Duration of the stage itself — set on `Ok`/`Warn`/`Fail`; `None` for `Start`/`Skip`.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration_ms: Option<u64>,
    /// Optional classification tag (e.g. `compile`, `nsis_failed`, `defender_lock`).
    /// Free-form string so callers can evolve taxonomy without a crate-wide enum.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub classification: Option<String>,
    /// Human-readable detail — one line, no newlines.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<String>,
    /// Remediation hint for failures (shown in the summary).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hint: Option<String>,
}

/// Clone-able sender half. Hand to threads/closures that need to emit.
#[derive(Clone)]
pub struct EventSender {
    tx: mpsc::Sender<StageEvent>,
    start: Instant,
}

impl EventSender {
    /// Build and send a one-shot event. Fails silently if the writer is gone.
    pub fn emit(&self, stage_id: &str, status: StageStatus, builder: EventBuilder) {
        let event = builder.into_event(stage_id, status, self.start);
        // Drop send errors: if the receiver is gone we're tearing down and
        // there is nothing useful to do with the error.
        let _ = self.tx.send(event);
    }

    /// Start a timed stage. Returns a guard that emits `Ok` on success via
    /// [`StageGuard::ok`] or `Fail` via [`StageGuard::fail`]. If dropped
    /// without explicit outcome, emits `Fail` with classification `dropped` —
    /// silent stages are a bug.
    pub fn start(&self, stage_id: &str) -> StageGuard {
        self.emit(stage_id, StageStatus::Start, EventBuilder::new());
        StageGuard {
            sender: self.clone(),
            stage_id: stage_id.to_string(),
            stage_start: Instant::now(),
            resolved: false,
        }
    }
}

/// Fluent builder for optional event fields.
#[derive(Default, Clone)]
pub struct EventBuilder {
    classification: Option<String>,
    detail: Option<String>,
    hint: Option<String>,
}

impl EventBuilder {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn classification(mut self, class: impl Into<String>) -> Self {
        self.classification = Some(class.into());
        self
    }

    pub fn detail(mut self, detail: impl Into<String>) -> Self {
        self.detail = Some(detail.into());
        self
    }

    pub fn hint(mut self, hint: impl Into<String>) -> Self {
        self.hint = Some(hint.into());
        self
    }

    fn into_event(self, stage_id: &str, status: StageStatus, start: Instant) -> StageEvent {
        let unix_ms = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_millis() as u64)
            .unwrap_or(0);
        StageEvent {
            unix_ms,
            elapsed_ms: start.elapsed().as_millis() as u64,
            stage_id: stage_id.to_string(),
            status,
            duration_ms: None,
            classification: self.classification,
            detail: self.detail,
            hint: self.hint,
        }
    }
}

/// Timed-stage guard returned by [`EventSender::start`].
///
/// Emits a `Fail` on drop if neither [`StageGuard::ok`], [`StageGuard::warn`],
/// [`StageGuard::skip`], nor [`StageGuard::fail`] has been called — forcing
/// every stage to resolve explicitly, so a silent pass cannot masquerade
/// as success.
pub struct StageGuard {
    sender: EventSender,
    stage_id: String,
    stage_start: Instant,
    resolved: bool,
}

impl StageGuard {
    pub fn ok(mut self) {
        self.resolve(StageStatus::Ok, EventBuilder::new());
    }

    pub fn ok_with(mut self, builder: EventBuilder) {
        self.resolve(StageStatus::Ok, builder);
    }

    pub fn warn(mut self, builder: EventBuilder) {
        self.resolve(StageStatus::Warn, builder);
    }

    pub fn skip(mut self, builder: EventBuilder) {
        self.resolve(StageStatus::Skip, builder);
    }

    pub fn fail(mut self, builder: EventBuilder) {
        self.resolve(StageStatus::Fail, builder);
    }

    fn resolve(&mut self, status: StageStatus, builder: EventBuilder) {
        if self.resolved {
            return;
        }
        self.resolved = true;
        let mut event = builder.into_event(&self.stage_id, status, self.sender.start);
        event.duration_ms = Some(self.stage_start.elapsed().as_millis() as u64);
        let _ = self.sender.tx.send(event);
    }
}

impl Drop for StageGuard {
    fn drop(&mut self) {
        if !self.resolved {
            self.resolve(
                StageStatus::Fail,
                EventBuilder::new()
                    .classification("dropped")
                    .detail("stage guard dropped without explicit resolution"),
            );
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// EventSink — owns the writer thread + log file
// ═══════════════════════════════════════════════════════════════

/// Single-writer jsonl sink. Spawns one thread that owns the file;
/// callers emit through cloneable [`EventSender`]s.
pub struct EventSink {
    sender: EventSender,
    writer: Option<thread::JoinHandle<Result<Vec<StageEvent>>>>,
    log_path: PathBuf,
}

impl EventSink {
    /// Open the sink. Truncates the log file on each run so the tail
    /// always reflects the most recent xtask invocation.
    pub fn open(log_path: &Path) -> Result<Self> {
        if let Some(parent) = log_path.parent() {
            std::fs::create_dir_all(parent)
                .with_context(|| format!("creating event log dir {}", parent.display()))?;
        }
        let file = OpenOptions::new()
            .create(true)
            .truncate(true)
            .write(true)
            .open(log_path)
            .with_context(|| format!("opening event log {}", log_path.display()))?;

        let (tx, rx) = mpsc::channel::<StageEvent>();
        let log_path_owned = log_path.to_path_buf();
        let writer = thread::spawn(move || writer_thread(file, rx, log_path_owned));

        Ok(Self {
            sender: EventSender {
                tx,
                start: Instant::now(),
            },
            writer: Some(writer),
            log_path: log_path.to_path_buf(),
        })
    }

    /// Clone the sender half. Every call site that emits holds one of these.
    pub fn sender(&self) -> EventSender {
        self.sender.clone()
    }

    /// One-shot emission from the owner thread — convenience for callers
    /// that don't need to clone a sender.
    pub fn emit(&self, stage_id: &str, status: StageStatus, builder: EventBuilder) {
        self.sender.emit(stage_id, status, builder);
    }

    /// Start a timed stage from the owner thread.
    pub fn start(&self, stage_id: &str) -> StageGuard {
        self.sender.start(stage_id)
    }

    /// Absolute path to the jsonl log file — useful for the SUMMARY section.
    pub fn log_path(&self) -> &Path {
        &self.log_path
    }

    /// Close the channel, join the writer thread, and return the accumulated events.
    ///
    /// Callers typically invoke this at the end of a command to drive a
    /// SUMMARY section that counts ok/fail/skip and surfaces hints for
    /// failed stages. The jsonl file on disk is the durable record;
    /// the returned vector is a convenience for same-process summaries.
    pub fn finish(mut self) -> Result<Vec<StageEvent>> {
        // Drop the sender owned by this struct. The cloned senders held
        // by call sites may still be alive — the writer thread only exits
        // when ALL senders drop.
        drop(self.sender);
        let handle = self
            .writer
            .take()
            .context("EventSink::finish called twice")?;
        handle
            .join()
            .map_err(|_| anyhow::anyhow!("event writer thread panicked"))?
            .with_context(|| format!("event writer failed for {}", self.log_path.display()))
    }
}

fn writer_thread(
    file: File,
    rx: mpsc::Receiver<StageEvent>,
    log_path: PathBuf,
) -> Result<Vec<StageEvent>> {
    let mut writer = BufWriter::new(file);
    let mut accumulated = Vec::<StageEvent>::new();

    for event in rx {
        let line = serde_json::to_string(&event)
            .with_context(|| format!("serializing event for stage {}", event.stage_id))?;
        writeln!(writer, "{line}")
            .with_context(|| format!("writing event log {}", log_path.display()))?;
        accumulated.push(event);
    }

    writer
        .flush()
        .with_context(|| format!("final flush of event log {}", log_path.display()))?;
    Ok(accumulated)
}

// ═══════════════════════════════════════════════════════════════
// Summary helpers
// ═══════════════════════════════════════════════════════════════

/// Counts of terminal statuses across a run.
#[derive(Debug, Clone, Copy, Default)]
pub struct SummaryCounts {
    pub ok: usize,
    pub warn: usize,
    pub skip: usize,
    pub fail: usize,
}

impl SummaryCounts {
    pub fn from_events(events: &[StageEvent]) -> Self {
        let mut c = Self::default();
        for e in events {
            match e.status {
                StageStatus::Ok => c.ok += 1,
                StageStatus::Warn => c.warn += 1,
                StageStatus::Skip => c.skip += 1,
                StageStatus::Fail => c.fail += 1,
                StageStatus::Start => {}
            }
        }
        c
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Test-specific log path under the OS temp dir. Test name keeps runs
    /// isolated even when executed concurrently. No new crate dep required.
    fn test_log_path(test_name: &str) -> PathBuf {
        let pid = std::process::id();
        std::env::temp_dir().join(format!("xtask-events-{test_name}-{pid}.jsonl"))
    }

    #[test]
    fn emit_and_finish_roundtrip() {
        let log_path = test_log_path("roundtrip");
        let _ = std::fs::remove_file(&log_path);
        let sink = EventSink::open(&log_path).expect("open sink");

        sink.emit(
            "stage-a",
            StageStatus::Ok,
            EventBuilder::new().detail("first"),
        );

        // Timed stage via guard.
        let guard = sink.start("stage-b");
        guard.ok_with(EventBuilder::new().detail("second"));

        // Simulated failure via guard drop — emits Fail("dropped").
        {
            let _ = sink.start("stage-dropped");
        }

        let events = sink.finish().expect("finish");
        let counts = SummaryCounts::from_events(&events);

        assert_eq!(counts.ok, 2, "expected 2 ok, got {counts:?}");
        assert_eq!(
            counts.fail, 1,
            "expected 1 fail (from drop), got {counts:?}"
        );
        // start events: one for stage-b, one for stage-dropped
        let starts = events
            .iter()
            .filter(|e| e.status == StageStatus::Start)
            .count();
        assert_eq!(starts, 2, "expected 2 start events, got {starts}");

        // File on disk has the full stream.
        let file_content = std::fs::read_to_string(&log_path).expect("read log");
        assert_eq!(
            file_content.lines().count(),
            events.len(),
            "jsonl line count must match events count"
        );
    }

    #[test]
    fn guard_fail_records_classification_and_hint() {
        let log_path = test_log_path("guard-fail");
        let _ = std::fs::remove_file(&log_path);
        let sink = EventSink::open(&log_path).expect("open sink");

        let guard = sink.start("nsis-bundle");
        guard.fail(
            EventBuilder::new()
                .classification("nsis_failed")
                .hint("check makensis output"),
        );

        let events = sink.finish().expect("finish");
        let fail = events
            .iter()
            .find(|e| e.status == StageStatus::Fail)
            .expect("fail event");
        assert_eq!(fail.stage_id, "nsis-bundle");
        assert_eq!(fail.classification.as_deref(), Some("nsis_failed"));
        assert_eq!(fail.hint.as_deref(), Some("check makensis output"));
        assert!(
            fail.duration_ms.is_some(),
            "duration_ms must be set on fail"
        );
    }
}
