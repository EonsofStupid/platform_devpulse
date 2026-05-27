//! Media pipeline orchestration
//!
//! Connects camera capture → processing → output routing

use crate::capture::CameraManager;
use crate::error::{MediaError, MediaResult};
use crate::frame::Frame;
use devpulse_telemetry::channel::flume::{self as traced_flume, TracedReceiver, TracedSender};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tokio::task::JoinHandle;
use tracing::{debug, error, info, warn};

/// Current lifecycle state of the media pipeline
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PipelineState {
    /// Pipeline is idle — no capture task running
    Stopped,
    /// Capture task is actively producing frames
    Running,
    /// Capture task exists but frame production is suspended
    Paused,
}

/// Configuration for the media pipeline
#[derive(Debug, Clone)]
pub struct PipelineConfig {
    /// Target frames per second
    pub target_fps: u32,
    /// Frame width
    pub width: u32,
    /// Frame height
    pub height: u32,
    /// Enable background removal
    pub enable_bg_removal: bool,
}

impl Default for PipelineConfig {
    fn default() -> Self {
        Self {
            target_fps: 30,
            width: 1280,
            height: 720,
            enable_bg_removal: false,
        }
    }
}

/// The main media pipeline
pub struct MediaPipeline {
    /// Pipeline configuration
    config: PipelineConfig,
    /// Current state
    state: PipelineState,
    /// Running flag for capture loop
    running: Arc<AtomicBool>,
    /// Frame output channel
    frame_tx: TracedSender<Frame>,
    /// Frame receiver (for consumers)
    frame_rx: TracedReceiver<Frame>,
    /// Capture task handle
    capture_handle: Option<JoinHandle<()>>,
}

impl MediaPipeline {
    /// Create a new media pipeline
    #[must_use]
    pub fn new(config: PipelineConfig) -> Self {
        let (frame_tx, frame_rx) = traced_flume::bounded(4); // Small buffer, drop old frames

        Self {
            config,
            state: PipelineState::Stopped,
            running: Arc::new(AtomicBool::new(false)),
            frame_tx,
            frame_rx,
            capture_handle: None,
        }
    }

    /// Start the capture pipeline.
    ///
    /// # Errors
    /// This implementation never returns an error today — camera open
    /// failures inside the spawned task are logged and the task exits.
    /// The signature returns `MediaResult<()>` so future synchronous
    /// validation (camera ID lookup before spawn, capability negotiation)
    /// can surface failures without breaking call sites.
    pub fn start(&mut self, camera_id: &str) -> MediaResult<()> {
        if self.state == PipelineState::Running {
            warn!("Pipeline already running");
            return Ok(());
        }

        info!("Starting media pipeline for camera: {}", camera_id);

        let running = self.running.clone();
        let frame_tx = self.frame_tx.clone();
        let width = self.config.width;
        let height = self.config.height;
        let target_fps = self.config.target_fps;
        let camera_id_owned = camera_id.to_string();

        running.store(true, Ordering::SeqCst);

        let handle = devpulse_telemetry::spawn_blocking(move || {
            run_capture_loop(
                &camera_id_owned,
                width,
                height,
                target_fps,
                &running,
                &frame_tx,
            );
        });

        self.capture_handle = Some(handle);
        self.state = PipelineState::Running;

        Ok(())
    }

    /// Stop the capture pipeline.
    ///
    /// # Errors
    /// Returns [`MediaError::CaptureFailed`] when the spawned capture
    /// task panicked. The pipeline state still transitions to
    /// `Stopped` so subsequent `start()` calls are safe.
    pub async fn stop(&mut self) -> MediaResult<()> {
        if self.state == PipelineState::Stopped {
            return Ok(());
        }

        info!("Stopping media pipeline...");
        self.running.store(false, Ordering::SeqCst);

        if let Some(handle) = self.capture_handle.take() {
            if let Err(e) = handle.await {
                error!("Capture task panicked during shutdown: {}", e);
                self.state = PipelineState::Stopped;
                return Err(MediaError::CaptureFailed(format!(
                    "Capture task panicked: {e}"
                )));
            }
        }

        self.state = PipelineState::Stopped;
        info!("Media pipeline stopped");
        Ok(())
    }

    /// Get the current pipeline state
    #[must_use]
    pub fn state(&self) -> PipelineState {
        self.state
    }

    /// Get a receiver for output frames
    #[must_use]
    pub fn frame_receiver(&self) -> TracedReceiver<Frame> {
        self.frame_rx.clone()
    }

    /// Get the pipeline configuration
    #[must_use]
    pub fn config(&self) -> &PipelineConfig {
        &self.config
    }
}

impl Drop for MediaPipeline {
    fn drop(&mut self) {
        self.running.store(false, Ordering::SeqCst);
    }
}

/// Capture-loop body. Extracted from [`MediaPipeline::start`] so the
/// blocking work — camera enumeration, open, per-frame capture + sleep —
/// has a stable, testable surface.
///
/// The loop exits when `running` flips to `false` (driven by
/// [`MediaPipeline::stop`] or [`MediaPipeline::drop`]).
fn run_capture_loop(
    camera_id: &str,
    width: u32,
    height: u32,
    target_fps: u32,
    running: &Arc<AtomicBool>,
    frame_tx: &TracedSender<Frame>,
) {
    let mut camera_mgr = CameraManager::new();

    if let Err(e) = camera_mgr.enumerate_cameras() {
        error!("Failed to enumerate cameras: {}", e);
        return;
    }

    if let Err(e) = camera_mgr.open_camera(camera_id, width, height) {
        error!("Failed to open camera: {}", e);
        return;
    }

    let frame_duration = Duration::from_millis(1000 / u64::from(target_fps.max(1)));

    while running.load(Ordering::SeqCst) {
        let start = std::time::Instant::now();

        match camera_mgr.capture_frame() {
            Ok(frame) => {
                debug!(
                    "Captured frame seq={} ({}x{})",
                    frame.sequence, frame.width, frame.height
                );
                if frame_tx.try_send(frame).is_err() {
                    debug!("Frame channel full, dropping frame to stay real-time");
                }
            }
            Err(e) => {
                warn!("Frame capture failed: {}", e);
            }
        }

        // Sleep to maintain target FPS. `checked_sub` guards against
        // a backwards clock or a frame that took longer than the budget;
        // either way we skip the sleep and immediately try the next
        // capture rather than panicking on `Duration` underflow.
        let elapsed = start.elapsed();
        if let Some(remaining) = frame_duration.checked_sub(elapsed) {
            std::thread::sleep(remaining);
        }
    }

    camera_mgr.close_camera();
    info!("Capture loop stopped");
}
