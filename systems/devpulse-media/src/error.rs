//! Media pipeline errors

use thiserror::Error;

/// Convenience alias for media operations
pub type MediaResult<T> = Result<T, MediaError>;

/// Errors that can occur during media capture and pipeline operations
#[derive(Debug, Error)]
pub enum MediaError {
    /// System has no cameras available
    #[error("No cameras found")]
    NoCamerasFound,

    /// Requested camera ID does not match any discovered device
    #[error("Camera not found: {0}")]
    CameraNotFound(String),

    /// Camera device exists but could not be opened
    #[error("Failed to open camera: {0}")]
    CameraOpenFailed(String),

    /// Frame capture from an open camera failed
    #[error("Failed to capture frame: {0}")]
    CaptureFailed(String),

    /// Operation requires a running pipeline but none is active
    #[error("Pipeline not running")]
    PipelineNotRunning,

    /// The flume frame channel was closed unexpectedly
    #[error("Frame channel closed")]
    ChannelClosed,

    /// Frame dimensions are zero or exceed hardware limits
    #[error("Invalid frame dimensions: {width}x{height}")]
    InvalidDimensions {
        /// Frame width in pixels
        width: u32,
        /// Frame height in pixels
        height: u32,
    },

    /// Camera does not support the requested pixel format
    #[error("Unsupported format: {0}")]
    UnsupportedFormat(String),

    /// Filesystem or device I/O failure
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    /// Image decoding or encoding failure
    #[error("Image processing error: {0}")]
    ImageError(#[from] image::ImageError),
}
