//! `PackagePortable` — produce a runnable folder + zip from an already-compiled release build.
//!
//! Decoupled from tauri-bundler's installer pipeline. When `cargo xtask
//! build-release` succeeds at compiling the Rust binary but the WiX/NSIS
//! bundling step fails (common on Windows with antivirus locking the MSI
//! mid-rename), this command produces a runnable distribution anyway.
//!
//! # Source of truth
//!
//! Reads [`Workspace::tauri_config`] — the single canonical parser for
//! `tauri.conf.json`. Previously this file opened the JSON directly,
//! which duplicated the schema knowledge with `build_release.rs`.
//!
//! # Output
//!
//! `target/release/portable/<productName>-v<version>/`
//!   ├── <productName>-app.exe    (main app)
//!   ├── llama-server.exe         (externalBin sidecar, already copied by tauri)
//!   ├── <runtime DLLs>           (CUDA + llama.cpp + libomp)
//!   ├── icon.ico
//!   ├── README.txt
//!   └── manifest.json            (build metadata + per-file SHA256 for integrity)
//!
//! Plus a zip at `target/release/<productName>-v<version>-portable.zip`.
//!
//! # Dry-run
//!
//! `--dry-run` walks every stage, reports what *would* be copied (path +
//! source size), but never writes to disk. Useful for CI smoke-testing
//! the SSOT alignment between tauri.conf.json and the compiled outputs
//! before committing to a minute-long zip cycle.
//!
//! # Invariant
//!
//! Refuses to run if the compiled binary is missing — a prior successful
//! `build-release` (or any `pnpm tauri build`) must have produced
//! `target/release/<productName>-app.exe`. We do NOT invoke cargo.

use crate::commands::Task;
use crate::stage;
use crate::workspace::{TauriConfig, Workspace};

use anyhow::{Context, Result};
use sha2::{Digest, Sha256};
use std::fs::{self, File};
use std::io::{BufReader, BufWriter, Read, Write};
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};
use zip::write::{FileOptions, ZipWriter};
use zip::CompressionMethod;

/// Produce a runnable portable folder + zip from the compiled release build.
///
/// `dry_run` reports what would be copied without writing anything.
pub struct PackagePortable {
    pub dry_run: bool,
}

impl Task for PackagePortable {
    fn name(&self) -> &'static str {
        if self.dry_run {
            "package-portable (dry-run)"
        } else {
            "package-portable"
        }
    }

    fn run(&self, ws: &Workspace) -> Result<()> {
        stage::section(if self.dry_run {
            "Package Portable (dry run)"
        } else {
            "Package Portable"
        });

        let plan = build_plan(ws)?;
        print_plan_header(&plan);

        if self.dry_run {
            execute_dry_run(&plan);
            return Ok(());
        }

        prepare_output_dir(&plan.portable_dir)?;
        let copied = execute_copies(ws, &plan)?;
        write_manifest(ws, &plan, &copied)?;
        write_readme(&plan)?;
        let zip_size = build_zip(&plan)?;
        print_summary(&plan, zip_size);

        Ok(())
    }
}

// ═══════════════════════════════════════════════════════════════════════
// Plan — pure value, built once, read by every stage
// ═══════════════════════════════════════════════════════════════════════

/// Resolved paths + config for a single package run. Built once at the
/// top of `run()` and passed by reference into stage helpers — keeps
/// path construction in one place so every stage agrees on where
/// things go.
struct PackagePlan {
    conf: TauriConfig,
    target_release: PathBuf,
    src_tauri: PathBuf,
    exe_path: PathBuf,
    exe_name: String,
    portable_name: String,
    portable_dir: PathBuf,
    zip_path: PathBuf,
}

fn build_plan(ws: &Workspace) -> Result<PackagePlan> {
    let conf = ws.tauri_config()?;
    let target_release = ws.root().join("target").join("release");
    let src_tauri = ws
        .root()
        .join("interfaces")
        .join("desktop")
        .join("src-tauri");

    let exe_name = format!("{}-app.exe", conf.product_name);
    let exe_path = target_release.join(&exe_name);
    if !exe_path.exists() {
        anyhow::bail!(
            "Compiled binary not found at {}.\n  \
             Run `cargo xtask build-release` first — `package-portable` \
             does NOT compile, it only packages what is already built.",
            exe_path.display()
        );
    }

    let portable_name = format!("{}-v{}", conf.product_name, conf.version);
    let portable_dir = target_release.join("portable").join(&portable_name);
    let zip_path = target_release.join(format!("{portable_name}-portable.zip"));

    Ok(PackagePlan {
        conf,
        target_release,
        src_tauri,
        exe_path,
        exe_name,
        portable_name,
        portable_dir,
        zip_path,
    })
}

fn print_plan_header(plan: &PackagePlan) {
    crate::xinfo!(
        "  > SSOT: productName={}, version={}, {} external bin(s), {} resource(s)",
        plan.conf.product_name,
        plan.conf.version,
        plan.conf.external_bins.len(),
        plan.conf.resources.len()
    );
    crate::xinfo!("");
    crate::xinfo!("  Compiled exe: {}", plan.exe_path.display());
    crate::xinfo!("  Destination:  {}", plan.portable_dir.display());
    crate::xinfo!("");
}

// ═══════════════════════════════════════════════════════════════════════
// Copy planning + execution
// ═══════════════════════════════════════════════════════════════════════

/// One file the portable build would copy or did copy.
#[derive(Debug, Clone)]
struct CopyEntry {
    /// Human category — appears in the manifest and dry-run report.
    category: &'static str,
    /// Absolute source path.
    source: PathBuf,
    /// Basename as it should land in the portable folder (flat layout).
    dest_name: String,
}

/// A copied file's on-disk result — hashed for the integrity manifest.
#[derive(Debug, Clone)]
struct CopiedFile {
    category: &'static str,
    name: String,
    size_bytes: u64,
    sha256_hex: String,
}

fn plan_copies(plan: &PackagePlan) -> Result<Vec<CopyEntry>> {
    let mut entries = Vec::new();

    // Main exe
    entries.push(CopyEntry {
        category: "exe",
        source: plan.exe_path.clone(),
        dest_name: plan.exe_name.clone(),
    });

    // External bins — tauri-bundler copies them next to the main exe.
    // We lift them straight from `target/release/`, not from src-tauri/.
    let mut missing_external = Vec::new();
    for prefix in &plan.conf.external_bins {
        let basename = utf8_filename(Path::new(prefix))
            .with_context(|| format!("externalBin path has non-UTF8 basename: {prefix}"))?;
        let sidecar_name = format!("{basename}.exe");
        let src = plan.target_release.join(&sidecar_name);
        if !src.exists() {
            missing_external.push(src.display().to_string());
            continue;
        }
        entries.push(CopyEntry {
            category: "external_bin",
            source: src,
            dest_name: sidecar_name,
        });
    }
    if !missing_external.is_empty() {
        anyhow::bail!(
            "externalBin sidecar(s) missing from target/release/ — tauri-bundler should \
             have copied these during compile. Re-run `cargo xtask build-release`. \
             Missing:\n  {}",
            missing_external.join("\n  ")
        );
    }

    // Resources (runtime DLLs, declared with paths relative to src-tauri/).
    let mut missing_resources = Vec::new();
    for rel in &plan.conf.resources {
        let src = plan.src_tauri.join(rel);
        if !src.exists() {
            missing_resources.push(src.display().to_string());
            continue;
        }
        let basename = utf8_filename(Path::new(rel))
            .with_context(|| format!("resource path has non-UTF8 basename: {rel}"))?
            .to_string();
        entries.push(CopyEntry {
            category: "resource",
            source: src,
            dest_name: basename,
        });
    }
    if !missing_resources.is_empty() {
        anyhow::bail!(
            "Resources declared in tauri.conf.json are missing on disk.\n  \
             Each must exist relative to interfaces/desktop/src-tauri/.\n  \
             Missing:\n  {}",
            missing_resources.join("\n  ")
        );
    }

    // Primary .ico icon — first one that exists wins.
    if let Some(icon) = locate_primary_icon(plan)? {
        entries.push(icon);
    }

    Ok(entries)
}

/// Locate the first `.ico` from `bundle.icon` that exists on disk.
/// Returns `None` with a warning printed if none do — not a hard error,
/// because tauri-bundler itself tolerates a missing icon in bundles.
fn locate_primary_icon(plan: &PackagePlan) -> Result<Option<CopyEntry>> {
    for icon_rel in &plan.conf.icons {
        if !icon_rel.ends_with(".ico") {
            continue;
        }
        let src = plan.src_tauri.join(icon_rel);
        if src.exists() {
            return Ok(Some(CopyEntry {
                category: "icon",
                source: src,
                dest_name: "icon.ico".to_string(),
            }));
        }
    }
    // Missing icon is non-fatal but worth surfacing — goes to stderr so
    // CI parsers that scan stderr for warnings pick it up.
    crate::xwarn!("  [!!] no .ico icon found in tauri.conf.json bundle.icon list — icon skipped");
    Ok(None)
}

fn prepare_output_dir(portable_dir: &Path) -> Result<()> {
    if portable_dir.exists() {
        fs::remove_dir_all(portable_dir)
            .with_context(|| format!("removing old {}", portable_dir.display()))?;
    }
    fs::create_dir_all(portable_dir)
        .with_context(|| format!("creating {}", portable_dir.display()))?;
    Ok(())
}

/// Copy every planned file, hashing on the way in so the manifest is
/// produced from the exact bytes that landed on disk (not a re-read).
fn execute_copies(ws: &Workspace, plan: &PackagePlan) -> Result<Vec<CopiedFile>> {
    let entries = plan_copies(plan)?;
    let _ = ws; // reserved for future progress reporting
    let mut copied = Vec::with_capacity(entries.len());
    for entry in entries {
        let dst = plan.portable_dir.join(&entry.dest_name);
        let (size_bytes, sha256_hex) = copy_and_hash(&entry.source, &dst)?;
        let size_mb = (size_bytes as f64) / (1024.0 * 1024.0);
        crate::xinfo!(
            "  > copied [{cat:<12}] {name:<40} ({size_mb:>8.2} MB)",
            cat = entry.category,
            name = entry.dest_name,
        );
        copied.push(CopiedFile {
            category: entry.category,
            name: entry.dest_name,
            size_bytes,
            sha256_hex,
        });
    }
    Ok(copied)
}

fn execute_dry_run(plan: &PackagePlan) {
    // Dry-run replays the plan without touching disk. We still call
    // plan_copies so missing resources/externals surface as errors the
    // same way they would in a real run.
    let entries = match plan_copies(plan) {
        Ok(e) => e,
        Err(e) => {
            // Dry-run validation failures aren't hard xtask errors — they
            // surface missing preconditions. Warn-stream so CI can catch.
            crate::xwarn!("  [dry-run] would fail: {e:#}");
            return;
        }
    };
    crate::xinfo!("  [dry-run] would write {} files:", entries.len());
    for entry in entries {
        let size_bytes = fs::metadata(&entry.source).map(|m| m.len()).unwrap_or(0);
        let size_mb = (size_bytes as f64) / (1024.0 * 1024.0);
        crate::xinfo!(
            "    [{cat:<12}] {name:<40} ({size_mb:>8.2} MB)  ← {src}",
            cat = entry.category,
            name = entry.dest_name,
            src = entry.source.display()
        );
    }
    crate::xinfo!("  [dry-run] would write manifest.json + README.txt");
    crate::xinfo!(
        "  [dry-run] would produce zip at {}",
        plan.zip_path.display()
    );
    crate::xinfo!("  [dry-run] nothing written.");
}

/// Streaming copy that computes SHA256 over the bytes as they flow.
/// Reading the file twice (once for copy, once for hash) is fine for
/// DLLs but needless IO; one pass keeps the hot cache warm.
fn copy_and_hash(src: &Path, dst: &Path) -> Result<(u64, String)> {
    let src_file = File::open(src).with_context(|| format!("opening source {}", src.display()))?;
    let mut reader = BufReader::new(src_file);
    let dst_file = File::create(dst).with_context(|| format!("creating dest {}", dst.display()))?;
    let mut writer = BufWriter::new(dst_file);

    let mut hasher = Sha256::new();
    let mut buf = [0u8; 64 * 1024];
    let mut total: u64 = 0;
    loop {
        let n = reader
            .read(&mut buf)
            .with_context(|| format!("reading from {}", src.display()))?;
        if n == 0 {
            break;
        }
        hasher.update(&buf[..n]);
        writer
            .write_all(&buf[..n])
            .with_context(|| format!("writing to {}", dst.display()))?;
        total += n as u64;
    }
    writer
        .flush()
        .with_context(|| format!("flushing {}", dst.display()))?;
    Ok((total, hex::encode(hasher.finalize())))
}

// ═══════════════════════════════════════════════════════════════════════
// Manifest + README + Zip
// ═══════════════════════════════════════════════════════════════════════

fn write_manifest(ws: &Workspace, plan: &PackagePlan, copied: &[CopiedFile]) -> Result<()> {
    let built_at_unix_secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    let git_sha = detect_git_sha(ws);

    // Small, hand-written JSON — keeps xtask free of a serde serializer
    // dep just for this one artifact. Fields are stable; consumers can
    // parse with any JSON library.
    let mut body = String::new();
    body.push_str("{\n");
    body.push_str(&format!(
        "  \"product_name\": {},\n",
        json_string(&plan.conf.product_name)
    ));
    body.push_str(&format!(
        "  \"version\": {},\n",
        json_string(&plan.conf.version)
    ));
    body.push_str(&format!(
        "  \"portable_name\": {},\n",
        json_string(&plan.portable_name)
    ));
    body.push_str(&format!(
        "  \"built_at_unix_secs\": {built_at_unix_secs},\n",
    ));
    match git_sha {
        Some(sha) => body.push_str(&format!("  \"git_sha\": {},\n", json_string(&sha))),
        None => body.push_str("  \"git_sha\": null,\n"),
    }
    body.push_str("  \"files\": [\n");
    for (idx, file) in copied.iter().enumerate() {
        let comma = if idx + 1 == copied.len() { "" } else { "," };
        body.push_str(&format!(
            "    {{ \"category\": {cat}, \"name\": {name}, \"size_bytes\": {size}, \"sha256\": {hash} }}{comma}\n",
            cat = json_string(file.category),
            name = json_string(&file.name),
            size = file.size_bytes,
            hash = json_string(&file.sha256_hex),
        ));
    }
    body.push_str("  ]\n");
    body.push_str("}\n");

    let path = plan.portable_dir.join("manifest.json");
    let mut f = File::create(&path).with_context(|| format!("creating {}", path.display()))?;
    f.write_all(body.as_bytes())
        .with_context(|| format!("writing {}", path.display()))?;
    crate::xinfo!("  > wrote manifest.json ({} files hashed)", copied.len());
    Ok(())
}

/// `git rev-parse HEAD` — returns the short sha if available. A missing
/// `git` or a non-repo cwd returns `None` rather than failing the
/// package run (portable zips still work without git attribution).
fn detect_git_sha(ws: &Workspace) -> Option<String> {
    let output = ws.output("git", &["rev-parse", "--short", "HEAD"]).ok()?;
    if !output.status.success() {
        return None;
    }
    let sha = String::from_utf8(output.stdout).ok()?.trim().to_string();
    if sha.is_empty() {
        None
    } else {
        Some(sha)
    }
}

/// Minimal JSON string escaper — handles backslash, double quote, and
/// ASCII control chars. Paths on Windows are the only realistic input
/// with backslashes in this codebase.
fn json_string(s: &str) -> String {
    let mut out = String::with_capacity(s.len() + 2);
    out.push('"');
    for ch in s.chars() {
        match ch {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c if (c as u32) < 0x20 => {
                out.push_str(&format!("\\u{:04x}", c as u32));
            }
            c => out.push(c),
        }
    }
    out.push('"');
    out
}

fn write_readme(plan: &PackagePlan) -> Result<()> {
    let mut body = String::new();
    body.push_str(&format!(
        "{} v{} — portable build\n\n",
        plan.conf.product_name, plan.conf.version
    ));
    body.push_str("Unzip this folder anywhere. No installer required.\n");
    body.push_str("All files MUST remain in the same folder — Windows DLL search\n");
    body.push_str("order resolves the runtime libraries as siblings of the exe.\n\n");
    body.push_str("Launch:\n");
    body.push_str(&format!("  {}\n\n", plan.exe_name));
    body.push_str("Contents:\n");
    body.push_str(&format!(
        "  {} — main application (Tauri + SvelteKit frontend)\n",
        plan.exe_name
    ));
    for bin in &plan.conf.external_bins {
        if let Some(name) = Path::new(bin).file_name().and_then(|n| n.to_str()) {
            body.push_str(&format!("  {name}.exe — sidecar process\n"));
        }
    }
    if !plan.conf.resources.is_empty() {
        body.push_str(&format!(
            "  {} runtime DLLs (llama.cpp, CUDA, cuBLAS, libomp)\n",
            plan.conf.resources.len()
        ));
    }
    body.push_str("  icon.ico — application icon\n");
    body.push_str("  manifest.json — build metadata + per-file SHA256 (integrity check)\n\n");
    body.push_str("First run writes data to %LOCALAPPDATA%\\DevPulse\\ (libSQL, DuckDB, logs).\n");

    let path = plan.portable_dir.join("README.txt");
    let mut f = File::create(&path).with_context(|| format!("creating {}", path.display()))?;
    f.write_all(body.as_bytes())
        .with_context(|| format!("writing {}", path.display()))?;
    crate::xinfo!("  > wrote README.txt");
    Ok(())
}

fn build_zip(plan: &PackagePlan) -> Result<u64> {
    if plan.zip_path.exists() {
        fs::remove_file(&plan.zip_path)
            .with_context(|| format!("removing old zip {}", plan.zip_path.display()))?;
    }
    zip_dir_flat(&plan.portable_dir, &plan.zip_path)?;
    Ok(fs::metadata(&plan.zip_path).map(|m| m.len()).unwrap_or(0))
}

/// Zip all FILES directly inside `src_dir` into `zip_path`. Flat layout —
/// extracts to the same shape as the portable folder. Does not recurse
/// into subfolders (a portable build has none).
fn zip_dir_flat(src_dir: &Path, zip_path: &Path) -> Result<()> {
    let file =
        File::create(zip_path).with_context(|| format!("creating {}", zip_path.display()))?;
    let mut zip = ZipWriter::new(BufWriter::new(file));
    let options: FileOptions<()> = FileOptions::default()
        .compression_method(CompressionMethod::Deflated)
        .compression_level(Some(6));

    let mut count = 0u32;
    for entry in fs::read_dir(src_dir).with_context(|| format!("reading {}", src_dir.display()))? {
        let entry = entry?;
        let path = entry.path();
        if !path.is_file() {
            continue;
        }
        let name = utf8_filename(&path)
            .with_context(|| format!("non-UTF8 filename inside {}", src_dir.display()))?;
        zip.start_file(name, options)
            .with_context(|| format!("zip entry {name}"))?;
        let mut f = File::open(&path).with_context(|| format!("opening {}", path.display()))?;
        std::io::copy(&mut f, &mut zip).with_context(|| format!("streaming {name} into zip"))?;
        count += 1;
    }

    zip.finish().context("finalizing zip archive")?;
    crate::xinfo!("  > zip archived {count} files");
    Ok(())
}

fn print_summary(plan: &PackagePlan, zip_size: u64) {
    let zip_mb = (zip_size as f64) / (1024.0 * 1024.0);
    crate::xinfo!("");
    crate::xinfo!("  ────────────────────────────────────────");
    crate::xinfo!("  Portable build ready.");
    crate::xinfo!("");
    crate::xinfo!("  Folder: {}", plan.portable_dir.display());
    crate::xinfo!("  Zip:    {} ({zip_mb:.2} MB)", plan.zip_path.display());
    crate::xinfo!("");
    crate::xinfo!("  Smoke test:");
    crate::xinfo!("    1. cd \"{}\"", plan.portable_dir.display());
    crate::xinfo!("    2. Run {}", plan.exe_name);
    crate::xinfo!(
        "    3. Expect: window opens, services start, `http://127.0.0.1:8822/health` healthy."
    );
    crate::xinfo!("");
}

// ═══════════════════════════════════════════════════════════════════════
// Path utilities
// ═══════════════════════════════════════════════════════════════════════

/// Extract the UTF-8 basename of a path, or error explicitly.
///
/// Windows paths are natively UTF-16 — a path with a lone surrogate
/// would silently become `<?>` under `.to_str().unwrap_or("<?>")`. The
/// portable build's inputs are all ASCII today, so this helper exists
/// to *surface* the day that stops being true instead of papering over
/// it.
fn utf8_filename(path: &Path) -> Result<&str> {
    path.file_name()
        .and_then(|n| n.to_str())
        .with_context(|| format!("path has no UTF-8 basename: {}", path.display()))
}

// ═══════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════

#[cfg(test)]
mod tests {
    use super::json_string;

    #[test]
    fn json_string_escapes_backslash_and_quote() {
        assert_eq!(
            json_string("D:\\path \"with\" quote"),
            r#""D:\\path \"with\" quote""#
        );
    }

    #[test]
    fn json_string_escapes_newline_tab_cr() {
        assert_eq!(json_string("a\nb\tc\rd"), r#""a\nb\tc\rd""#);
    }

    #[test]
    fn json_string_passes_unicode_through() {
        // Greek mu + em-dash — both above U+001F so they stay literal.
        assert_eq!(json_string("μ — ok"), "\"μ — ok\"");
    }

    #[test]
    fn json_string_escapes_control_chars_as_unicode() {
        // 0x01 should become \u0001.
        assert_eq!(json_string("\u{0001}"), r#""\u0001""#);
    }
}
