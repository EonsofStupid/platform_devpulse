//! `Voices.tgz` extractor — unpacks the voice-profile bundle that
//! Personaplex-7B (and other Moshi-architecture STS models) ships in
//! its Hugging Face repo.
//!
//! Personaplex's `Voices.tgz` contains the per-speaker reference audio
//! and embeddings the moshi runtime mounts when a slot loads. The
//! download manager fetches the archive verbatim; this module pulls
//! the contents out into a sibling directory so the rest of the
//! `moshi-sts` load path can read individual files without re-decoding
//! the gzip stream on every probe.
//!
//! # Path-traversal guard
//!
//! `tar::Archive::unpack` will refuse to write entries that try to
//! escape the destination via `..` or absolute paths, but the safer
//! shape is to validate up-front so a malformed archive can't even
//! create partial files. We rebuild every path against `dst` and
//! reject anything that resolves outside.

use anyhow::{Context, Result};
use std::fs::File;
use std::path::{Component, Path};

/// Extract a tar.gz archive into `dst`, creating `dst` if needed.
///
/// Returns the count of file entries written (directories aren't
/// counted — `tar::Archive::unpack` creates them implicitly when a
/// nested file lands).
///
/// # Errors
///
/// Returns an error if:
/// - `src` cannot be opened or isn't a valid gzip stream
/// - `dst` cannot be created
/// - any entry's resolved path escapes `dst` (path traversal)
/// - any entry's filesystem write fails (permission, full disk)
///
/// # Example
///
/// ```no_run
/// # #[cfg(feature = "moshi-sts")]
/// # fn run() -> anyhow::Result<()> {
/// use std::path::Path;
/// use model_loader::backends::candle::voices_archive::extract_tgz;
/// let count = extract_tgz(
///     Path::new(".userdata/models/personaplex-7b-v1/Voices.tgz"),
///     Path::new(".userdata/models/personaplex-7b-v1/voices/"),
/// )?;
/// println!("extracted {count} files");
/// # Ok(()) }
/// ```
pub fn extract_tgz(src: &Path, dst: &Path) -> Result<usize> {
    if !src.exists() {
        anyhow::bail!("Voices archive not found: {}", src.display());
    }

    std::fs::create_dir_all(dst)
        .with_context(|| format!("Failed to create destination dir {}", dst.display()))?;

    let dst_canonical = dst
        .canonicalize()
        .with_context(|| format!("Failed to canonicalize destination {}", dst.display()))?;

    let file = File::open(src)
        .with_context(|| format!("Failed to open archive {}", src.display()))?;
    let decoder = flate2::read::GzDecoder::new(file);
    let mut archive = tar::Archive::new(decoder);

    let mut written = 0usize;
    for entry_result in archive
        .entries()
        .context("Failed to read tar entries — archive may be truncated or non-tar")?
    {
        let mut entry = entry_result.context("Failed to read tar entry header")?;

        let entry_path = entry
            .path()
            .context("Tar entry contained an invalid path encoding")?
            .into_owned();

        // Reject entries whose path components include `..` or are
        // absolute — these are the textbook traversal-escape shapes
        // that a hostile or malformed archive would use.
        if !is_safe_relative_path(&entry_path) {
            anyhow::bail!(
                "Tar entry escapes destination dir: {}",
                entry_path.display()
            );
        }

        // tar::Archive::unpack handles directory creation, file
        // permissions, and timestamps. Each entry decision is
        // archive-relative; we already validated the relative path.
        let target = dst_canonical.join(&entry_path);

        // Defence in depth: confirm the joined path stays under dst
        // even though the relative-path guard above should be
        // sufficient.
        if !target.starts_with(&dst_canonical) {
            anyhow::bail!(
                "Tar entry resolves outside destination: {} → {}",
                entry_path.display(),
                target.display()
            );
        }

        let entry_type = entry.header().entry_type();
        if entry_type.is_file() {
            // `entry.unpack` does NOT auto-create parent dirs (unlike
            // `Archive::unpack` which walks ahead). Materialize them
            // explicitly before unpacking each file.
            if let Some(parent) = target.parent() {
                std::fs::create_dir_all(parent).with_context(|| {
                    format!("Failed to create parent dir {}", parent.display())
                })?;
            }
            entry
                .unpack(&target)
                .with_context(|| format!("Failed to unpack file {}", target.display()))?;
            written += 1;
        } else if entry_type.is_dir() {
            std::fs::create_dir_all(&target)
                .with_context(|| format!("Failed to create dir {}", target.display()))?;
        }
        // Other entry types (symlinks, hardlinks, devices) are
        // ignored — the model-loader's known archives don't use
        // them, and silently skipping is safer than blindly creating
        // them on a customer's disk.
    }

    tracing::info!(
        archive = %src.display(),
        dst = %dst.display(),
        files = written,
        "Voices archive extracted"
    );
    Ok(written)
}

fn is_safe_relative_path(path: &Path) -> bool {
    if path.is_absolute() {
        return false;
    }
    for component in path.components() {
        match component {
            Component::Normal(_) | Component::CurDir => {}
            // ParentDir, Prefix, RootDir all let an entry escape.
            Component::ParentDir | Component::Prefix(_) | Component::RootDir => return false,
        }
    }
    true
}

/// Locate a `Voices.tgz` archive inside `model_dir` and extract its
/// contents into `<model_dir>/voices/`. No-op (returns `Ok(0)`) when
/// no archive is present, which is the natural state for moshi-arch
/// repos that don't ship voice profiles (e.g. base Kyutai Moshi 7B).
///
/// Returns the count of files extracted, or `0` when nothing was
/// done.
///
/// # Errors
/// Same as [`extract_tgz`], plus filesystem-walk failures while
/// scanning `model_dir` for the archive.
pub fn extract_voices_in(model_dir: &Path) -> Result<usize> {
    if !model_dir.exists() {
        anyhow::bail!("Model dir does not exist: {}", model_dir.display());
    }

    let candidates = ["Voices.tgz", "voices.tgz", "Voices.tar.gz", "voices.tar.gz"];
    for name in candidates {
        let archive = model_dir.join(name);
        if archive.exists() {
            let dst = model_dir.join("voices");
            return extract_tgz(&archive, &dst);
        }
    }

    Ok(0)
}

#[cfg(test)]
#[allow(clippy::unwrap_used)] // tests panic on assertion failure by design
mod tests {
    use super::*;
    use std::io::Write;
    use std::path::PathBuf;

    /// Unique-per-test temp dir. Tests run in parallel so we can't
    /// share `std::process::id()` across them — race on the same
    /// archive_path causes intermittent failures.
    static TEST_DIR_COUNTER: std::sync::atomic::AtomicU64 =
        std::sync::atomic::AtomicU64::new(0);

    fn make_tgz(payload: &[(&str, &[u8])]) -> Result<PathBuf> {
        let n = TEST_DIR_COUNTER.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
        let dir = std::env::temp_dir().join(format!(
            "devpulse-voices-tgz-test-{}-{n}",
            std::process::id()
        ));
        std::fs::create_dir_all(&dir)?;

        let archive_path = dir.join("Voices.tgz");
        let file = File::create(&archive_path)?;
        let encoder = flate2::write::GzEncoder::new(file, flate2::Compression::fast());
        let mut tar = tar::Builder::new(encoder);

        for (name, contents) in payload {
            // Use `append` with an explicitly-pathed header. The
            // workspace's `tar` fork rejects `append_data`'s implicit
            // path-setting under some conditions; `set_path` first
            // then `set_cksum` is the explicit shape that matches
            // how upstream `tar::Builder::append_path_with_name`
            // builds its headers internally.
            let mut header = tar::Header::new_gnu();
            header.set_size(contents.len() as u64);
            header.set_mode(0o644);
            header.set_entry_type(tar::EntryType::Regular);
            header.set_path(name)?;
            header.set_cksum();
            tar.append(&header, std::io::Cursor::new(*contents))?;
        }

        tar.finish()?;
        let mut encoder = tar.into_inner()?;
        encoder.flush()?;
        encoder.finish()?;
        Ok(archive_path)
    }

    #[test]
    fn extract_round_trips_a_simple_archive() {
        let archive = make_tgz(&[
            ("default.wav", b"fake-wav-bytes"),
            ("nested/profile.json", b"{\"name\":\"x\"}"),
        ])
        .unwrap();

        let dst = archive.parent().unwrap().join("voices-out");
        let count = extract_tgz(&archive, &dst).unwrap();
        assert_eq!(count, 2, "two file entries expected");

        let default_wav = dst.join("default.wav");
        let nested_json = dst.join("nested").join("profile.json");
        assert!(default_wav.exists(), "default.wav not extracted");
        assert!(nested_json.exists(), "nested/profile.json not extracted");
        assert_eq!(std::fs::read(&default_wav).unwrap(), b"fake-wav-bytes");

        let _ = std::fs::remove_dir_all(archive.parent().unwrap());
    }

    #[test]
    fn rejects_path_traversal_at_create_time() {
        // The workspace's `tar` fork rejects `..` paths at archive
        // BUILD time (`Header::set_path` returns an error), one
        // layer earlier than `extract_tgz`'s runtime guard. Both
        // layers exist in the security stack — this test pins the
        // build-time guard so a future tar bump that loosens the
        // check would surface immediately.
        let err = make_tgz(&[("../escape.wav", b"x")]).unwrap_err();
        let msg = err.to_string();
        assert!(
            msg.contains("must not have")
                || msg.contains("relative")
                || msg.contains(".."),
            "expected build-time traversal rejection, got: {msg}"
        );
    }

    #[test]
    fn extract_tgz_relative_guard_recognises_escape_paths() {
        // Our runtime guard (`is_safe_relative_path`) is the second
        // layer of defence in case a future tar bump weakens the
        // build-time check or an archive is built externally with a
        // tool that doesn't validate. Pin the guard's behaviour
        // directly so coverage doesn't depend on tar's internals.
        assert!(!is_safe_relative_path(Path::new("../escape.wav")));
        assert!(!is_safe_relative_path(Path::new("nested/../escape.wav")));
        assert!(!is_safe_relative_path(Path::new("/abs/path")));
    }

    #[test]
    fn extract_voices_in_returns_zero_when_archive_missing() {
        let n = TEST_DIR_COUNTER.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
        let dir = std::env::temp_dir().join(format!(
            "devpulse-voices-missing-{}-{n}",
            std::process::id()
        ));
        std::fs::create_dir_all(&dir).unwrap();
        let count = extract_voices_in(&dir).unwrap();
        assert_eq!(count, 0);
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn safe_relative_path_recognises_normal_paths() {
        assert!(is_safe_relative_path(Path::new("voices/default.wav")));
        assert!(is_safe_relative_path(Path::new("nested/inner/file.bin")));
        assert!(!is_safe_relative_path(Path::new("../escape")));
        assert!(!is_safe_relative_path(Path::new("/etc/shadow")));
    }
}
