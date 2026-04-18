//! Frame representation for the media pipeline

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// A single video frame with metadata
#[derive(Clone)]
pub struct Frame {
    /// Raw pixel data (RGBA format)
    pub data: Vec<u8>,
    /// Frame width in pixels
    pub width: u32,
    /// Frame height in pixels
    pub height: u32,
    /// Timestamp when frame was captured
    pub timestamp: DateTime<Utc>,
    /// Frame number in sequence
    pub sequence: u64,
    /// Source identifier (camera ID, file path, etc.)
    pub source_id: String,
}

impl Frame {
    /// Create a new frame
    pub fn new(data: Vec<u8>, width: u32, height: u32, source_id: impl Into<String>) -> Self {
        Self {
            data,
            width,
            height,
            timestamp: Utc::now(),
            sequence: 0,
            source_id: source_id.into(),
        }
    }

    /// Create an empty/black frame
    pub fn black(width: u32, height: u32) -> Self {
        let size = (width * height * 4) as usize;
        Self {
            data: vec![0u8; size],
            width,
            height,
            timestamp: Utc::now(),
            sequence: 0,
            source_id: "black".into(),
        }
    }

    /// Get pixel at (x, y) as RGBA
    pub fn get_pixel(&self, x: u32, y: u32) -> Option<[u8; 4]> {
        if x >= self.width || y >= self.height {
            return None;
        }
        let idx = ((y * self.width + x) * 4) as usize;
        Some([
            self.data[idx],
            self.data[idx + 1],
            self.data[idx + 2],
            self.data[idx + 3],
        ])
    }

    /// Set pixel at (x, y) to RGBA value
    pub fn set_pixel(&mut self, x: u32, y: u32, rgba: [u8; 4]) {
        if x < self.width && y < self.height {
            let idx = ((y * self.width + x) * 4) as usize;
            self.data[idx..idx + 4].copy_from_slice(&rgba);
        }
    }

    /// Total bytes in frame
    pub fn byte_len(&self) -> usize {
        self.data.len()
    }
}

/// Metadata about a frame (for serialization without pixel data)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameMetadata {
    /// Frame width in pixels
    pub width: u32,
    /// Frame height in pixels
    pub height: u32,
    /// Timestamp when the source frame was captured
    pub timestamp: DateTime<Utc>,
    /// Frame number in the capture sequence
    pub sequence: u64,
    /// Identifier of the device that produced the frame
    pub source_id: String,
}

impl From<&Frame> for FrameMetadata {
    fn from(frame: &Frame) -> Self {
        Self {
            width: frame.width,
            height: frame.height,
            timestamp: frame.timestamp,
            sequence: frame.sequence,
            source_id: frame.source_id.clone(),
        }
    }
}
