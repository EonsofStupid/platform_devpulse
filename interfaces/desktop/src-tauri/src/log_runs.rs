//! Each run's logs in a folder of its own, kept by policy (master plan M8).
//!
//! A run is one boot of `DevPulse`. Its logs live in
//! `{data_dir}/logs/runs/<run id>/`, where the id is the boot's UTC time in
//! ISO 8601 basic form (`20261022T025754Z`): it sorts, and its timezone is
//! explicit. Inside, every file is named by its kind ([`LogFile`]) with no
//! timestamp, so one run's session log, stderr and crash records sit
//! together.
//!
//! At boot, older runs are judged against the policy (`[logs]`, the
//! engine's `LogsPolicy`):
//! - the newest `keep_runs` stay;
//! - a failed run (it holds a crash record, a panic in its stderr, or a boot
//!   log without READY) younger than `failed_run_days` is pinned, and the
//!   newest `keep_failed_runs` of those stay besides;
//! - while the folder is over `max_total_mb`, the oldest runs that are not
//!   pinned go first.
//!
//! With `prune` off nothing is removed; the report says what would go.
//! Files from before runs existed (`session-<ts>.jsonl`, `stderr-<ts>.log`,
//! `crash-<ts>.json` in `logs/`) are first moved into run folders by their
//! shared timestamp; nothing is deleted in that move.

use std::path::{Path, PathBuf};

use chrono::{DateTime, Local, NaiveDateTime, TimeZone, Utc};
use devpulse_engine::platform::config::runtime::logs::{LoadedPolicy, LogsPolicy};
use serde::Serialize;

/// The kinds of file a run folder holds, each under one fixed name.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LogFile {
    /// Every tracing event of the run, as JSON lines.
    Session,
    /// Everything the process wrote to stderr.
    Stderr,
    /// One JSON record per panic, appended.
    Crash,
    /// The boot pipeline's progress.
    Boot,
    /// What the retention policy decided at the start of the run.
    Retention,
}

impl LogFile {
    /// The file's name inside a run folder.
    #[must_use]
    pub const fn name(self) -> &'static str {
        match self {
            Self::Session => "session.jsonl",
            Self::Stderr => "stderr.log",
            Self::Crash => "crash.jsonl",
            Self::Boot => "boot.log",
            Self::Retention => "retention.json",
        }
    }
}

/// The folder that holds every run.
#[must_use]
pub fn runs_root(data_dir: &Path) -> PathBuf {
    data_dir.join("logs").join("runs")
}

/// A run's id: when it started, in UTC, ISO 8601 basic form.
#[must_use]
pub fn run_id(at: DateTime<Utc>) -> String {
    at.format("%Y%m%dT%H%M%SZ").to_string()
}

/// When a run started, read from its id (a `-N` suffix is allowed).
fn started(id: &str) -> Option<DateTime<Utc>> {
    let stamp = id.split('-').next()?;
    NaiveDateTime::parse_from_str(stamp, "%Y%m%dT%H%M%SZ")
        .ok()
        .map(|naive| naive.and_utc())
}

/// This boot's run.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Run {
    id: String,
    dir: PathBuf,
}

impl Run {
    /// Make the run's folder. Two boots in the same second get `-2`, `-3`…
    ///
    /// # Errors
    /// When the folder cannot be made.
    pub fn start(data_dir: &Path, at: DateTime<Utc>) -> std::io::Result<Self> {
        let root = runs_root(data_dir);
        std::fs::create_dir_all(&root)?;
        let base = run_id(at);
        let mut id = base.clone();
        for n in 2..=100 {
            let dir = root.join(&id);
            match std::fs::create_dir(&dir) {
                Ok(()) => return Ok(Self { id, dir }),
                Err(e) if e.kind() == std::io::ErrorKind::AlreadyExists => {
                    id = format!("{base}-{n}");
                }
                Err(e) => return Err(e),
            }
        }
        Err(std::io::Error::other(format!(
            "100 runs started in the second {base}"
        )))
    }

    /// The run's id.
    #[must_use]
    pub fn id(&self) -> &str {
        &self.id
    }

    /// The run's file of a kind.
    #[must_use]
    pub fn file(&self, kind: LogFile) -> PathBuf {
        self.dir.join(kind.name())
    }
}

/// The newest run's file of a kind, when a run has one.
#[must_use]
pub fn newest_run_file(data_dir: &Path, kind: LogFile) -> Option<PathBuf> {
    let root = runs_root(data_dir);
    let mut ids = run_ids(&root);
    ids.sort();
    ids.into_iter()
        .rev()
        .map(|id| root.join(id).join(kind.name()))
        .find(|path| path.exists())
}

/// The names of the run folders under `root`; anything else is ignored.
fn run_ids(root: &Path) -> Vec<String> {
    std::fs::read_dir(root)
        .map(|entries| {
            entries
                .filter_map(Result::ok)
                .filter(|e| e.path().is_dir())
                .map(|e| e.file_name().to_string_lossy().into_owned())
                .filter(|name| started(name).is_some())
                .collect()
        })
        .unwrap_or_default()
}

/// Files from before runs existed: the prefix and extension, and the kind's
/// name each becomes in its run folder.
const LEGACY: [(&str, &str, &str); 3] = [
    ("session-", ".jsonl", "session.jsonl"),
    ("stderr-", ".log", "stderr.log"),
    ("crash-", ".json", "crash.json"),
];

/// Move files from before runs existed into run folders by their shared
/// local timestamp. Nothing is deleted or overwritten: a file whose name is
/// taken in its run folder keeps its old name there. Returns each move.
pub fn adopt_legacy(data_dir: &Path) -> Vec<String> {
    let logs = data_dir.join("logs");
    let Ok(entries) = std::fs::read_dir(&logs) else {
        return Vec::new();
    };
    let mut names: Vec<String> = entries
        .filter_map(Result::ok)
        .filter(|e| e.path().is_file())
        .map(|e| e.file_name().to_string_lossy().into_owned())
        .collect();
    names.sort();
    let root = runs_root(data_dir);
    let mut moved = Vec::new();
    for name in names {
        let Some((stamp, kind)) = LEGACY.iter().find_map(|(prefix, ext, kind)| {
            let stamp = name.strip_prefix(prefix)?.strip_suffix(ext)?;
            Some((stamp.to_owned(), *kind))
        }) else {
            continue;
        };
        let Some(id) = legacy_run_id(&stamp) else {
            continue;
        };
        let dir = root.join(&id);
        if std::fs::create_dir_all(&dir).is_err() {
            continue;
        }
        let to = if dir.join(kind).exists() {
            dir.join(&name)
        } else {
            dir.join(kind)
        };
        if to.exists() {
            continue;
        }
        if std::fs::rename(logs.join(&name), &to).is_ok() {
            let file = to.file_name().map(|f| f.to_string_lossy().into_owned());
            moved.push(format!("{name} → runs/{id}/{}", file.unwrap_or_default()));
        }
    }
    moved
}

/// A legacy local timestamp (`2026-10-21-225754`) as a run id in UTC.
fn legacy_run_id(stamp: &str) -> Option<String> {
    let naive = NaiveDateTime::parse_from_str(stamp, "%Y-%m-%d-%H%M%S").ok()?;
    let local = Local.from_local_datetime(&naive).earliest()?;
    Some(run_id(local.with_timezone(&Utc)))
}

/// Why a run stays or goes.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum Reason {
    /// This boot.
    Current,
    /// Among the newest `keep_runs`.
    Newest,
    /// A failed run within `failed_run_days` and `keep_failed_runs`.
    Failed,
    /// Older than the newest `keep_runs`.
    BeyondKeepRuns,
    /// A failed run older than `failed_run_days`.
    FailedTooOld,
    /// A failed run beyond `keep_failed_runs`.
    BeyondKeepFailed,
    /// Removed so the folder fits `max_total_mb`.
    OverTotalCap,
}

/// What the policy decided about one run.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Verdict {
    /// The run's id.
    pub run: String,
    /// Its size on disk, in KB.
    pub kb: u64,
    /// It failed (a crash, a panic, a boot without READY).
    pub failed: bool,
    /// Why it stays or goes.
    pub reason: Reason,
}

/// The policy's decision at the start of a run.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct RetentionReport {
    /// This boot's run.
    pub run: String,
    /// The policy applied.
    pub policy: LogsPolicy,
    /// Why your `[logs]` was not used, when it was not.
    pub refused_policy: Vec<String>,
    /// Files from before runs existed, moved into run folders.
    pub adopted: Vec<String>,
    /// Runs that stay.
    pub kept: Vec<Verdict>,
    /// Runs that go: removed when `prune` is on, otherwise only reported.
    pub gone: Vec<Verdict>,
    /// Removals that failed.
    pub errors: Vec<String>,
}

/// One run as the policy sees it.
struct Seen {
    id: String,
    started: DateTime<Utc>,
    bytes: u64,
    failed: bool,
}

/// Judge every run against the policy: what stays and what goes, each with
/// its reason, newest first.
fn judge(
    mut runs: Vec<Seen>,
    current: &str,
    policy: &LogsPolicy,
    now: DateTime<Utc>,
) -> (Vec<Verdict>, Vec<Verdict>) {
    runs.sort_by(|a, b| b.started.cmp(&a.started).then_with(|| b.id.cmp(&a.id)));
    let keep_runs = usize::try_from(policy.keep_runs).unwrap_or(usize::MAX);
    let keep_failed = usize::try_from(policy.keep_failed_runs).unwrap_or(usize::MAX);
    let max_age = chrono::Duration::days(i64::from(policy.failed_run_days));
    let verdict = |run: &Seen, reason| Verdict {
        run: run.id.clone(),
        kb: run.bytes.div_ceil(1024),
        failed: run.failed,
        reason,
    };
    // Kept runs with their bytes and whether the size cap may take them.
    let mut kept: Vec<(Verdict, u64, bool)> = Vec::new();
    let mut gone = Vec::new();
    let (mut newest, mut failed_kept) = (0usize, 0usize);
    for run in &runs {
        let young = now.signed_duration_since(run.started) <= max_age;
        let pinned_failure = run.failed && young;
        if run.id == current {
            newest += 1;
            kept.push((verdict(run, Reason::Current), run.bytes, true));
        } else if newest < keep_runs {
            newest += 1;
            kept.push((verdict(run, Reason::Newest), run.bytes, pinned_failure));
        } else if pinned_failure && failed_kept < keep_failed {
            failed_kept += 1;
            kept.push((verdict(run, Reason::Failed), run.bytes, true));
        } else {
            let reason = match (run.failed, young) {
                (true, false) => Reason::FailedTooOld,
                (true, true) => Reason::BeyondKeepFailed,
                (false, _) => Reason::BeyondKeepRuns,
            };
            gone.push(verdict(run, reason));
        }
    }
    let cap = policy.max_total_mb.saturating_mul(1024 * 1024);
    let mut total: u64 = kept.iter().map(|(_, bytes, _)| bytes).sum();
    while total > cap {
        let Some(oldest) = kept.iter().rposition(|(_, _, pinned)| !pinned) else {
            break;
        };
        let (mut run, bytes, _) = kept.remove(oldest);
        run.reason = Reason::OverTotalCap;
        total = total.saturating_sub(bytes);
        gone.push(run);
    }
    (kept.into_iter().map(|(v, _, _)| v).collect(), gone)
}

/// The run failed: it holds a crash record, a panic in its stderr, or a
/// boot log without READY.
fn failed(dir: &Path) -> bool {
    let has = |path: PathBuf, needle: &str| {
        std::fs::read(path).is_ok_and(|bytes| {
            bytes
                .windows(needle.len())
                .any(|window| window == needle.as_bytes())
        })
    };
    let boot = dir.join(LogFile::Boot.name());
    dir.join(LogFile::Crash.name()).exists()
        || dir.join("crash.json").exists()
        || has(dir.join(LogFile::Stderr.name()), "panicked at")
        || (boot.exists() && !has(boot, "[READY]"))
}

/// A folder's size: the bytes of the files in it.
fn bytes_in(dir: &Path) -> u64 {
    std::fs::read_dir(dir)
        .map(|entries| {
            entries
                .filter_map(Result::ok)
                .filter_map(|e| e.metadata().ok())
                .filter(std::fs::Metadata::is_file)
                .map(|m| m.len())
                .sum()
        })
        .unwrap_or(0)
}

/// Judge every run against the policy at the start of `current`, remove
/// what goes when `prune` is on, and write the report into the run.
pub fn retain(
    data_dir: &Path,
    current: &Run,
    loaded: LoadedPolicy,
    adopted: Vec<String>,
    now: DateTime<Utc>,
) -> RetentionReport {
    let root = runs_root(data_dir);
    let seen: Vec<Seen> = run_ids(&root)
        .into_iter()
        .filter_map(|id| {
            let dir = root.join(&id);
            Some(Seen {
                started: started(&id)?,
                bytes: bytes_in(&dir),
                failed: failed(&dir),
                id,
            })
        })
        .collect();
    let (kept, gone) = judge(seen, current.id(), &loaded.policy, now);
    let mut errors = Vec::new();
    if loaded.policy.prune {
        for verdict in &gone {
            if let Err(e) = std::fs::remove_dir_all(root.join(&verdict.run)) {
                errors.push(format!("runs/{}: {e}", verdict.run));
            }
        }
    }
    let report = RetentionReport {
        run: current.id().to_owned(),
        policy: loaded.policy,
        refused_policy: loaded.refused,
        adopted,
        kept,
        gone,
        errors,
    };
    if let Ok(text) = serde_json::to_string_pretty(&report) {
        let _ = std::fs::write(current.file(LogFile::Retention), text);
    }
    report
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;

    fn policy() -> LogsPolicy {
        LogsPolicy {
            keep_runs: 3,
            keep_failed_runs: 2,
            failed_run_days: 30,
            max_total_mb: 1024,
            keep_free_mb: 1024,
            max_file_mb: 256,
            prune: false,
        }
    }

    fn temp(name: &str) -> PathBuf {
        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_nanos())
            .unwrap_or(0);
        let dir = std::env::temp_dir().join(format!("devpulse-runs-{name}-{nanos}"));
        std::fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn at(day: u32, second: u32) -> DateTime<Utc> {
        Utc.with_ymd_and_hms(2026, 10, day, 12, 0, second).unwrap()
    }

    fn seen(day: u32, failed: bool, kb: u64) -> Seen {
        Seen {
            id: run_id(at(day, 0)),
            started: at(day, 0),
            bytes: kb * 1024,
            failed,
        }
    }

    fn ids(verdicts: &[Verdict]) -> Vec<(String, Reason)> {
        verdicts
            .iter()
            .map(|v| (v.run[6..8].to_owned(), v.reason))
            .collect()
    }

    #[test]
    fn a_run_id_is_its_start_in_utc() {
        assert_eq!(run_id(at(22, 54)), "20261022T120054Z");
        assert_eq!(started("20261022T120054Z"), Some(at(22, 54)));
        assert_eq!(started("20261022T120054Z-2"), Some(at(22, 54)));
        assert_eq!(started("legacy"), None);
    }

    #[test]
    fn two_boots_in_one_second_get_their_own_folders() {
        let data = temp("start");
        let first = Run::start(&data, at(22, 1)).unwrap();
        let second = Run::start(&data, at(22, 1)).unwrap();
        assert_eq!(first.id(), "20261022T120001Z");
        assert_eq!(second.id(), "20261022T120001Z-2");
        assert!(second.file(LogFile::Session).ends_with("session.jsonl"));
        let _ = std::fs::remove_dir_all(data);
    }

    #[test]
    fn the_newest_stay_failed_runs_are_pinned_and_the_cap_takes_the_oldest() {
        // Days 20..10, newest first; day 20 is this boot.
        let runs = vec![
            seen(20, false, 10),
            seen(19, false, 10),
            seen(18, false, 10),
            seen(17, true, 10),  // failed, young → kept as failed
            seen(16, false, 10), // beyond keep_runs
            seen(15, true, 10),  // failed, young → kept as failed
            seen(14, true, 10),  // failed, beyond keep_failed_runs
        ];
        let (kept, gone) = judge(runs, &run_id(at(20, 0)), &policy(), at(20, 0));
        assert_eq!(
            ids(&kept),
            [
                ("20".into(), Reason::Current),
                ("19".into(), Reason::Newest),
                ("18".into(), Reason::Newest),
                ("17".into(), Reason::Failed),
                ("15".into(), Reason::Failed),
            ]
        );
        assert_eq!(
            ids(&gone),
            [
                ("16".into(), Reason::BeyondKeepRuns),
                ("14".into(), Reason::BeyondKeepFailed),
            ]
        );
    }

    #[test]
    fn an_old_failure_goes_and_the_cap_spares_what_is_pinned() {
        let mut small = policy();
        small.max_total_mb = 1; // 1024 KB
        small.failed_run_days = 3;
        let runs = vec![
            seen(20, false, 400),
            seen(19, false, 400),
            seen(18, true, 400), // failed, young: pinned
            seen(10, true, 10),  // failed, older than 3 days
        ];
        let (kept, gone) = judge(runs, &run_id(at(20, 0)), &small, at(20, 0));
        // 1200 KB over a 1024 KB cap: the oldest unpinned kept run goes.
        assert_eq!(
            ids(&kept),
            [
                ("20".into(), Reason::Current),
                ("18".into(), Reason::Newest)
            ]
        );
        assert_eq!(
            ids(&gone),
            [
                ("10".into(), Reason::FailedTooOld),
                ("19".into(), Reason::OverTotalCap),
            ]
        );
    }

    #[test]
    fn old_files_move_into_their_run_folders_and_nothing_is_deleted() {
        let data = temp("adopt");
        let logs = data.join("logs");
        std::fs::create_dir_all(&logs).unwrap();
        for name in [
            "session-2026-10-21-225754.jsonl",
            "stderr-2026-10-21-225754.log",
            "crash-2026-10-21-225754.json",
            "action-2026-10-21.jsonl",
        ] {
            std::fs::write(logs.join(name), name).unwrap();
        }
        let moved = adopt_legacy(&data);
        assert_eq!(moved.len(), 3, "{moved:?}");
        let id = legacy_run_id("2026-10-21-225754").unwrap();
        let dir = runs_root(&data).join(&id);
        for kind in ["session.jsonl", "stderr.log", "crash.json"] {
            assert!(dir.join(kind).exists(), "{kind}");
        }
        assert!(logs.join("action-2026-10-21.jsonl").exists());
        assert!(failed(&dir), "a crash record marks the run failed");
        let _ = std::fs::remove_dir_all(data);
    }

    #[test]
    fn retain_reports_without_removing_until_prune_is_on() {
        let data = temp("retain");
        for day in 10..=15 {
            let run = Run::start(&data, at(day, 0)).unwrap();
            std::fs::write(run.file(LogFile::Session), "{}").unwrap();
        }
        let current = Run::start(&data, at(16, 0)).unwrap();
        let loaded = LoadedPolicy {
            policy: policy(),
            refused: Vec::new(),
        };
        let report = retain(&data, &current, loaded.clone(), Vec::new(), at(16, 0));
        assert_eq!(report.kept.len(), 3);
        assert_eq!(report.gone.len(), 4);
        assert_eq!(run_ids(&runs_root(&data)).len(), 7, "nothing removed");
        assert!(current.file(LogFile::Retention).exists());

        let mut pruning = loaded;
        pruning.policy.prune = true;
        let report = retain(&data, &current, pruning, Vec::new(), at(16, 0));
        assert!(report.errors.is_empty(), "{:?}", report.errors);
        assert_eq!(run_ids(&runs_root(&data)).len(), 3);
        assert_eq!(
            newest_run_file(&data, LogFile::Retention),
            Some(current.file(LogFile::Retention))
        );
        let _ = std::fs::remove_dir_all(data);
    }
}
