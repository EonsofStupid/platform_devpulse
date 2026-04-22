//! Media pipeline orchestration
//!
//! Connects camera capture → processing → output routing

use crate::capture::CameraManager;
use crate::error::{MediaError, MediaResult};
use crate::frame::Frame;
use flume::{Receiver, Sender};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
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
    frame_tx: Sender<Frame>,
    /// Frame receiver (for consumers)
    frame_rx: Receiver<Frame>,
    /// Capture task handle
    capture_handle: Option<JoinHandle<()>>,
}

impl MediaPipeline {
    /// Create a new media pipeline
    pub fn new(config: PipelineConfig) -> Self {
        let (frame_tx, frame_rx) = flume::bounded(4); // Small buffer, drop old frames

        Self {
            config,
            state: PipelineState::Stopped,
            running: Arc::new(AtomicBool::new(false)),
            frame_tx,
            frame_rx,
            capture_handle: None,
        }
    }

    /// Start the capture pipeline
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

        let handle = tokio::task::spawn_blocking(move || {
            let mut camera_mgr = CameraManager::new();

            // Enumerate and open camera
            if let Err(e) = camera_mgr.enumerate_cameras() {
                error!("Failed to enumerate cameras: {}", e);
                return;
            }

            if let Err(e) = camera_mgr.open_camera(&camera_id_owned, width, height) {
                error!("Failed to open camera: {}", e);
                return;
            }

            let frame_duration = std::time::Duration::from_millis(1000 / target_fps as u64);

            while running.load(Ordering::SeqCst) {
                let start = std::time::Instant::now();

                match camera_mgr.capture_frame() {
                    Ok(frame) => {
                        debug!(
                            "Captured frame seq={} ({}x{})",
                            frame.sequence, frame.width, frame.height
                        );
                        // Try to send, drop if channel full (keeps us real-time)
                        if frame_tx.try_send(frame).is_err() {
                            debug!("Frame channel full, dropping frame to stay real-time");
                        }
                    }
                    Err(e) => {
                        warn!("Frame capture failed: {}", e);
                    }
                }

                // Sleep to maintain target FPS
                let elapsed = start.elapsed();
                if elapsed < frame_duration {
                    std::thread::sleep(frame_duration - elapsed);
                }
            }

            camera_mgr.close_camera();
            info!("Capture loop stopped");
        });

        self.capture_handle = Some(handle);
        self.state = PipelineState::Running;

        Ok(())
    }

    /// Stop the capture pipeline
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
    pub fn state(&self) -> PipelineState {
        self.state
    }

    /// Get a receiver for output frames
    pub fn frame_receiver(&self) -> Receiver<Frame> {
        self.frame_rx.clone()
    }

    /// Get the pipeline configuration
    pub fn config(&self) -> &PipelineConfig {
        &self.config
    }
}

impl Drop for MediaPipeline {
    fn drop(&mut self) {
        self.running.store(false, Ordering::SeqCst);
    }
}
