# SPRINT — Portable Build Regression Fix

> **Dated**: 2026-04-23
> **Status**: PROPOSED — needs owner approval before execution
> **Scope**: `xtask/` only. No engine, no kernel, no frontend code changes.
> **Owner runs builds.** Plan specifies diffs + verification commands; assistant
> authors code only after approval.

---

## 1. Root cause (disk-verified, not speculation)

The Apr 23 12:00 portable build produced a **267 MB** folder containing only
`devpulse-desktop-app.exe` + `llama-server.exe` + `icon.ico` + README + manifest.
It was **supposed** to contain an additional ~1.2 GB: 10 runtime DLLs
(ggml-cuda 503 MB, cublasLt64_12 452 MB, cublas64_12 96 MB, plus 7 smaller)
and the DevForge REH tree (221 MB, 3017 files).

### Three independent failures stacked

| # | Failure | Evidence |
|---|---------|----------|
| **F1** | Platform-override merge in `Workspace::tauri_config()` is uncommitted. HEAD reads only `tauri.conf.json`; `bundle.resources` is absent there; the 10 DLLs + DevForge dir in `tauri.windows.conf.json` are invisible to `package-portable`. | `git show HEAD:xtask/src/workspace.rs \| grep merge_rfc7396` → 0. Working tree has 8. `git diff --stat xtask/src/workspace.rs` → 109 lines added. |
| **F2** | Even with F1 fixed, [`copy_and_hash`](../../xtask/src/commands/package_portable.rs) calls `File::open(src)` on every resource. `resources/devforge/win32-x64/` is a directory (3017 files). On Windows, `File::open` on a directory returns `PermissionDenied` → task would bail. There is no directory-walker in `plan_copies`. | Source read of [package_portable.rs:351](../../xtask/src/commands/package_portable.rs#L351). |
| **F3** | Regression protection is invisible. `target/xtask-build-release.log` (69 KB) captures **only** subprocess stdout/stderr. xtask's own `xinfo!` output — where "copied [resource] …" prints — goes to terminal and dies there. `target/xtask-events.jsonl` logs `package-portable ok` with no file count, no byte total, no per-category breakdown. Smoke-test pings `/health` — does not check that DLLs or DevForge landed beside the exe. | `target/xtask-build-release.log` + `target/xtask-events.jsonl` read. |

### Why the NSIS installer was "fine" but portable wasn't

Tauri CLI merges `tauri.windows.conf.json` internally during `tauri build` —
that's upstream tauri-bundler code, independent of our xtask. It bundles all
resources into the 511 MB NSIS installer. Our `package-portable` is a **second,
parallel packaging path** that needed to replicate the merge. F1 = that
replication was never committed. F2 = even if it had been, the file copy loop
can't traverse directories.

---

## 2. Spec — real-world Tauri 2 pattern (researched, not invented)

Per [v2.tauri.app/develop/resources](https://v2.tauri.app/develop/resources/):

- `bundle.resources` list form with **trailing slash** (`"dir/"`) recursively
  includes a directory **preserving structure** into the bundle's resource
  root. This is the canonical pattern for large subtrees (Electron REH,
  model weights, anything with 1000+ files).
- Platform overrides live in `tauri.<platform>.conf.json` and merge via
  **RFC 7396 JSON Merge Patch** (arrays replace, objects merge recursively).
- DLLs must go through `bundle.resources` — `externalBin` is for executables
  with a `-<TARGET_TRIPLE>` suffix convention ([Tauri 2 sidecar docs](https://v2.tauri.app/develop/sidecar/)).

Our current configs are shaped correctly. `package_portable.rs` is the thing
out of step.

---

## 3. The fix — 5 phases, commit-sized, verification after each

### Phase 0 — Commit the merge (blocks everything else)

**Files**: `xtask/src/workspace.rs` (already modified in working tree).

**Diff**: 109 lines already authored. No new code.

**Verify**:
```bash
git diff xtask/src/workspace.rs          # inspect
cargo check -p xtask                     # must pass
cargo test -p xtask merge_tests          # merge_rfc7396 unit tests must pass
git show HEAD:xtask/src/workspace.rs | grep -c merge_rfc7396   # → 8 after commit
```

---

### Phase 1 — Directory-walker in `plan_copies` (structural fix)

**Problem**: `plan.conf.resources` will now contain `"resources/devforge/win32-x64/"`
after Phase 0. `plan_copies` must detect `src.is_dir()` and enumerate files with
**relative path preserved**, not flatten to basename.

**Files**:
- `xtask/Cargo.toml` — add `walkdir = "2.5"` (industry standard, 1-dep, no transitive bloat).
- `xtask/src/commands/package_portable.rs` — extend `CopyEntry`/`plan_copies`/`execute_copies`.

**Contract changes**:
```rust
// BEFORE: flat layout — dest_name is a basename.
struct CopyEntry {
    category: &'static str,
    source: PathBuf,
    dest_name: String,   // e.g. "ggml-cuda.dll"
}

// AFTER: preserved layout — dest_rel is a relative path that keeps
// subdirectory structure for tree resources.
struct CopyEntry {
    category: &'static str,
    source: PathBuf,
    dest_rel: PathBuf,   // e.g. "ggml-cuda.dll" OR "devforge/out/server-main.js"
}
```

**New helper in `plan_copies`**:
```rust
// For each entry in plan.conf.resources:
if src.is_dir() {
    // Tree resource — recursive enumeration, relative path preserved.
    // Root folder name = file_name() of the declared path (trailing slash
    // is normalized away by Path::file_name()). Same convention Tauri uses
    // when merging a `"dir/"` into the bundle resource root.
    let root_name = utf8_filename(Path::new(rel.trim_end_matches('/')))?;
    for walked in walkdir::WalkDir::new(&src)
        .follow_links(false)
        .into_iter()
        .filter_map(Result::ok)
    {
        if !walked.file_type().is_file() { continue; }
        let rel_in_tree = walked.path().strip_prefix(&src)
            .expect("walkdir entry is under src")
            .to_path_buf();
        let dest_rel = Path::new(root_name).join(rel_in_tree);
        entries.push(CopyEntry {
            category: "resource_tree_file",
            source: walked.into_path(),
            dest_rel,
        });
    }
} else if src.is_file() {
    // Unchanged path — single file resource (the 10 DLLs).
    entries.push(CopyEntry {
        category: "resource",
        source: src,
        dest_rel: PathBuf::from(utf8_filename(Path::new(rel))?),
    });
}
```

**`execute_copies` adjustment**:
```rust
let dst = plan.portable_dir.join(&entry.dest_rel);
if let Some(parent) = dst.parent() {
    fs::create_dir_all(parent)
        .with_context(|| format!("creating {}", parent.display()))?;
}
let (size_bytes, sha256_hex) = copy_and_hash(&entry.source, &dst)?;
```

**Zip builder adjustment** — `zip_dir_flat` → `zip_dir_recursive`:
```rust
// Walk the portable dir recursively, preserve relative paths as zip entry names.
// Each entry name uses '/' separators per zip spec (Path::display() on
// Windows uses '\'; convert).
for entry in walkdir::WalkDir::new(src_dir) {
    let entry = entry?;
    if !entry.file_type().is_file() { continue; }
    let rel = entry.path().strip_prefix(src_dir)?;
    let name = rel.to_string_lossy().replace('\\', "/");
    zip.start_file(name, options)?;
    ...
}
```

**Verify after this phase** (owner runs, assistant reads):
```bash
cargo test -p xtask package_portable     # add fixture test, see Phase 3
cargo xtask build-release --portable-only
# Expected on success:
#   target/release/portable/devpulse-desktop-v0.1.0/  ~1.4 GB
#     ├── devpulse-desktop-app.exe       254 MB
#     ├── llama-server.exe                13 MB
#     ├── ggml-cuda.dll                  503 MB
#     ├── cublasLt64_12.dll              452 MB
#     ├── cublas64_12.dll                 96 MB
#     ├── (7 more DLLs)                   14 MB
#     ├── devforge/out/server-main.js
#     ├── devforge/… (3017 files)        221 MB
#     ├── icon.ico, README.txt, manifest.json
```

---

### Phase 2 — Persist xtask's own stdout (regression visibility)

**Problem**: `xinfo!`/`xwarn!` writes go to terminal only. Build transcripts
don't contain per-file copy lines, so regressions are invisible to automation.

**Files**: `xtask/src/out.rs`.

**Design**: add an optional `Mutex<Option<File>>` sink that `info()`/`warn()`
also write to. Set once from `main.rs` (or `build_release.rs`'s top-of-run).
No new deps. Matches the existing `out.rs` "no tracing" doctrine.

```rust
// out.rs additions
use std::fs::{File, OpenOptions};
use std::sync::Mutex;

static FILE_SINK: Mutex<Option<File>> = Mutex::new(None);

pub fn set_file_sink(path: &Path) -> io::Result<()> {
    let f = OpenOptions::new().create(true).append(true).open(path)?;
    *FILE_SINK.lock().unwrap() = Some(f);
    Ok(())
}

pub fn info(args: fmt::Arguments<'_>) {
    if level() >= NORMAL {
        let line = format!("{args}\n");
        let _ = io::stdout().lock().write_all(line.as_bytes());
        if let Some(f) = FILE_SINK.lock().unwrap().as_mut() {
            let _ = f.write_all(line.as_bytes());
        }
    }
}
// warn(): same shape, write to stderr + FILE_SINK.
```

**Hook in `BuildRelease::run`** (before first `xinfo!`):
```rust
let xtask_log = ws.root().join("target").join("xtask-run.log");
let _ = crate::out::set_file_sink(&xtask_log);
crate::xinfo!("xtask transcript: {}", xtask_log.display());
```

**Verify**:
```bash
cargo xtask build-release --portable-only
ls -lah target/xtask-run.log   # > 0 bytes, contains "copied [resource] ..." lines
grep "copied.*ggml-cuda" target/xtask-run.log    # → ≥1 match after Phase 1 commits
```

---

### Phase 3 — Structured events with truth (no more silent ok)

**Problem**: `xtask-events.jsonl` reports `package-portable ok` with no payload
beyond duration. Regressions pass because the assertion is "function returned
Ok" instead of "all declared content shipped."

**Files**: `xtask/src/commands/package_portable.rs`.

**Add a `PortableReport` value returned from `run`**:
```rust
pub struct PortableReport {
    pub total_files: usize,
    pub total_bytes: u64,
    pub per_category: BTreeMap<&'static str, CategoryTotals>,
    pub declared_resources: usize,   // len of plan.conf.resources
    pub declared_external_bins: usize,
}

pub struct CategoryTotals {
    pub files: usize,
    pub bytes: u64,
}
```

**Assertion before returning Ok(PortableReport)**:
```rust
// Every declared resource must appear at least once in the copy list.
// Tree resources contribute N entries with category "resource_tree_file";
// file resources contribute 1 with category "resource".
let declared = plan.conf.resources.len();
let resource_categories_present = copied.iter()
    .any(|f| f.category == "resource") as usize
    + copied.iter().any(|f| f.category == "resource_tree_file") as usize;

if declared > 0 && resource_categories_present == 0 {
    anyhow::bail!(
        "tauri.conf.json declares {declared} resources but none landed in \
         the portable folder — merge or directory-walker failure. \
         See {}.",
        xtask_log_path.display()
    );
}
```

**Emit rich event in `build_release.rs`**:
```rust
match pkg.run(ws) {
    Ok(report) => pkg_guard.ok_with(
        EventBuilder::new()
            .detail(format!(
                "{} files, {:.1} MB, {} resources + {} sidecars declared",
                report.total_files,
                (report.total_bytes as f64) / 1_048_576.0,
                report.declared_resources,
                report.declared_external_bins,
            ))
    ),
    Err(e) => { ... }  // unchanged
}
```

**Add integration test** (replaces the current "did it crash" heuristic):
```rust
// xtask/src/commands/package_portable.rs tests module
#[test]
fn portable_report_includes_tree_resource() {
    // Fixture: temp dir with a fake tauri.conf.json declaring one file
    // resource and one tree resource. Fake exe, fake sidecar, fake tree.
    // Run build_plan + plan_copies (no actual copy), assert:
    //   - declared_resources == 2
    //   - copy entries include both "resource" and "resource_tree_file"
    //   - tree resource contributes N entries with relative paths preserved
}
```

---

### Phase 4 — Smoke test asserts runtime deps are present

**Problem**: Smoke test launches the exe and pings `/health`. A portable build
missing `ggml-cuda.dll` can still pass `/health` because libsql/surrealkv/duckdb
are statically linked in the Rust binary and initialize fine without llama.cpp.
The CUDA gap would only surface when the user tries to load a GGUF model —
which is not what smoke tests cover.

**Files**: `xtask/src/commands/build_release.rs` — `smoke-test` stage.

**Before launching exe, assert portable folder contents**:
```rust
// Post-Package, pre-Smoke: verify what we just shipped.
// This is cheap (fs::metadata calls) and catches the entire class of
// "portable zip is smaller than it should be" regressions.
if portable_only {
    let portable_dir = target_release
        .join("portable")
        .join(format!("{productName}-v{version}"));
    let min_expected_mb: u64 = 500;  // conservative floor; tune with manifest
    let actual_bytes = walkdir::WalkDir::new(&portable_dir)
        .into_iter()
        .filter_map(Result::ok)
        .filter(|e| e.file_type().is_file())
        .map(|e| e.metadata().map(|m| m.len()).unwrap_or(0))
        .sum::<u64>();
    let actual_mb = actual_bytes / 1_048_576;
    if actual_mb < min_expected_mb {
        // Quarantine + fail: rename to REJECTED-<zip>, bail the task.
        ...
        anyhow::bail!(
            "portable folder is {actual_mb} MB, expected ≥ {min_expected_mb} MB — \
             missing resources suspected. Inspect target/xtask-run.log."
        );
    }
}
```

**Better — assert per-declared-resource presence**:
```rust
// Strict mode: every path in plan.conf.resources must resolve under the
// portable dir. Files → exact basename present. Tree resources → root
// folder name present with at least one file inside.
for rel in &tauri_conf.resources {
    let src = src_tauri.join(rel);
    let root_name = utf8_filename(Path::new(rel.trim_end_matches('/')))?;
    let shipped = portable_dir.join(root_name);
    if src.is_dir() {
        let has_files = walkdir::WalkDir::new(&shipped)
            .into_iter().filter_map(Result::ok)
            .any(|e| e.file_type().is_file());
        if !has_files {
            anyhow::bail!("tree resource `{rel}` declared but missing from portable dir");
        }
    } else if !shipped.is_file() {
        anyhow::bail!("file resource `{rel}` declared but missing from portable dir");
    }
}
```

---

### Phase 5 — CI gate: post-zip contents validator (optional but recommended)

**Files**: `.github/workflows/ci.yml` + new `scripts/ci/validate-portable-zip.mjs`.

On every CI build that produces a `*-portable.zip`, open the zip with `adm-zip`
(or equivalent), enumerate entries, and assert against `build.manifest.json`
that every declared artifact is inside. Fail CI if any is missing or size is
< 50% of source.

This is the **last-mile gate** that makes "we shipped a broken zip" impossible
in the commit-to-release path. Recommended but not required for Phase 0-4 to
unblock local portable builds.

---

## 4. Phase ordering (strict — phases are not independent)

```
Phase 0  (commit merge)        ← unblocks everything
  └── Phase 1  (dir walker)    ← without this, Phase 0 crashes on devforge dir
        ├── Phase 2  (stdout)  ← independent of 3/4, can interleave
        ├── Phase 3  (events)  ← depends on Phase 1's `PortableReport`
        │     └── Phase 4  (smoke asserts) ← depends on Phase 3's report shape
        └── Phase 5  (CI gate) ← can land any time after Phase 1
```

Expected total effort: **~4-6 hours of authoring + review**, excluding the
~60 min actual build to verify the end-to-end result.

---

## 5. What I explicitly am NOT changing

- **Tauri config layout** — `tauri.conf.json` + per-OS `tauri.<platform>.conf.json`
  is canonical Tauri 2 pattern, already correct.
- **Bundle resources declarations** — `tauri.windows.conf.json` DLL list + devforge
  trailing-slash entry is correct per Tauri docs.
- **externalBin** — `llama-server` naming + target-triple suffix is correct.
- **Engine, kernel, frontend code** — zero changes.

The fix is 100% inside `xtask/`. The regression is a xtask implementation gap,
not an architecture problem.

---

## 6. References (authoritative, not blog-post guesses)

- [Tauri 2 — bundle.resources directory syntax](https://v2.tauri.app/develop/resources/)
- [Tauri 2 — configuration file merging RFC 7396](https://v2.tauri.app/develop/configuration-files/)
- [Tauri 2 — externalBin sidecar convention](https://v2.tauri.app/develop/sidecar/)
- [walkdir crate](https://docs.rs/walkdir/2.5/walkdir/) — standard recursive walker
- [RFC 7396 JSON Merge Patch](https://www.rfc-editor.org/rfc/rfc7396) — already in workspace.rs via `merge_rfc7396`

---

## 7. Approval gate

**I will not author any Phase 1-5 code until owner approves this plan.**
Phase 0 is the existing working-tree diff — owner commits it directly.
