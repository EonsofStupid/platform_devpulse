//! Hardware metrics — CPU, RAM, GPU, VRAM detection and polling.

use serde::{Deserialize, Serialize};

/// System-wide hardware metrics. Model Loader is app-agnostic — no
/// DevPulse-specific field names.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct HardwareMetrics {
    // CPU
    /// CPU usage as a percentage (0.0–100.0).
    pub cpu_usage_percent: f32,
    /// Number of logical CPU cores.
    pub cpu_cores: usize,
    /// CPU model name.
    pub cpu_name: String,

    // RAM
    /// Total system RAM in MB.
    pub ram_total_mb: u64,
    /// Used system RAM in MB.
    pub ram_used_mb: u64,
    /// Available system RAM in MB.
    pub ram_available_mb: u64,

    // GPU (all `None` if no NVIDIA GPU detected)
    /// GPU model name.
    pub gpu_name: Option<String>,
    /// Total VRAM in MB.
    pub gpu_vram_total_mb: Option<u64>,
    /// Used VRAM in MB.
    pub gpu_vram_used_mb: Option<u64>,
    /// Free VRAM in MB.
    pub gpu_vram_free_mb: Option<u64>,
    /// GPU utilization percentage.
    pub gpu_utilization_percent: Option<f32>,
    /// GPU temperature in Celsius.
    pub gpu_temperature_c: Option<f32>,

    // Process-specific
    /// RAM consumed by this process in MB.
    pub process_ram_mb: u64,
    /// VRAM consumed by this process in MB.
    pub process_vram_mb: u64,
}

impl HardwareMetrics {
    /// Whether a GPU was detected.
    #[must_use]
    pub fn has_gpu(&self) -> bool {
        self.gpu_name.is_some()
    }

    /// Free VRAM in MB, or 0 if no GPU.
    #[must_use]
    pub fn free_vram_mb(&self) -> u64 {
        self.gpu_vram_free_mb.unwrap_or(0)
    }

    /// Total VRAM in MB, or 0 if no GPU.
    #[must_use]
    pub fn total_vram_mb(&self) -> u64 {
        self.gpu_vram_total_mb.unwrap_or(0)
    }

    /// VRAM usage as a percentage (0.0–100.0), or 0 if no GPU.
    #[must_use]
    pub fn vram_usage_percent(&self) -> f32 {
        let total = self.total_vram_mb();
        if total == 0 {
            return 0.0;
        }
        let used = self.gpu_vram_used_mb.unwrap_or(0);
        (used as f32 / total as f32) * 100.0
    }
}

/// Collects hardware metrics using `sysinfo` (CPU/RAM) and optionally NVML (GPU).
///
/// This is a sync operation — call from `spawn_blocking` if in async context.
#[allow(clippy::cast_possible_truncation)]
pub fn collect_hardware() -> HardwareMetrics {
    use sysinfo::{CpuRefreshKind, MemoryRefreshKind, Pid, RefreshKind, System};

    let mut sys = System::new_with_specifics(
        RefreshKind::nothing()
            .with_cpu(CpuRefreshKind::everything())
            .with_memory(MemoryRefreshKind::everything()),
    );

    // Two refreshes needed for accurate CPU usage (sysinfo requirement).
    std::thread::sleep(std::time::Duration::from_millis(200));
    sys.refresh_cpu_all();

    let cpu_name = sys
        .cpus()
        .first()
        .map(|c| c.brand().to_string())
        .unwrap_or_default();

    let cpu_usage = sys.global_cpu_usage();
    let cpu_cores = sys.cpus().len();

    let ram_total_mb = sys.total_memory() / (1024 * 1024);
    let ram_used_mb = sys.used_memory() / (1024 * 1024);
    let ram_available_mb = sys.available_memory() / (1024 * 1024);

    // Process metrics
    let pid = Pid::from_u32(std::process::id());
    let filter = sysinfo::ProcessesToUpdate::Some(&[pid]);
    sys.refresh_processes(filter, true);

    let process_ram_mb = sys
        .process(pid)
        .map(|p| p.memory() / (1024 * 1024))
        .unwrap_or(0);

    #[allow(unused_mut)]
    let mut metrics = HardwareMetrics {
        cpu_usage_percent: cpu_usage,
        cpu_cores,
        cpu_name,
        ram_total_mb,
        ram_used_mb,
        ram_available_mb,
        process_ram_mb,
        ..Default::default()
    };

    // GPU metrics via NVML (feature-gated)
    #[cfg(feature = "nvml")]
    {
        collect_gpu_metrics(&mut metrics);
    }

    metrics
}

#[cfg(feature = "nvml")]
fn collect_gpu_metrics(metrics: &mut HardwareMetrics) {
    use nvml_wrapper::Nvml;

    let nvml = match Nvml::init() {
        Ok(n) => n,
        Err(e) => {
            tracing::debug!("NVML init failed (no NVIDIA driver?): {e}");
            return;
        }
    };

    let device = match nvml.device_by_index(0) {
        Ok(d) => d,
        Err(e) => {
            tracing::debug!("NVML device 0 not found: {e}");
            return;
        }
    };

    metrics.gpu_name = device.name().ok();

    if let Ok(mem) = device.memory_info() {
        let mb = 1024 * 1024;
        metrics.gpu_vram_total_mb = Some(mem.total / mb);
        metrics.gpu_vram_used_mb = Some(mem.used / mb);
        metrics.gpu_vram_free_mb = Some(mem.free / mb);
    }

    if let Ok(util) = device.utilization_rates() {
        #[allow(clippy::cast_precision_loss)]
        {
            metrics.gpu_utilization_percent = Some(util.gpu as f32);
        }
    }

    if let Ok(temp) = device.temperature(nvml_wrapper::enum_wrappers::device::TemperatureSensor::Gpu)
    {
        #[allow(clippy::cast_precision_loss)]
        {
            metrics.gpu_temperature_c = Some(temp as f32);
        }
    }

    // Process VRAM — find our PID in compute processes
    if let Ok(procs) = device.running_compute_processes() {
        let our_pid = std::process::id();
        let mb = 1024 * 1024;
        for proc in procs {
            if proc.pid == our_pid {
                if let nvml_wrapper::enums::device::UsedGpuMemory::Used(mem) =
                    proc.used_gpu_memory
                {
                    metrics.process_vram_mb = mem / mb;
                }
            }
        }
    }
}

/// Hardware monitor — caches metrics and manages polling intervals.
///
/// The monitor owns a cached snapshot that gets refreshed on demand or
/// on a timer. Consumers use this to avoid calling `collect_hardware()`
/// (which sleeps 200ms for CPU accuracy) on every UI frame.
pub struct HardwareMonitor {
    /// Last collected metrics.
    last_metrics: HardwareMetrics,
    /// When the last collection happened.
    last_collected: std::time::Instant,
    /// Minimum interval between collections (prevents thrashing).
    min_interval: std::time::Duration,
}

impl HardwareMonitor {
    /// Create a new monitor. Performs an initial hardware collection.
    #[must_use]
    pub fn new() -> Self {
        Self {
            last_metrics: collect_hardware(),
            last_collected: std::time::Instant::now(),
            min_interval: std::time::Duration::from_secs(2),
        }
    }

    /// Create a monitor with a custom minimum poll interval.
    #[must_use]
    pub fn with_interval(interval: std::time::Duration) -> Self {
        Self {
            last_metrics: collect_hardware(),
            last_collected: std::time::Instant::now(),
            min_interval: interval,
        }
    }

    /// Get the latest metrics. Refreshes if the minimum interval has elapsed.
    pub fn metrics(&mut self) -> &HardwareMetrics {
        if self.last_collected.elapsed() >= self.min_interval {
            self.refresh();
        }
        &self.last_metrics
    }

    /// Force a refresh regardless of interval.
    pub fn refresh(&mut self) -> &HardwareMetrics {
        self.last_metrics = collect_hardware();
        self.last_collected = std::time::Instant::now();
        &self.last_metrics
    }

    /// Get the cached metrics without checking the interval.
    /// Use when you need the last known values without blocking.
    #[must_use]
    pub fn cached(&self) -> &HardwareMetrics {
        &self.last_metrics
    }

    /// Set the minimum polling interval.
    pub fn set_interval(&mut self, interval: std::time::Duration) {
        self.min_interval = interval;
    }

    /// How long since the last refresh.
    #[must_use]
    pub fn age(&self) -> std::time::Duration {
        self.last_collected.elapsed()
    }

    /// Switch to fast polling (500ms) — use during model loading.
    pub fn enter_loading_mode(&mut self) {
        self.min_interval = std::time::Duration::from_millis(500);
    }

    /// Switch to normal polling (2s) — use during idle.
    pub fn enter_normal_mode(&mut self) {
        self.min_interval = std::time::Duration::from_secs(2);
    }

    /// Switch to inference polling (1s) — use during active generation.
    pub fn enter_inference_mode(&mut self) {
        self.min_interval = std::time::Duration::from_secs(1);
    }
}

impl Default for HardwareMonitor {
    fn default() -> Self {
        Self::new()
    }
}
