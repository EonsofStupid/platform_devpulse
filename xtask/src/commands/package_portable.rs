//! `PackagePortable` — produce a runnable folder + zip from an already-compiled release build.
//!
//! Decoupled from tauri-bundler's installer pipeline. When `cargo xtask
//! build-release` succeeds at compiling the Rust binary but the WiX/NSIS
//! bundling step fails (common on Windows with antivirus locking the MSI
//! mid-rename), this command produces a runnable distribution anyway.
//!
//! # Source of truth
//!
//! Reads `interfaces/desktop/src-tauri/tauri.conf.json` for the authoritative
//! list of:
//!   - `productName` + `version` — drives output filenames
//!   - `bundle.externalBin` — sidecar binaries tauri has already copied to `target/release/`
//!   - `bundle.resources` — runtime DLLs that the installer is supposed to
//!     unpack; for a portable build we copy them next to the exe so Windows
//!     DLL search finds them at launch time
//!   - `bundle.icon` — app icon(s); the `.ico` goes in the portable folder
//!
//! # Output
//!
//! `target/release/portable/<productName>-v<version>/`
//!   ├── <productName>-app.exe    (main app)
//!   ├── llama-server.exe         (externalBin sidecar, already copied by tauri)
//!   ├── <27 runtime DLLs>        (CUDA + llama.cpp + libomp)
//!   ├── icon.ico
//!   └── README.txt
//!
//! Plus a zip at `target/release/<productName>-v<version>-portable.zip`.
//!
//! # Invariant
//!
//! Refuses to run if the compiled binary is missing — we require a prior
//! successful `build-release` (or any `pnpm tauri build`) to have produced
//! `target/release/<productName>-app.exe`. We DO NOT invoke cargo ourselves.

use crate::commands::Task;
use crate::stage;
use crate::workspace::Workspace;

use anyhow::{Context, Result};
use serde_json::Value;
use std::fs::{self, File};
use std::io::{BufWriter, Write};
use std::path::{Path, PathBuf};
use zip::write::{FileOptions, ZipWriter};
use zip::CompressionMethod;

/// Produce a runnable portable folder + zip from the compiled release build.
pub struct PackagePortable;

impl Task for PackagePortable {
    fn name(&self) -> &'static str {
        "package-portable"
    }

    #[allow(clippy::too_many_lines)]
    fn run(&self, ws: &Workspace) -> Result<()> {
        stage::section("Package Portable");

        // ── 1. Read SSOT from tauri.conf.json ──
        let conf = read_tauri_conf(ws)?;
        println!(
            "  > SSOT: productName={}, version={}, {} external bin(s), {} resource(s)",
            conf.product_name,
            conf.version,
            conf.external_bins.len(),
            conf.resources.len()
        );

        let target_release = ws.root().join("target").join("release");
        let src_tauri = ws
            .root()
            .join("interfaces")
            .join("desktop")
            .join("src-tauri");

        // ── 2. Precondition: compiled binary must exist ──
        let exe_name = format!("{}-app.exe", conf.product_name);
        let exe = target_release.join(&exe_name);
        if !exe.exists() {
            anyhow::bail!(
                "Compiled binary not found at {}.\n  \
                 Run `cargo xtask build-release` first — `package-portable` \
                 does NOT compile, it only packages what is already built.",
                exe.display()
            );
        }

        // ── 3. Prepare clean output dir ──
        let portable_name = format!("{}-v{}", conf.product_name, conf.version);
        let portable_dir = target_release.join("portable").join(&portable_name);
        if portable_dir.exists() {
            fs::remove_dir_all(&portable_dir)
                .with_context(|| format!("removing old {}", portable_dir.display()))?;
        }
        fs::create_dir_all(&portable_dir)
            .with_context(|| format!("creating {}", portable_dir.display()))?;

        println!();
        println!("  Destination: {}", portable_dir.display());
        println!();

        // ── 4. Copy main exe ──
        copy_with_log(&exe, &portable_dir.join(&exe_name))?;

        // ── 5. Copy external binaries (already next to main exe in target/release/) ──
        let mut missing_external = Vec::new();
        for prefix in &conf.external_bins {
            let basename = Path::new(prefix)
                .file_name()
                .and_then(|n| n.to_str())
                .with_context(|| {
                    format!("invalid externalBin path in tauri.conf.json: {prefix}")
                })?;
            let sidecar_name = format!("{basename}.exe");
            let src = target_release.join(&sidecar_name);
            if !src.exists() {
                missing_external.push(src.display().to_string());
                continue;
            }
            copy_with_log(&src, &portable_dir.join(&sidecar_name))?;
        }
        if !missing_external.is_empty() {
            anyhow::bail!(
                "externalBin sidecar(s) missing from target/release/ — tauri-bundler should \
                 have copied these during compile. Re-run `cargo xtask build-release`. \
                 Missing:\n  {}",
                missing_external.join("\n  ")
            );
        }

        // ── 6. Copy runtime DLLs (resources) from src-tauri/ ──
        let mut missing_resources = Vec::new();
        for rel in &conf.resources {
            let src = src_tauri.join(rel);
            if !src.exists() {
                missing_resources.push(src.display().to_string());
                continue;
            }
            let basename = Path::new(rel)
                .file_name()
                .and_then(|n| n.to_str())
                .with_context(|| format!("invalid resource path in tauri.conf.json: {rel}"))?;
            copy_with_log(&src, &portable_dir.join(basename))?;
        }
        if !missing_resources.is_empty() {
            anyhow::bail!(
                "Resources declared in tauri.conf.json are missing on disk.\n  \
                 Each must exist relative to interfaces/desktop/src-tauri/.\n  \
                 Missing:\n  {}",
                missing_resources.join("\n  ")
            );
        }

        // ── 7. Copy primary .ico icon (first one in the list) ──
        let mut icon_copied = false;
        for icon_rel in &conf.icons {
            if !icon_rel.ends_with(".ico") {
                continue;
            }
            let src = src_tauri.join(icon_rel);
            if src.exists() {
                copy_with_log(&src, &portable_dir.join("icon.ico"))?;
                icon_copied = true;
                break;
            }
        }
        if !icon_copied {
            println!("  [!!] no .ico icon found in tauri.conf.json bundle.icon list");
        }

        // ── 8. README ──
        write_readme(&portable_dir, &conf, &exe_name)?;

        // ── 9. Zip ──
        let zip_path = target_release.join(format!("{portable_name}-portable.zip"));
        if zip_path.exists() {
            fs::remove_file(&zip_path)
                .with_context(|| format!("removing old zip {}", zip_path.display()))?;
        }
        zip_dir_flat(&portable_dir, &zip_path)?;

        // ── 10. Summary ──
        println!();
        println!("  ────────────────────────────────────────");
        println!("  Portable build ready.");
        println!();
        println!("  Folder: {}", portable_dir.display());
        println!("  Zip:    {}", zip_path.display());
        println!();
        println!("  Smoke test:");
        println!("    1. cd \"{}\"", portable_dir.display());
        println!("    2. Run {exe_name}");
        println!(
            "    3. Expect: window opens, services start, `http://127.0.0.1:8822/health` healthy."
        );
        println!();

        Ok(())
    }
}

// ═══════════════════════════════════════════════════════════════════════
// Tauri config SSOT
// ═══════════════════════════════════════════════════════════════════════

struct TauriConf {
    product_name: String,
    version: String,
    resources: Vec<String>,
    external_bins: Vec<String>,
    icons: Vec<String>,
}

fn read_tauri_conf(ws: &Workspace) -> Result<TauriConf> {
    let path: PathBuf = ws
        .root()
        .join("interfaces")
        .join("desktop")
        .join("src-tauri")
        .join("tauri.conf.json");
    let raw = fs::read_to_string(&path).with_context(|| format!("reading {}", path.display()))?;
    let v: Value = serde_json::from_str(&raw)
        .with_context(|| format!("parsing JSON from {}", path.display()))?;

    let product_name = v
        .get("productName")
        .and_then(Value::as_str)
        .with_context(|| format!("`productName` missing from {}", path.display()))?
        .to_string();
    let version = v
        .get("version")
        .and_then(Value::as_str)
        .with_context(|| format!("`version` missing from {}", path.display()))?
        .to_string();
    let bundle = v
        .get("bundle")
        .with_context(|| format!("`bundle` missing from {}", path.display()))?;
    let resources = json_string_array(bundle.get("resources"));
    let external_bins = json_string_array(bundle.get("externalBin"));
    let icons = json_string_array(bundle.get("icon"));

    Ok(TauriConf {
        product_name,
        version,
        resources,
        external_bins,
        icons,
    })
}

fn json_string_array(v: Option<&Value>) -> Vec<String> {
    v.and_then(Value::as_array)
        .map(|arr| {
            arr.iter()
                .filter_map(Value::as_str)
                .map(String::from)
                .collect()
        })
        .unwrap_or_default()
}

// ═══════════════════════════════════════════════════════════════════════
// File operations
// ═══════════════════════════════════════════════════════════════════════

fn copy_with_log(src: &Path, dst: &Path) -> Result<()> {
    fs::copy(src, dst).with_context(|| format!("copying {} → {}", src.display(), dst.display()))?;
    let size_mb = fs::metadata(src)
        .map(|m| (m.len() as f64) / (1024.0 * 1024.0))
        .unwrap_or(0.0);
    let name = dst.file_name().and_then(|n| n.to_str()).unwrap_or("<?>");
    println!("  > copied {name:<40} ({size_mb:>8.2} MB)");
    Ok(())
}

fn write_readme(portable_dir: &Path, conf: &TauriConf, exe_name: &str) -> Result<()> {
    let mut body = String::new();
    body.push_str(&format!(
        "{} v{} — portable build\n\n",
        conf.product_name, conf.version
    ));
    body.push_str("Unzip this folder anywhere. No installer required.\n");
    body.push_str("All files MUST remain in the same folder — Windows DLL search\n");
    body.push_str("order resolves the runtime libraries as siblings of the exe.\n\n");
    body.push_str("Launch:\n");
    body.push_str(&format!("  {exe_name}\n\n"));
    body.push_str("Contents:\n");
    body.push_str(&format!(
        "  {exe_name} — main application (Tauri + SvelteKit frontend)\n"
    ));
    for bin in &conf.external_bins {
        if let Some(name) = Path::new(bin).file_name().and_then(|n| n.to_str()) {
            body.push_str(&format!("  {name}.exe — sidecar process\n"));
        }
    }
    if !conf.resources.is_empty() {
        body.push_str(&format!(
            "  {} runtime DLLs (llama.cpp, CUDA, cuBLAS, libomp)\n",
            conf.resources.len()
        ));
    }
    body.push_str("  icon.ico — application icon\n\n");
    body.push_str("First run writes data to %LOCALAPPDATA%\\DevPulse\\ (libSQL, DuckDB, logs).\n");

    let path = portable_dir.join("README.txt");
    let mut f = File::create(&path).with_context(|| format!("creating {}", path.display()))?;
    f.write_all(body.as_bytes())
        .with_context(|| format!("writing {}", path.display()))?;
    println!("  > wrote README.txt");
    Ok(())
}

/// Zip all FILES directly inside `src_dir` into `zip_path`. Flat layout —
/// the zip extracts to the same shape as the portable folder. Does not
/// recurse into subfolders (there are none in a portable build).
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
        let name = path
            .file_name()
            .and_then(|n| n.to_str())
            .with_context(|| format!("non-UTF8 filename in {}", src_dir.display()))?;
        zip.start_file(name, options)
            .with_context(|| format!("zip entry {name}"))?;
        let mut f = File::open(&path).with_context(|| format!("opening {}", path.display()))?;
        std::io::copy(&mut f, &mut zip).with_context(|| format!("streaming {name} into zip"))?;
        count += 1;
    }

    zip.finish().context("finalizing zip archive")?;

    let size_mb = fs::metadata(zip_path)
        .map(|m| (m.len() as f64) / (1024.0 * 1024.0))
        .unwrap_or(0.0);
    println!("  > zip archived {count} files ({size_mb:.2} MB)");
    Ok(())
}
