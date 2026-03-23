//! Real-time boot log sink — writes to file AND stderr simultaneously.
//!
//! Every line is flushed immediately. If the process crashes at service 4,
//! services 1–3 are already on disk. No buffering, no accumulation, no
//! "write at the end" nonsense.
//!
//! Format:
//! ```text
//! # DevPulse Boot Log
//! # 2026-03-22 14:30:01
//! # OS: windows x86_64
//! # data_dir: D:\localdev\platform_devpulse\.userdata
//! #
//! [+000.000s] [START] DevPulse Boot
//! [+000.012s] [  OK ] preflight: directories ready (12ms)
//! [+000.045s] [  OK ] system_relational: LibSQL platform.db (33ms)
//! [+002.341s] [  OK ] graph_store: SurrealDB consolidated 3 namespaces (2252ms)
//! [+002.402s] [READY] All critical services confirmed — UI may render
//! ```

use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::time::Instant;

/// Real-time boot log sink.
///
/// Every method writes one line to the log file AND to stderr, then flushes
/// both. The file is created (or truncated) on construction — there is always
/// exactly one boot.log per run.
pub struct BootLog {
    file: fs::File,
    start: Instant,
    path: PathBuf,
    fail_count: std::sync::atomic::AtomicU32,
}

impl BootLog {
    /// Create a new boot log at `{data_dir}/logs/boot.log`.
    ///
    /// Creates the logs directory if it doesn't exist. Truncates any existing
    /// boot.log — each run starts fresh.
    pub fn open(data_dir: &Path) -> anyhow::Result<Self> {
        let log_dir = data_dir.join("logs");
        fs::create_dir_all(&log_dir)?;
        let path = log_dir.join("boot.log");
        let mut file = fs::File::create(&path)?;

        // Header — machine-parseable metadata
        let now = timestamp();
        writeln!(file, "# DevPulse Boot Log")?;
        writeln!(file, "# {now}")?;
        writeln!(
            file,
            "# OS: {} {}",
            std::env::consts::OS,
            std::env::consts::ARCH
        )?;
        writeln!(file, "# data_dir: {}", data_dir.display())?;

        // Config source
        let config_source = if data_dir.join("platform.toml").exists() {
            "platform.toml (user override)"
        } else {
            "platform.default.toml (embedded)"
        };
        writeln!(file, "# config: {config_source}")?;
        writeln!(file, "#")?;
        file.flush()?;

        let log = Self {
            file,
            start: Instant::now(),
            path,
            fail_count: std::sync::atomic::AtomicU32::new(0),
        };

        log.emit("[START] DevPulse Boot");

        Ok(log)
    }

    /// Log a successful stage.
    ///
    /// Callers include timing in `detail` (e.g. "LibSQL platform.db (33ms)").
    pub fn ok(&self, stage: &str, detail: &str) {
        let line = format!("[  OK ] {stage}: {detail}");
        self.emit(&line);
    }

    /// Log a skipped stage (disabled in config).
    pub fn skip(&self, stage: &str, reason: &str) {
        let line = format!("[ SKIP] {stage}: {reason}");
        self.emit(&line);
    }

    /// Log a failed stage. Increments the failure counter.
    pub fn fail(&self, stage: &str, error: &str) {
        self.fail_count.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
        let line = format!("[FAIL!] {stage}: {error}");
        self.emit(&line);
    }

    /// Returns true if any stage has FAILed during this boot.
    pub fn has_failures(&self) -> bool {
        self.fail_count.load(std::sync::atomic::Ordering::Relaxed) > 0
    }

    /// Number of stages that FAILed.
    pub fn failure_count(&self) -> u32 {
        self.fail_count.load(std::sync::atomic::Ordering::Relaxed)
    }

    /// Log a running/in-progress stage (no newline after — will be overwritten).
    pub fn running(&self, stage: &str, detail: &str) {
        // Only write to stderr (progress indicator), not to file.
        // File only gets final outcomes.
        let tag = self.elapsed_tag();
        eprint!("\r[{tag}] [  >> ] {stage}: {detail}");
        let _ = std::io::stderr().flush();
    }

    /// Log the final ready line — all critical services confirmed.
    pub fn ready(&self, total_ms: u64) {
        let line = format!("[READY] All critical services confirmed — UI may render ({total_ms}ms total)");
        self.emit(&line);
    }

    /// Log a boot failure — critical service could not start.
    pub fn boot_failed(&self, error: &str, total_ms: u64) {
        let line = format!("[ABORT] Boot failed: {error} ({total_ms}ms total)");
        self.emit(&line);
    }

    /// Log a health check result after boot.
    /// Called when BootLog is persisted past boot for runtime health reporting.
    #[allow(dead_code)]
    pub fn health(&self, service: &str, status: &str, latency_us: Option<u64>) {
        let latency_str = latency_us
            .map(|us| {
                if us >= 1000 {
                    format!(" ({}ms)", us / 1000)
                } else {
                    format!(" ({us}µs)")
                }
            })
            .unwrap_or_default();
        let line = format!("[HEALTH] {service}: {status}{latency_str}");
        self.emit(&line);
    }

    /// Get the path to the log file.
    pub fn path(&self) -> &Path {
        &self.path
    }

    /// Total elapsed milliseconds since boot started.
    pub fn elapsed_ms(&self) -> u64 {
        self.start.elapsed().as_millis() as u64
    }

    // ── Internal ───────────────────────────────────────────────

    /// Emit a line to both file and stderr, with elapsed time prefix.
    fn emit(&self, line: &str) {
        let tag = self.elapsed_tag();
        let full = format!("[{tag}] {line}");

        // File — append + flush
        // Using &self.file because File implements Write for &File too
        let _ = writeln!(&self.file, "{full}");
        let _ = (&self.file).flush();

        // stderr — clear any progress line first, then print
        eprint!("\r{}\r", " ".repeat(100));
        eprintln!("{full}");
        let _ = std::io::stderr().flush();
    }

    /// Elapsed tag: "+002.341s"
    fn elapsed_tag(&self) -> String {
        let e = self.start.elapsed();
        let secs = e.as_secs();
        let ms = e.subsec_millis();
        format!("+{secs:03}.{ms:03}s")
    }

}

/// UTC timestamp string.
fn timestamp() -> String {
    use std::time::SystemTime;
    let now = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap_or_default();
    let secs = now.as_secs();
    let days = secs / 86400;
    let time_secs = secs % 86400;
    let hours = time_secs / 3600;
    let mins = (time_secs % 3600) / 60;
    let s = time_secs % 60;
    let (year, month, day) = days_to_ymd(days);
    format!("{year:04}-{month:02}-{day:02} {hours:02}:{mins:02}:{s:02} UTC")
}

/// Convert days since Unix epoch to (year, month, day).
fn days_to_ymd(days: u64) -> (u64, u64, u64) {
    let era_days = days + 719_468;
    let era = era_days / 146_097;
    let doe = era_days - era * 146_097;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146_096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = if m <= 2 { y + 1 } else { y };
    (y, m, d)
}
