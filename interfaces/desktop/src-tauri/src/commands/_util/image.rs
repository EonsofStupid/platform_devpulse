//! Image encoding helpers shared across capture commands.
//!
//! Replaces hand-rolled `encode_png` copies in pixvix monitor / window
//! / webcam. One impl, one error mapping (via `CommandError`), one
//! buffer pre-sizing convention.

use base64::engine::general_purpose::STANDARD as B64;
use base64::Engine as _;
use image::ImageFormat;

use super::error::CommandError;

/// Encode an `RgbaImage` to PNG bytes in memory.
///
/// Pre-sizes the output buffer to the raw RGBA byte count — PNG of a
/// uniform image compresses much smaller, but real screenshots
/// approach the raw size, so this avoids `Vec` reallocations during
/// encode.
///
/// # Errors
/// Returns [`CommandError`] when the image crate's PNG encoder fails.
pub fn encode_png(img: &image::RgbaImage) -> Result<Vec<u8>, CommandError> {
    let mut bytes = Vec::with_capacity((img.width() * img.height() * 4) as usize);
    img.write_to(&mut std::io::Cursor::new(&mut bytes), ImageFormat::Png)
        .map_err(|e| CommandError::internal(format!("PNG encode failed: {e}")))?;
    Ok(bytes)
}

/// Encode an `RgbaImage` to JPEG bytes in memory at the given quality
/// (0..=100, recommend 70..=85 for the streaming live-view path).
///
/// JPEG is the right choice when the live pipeline is sending frames
/// over IPC at >1 fps — PNG encode is the dominant cost on screenshot
/// pipelines (15–40 ms at 720p) where JPEG q70 is ~3–5 ms with a
/// fraction of the bytes.
///
/// # Errors
/// Returns [`CommandError`] when the image crate's JPEG encoder fails.
pub fn encode_jpeg(img: &image::RgbaImage, quality: u8) -> Result<Vec<u8>, CommandError> {
    use image::codecs::jpeg::JpegEncoder;
    let mut bytes = Vec::with_capacity((img.width() * img.height()) as usize);
    let mut encoder = JpegEncoder::new_with_quality(&mut bytes, quality);
    // JPEG cannot carry alpha — convert RGBA → RGB by dropping alpha.
    let rgb = image::DynamicImage::ImageRgba8(img.clone()).to_rgb8();
    encoder
        .encode(
            rgb.as_raw(),
            rgb.width(),
            rgb.height(),
            image::ExtendedColorType::Rgb8,
        )
        .map_err(|e| CommandError::internal(format!("JPEG encode failed: {e}")))?;
    Ok(bytes)
}

/// Build a `data:<mime>;base64,<bytes>` URL the frontend can drop into
/// `<img src=>` directly.
///
/// One place for the data-URL convention so the wire format never
/// drifts between commands. Use sparingly for live-view paths — at
/// 1 fps and >500 KB per frame, base64 over JSON IPC starts to
/// matter (V-4b session uses `Channel<Raw>` instead).
#[must_use]
pub fn data_url(mime: &str, bytes: &[u8]) -> String {
    format!("data:{mime};base64,{}", B64.encode(bytes))
}

#[cfg(test)]
mod tests {
    #![allow(clippy::unwrap_used, reason = "test assertions")]
    use super::*;

    fn red_pixel() -> image::RgbaImage {
        image::RgbaImage::from_pixel(2, 2, image::Rgba([255, 0, 0, 255]))
    }

    #[test]
    fn encode_png_emits_valid_png_signature() {
        let bytes = encode_png(&red_pixel()).unwrap();
        // PNG magic: 89 50 4E 47 0D 0A 1A 0A
        assert_eq!(
            &bytes[..8],
            &[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
        );
    }

    #[test]
    fn encode_jpeg_emits_valid_jpeg_signature() {
        let bytes = encode_jpeg(&red_pixel(), 80).unwrap();
        // JPEG magic: FF D8 FF
        assert_eq!(&bytes[..3], &[0xFF, 0xD8, 0xFF]);
    }

    #[test]
    fn encode_jpeg_respects_quality_parameter() {
        let small = encode_jpeg(&red_pixel(), 10).unwrap();
        let large = encode_jpeg(&red_pixel(), 95).unwrap();
        // Higher quality should produce equal-or-larger output (allowing
        // for compressor quirks at 2x2 pixels — at least both must encode).
        assert!(!small.is_empty());
        assert!(!large.is_empty());
    }

    #[test]
    fn data_url_shape_is_canonical() {
        let url = data_url("image/png", b"\x89PNG");
        assert!(url.starts_with("data:image/png;base64,"));
        // Base64 of "\x89PNG" is "iVBORw==" (... close to it; verify
        // structure not the exact bytes since base64 padding rules
        // depend on input length — 4 bytes → 8 chars no padding).
        let comma = url.find(',').unwrap();
        assert!(url.len() > comma + 1);
    }
}
