//! Camera capture and enumeration
//!
//! Uses nokhwa for cross-platform camera access.
//! On Windows: Media Foundation (MSMF)
//! On Linux: V4L2
//! On macOS: AVFoundation

use crate::error::{MediaError, MediaResult};
use crate::frame::Frame;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{debug, error, info, warn};

#[cfg(feature = "capture")]
use nokhwa::{
    pixel_format::RgbAFormat,
    utils::{
        CameraFormat, CameraIndex, FrameFormat, RequestedFormat, RequestedFormatType, Resolution,
    },
    Camera, NokhwaError,
};

/// Information about an available camera
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CameraInfo {
    /// Unique identifier
    pub id: String,
    /// Human-readable name
    pub name: String,
    /// Device index
    pub index: u32,
    /// Available resolutions (if queryable)
    pub resolutions: Vec<(u32, u32)>,
}

/// Manages camera discovery and capture
pub struct CameraManager {
    /// Currently active camera (if any)
    #[cfg(feature = "capture")]
    active_camera: Option<Camera>,
    /// Cached list of available cameras
    cameras: Vec<CameraInfo>,
    /// Frame sequence counter
    frame_seq: u64,
}

impl CameraManager {
    /// Create a new camera manager
    pub fn new() -> Self {
        Self {
            #[cfg(feature = "capture")]
            active_camera: None,
            cameras: Vec::new(),
            frame_seq: 0,
        }
    }

    /// Create a thread-safe shared camera manager for pipeline use
    pub fn shared() -> Arc<RwLock<Self>> {
        Arc::new(RwLock::new(Self::new()))
    }

    /// Enumerate all available cameras
    #[cfg(feature = "capture")]
    pub fn enumerate_cameras(&mut self) -> MediaResult<Vec<CameraInfo>> {
        use nokhwa::query;

        info!("Enumerating cameras...");

        let devices = query(nokhwa::utils::ApiBackend::Auto)
            .map_err(|e| MediaError::CaptureFailed(e.to_string()))?;

        self.cameras = devices
            .iter()
            .enumerate()
            .map(|(idx, info)| CameraInfo {
                id: format!("camera_{}", idx),
                name: info.human_name().to_string(),
                index: idx as u32,
                resolutions: Vec::new(), // TODO: query supported resolutions
            })
            .collect();

        if self.cameras.is_empty() {
            warn!("No cameras detected on this system");
        } else {
            info!("Found {} cameras", self.cameras.len());
            for cam in &self.cameras {
                debug!("  - {} ({})", cam.name, cam.id);
            }
        }

        Ok(self.cameras.clone())
    }

    /// Enumerate cameras (stub when capture feature disabled)
    #[cfg(not(feature = "capture"))]
    pub fn enumerate_cameras(&mut self) -> MediaResult<Vec<CameraInfo>> {
        warn!("Camera capture disabled (compile with 'capture' feature)");
        Ok(Vec::new())
    }

    /// Get cached camera list
    pub fn cameras(&self) -> &[CameraInfo] {
        &self.cameras
    }

    /// Open a camera by ID
    #[cfg(feature = "capture")]
    pub fn open_camera(&mut self, camera_id: &str, width: u32, height: u32) -> MediaResult<()> {
        let cam_info = self
            .cameras
            .iter()
            .find(|c| c.id == camera_id)
            .ok_or_else(|| MediaError::CameraNotFound(camera_id.to_string()))?;

        info!("Opening camera: {} ({}x{})", cam_info.name, width, height);

        let index = CameraIndex::Index(cam_info.index);
        let format = CameraFormat::new(Resolution::new(width, height), FrameFormat::MJPEG, 30);
        let requested = RequestedFormat::new::<RgbAFormat>(RequestedFormatType::Closest(format));

        let camera = Camera::new(index, requested).map_err(|e| match &e {
            NokhwaError::OpenDeviceError(dev, reason) => {
                error!("Device open failed for {}: {}", dev, reason);
                MediaError::CameraOpenFailed(e.to_string())
            }
            NokhwaError::StructureError {
                structure,
                error: err,
            } => {
                error!("Format negotiation failed ({}): {}", structure, err);
                MediaError::UnsupportedFormat(e.to_string())
            }
            _ => {
                error!("Camera initialization failed: {}", e);
                MediaError::CameraOpenFailed(e.to_string())
            }
        })?;

        self.active_camera = Some(camera);
        info!("Camera opened successfully");
        Ok(())
    }

    /// Open camera stub
    #[cfg(not(feature = "capture"))]
    pub fn open_camera(&mut self, _camera_id: &str, _width: u32, _height: u32) -> MediaResult<()> {
        error!("Cannot open camera: capture feature disabled at compile time");
        Err(MediaError::CaptureFailed("Capture feature disabled".into()))
    }

    /// Capture a single frame from the active camera
    #[cfg(feature = "capture")]
    pub fn capture_frame(&mut self) -> MediaResult<Frame> {
        let camera = self
            .active_camera
            .as_mut()
            .ok_or(MediaError::PipelineNotRunning)?;

        let raw_frame = camera
            .frame()
            .map_err(|e| MediaError::CaptureFailed(e.to_string()))?;

        let decoded = raw_frame
            .decode_image::<RgbAFormat>()
            .map_err(|e| MediaError::CaptureFailed(e.to_string()))?;

        let resolution = raw_frame.resolution();
        self.frame_seq += 1;

        let mut frame = Frame::new(
            decoded.into_raw(),
            resolution.width(),
            resolution.height(),
            "camera",
        );
        frame.sequence = self.frame_seq;

        Ok(frame)
    }

    /// Capture frame stub
    #[cfg(not(feature = "capture"))]
    pub fn capture_frame(&mut self) -> MediaResult<Frame> {
        Err(MediaError::CaptureFailed("Capture feature disabled".into()))
    }

    /// Close the active camera
    pub fn close_camera(&mut self) {
        #[cfg(feature = "capture")]
        {
            self.active_camera = None;
        }
        info!("Camera closed");
    }

    /// Check if a camera is currently open
    pub fn is_camera_open(&self) -> bool {
        #[cfg(feature = "capture")]
        {
            self.active_camera.is_some()
        }
        #[cfg(not(feature = "capture"))]
        {
            false
        }
    }
}

impl Default for CameraManager {
    fn default() -> Self {
        Self::new()
    }
}
