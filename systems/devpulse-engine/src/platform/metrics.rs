//! Process metrics — real measurements from the OS.
//!
//! Uses `sysinfo` to report actual RSS memory, CPU usage, and per-service
//! resource estimates. No faking, no proxying cache counts as memory.

use serde::Serialize;
use sysinfo::{Pid, System};
use ts_rs::TS;

/// Real process metrics from the OS. Every field is a measurement, not a guess.
#[derive(Debug, Clone, Serialize, TS)]
#[ts(export)]
pub struct ProcessMetrics {
    /// Process RSS (resident set size) in bytes. This is real memory usage.
    pub memory_rss_bytes: u64,
    /// Process virtual memory in bytes.
    pub memory_virtual_bytes: u64,
    /// CPU usage as a percentage of one core (0.0 - 100.0+).
    /// Values >100 mean multiple cores in use.
    pub cpu_usage_percent: f32,
    /// Process uptime in seconds (wall clock since boot).
    pub uptime_secs: u64,
    /// Process ID.
    pub pid: u32,
}

/// Collect real process metrics from the OS.
///
/// sysinfo requires TWO refreshes to compute CPU usage — the first call
/// always returns 0%. We refresh twice with a small sleep between.
/// Memory (RSS) is accurate on the first refresh.
#[allow(clippy::cast_possible_truncation)]
pub fn collect(uptime_secs: u64) -> ProcessMetrics {
    let pid = Pid::from_u32(std::process::id());
    let mut sys = System::new();
    let filter = sysinfo::ProcessesToUpdate::Some(&[pid]);

    // First refresh — baseline for CPU delta calculation. RSS is valid here.
    sys.refresh_processes(filter, true);

    let (rss, virt) = sys
        .process(pid)
        .map(|p| (p.memory(), p.virtual_memory()))
        .unwrap_or((0, 0));

    // Brief pause then second refresh — CPU usage needs a delta between two samples.
    std::thread::sleep(std::time::Duration::from_millis(200));
    sys.refresh_processes(filter, true);

    let cpu = sys
        .process(pid)
        .map(|p| p.cpu_usage())
        .unwrap_or(0.0);

    ProcessMetrics {
        memory_rss_bytes: rss,
        memory_virtual_bytes: virt,
        cpu_usage_percent: cpu,
        uptime_secs,
        pid: std::process::id(),
    }
}
