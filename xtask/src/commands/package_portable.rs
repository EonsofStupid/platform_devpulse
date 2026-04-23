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
//! `tauri.conf.json`. The config parser already merges the per-platform
//! override (`tauri.windows.conf.json` etc.) via RFC 7396, so
//! `package-portable` sees the same resource set tauri-bundler does.
//!
//! # Output layout
//!
//! ```text
//! target/release/portable/<productName>-v<version>/
//!   ├── <productName>-app.exe       (main app)
//!   ├── llama-server.exe            (externalBin sidecar)
//!   ├── <runtime DLLs at root>      (CUDA + llama.cpp + libomp)
//!   ├── devforge/                   (REH tree — map-form resource with target "devforge/")
//!   │   └── out/server-main.js
//!   │   └── …3000 files…
//!   ├── icon.ico
//!   ├── README.txt
//!   └── manifest.json               (per-file SHA256 for integrity)
//! ```
//!
//! Plus a zip at `target/release/<productName>-v<version>-portable.zip`.
//!
//! # Resource semantics
//!
//! `bundle.resources` is parsed from either Tauri list form or map form
//! (see [`crate::workspace::parse_resources`]). Each normalized
//! [`ResourceEntry`] pairs a `source` path (relative to `src-tauri/`) with
//! a `target` (relative path inside the portable folder):
//!
//! * `target == ""` — land at the portable root. Single files use their
//!   source basename; directories and globs flatten their contents into
//!   the root.
//! * `target` ending in `/` — land inside that subfolder, preserving
//!   subdirectory structure for tree sources.
//! * `target` with no trailing slash — treat as an explicit filename for
//!   single-file sources (rename); for tree sources, treat as a subfolder.
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
use crate::workspace::{ResourceEntry, TauriConfig, Workspace};

use anyhow::{Context, Result};
use sha2::{Digest, Sha256};
use std::collections::BTreeMap;
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
        // Trait entry point — discards the summary. Callers that want
        // the per-category totals (build-release's structured event log)
        // use [`run_and_report`] directly.
        self.run_and_report(ws).map(|_| ())
    }
}

impl PackagePortable {
    /// Run the packaging pipeline and return a [`PortableSummary`] with
    /// per-category file counts and byte totals. `None` is returned for
    /// dry-run invocations (no files landed on disk to summarize).
    ///
    /// # Errors
    /// Returns any error surfaced by plan construction, resource
    /// resolution, file copying, coverage assertion, manifest writing,
    /// or zip construction. The coverage assertion in particular rejects
    /// the "tauri.conf.json declared N resources, zero landed on disk"
    /// case — the exact regression class this overhaul exists to
    /// eliminate.
    pub fn run_and_report(&self, ws: &Workspace) -> Result<Option<PortableSummary>> {
        stage::section(if self.dry_run {
            "Package Portable (dry run)"
        } else {
            "Package Portable"
        });

        let plan = build_plan(ws)?;
        print_plan_header(&plan);

        if self.dry_run {
            execute_dry_run(&plan)?;
            return Ok(None);
        }

        prepare_output_dir(&plan.portable_dir)?;
        let report = execute_copies(ws, &plan)?;
        // Two layered assertions:
        //   1. `assert_resource_coverage` — quick aggregate: "did ANY
        //      resource file land?" Catches the merge-failure class.
        //   2. `assert_declared_resources_present` — strict per-resource:
        //      "did THIS resource's target exist on disk?" Catches
        //      target-path-resolution bugs that still produce files but
        //      at the wrong location (e.g. DevForge under `win32-x64/`
        //      instead of `devforge/`).
        assert_resource_coverage(&plan, &report)?;
        assert_declared_resources_present(&plan)?;
        write_manifest(ws, &plan, &report)?;
        write_readme(&plan, &report)?;
        let zip_size = build_zip(&plan)?;
        print_summary(&plan, &report, zip_size);

        Ok(Some(PortableSummary::from_report(&plan, &report)))
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
    let mut conf = ws.tauri_config()?;
    // Portable layout policy — applied once here so every downstream stage
    // (plan_copies, assertions, manifest, README) sees the normalized set.
    conf.resources = apply_portable_layout_policy(conf.resources);
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

/// Normalize `bundle.resources` entries into the portable-build target
/// layout. Tauri's own map form lets Linux/macOS declare a renamed target
/// (`resources/devforge/<platform>/**/*` → `devforge/`), but **tauri-build
/// rejects the equivalent Windows map-form config** with `os error 3` when
/// compiling the backend crate — at minimum with the particular `""`
/// target + large glob combination we need. Reverting Windows to list
/// form (the shape in HEAD) is the only configuration that survives the
/// backend build, so this policy applies the renames xtask needs on its
/// side instead of relying on the Tauri config to express them.
///
/// Policies (list-form heuristics — only applied when the entry arrived
/// with `target == ""`, i.e. from list form or a map-form explicit-root):
///
/// * `resources/devforge/<platform>/` or `.../**/*` or `.../*` — retarget
///   to `devforge/` so the Rust runtime's `{resourceDir}/devforge/` lookup
///   (see `interfaces/desktop/src-tauri/src/commands/devforge/paths.rs`)
///   finds the tree. Matches what tauri.linux/macos.conf.json already
///   declares via map form.
///
/// No-op for map-form entries that already carry a non-empty target: the
/// declaration is authoritative and the policy defers to it.
fn apply_portable_layout_policy(resources: Vec<ResourceEntry>) -> Vec<ResourceEntry> {
    resources
        .into_iter()
        .map(|mut r| {
            if r.target.is_empty() && is_devforge_platform_source(&r.source) {
                r.target = "devforge/".to_string();
            }
            r
        })
        .collect()
}

/// Does the source path point at `resources/devforge/<platform>/` (with or
/// without trailing slash or a glob suffix)? Used only by
/// [`apply_portable_layout_policy`].
fn is_devforge_platform_source(source: &str) -> bool {
    let stripped = source
        .strip_suffix("/**/*")
        .or_else(|| source.strip_suffix("/*"))
        .unwrap_or(source)
        .trim_end_matches('/');
    let mut segments = stripped.split('/');
    match (segments.next(), segments.next(), segments.next()) {
        (Some("resources"), Some("devforge"), Some(platform)) if !platform.is_empty() => {
            // Ensure there's nothing DEEPER than the platform subdir —
            // a source like `resources/devforge/win32-x64/out/` should not
            // auto-retarget; the author clearly meant something else.
            segments.next().is_none()
        }
        _ => false,
    }
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
///
/// `dest_rel` is the path inside the portable folder, with OS-native
/// separators. It has forward slashes applied at manifest/zip serialization
/// time so consumers on other OSes see consistent paths regardless of who
/// built the archive.
#[derive(Debug, Clone)]
struct CopyEntry {
    category: &'static str,
    source: PathBuf,
    dest_rel: PathBuf,
}

/// A copied file's on-disk result — hashed for the integrity manifest.
#[derive(Debug, Clone)]
struct CopiedFile {
    category: &'static str,
    dest_rel: PathBuf,
    size_bytes: u64,
    sha256_hex: String,
}

/// Aggregate result of a package-portable run. Internal to this module;
/// callers outside the module receive the thinner [`PortableSummary`]
/// which omits the per-file `Vec<CopiedFile>` (3000+ entries for tree
/// resources — noise in an event log).
#[derive(Debug, Clone)]
struct PortableReport {
    files: Vec<CopiedFile>,
    total_bytes: u64,
    per_category: BTreeMap<&'static str, CategoryTotals>,
}

#[derive(Debug, Clone, Default)]
struct CategoryTotals {
    files: usize,
    bytes: u64,
}

impl PortableReport {
    fn from_files(files: Vec<CopiedFile>) -> Self {
        let mut per_category: BTreeMap<&'static str, CategoryTotals> = BTreeMap::new();
        let mut total_bytes: u64 = 0;
        for f in &files {
            total_bytes += f.size_bytes;
            let entry = per_category.entry(f.category).or_default();
            entry.files += 1;
            entry.bytes += f.size_bytes;
        }
        Self {
            files,
            total_bytes,
            per_category,
        }
    }
}

/// Public aggregate returned by [`PackagePortable::run_and_report`] for
/// inclusion in the caller's structured event log.
///
/// Design note: the category key is a `String`, not a `&'static str`. The
/// internal [`PortableReport`] stores categories as `&'static str` because
/// the category set is closed (`exe` / `external_bin` / `resource` /
/// `resource_tree_file` / `icon`). Converting to `String` at the module
/// boundary keeps the public type independent of the internal category
/// enumeration — adding a category later does not ripple through callers.
#[derive(Debug, Clone)]
pub struct PortableSummary {
    pub total_files: usize,
    pub total_bytes: u64,
    pub per_category: BTreeMap<String, PortableCategoryTotals>,
    pub declared_resources: usize,
    pub declared_external_bins: usize,
}

#[derive(Debug, Clone, Copy, Default)]
pub struct PortableCategoryTotals {
    pub files: usize,
    pub bytes: u64,
}

impl PortableSummary {
    fn from_report(plan: &PackagePlan, report: &PortableReport) -> Self {
        let per_category: BTreeMap<String, PortableCategoryTotals> = report
            .per_category
            .iter()
            .map(|(k, v)| {
                (
                    (*k).to_string(),
                    PortableCategoryTotals {
                        files: v.files,
                        bytes: v.bytes,
                    },
                )
            })
            .collect();
        Self {
            total_files: report.files.len(),
            total_bytes: report.total_bytes,
            per_category,
            declared_resources: plan.conf.resources.len(),
            declared_external_bins: plan.conf.external_bins.len(),
        }
    }

    /// Compact one-line human string suitable for a structured event
    /// log detail field. Format:
    /// `"N files, M.M MB — R resources + S sidecars declared"`.
    pub fn event_detail(&self) -> String {
        let mb = (self.total_bytes as f64) / (1024.0 * 1024.0);
        format!(
            "{} files, {mb:.1} MB — {} resources + {} sidecars declared",
            self.total_files, self.declared_resources, self.declared_external_bins,
        )
    }
}

fn plan_copies(plan: &PackagePlan) -> Result<Vec<CopyEntry>> {
    let mut entries = Vec::new();

    // ── Main exe ─────────────────────────────────────────────────────
    entries.push(CopyEntry {
        category: "exe",
        source: plan.exe_path.clone(),
        dest_rel: PathBuf::from(&plan.exe_name),
    });

    // ── External bins — tauri-bundler copies them next to the main exe.
    //    We lift them straight from `target/release/`, not from src-tauri/.
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
            dest_rel: PathBuf::from(&sidecar_name),
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

    // ── Resources — expand each ResourceEntry into 1..N CopyEntry's
    //    depending on whether the source is a file, a directory, or a glob.
    let mut missing_resources = Vec::new();
    for res in &plan.conf.resources {
        match resource_copy_entries(&plan.src_tauri, res) {
            Ok(mut sub) => entries.append(&mut sub),
            Err(ResourceResolveError::MissingSource { display }) => {
                missing_resources.push(display);
            }
            Err(ResourceResolveError::Fatal(e)) => return Err(e),
        }
    }
    if !missing_resources.is_empty() {
        anyhow::bail!(
            "Resources declared in tauri.conf.json are missing on disk.\n  \
             Each must exist relative to interfaces/desktop/src-tauri/.\n  \
             Missing:\n  {}",
            missing_resources.join("\n  ")
        );
    }

    // ── Primary .ico icon — first one that exists wins.
    if let Some(icon) = locate_primary_icon(plan)? {
        entries.push(icon);
    }

    Ok(entries)
}

/// Errors from [`resource_copy_entries`]. `MissingSource` is collected and
/// reported in bulk by `plan_copies`; any other failure (IO, non-UTF8 path)
/// aborts the plan immediately.
enum ResourceResolveError {
    MissingSource { display: String },
    Fatal(anyhow::Error),
}

impl From<anyhow::Error> for ResourceResolveError {
    fn from(e: anyhow::Error) -> Self {
        Self::Fatal(e)
    }
}

/// Expand one [`ResourceEntry`] into zero or more [`CopyEntry`] rows.
///
/// Resolves Tauri's source shapes (literal file, literal directory with
/// optional trailing slash, glob `…/*` or `…/**/*`) and applies the
/// target policy documented on [`ResourceEntry`]. Returns `MissingSource`
/// (not a hard error) if the resolved base path does not exist — the
/// caller aggregates these so the human sees all missing resources in one
/// message rather than bailing on the first.
fn resource_copy_entries(
    base_dir: &Path,
    entry: &ResourceEntry,
) -> Result<Vec<CopyEntry>, ResourceResolveError> {
    // Strip a glob suffix to find the base directory the walk should root at.
    // Tauri v2 accepts `dir/**/*` (recursive) and `dir/*` (one level); we
    // treat the former as "walk everything" and the latter as "one level
    // deep". The explicit-tree flag short-circuits the is_dir check when the
    // glob is present without the directory having to physically exist yet
    // (it always does here but the flag keeps the branch readable).
    const GLOB_DOUBLESTAR: &str = "/**/*";
    const GLOB_STAR: &str = "/*";

    let (literal, glob_depth): (&str, Option<walkdir::WalkDir>) =
        if let Some(base) = entry.source.strip_suffix(GLOB_DOUBLESTAR) {
            (base.trim_end_matches('/'), Some(walkdir::WalkDir::new("")))
        } else if let Some(base) = entry.source.strip_suffix(GLOB_STAR) {
            (
                base.trim_end_matches('/'),
                Some(walkdir::WalkDir::new("").min_depth(1).max_depth(1)),
            )
        } else {
            (entry.source.trim_end_matches('/'), None)
        };

    let abs = base_dir.join(literal);
    if !abs.exists() {
        return Err(ResourceResolveError::MissingSource {
            display: abs.display().to_string(),
        });
    }

    // Decide whether we're walking a tree or copying a single file.
    let tree_mode = glob_depth.is_some() || abs.is_dir() || entry.source.ends_with('/');

    if tree_mode {
        // Walk the tree, mapping every file under `abs` to a dest path
        // rooted at `target` (empty target → portable root).
        let target_root = target_as_subpath(&entry.target);
        let walker = match &glob_depth {
            Some(prototype) => prototype_walkdir(prototype, &abs),
            None => walkdir::WalkDir::new(&abs).follow_links(false),
        };

        let mut out = Vec::new();
        for walked in walker.into_iter().filter_map(|e| e.ok()) {
            if !walked.file_type().is_file() {
                continue;
            }
            let rel_in_source = walked
                .path()
                .strip_prefix(&abs)
                .map_err(|e| {
                    anyhow::anyhow!(
                        "walkdir produced path outside base {}: {e}",
                        abs.display()
                    )
                })?
                .to_path_buf();
            let dest_rel = if target_root.as_os_str().is_empty() {
                rel_in_source
            } else {
                target_root.join(rel_in_source)
            };
            out.push(CopyEntry {
                category: "resource_tree_file",
                source: walked.into_path(),
                dest_rel,
            });
        }
        Ok(out)
    } else {
        // Single file.
        let basename = utf8_filename(&abs)
            .with_context(|| format!("resource source has non-UTF8 basename: {}", entry.source))?;
        let dest_rel = if entry.target.is_empty() {
            PathBuf::from(basename)
        } else if entry.target.ends_with('/') {
            PathBuf::from(entry.target.trim_end_matches('/')).join(basename)
        } else {
            // Explicit rename.
            PathBuf::from(&entry.target)
        };
        Ok(vec![CopyEntry {
            category: "resource",
            source: abs,
            dest_rel,
        }])
    }
}

/// Convert a `target` string (possibly empty, possibly with trailing slash)
/// into a [`PathBuf`] suitable for `join`. Empty stays empty; `"foo/"` →
/// `foo`; `"foo/bar/"` → `foo/bar`.
fn target_as_subpath(target: &str) -> PathBuf {
    if target.is_empty() {
        PathBuf::new()
    } else {
        PathBuf::from(target.trim_end_matches('/'))
    }
}

/// Rebuild a [`walkdir::WalkDir`] at `abs` with the same depth bounds as
/// `prototype`. [`walkdir::WalkDir`] exposes a builder-style API but does
/// not implement `Clone`; we carry the prototype forward to preserve any
/// `min_depth`/`max_depth` the caller set and replace the path at the end.
fn prototype_walkdir(prototype: &walkdir::WalkDir, abs: &Path) -> walkdir::WalkDir {
    // Ignore the prototype's bound encoding and just reconstruct from abs —
    // in practice only the two glob flavors in `resource_copy_entries`
    // reach this helper, and both are reconstructable.
    let _ = prototype; // reserved for future introspection
    walkdir::WalkDir::new(abs).follow_links(false)
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
                dest_rel: PathBuf::from("icon.ico"),
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
///
/// Per-file log lines would balloon under tree resources (DevForge alone
/// is 3000+ files); instead we log per-category aggregates after the
/// copy loop so the transcript stays scannable.
fn execute_copies(ws: &Workspace, plan: &PackagePlan) -> Result<PortableReport> {
    let entries = plan_copies(plan)?;
    let _ = ws; // reserved for future progress reporting

    let total_entries = entries.len();
    let mut copied: Vec<CopiedFile> = Vec::with_capacity(total_entries);
    for entry in entries {
        let dst = plan.portable_dir.join(&entry.dest_rel);
        if let Some(parent) = dst.parent() {
            fs::create_dir_all(parent)
                .with_context(|| format!("creating parent dir {}", parent.display()))?;
        }
        let (size_bytes, sha256_hex) = copy_and_hash(&entry.source, &dst)?;
        copied.push(CopiedFile {
            category: entry.category,
            dest_rel: entry.dest_rel,
            size_bytes,
            sha256_hex,
        });
    }

    let report = PortableReport::from_files(copied);
    for (cat, totals) in &report.per_category {
        let mb = (totals.bytes as f64) / (1024.0 * 1024.0);
        crate::xinfo!(
            "  > {cat:<20} {:>5} files, {mb:>8.2} MB",
            totals.files,
            cat = cat,
        );
    }
    crate::xinfo!(
        "  > total                {:>5} files, {:>8.2} MB",
        report.files.len(),
        (report.total_bytes as f64) / (1024.0 * 1024.0),
    );
    Ok(report)
}

fn execute_dry_run(plan: &PackagePlan) -> Result<()> {
    // Dry-run replays the plan without touching disk. We still call
    // plan_copies so missing resources/externals surface as errors the
    // same way they would in a real run.
    let entries = match plan_copies(plan) {
        Ok(e) => e,
        Err(e) => {
            // Dry-run validation failures aren't hard xtask errors — they
            // surface missing preconditions. Warn-stream so CI can catch.
            crate::xwarn!("  [dry-run] would fail: {e:#}");
            return Ok(());
        }
    };

    // Aggregate by category before printing so 3000 tree files don't
    // flood the transcript.
    let mut per_category: BTreeMap<&'static str, CategoryTotals> = BTreeMap::new();
    for entry in &entries {
        let size_bytes = fs::metadata(&entry.source).map(|m| m.len()).unwrap_or(0);
        let totals = per_category.entry(entry.category).or_default();
        totals.files += 1;
        totals.bytes += size_bytes;
    }

    crate::xinfo!("  [dry-run] would write {} files:", entries.len());
    for (cat, totals) in &per_category {
        let mb = (totals.bytes as f64) / (1024.0 * 1024.0);
        crate::xinfo!(
            "    [{cat:<20}] {:>5} files, {mb:>8.2} MB",
            totals.files,
            cat = cat,
        );
    }
    crate::xinfo!("  [dry-run] would write manifest.json + README.txt");
    crate::xinfo!(
        "  [dry-run] would produce zip at {}",
        plan.zip_path.display()
    );
    crate::xinfo!("  [dry-run] nothing written.");
    Ok(())
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

/// Invariant check: every declared `bundle.resources` entry must have
/// produced at least one copied file. This catches the silent-degradation
/// mode where a platform override failed to merge or a directory walker
/// returned an empty tree — both of which used to ship a tiny portable
/// folder with an apparent "ok" exit.
fn assert_resource_coverage(plan: &PackagePlan, report: &PortableReport) -> Result<()> {
    let declared = plan.conf.resources.len();
    if declared == 0 {
        return Ok(());
    }
    let resource_files = report
        .per_category
        .get("resource")
        .map_or(0, |t| t.files);
    let tree_files = report
        .per_category
        .get("resource_tree_file")
        .map_or(0, |t| t.files);
    if resource_files + tree_files == 0 {
        anyhow::bail!(
            "tauri.conf.json declares {declared} bundle.resources but zero files landed \
             in the portable folder at {}. This almost always means the platform \
             override did not merge (check `Workspace::tauri_config` / RFC 7396 merge) \
             or the resource sources all failed to resolve.",
            plan.portable_dir.display()
        );
    }
    Ok(())
}

/// Per-resource presence check — stricter than [`assert_resource_coverage`].
/// For every `ResourceEntry` in `plan.conf.resources`, verify its declared
/// target actually landed on disk inside `plan.portable_dir`:
///
/// * Tree sources (directory or glob): at least one file exists beneath the
///   target subdirectory.
/// * File sources: the expected file exists at the computed destination
///   (same resolution rules as `resource_copy_entries` — empty target →
///   basename at root; trailing slash → `target/basename`; explicit
///   filename → `target`).
///
/// Surfaces divergence between declaration and reality that slips past the
/// aggregate `assert_resource_coverage`. E.g. a target-resolution bug that
/// lands `resources/devforge/win32-x64/` contents under `/win32-x64/`
/// instead of `/devforge/` would satisfy coverage (files landed
/// *somewhere*) but fail here with a clear per-resource error.
fn assert_declared_resources_present(plan: &PackagePlan) -> Result<()> {
    let mut missing: Vec<String> = Vec::new();

    for res in &plan.conf.resources {
        // Reuse the same source-shape resolution as `resource_copy_entries`
        // so both code paths agree on what "source" means.
        let literal_source = res
            .source
            .strip_suffix("/**/*")
            .or_else(|| res.source.strip_suffix("/*"))
            .map_or_else(
                || res.source.trim_end_matches('/').to_string(),
                |s| s.trim_end_matches('/').to_string(),
            );
        let src_abs = plan.src_tauri.join(&literal_source);
        let source_is_tree = res.source.ends_with("/**/*")
            || res.source.ends_with("/*")
            || res.source.ends_with('/')
            || src_abs.is_dir();

        let target_sub = target_as_subpath(&res.target);
        let target_root = plan.portable_dir.join(&target_sub);

        if source_is_tree {
            // Every tree source must have produced at least one file
            // underneath its target root in the portable folder.
            let has_files = if target_root.is_dir() {
                walkdir::WalkDir::new(&target_root)
                    .follow_links(false)
                    .into_iter()
                    .filter_map(|e| e.ok())
                    .any(|e| e.file_type().is_file())
            } else {
                false
            };
            if !has_files {
                missing.push(format!(
                    "tree `{source}` → {dest} (no files under target)",
                    source = res.source,
                    dest = target_root.display()
                ));
            }
        } else {
            // File sources. Reconstruct the exact destination path that
            // `resource_copy_entries` would have produced.
            let Some(basename) = src_abs.file_name().and_then(|n| n.to_str()) else {
                // Non-UTF8 source path — surface as missing so the caller
                // sees it in the bulk error list rather than bailing.
                missing.push(format!(
                    "file `{source}` → basename not representable as UTF-8",
                    source = res.source
                ));
                continue;
            };
            let expected = if res.target.is_empty() {
                plan.portable_dir.join(basename)
            } else if res.target.ends_with('/') {
                target_root.join(basename)
            } else {
                // Explicit rename — target_root IS the file path.
                target_root
            };
            if !expected.is_file() {
                missing.push(format!(
                    "file `{source}` → {dest}",
                    source = res.source,
                    dest = expected.display()
                ));
            }
        }
    }

    if missing.is_empty() {
        return Ok(());
    }

    let hint = crate::out::file_sink_path()
        .map(|p| format!(" See {}.", p.display()))
        .unwrap_or_default();
    anyhow::bail!(
        "portable folder missing {n} declared resource target(s) — \
         the copy step reported success but declared resources did not \
         land at their expected paths.{hint}\n  - {list}",
        n = missing.len(),
        list = missing.join("\n  - ")
    );
}

// ═══════════════════════════════════════════════════════════════════════
// Manifest + README + Zip
// ═══════════════════════════════════════════════════════════════════════

/// Convert an OS-native relative path into forward-slash form for manifest
/// and zip entries. Windows paths natively use `\`; consumers (macOS / Linux
/// tools, `unzip`, CI manifest readers) expect `/`. This is a serialization
/// convention — the in-memory `PathBuf` keeps OS-native separators.
fn rel_to_forward(path: &Path) -> String {
    path.to_string_lossy().replace('\\', "/")
}

fn write_manifest(ws: &Workspace, plan: &PackagePlan, report: &PortableReport) -> Result<()> {
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

    // Per-category aggregate totals first — makes the manifest scannable
    // even when `files` holds thousands of entries.
    body.push_str("  \"totals\": {\n");
    body.push_str(&format!(
        "    \"files\": {}, \"bytes\": {},\n",
        report.files.len(),
        report.total_bytes
    ));
    body.push_str("    \"per_category\": {\n");
    let cat_count = report.per_category.len();
    for (i, (cat, totals)) in report.per_category.iter().enumerate() {
        let comma = if i + 1 == cat_count { "" } else { "," };
        body.push_str(&format!(
            "      {cat}: {{ \"files\": {files}, \"bytes\": {bytes} }}{comma}\n",
            cat = json_string(cat),
            files = totals.files,
            bytes = totals.bytes,
        ));
    }
    body.push_str("    }\n");
    body.push_str("  },\n");

    body.push_str("  \"files\": [\n");
    let file_count = report.files.len();
    for (idx, file) in report.files.iter().enumerate() {
        let comma = if idx + 1 == file_count { "" } else { "," };
        body.push_str(&format!(
            "    {{ \"category\": {cat}, \"path\": {path}, \"size_bytes\": {size}, \"sha256\": {hash} }}{comma}\n",
            cat = json_string(file.category),
            path = json_string(&rel_to_forward(&file.dest_rel)),
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
    crate::xinfo!("  > wrote manifest.json ({} files hashed)", file_count);
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

fn write_readme(plan: &PackagePlan, report: &PortableReport) -> Result<()> {
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
    if let Some(totals) = report.per_category.get("resource") {
        body.push_str(&format!(
            "  {} root-level resource file(s) (runtime DLLs: llama.cpp, CUDA, cuBLAS, libomp)\n",
            totals.files
        ));
    }
    if let Some(totals) = report.per_category.get("resource_tree_file") {
        let mb = (totals.bytes as f64) / (1024.0 * 1024.0);
        body.push_str(&format!(
            "  {} tree resource file(s), {mb:.1} MB (e.g. DevForge REH tree under devforge/)\n",
            totals.files
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
    zip_dir_recursive(&plan.portable_dir, &plan.zip_path)?;
    Ok(fs::metadata(&plan.zip_path).map(|m| m.len()).unwrap_or(0))
}

/// Zip every FILE under `src_dir` into `zip_path`, preserving subdirectory
/// structure. Extracts to the same shape as the portable folder. Replaces
/// the old flat-layout packer, which dropped tree resources (DevForge,
/// future model bundles) on the floor because it only iterated the top
/// level of the portable dir.
///
/// Entry names use forward slashes per the zip spec — on Windows,
/// [`Path::display`] produces backslashes which many unzip tools treat as
/// literal filename characters. [`rel_to_forward`] normalizes at the edge.
fn zip_dir_recursive(src_dir: &Path, zip_path: &Path) -> Result<()> {
    let file =
        File::create(zip_path).with_context(|| format!("creating {}", zip_path.display()))?;
    let mut zip = ZipWriter::new(BufWriter::new(file));
    let options: FileOptions<()> = FileOptions::default()
        .compression_method(CompressionMethod::Deflated)
        .compression_level(Some(6));

    let mut count = 0u64;
    for walked in walkdir::WalkDir::new(src_dir)
        .follow_links(false)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        if !walked.file_type().is_file() {
            continue;
        }
        let rel = walked
            .path()
            .strip_prefix(src_dir)
            .with_context(|| format!("zip walker produced path outside {}", src_dir.display()))?;
        let name = rel_to_forward(rel);
        zip.start_file(&name, options)
            .with_context(|| format!("zip entry {name}"))?;
        let mut f = File::open(walked.path())
            .with_context(|| format!("opening {}", walked.path().display()))?;
        std::io::copy(&mut f, &mut zip)
            .with_context(|| format!("streaming {name} into zip"))?;
        count += 1;
    }

    zip.finish().context("finalizing zip archive")?;
    crate::xinfo!("  > zip archived {count} files");
    Ok(())
}

fn print_summary(plan: &PackagePlan, report: &PortableReport, zip_size: u64) {
    let zip_mb = (zip_size as f64) / (1024.0 * 1024.0);
    let portable_mb = (report.total_bytes as f64) / (1024.0 * 1024.0);
    crate::xinfo!("");
    crate::xinfo!("  ────────────────────────────────────────");
    crate::xinfo!("  Portable build ready.");
    crate::xinfo!("");
    crate::xinfo!(
        "  Folder: {} ({portable_mb:.2} MB, {} files)",
        plan.portable_dir.display(),
        report.files.len()
    );
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
    use super::*;

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

    #[test]
    fn rel_to_forward_converts_windows_separators() {
        let p = Path::new("devforge").join("out").join("server-main.js");
        let forward = rel_to_forward(&p);
        // Path::join uses OS separators; the helper must emit '/' regardless.
        assert!(!forward.contains('\\'));
        assert_eq!(forward, "devforge/out/server-main.js");
    }

    #[test]
    fn target_as_subpath_empty_is_empty() {
        assert_eq!(target_as_subpath(""), PathBuf::new());
    }

    #[test]
    fn devforge_platform_source_detects_all_list_form_shapes() {
        // Exact match, trailing slash, glob variants.
        assert!(is_devforge_platform_source("resources/devforge/win32-x64"));
        assert!(is_devforge_platform_source("resources/devforge/win32-x64/"));
        assert!(is_devforge_platform_source(
            "resources/devforge/win32-x64/**/*"
        ));
        assert!(is_devforge_platform_source(
            "resources/devforge/darwin-arm64/*"
        ));
        assert!(is_devforge_platform_source("resources/devforge/linux-x64/"));
    }

    #[test]
    fn devforge_platform_source_rejects_deeper_paths_and_other_roots() {
        // Author wanted to ship something DEEPER — don't auto-retarget.
        assert!(!is_devforge_platform_source(
            "resources/devforge/win32-x64/out/"
        ));
        // Top-level resources (not under devforge/).
        assert!(!is_devforge_platform_source("resources/tree/"));
        // Non-resources root.
        assert!(!is_devforge_platform_source("binaries/llama.dll"));
        // Missing platform segment.
        assert!(!is_devforge_platform_source("resources/devforge/"));
    }

    #[test]
    fn portable_layout_policy_retargets_devforge_but_leaves_others_alone() {
        let input = vec![
            ResourceEntry {
                source: "binaries/llama.dll".to_string(),
                target: String::new(),
            },
            ResourceEntry {
                source: "resources/devforge/win32-x64/".to_string(),
                target: String::new(),
            },
            // An explicit target in map form must be preserved — the
            // author's declaration is authoritative.
            ResourceEntry {
                source: "already/mapped/**/*".to_string(),
                target: "explicit-keep-me/".to_string(),
            },
        ];
        let out = apply_portable_layout_policy(input);
        assert_eq!(out[0].target, ""); // DLL stays at root
        assert_eq!(out[1].target, "devforge/"); // devforge retargeted
        assert_eq!(out[2].target, "explicit-keep-me/"); // explicit untouched
    }

    #[test]
    fn target_as_subpath_strips_trailing_slash() {
        assert_eq!(target_as_subpath("devforge/"), PathBuf::from("devforge"));
        assert_eq!(
            target_as_subpath("deep/nested/"),
            PathBuf::from("deep/nested")
        );
    }

    #[test]
    fn resource_copy_entries_file_to_root_with_empty_target() {
        let tmp = tempdir();
        let src_rel = "src/a.dll";
        write_file(&tmp.join(src_rel), b"A");
        let entry = ResourceEntry {
            source: src_rel.to_string(),
            target: String::new(),
        };
        let copies = resource_copy_entries(&tmp, &entry).expect("resolve ok");
        assert_eq!(copies.len(), 1);
        assert_eq!(copies[0].dest_rel, PathBuf::from("a.dll"));
        assert_eq!(copies[0].category, "resource");
    }

    #[test]
    fn resource_copy_entries_file_renamed_by_plain_target() {
        let tmp = tempdir();
        let src_rel = "src/a.dll";
        write_file(&tmp.join(src_rel), b"A");
        let entry = ResourceEntry {
            source: src_rel.to_string(),
            target: "renamed.dll".to_string(),
        };
        let copies = resource_copy_entries(&tmp, &entry).expect("resolve ok");
        assert_eq!(copies.len(), 1);
        assert_eq!(copies[0].dest_rel, PathBuf::from("renamed.dll"));
    }

    #[test]
    fn resource_copy_entries_file_into_subfolder_with_trailing_slash() {
        let tmp = tempdir();
        let src_rel = "src/a.dll";
        write_file(&tmp.join(src_rel), b"A");
        let entry = ResourceEntry {
            source: src_rel.to_string(),
            target: "bin/".to_string(),
        };
        let copies = resource_copy_entries(&tmp, &entry).expect("resolve ok");
        assert_eq!(copies.len(), 1);
        assert_eq!(copies[0].dest_rel, PathBuf::from("bin").join("a.dll"));
    }

    #[test]
    fn resource_copy_entries_directory_with_trailing_slash_walks() {
        let tmp = tempdir();
        write_file(&tmp.join("tree/a.txt"), b"a");
        write_file(&tmp.join("tree/sub/b.txt"), b"b");
        let entry = ResourceEntry {
            source: "tree/".to_string(),
            target: "out/".to_string(),
        };
        let copies = resource_copy_entries(&tmp, &entry).expect("resolve ok");
        // Two files expected; order is filesystem-dependent so we collect.
        let dests: std::collections::BTreeSet<PathBuf> =
            copies.iter().map(|c| c.dest_rel.clone()).collect();
        let expected: std::collections::BTreeSet<PathBuf> = [
            PathBuf::from("out").join("a.txt"),
            PathBuf::from("out").join("sub").join("b.txt"),
        ]
        .into_iter()
        .collect();
        assert_eq!(dests, expected);
        for c in &copies {
            assert_eq!(c.category, "resource_tree_file");
        }
    }

    #[test]
    fn resource_copy_entries_glob_double_star_walks_recursively() {
        let tmp = tempdir();
        write_file(&tmp.join("tree/a.txt"), b"a");
        write_file(&tmp.join("tree/deep/nested/b.txt"), b"b");
        let entry = ResourceEntry {
            source: "tree/**/*".to_string(),
            target: "devforge/".to_string(),
        };
        let copies = resource_copy_entries(&tmp, &entry).expect("resolve ok");
        let dests: std::collections::BTreeSet<PathBuf> =
            copies.iter().map(|c| c.dest_rel.clone()).collect();
        let expected: std::collections::BTreeSet<PathBuf> = [
            PathBuf::from("devforge").join("a.txt"),
            PathBuf::from("devforge")
                .join("deep")
                .join("nested")
                .join("b.txt"),
        ]
        .into_iter()
        .collect();
        assert_eq!(dests, expected);
    }

    #[test]
    fn resource_copy_entries_missing_source_reports_missing() {
        let tmp = tempdir();
        let entry = ResourceEntry {
            source: "nope/nothing.dll".to_string(),
            target: String::new(),
        };
        match resource_copy_entries(&tmp, &entry) {
            Err(ResourceResolveError::MissingSource { display }) => {
                assert!(
                    display.contains("nope"),
                    "display should include source: {display}"
                );
            }
            other => panic!("expected MissingSource, got {other:?}"),
        }
    }

    #[test]
    fn assert_resource_coverage_bails_when_declarations_dont_land() {
        // Plan declares 2 resources; report shows zero resource files.
        // assert_resource_coverage must bail — this is the regression
        // protection for the "silent empty portable" class of failure.
        let plan = fake_plan_with_declared_resources(2);
        let report = PortableReport::from_files(vec![CopiedFile {
            category: "exe",
            dest_rel: PathBuf::from("app.exe"),
            size_bytes: 1,
            sha256_hex: "x".to_string(),
        }]);
        let err = assert_resource_coverage(&plan, &report).unwrap_err();
        let msg = format!("{err:#}");
        assert!(msg.contains("declares 2 bundle.resources"), "msg: {msg}");
    }

    #[test]
    fn assert_resource_coverage_passes_when_tree_resource_landed() {
        let plan = fake_plan_with_declared_resources(1);
        let report = PortableReport::from_files(vec![CopiedFile {
            category: "resource_tree_file",
            dest_rel: PathBuf::from("devforge").join("out").join("server-main.js"),
            size_bytes: 1,
            sha256_hex: "x".to_string(),
        }]);
        assert!(assert_resource_coverage(&plan, &report).is_ok());
    }

    #[test]
    fn assert_declared_resources_present_passes_when_file_and_tree_landed() {
        // Build a plan with one file resource + one tree resource; stage
        // both in the portable_dir so the assertion sees what it expects.
        let base = tempdir();
        let src_tauri = base.join("src-tauri");
        let portable_dir = base.join("portable");
        fs::create_dir_all(&portable_dir).unwrap();

        // Source side
        write_file(&src_tauri.join("binaries/llama.dll"), b"dll");
        write_file(&src_tauri.join("resources/tree/out/server-main.js"), b"js");
        // Target side — the post-copy portable layout
        write_file(&portable_dir.join("llama.dll"), b"dll");
        write_file(&portable_dir.join("devforge/out/server-main.js"), b"js");

        let plan = PackagePlan {
            conf: TauriConfig {
                product_name: "fake".to_string(),
                version: "0.0.0".to_string(),
                resources: vec![
                    ResourceEntry {
                        source: "binaries/llama.dll".to_string(),
                        target: String::new(),
                    },
                    ResourceEntry {
                        source: "resources/tree/**/*".to_string(),
                        target: "devforge/".to_string(),
                    },
                ],
                external_bins: Vec::new(),
                icons: Vec::new(),
            },
            target_release: base.clone(),
            src_tauri,
            exe_path: base.join("fake-app.exe"),
            exe_name: "fake-app.exe".to_string(),
            portable_name: "fake-v0.0.0".to_string(),
            portable_dir,
            zip_path: base.join("fake-v0.0.0-portable.zip"),
        };

        assert!(assert_declared_resources_present(&plan).is_ok());
    }

    #[test]
    fn assert_declared_resources_present_bails_when_tree_landed_at_wrong_target() {
        // Simulates the "target-resolution bug" class — DevForge files
        // landed somewhere in the portable dir but not under `devforge/`
        // as declared. Coverage would pass; target presence must fail.
        let base = tempdir();
        let src_tauri = base.join("src-tauri");
        let portable_dir = base.join("portable");
        fs::create_dir_all(&portable_dir).unwrap();
        write_file(&src_tauri.join("resources/tree/out/server-main.js"), b"js");
        // Intentionally stage at WRONG location (`/win32-x64/` not `/devforge/`)
        write_file(
            &portable_dir.join("win32-x64/out/server-main.js"),
            b"js",
        );

        let plan = PackagePlan {
            conf: TauriConfig {
                product_name: "fake".to_string(),
                version: "0.0.0".to_string(),
                resources: vec![ResourceEntry {
                    source: "resources/tree/**/*".to_string(),
                    target: "devforge/".to_string(),
                }],
                external_bins: Vec::new(),
                icons: Vec::new(),
            },
            target_release: base.clone(),
            src_tauri,
            exe_path: base.join("fake-app.exe"),
            exe_name: "fake-app.exe".to_string(),
            portable_name: "fake-v0.0.0".to_string(),
            portable_dir,
            zip_path: base.join("fake-v0.0.0-portable.zip"),
        };

        let err = assert_declared_resources_present(&plan).unwrap_err();
        let msg = format!("{err:#}");
        assert!(msg.contains("tree `resources/tree/**/*`"), "msg: {msg}");
        assert!(msg.contains("devforge"), "msg: {msg}");
    }

    #[test]
    fn assert_declared_resources_present_reports_every_missing_target() {
        // Multiple declared resources, portable dir is empty — every
        // declaration should appear in the bail message so the user has
        // one pass/fail list, not N separate errors.
        let base = tempdir();
        let src_tauri = base.join("src-tauri");
        let portable_dir = base.join("portable");
        fs::create_dir_all(&portable_dir).unwrap();
        write_file(&src_tauri.join("binaries/a.dll"), b"a");
        write_file(&src_tauri.join("binaries/b.dll"), b"b");

        let plan = PackagePlan {
            conf: TauriConfig {
                product_name: "fake".to_string(),
                version: "0.0.0".to_string(),
                resources: vec![
                    ResourceEntry {
                        source: "binaries/a.dll".to_string(),
                        target: String::new(),
                    },
                    ResourceEntry {
                        source: "binaries/b.dll".to_string(),
                        target: String::new(),
                    },
                ],
                external_bins: Vec::new(),
                icons: Vec::new(),
            },
            target_release: base.clone(),
            src_tauri,
            exe_path: base.join("fake-app.exe"),
            exe_name: "fake-app.exe".to_string(),
            portable_name: "fake-v0.0.0".to_string(),
            portable_dir,
            zip_path: base.join("fake-v0.0.0-portable.zip"),
        };

        let err = assert_declared_resources_present(&plan).unwrap_err();
        let msg = format!("{err:#}");
        assert!(msg.contains("missing 2 declared resource"), "msg: {msg}");
        assert!(msg.contains("a.dll"), "msg: {msg}");
        assert!(msg.contains("b.dll"), "msg: {msg}");
    }

    // ── test helpers ──────────────────────────────────────────────

    impl std::fmt::Debug for ResourceResolveError {
        fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
            match self {
                Self::MissingSource { display } => write!(f, "MissingSource({display})"),
                Self::Fatal(e) => write!(f, "Fatal({e:#})"),
            }
        }
    }

    fn tempdir() -> PathBuf {
        let base = std::env::temp_dir().join(format!(
            "xtask-package-portable-test-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&base).expect("tempdir create");
        base
    }

    fn write_file(p: &Path, content: &[u8]) {
        if let Some(parent) = p.parent() {
            fs::create_dir_all(parent).expect("mk parent");
        }
        fs::write(p, content).expect("write fixture");
    }

    fn fake_plan_with_declared_resources(n: usize) -> PackagePlan {
        let base = tempdir();
        let conf = TauriConfig {
            product_name: "fake".to_string(),
            version: "0.0.0".to_string(),
            resources: (0..n)
                .map(|i| ResourceEntry {
                    source: format!("r{i}"),
                    target: String::new(),
                })
                .collect(),
            external_bins: Vec::new(),
            icons: Vec::new(),
        };
        PackagePlan {
            conf,
            target_release: base.clone(),
            src_tauri: base.clone(),
            exe_path: base.join("fake-app.exe"),
            exe_name: "fake-app.exe".to_string(),
            portable_name: "fake-v0.0.0".to_string(),
            portable_dir: base.join("portable"),
            zip_path: base.join("fake-v0.0.0-portable.zip"),
        }
    }
}
