//! Media pipeline errors

use thiserror::Error;

pub type MediaResult<T> = Result<T, MediaError>;

#[derive(Debug, Error)]
pub enum MediaError {
    #[error("No cameras found")]
    NoCamerasFound,

    #[error("Camera not found: {0}")]
    CameraNotFound(String),

    #[error("Failed to open camera: {0}")]
    CameraOpenFailed(String),

    #[error("Failed to capture frame: {0}")]
    CaptureFailed(String),

    #[error("Pipeline not running")]
    PipelineNotRunning,

    #[error("Frame channel closed")]
    ChannelClosed,

    #[error("Invalid frame dimensions: {width}x{height}")]
    InvalidDimensions { width: u32, height: u32 },

    #[error("Unsupported format: {0}")]
    UnsupportedFormat(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Image processing error: {0}")]
    ImageError(#[from] image::ImageError),
}
