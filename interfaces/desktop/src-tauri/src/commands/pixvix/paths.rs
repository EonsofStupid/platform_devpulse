//! Resolve PixVix on-disk locations from the platform data dir.
//!
//! Tiny helper module — every other PixVix command that touches disk
//! goes through these so the convention is in one place.

use std::path::PathBuf;

/// Subdirectory under `<data_dir>/` that owns captured frames written
/// by the V-4 disk sink. Created on demand by the sink, never by these
/// helpers — read-only here.
pub const FRAMES_SUBDIR: &str = "vision-frames";

/// Subdirectory under `<data_dir>/` for V-10 demo recordings (WebM).
pub const RECORDINGS_SUBDIR: &str = "vision-recordings";

/// `<data_dir>/vision-frames/`.
pub fn frames_dir(data_dir: &std::path::Path) -> PathBuf {
    data_dir.join(FRAMES_SUBDIR)
}

/// `<data_dir>/vision-recordings/`.
pub fn recordings_dir(data_dir: &std::path::Path) -> PathBuf {
    data_dir.join(RECORDINGS_SUBDIR)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;

    #[test]
    fn frames_dir_appends_under_data_dir() {
        let p = frames_dir(Path::new("/tmp/userdata"));
        assert!(p.ends_with(FRAMES_SUBDIR));
    }

    #[test]
    fn recordings_dir_distinct_from_frames() {
        let base = Path::new("/tmp/userdata");
        assert_ne!(frames_dir(base), recordings_dir(base));
    }
}
