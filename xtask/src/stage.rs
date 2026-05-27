//! Stage — timed status reporting for pipeline stages.
//!
//! Every stage in the orchestrator starts a timer and reports
//! its outcome with duration. Consistent output across all tasks.
//!
//! ```text
//! --- Pre-flight ---
//!   [OK] node_modules (2ms)
//!   [OK] pnpm 10.29.3 — C:\nvm4w\nodejs\pnpm.CMD (45ms)
//!   [WARN] node v24.13.1 — expected v22.x from .nvmrc (12ms)
//!   [OK] cargo (1ms)
//!
//! --- Backend (423 crates in dependency graph) ---
//!   ├─ tls layer
//!   │  compiling rustls                        2.1s    [  8/423]
//!   ├─ relational service (LibSQL)
//!   │  checking  libsql                        4.3s    [ 92/423]
//!   ├─ platform engine
//!   │  checking  devpulse-engine               9.1s    [421/423]
//!   └─ [OK] backend — 12 compiled + 411 checked (9.3s)
//! ```

use std::io::{self, Write};
use std::path::Path;
use std::time::Instant;

/// Print a section header. Groups related stages.
pub fn section(name: &str) {
    println!();
    println!("--- {name} ---");
}

/// A timed stage within a task pipeline.
///
/// Created via [`Stage::start`], consumed by one of
/// [`ok`](Stage::ok), [`ok_with`](Stage::ok_with),
/// [`warn`](Stage::warn), or [`skip`](Stage::skip).
pub struct Stage {
    label: &'static str,
    start: Instant,
}

impl Stage {
    /// Begin a new timed stage.
    pub fn start(label: &'static str) -> Self {
        Self {
            label,
            start: Instant::now(),
        }
    }

    /// Stage completed successfully.
    pub fn ok(self) {
        let ms = self.start.elapsed().as_millis();
        println!("  [OK] {} ({ms}ms)", self.label);
    }

    /// Stage completed successfully with extra detail.
    pub fn ok_with(self, detail: impl std::fmt::Display) {
        let ms = self.start.elapsed().as_millis();
        println!("  [OK] {} — {detail} ({ms}ms)", self.label);
    }

    /// Stage completed with a non-fatal warning.
    pub fn warn(self, detail: impl std::fmt::Display) {
        let ms = self.start.elapsed().as_millis();
        eprintln!("  [WARN] {} — {detail} ({ms}ms)", self.label);
    }

    /// Stage was skipped (not applicable).
    pub fn skip(self, reason: impl std::fmt::Display) {
        println!("  [--] {} — {reason}", self.label);
    }

    /// Stage failed with a fatal error.
    pub fn fail(self, detail: impl std::fmt::Display) {
        let ms = self.start.elapsed().as_millis();
        eprintln!("  [FAIL] {} — {detail} ({ms}ms)", self.label);
    }
}

// ── Dependency graph estimation ──────────────────────────────────

/// Use `cargo_metadata` to count the total number of packages in the resolve
/// graph for a given package. Returns the count, or 0 if metadata fails.
///
/// This lets us show "X of ~Y" during compilation instead of just "X compiled".
pub fn estimate_crate_count(workspace_root: &Path, package: &str) -> u32 {
    let Ok(metadata) = cargo_metadata::MetadataCommand::new()
        .manifest_path(workspace_root.join("Cargo.toml"))
        .exec()
    else {
        return 0;
    };

    // Find the target package's ID
    let Some(target_pkg) = metadata.packages.iter().find(|p| p.name == package) else {
        // Fall back to total package count
        return metadata.packages.len() as u32;
    };

    // Walk the resolve graph from the target package to count transitive deps
    let Some(resolve) = &metadata.resolve else {
        return metadata.packages.len() as u32;
    };

    let mut visited = std::collections::HashSet::new();
    let mut stack = vec![&target_pkg.id];

    while let Some(pkg_id) = stack.pop() {
        if !visited.insert(pkg_id.clone()) {
            continue;
        }
        if let Some(node) = resolve.nodes.iter().find(|n| &n.id == pkg_id) {
            for dep in &node.deps {
                stack.push(&dep.pkg);
            }
        }
    }

    visited.len() as u32
}

// ── Crate layer mapping ─────────────────────────────────────────

/// Known crate → human-readable layer mapping.
/// Tells the developer WHERE in the stack the build currently is.
fn crate_layer(name: &str) -> &'static str {
    match name {
        // Platform crates (ours)
        "devpulse_desktop_backend" | "devpulse-desktop-app" => "tauri backend",
        "devpulse-engine" => "platform engine",
        "devpulse-clyffy" => "ai kernel",
        // Database drivers
        "surrealdb" | "surrealdb-core" | "surrealdb-core2" => "graph service (SurrealDB)",
        "surrealkv" | "surrealcs" => "graph service (kv engine)",
        "libsql" | "libsql-sys" => "relational service (LibSQL)",
        "duckdb" | "libduckdb-sys" => "analytics service (DuckDB)",
        "moka" => "cache service (Moka)",
        // Networking
        "reqwest" | "hyper" | "hyper-util" => "http client",
        "rustls" | "rustls-webpki" | "tokio-rustls" | "hyper-rustls" => "tls layer",
        // Tauri framework
        n if n.starts_with("tauri") => "tauri framework",
        // Tokio runtime
        "tokio" | "tokio-util" | "tokio-stream" => "async runtime",
        // Serde
        "serde" | "serde_json" | "serde_derive" => "serialization",
        // Crypto
        n if n.starts_with("aws-lc") || n.starts_with("ring") => "crypto (native)",
        // Everything else
        _ => "",
    }
}

// ── Line clearing helper ─────────────────────────────────────────

/// Width of the progress line. Must be wide enough to overwrite any previous
/// content on Windows `ConHost` (bare \r does not clear trailing chars).
const LINE_WIDTH: usize = 100;

/// Clear the current terminal line (works on Windows `ConHost` + Unix).
fn clear_line() {
    eprint!("\r{}\r", " ".repeat(LINE_WIDTH));
    io::stderr().flush().ok();
}

// ── Live progress for long operations ────────────────────────────

/// Monitor a cargo child process with transparent, real-time build logging.
///
/// Shows every crate being compiled/checked with its layer context.
/// When `estimated_total > 0`, shows "X of ~Y" progress.
/// Errors print immediately. Warnings are counted. Summary at the end.
///
/// Returns the child's exit status. Previously also returned a
/// `saw_sccache_transport_error` flag used to drive a retry-without-cache
/// path in `dev.rs`. That scaffolding existed only because the sccache
/// server was being killed by xtask's Job Object mid-compile. The
/// foundation fix (see [`crate::commands::sccache`]) starts the server
/// outside the job so transport failures no longer happen from that
/// cause; the retry path has been removed.
pub struct CargoMonitorResult {
    /// Exit status returned by cargo.
    pub status: std::process::ExitStatus,
}

pub fn monitor_cargo_child(
    label: &str,
    mut child: std::process::Child,
    estimated_total: u32,
) -> anyhow::Result<CargoMonitorResult> {
    use std::io::BufRead;
    use std::sync::{Arc, Mutex};

    let stderr = child
        .stderr
        .take()
        .ok_or_else(|| anyhow::anyhow!("no stderr on child"))?;

    let reader = io::BufReader::new(stderr);
    let start = Instant::now();

    // Shared state for the heartbeat thread to display live elapsed time
    // even when cargo is silent (e.g. during long native C++ compilations).
    let heartbeat_state = Arc::new(Mutex::new(HeartbeatState {
        last_verb: String::new(),
        last_crate: String::new(),
        total: 0u32,
        estimated_total,
        alive: true,
    }));

    let heartbeat = spawn_heartbeat_thread(Arc::clone(&heartbeat_state), start);

    let mut counters = CompileCounters::default();
    for line in reader.lines() {
        let Ok(line) = line else { continue };
        process_compile_line(
            &line,
            &mut counters,
            start,
            estimated_total,
            &heartbeat_state,
        );
    }

    // Stop heartbeat thread
    if let Ok(mut state) = heartbeat_state.lock() {
        state.alive = false;
    }
    let _ = heartbeat.join();

    clear_line();

    let status = child.wait().context("failed to wait on cargo")?;
    let elapsed = format_duration(start.elapsed());
    report_cargo_result(label, &counters, &elapsed, status);

    Ok(CargoMonitorResult { status })
}

/// Running counters maintained while the cargo monitor consumes its
/// stderr stream. `current_layer` and `in_error_block` are line-by-line
/// state used to drive the rendered progress UI.
#[derive(Default)]
struct CompileCounters {
    compiled: u32,
    checked: u32,
    warnings: u32,
    errors: Vec<String>,
    current_layer: &'static str,
    in_error_block: bool,
}

fn spawn_heartbeat_thread(
    hb: std::sync::Arc<std::sync::Mutex<HeartbeatState>>,
    hb_start: Instant,
) -> std::thread::JoinHandle<()> {
    use std::thread;
    use std::time::Duration;

    thread::spawn(move || {
        let spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        let mut tick = 0usize;
        loop {
            thread::sleep(Duration::from_millis(500));
            // If the mutex poisons (producer panicked), recover the inner
            // value and keep ticking — the only durable state we need is
            // `alive`, which the producer sets false on shutdown. Panicking
            // the heartbeat would just hide the real panic behind a second.
            let state = hb.lock().unwrap_or_else(std::sync::PoisonError::into_inner);
            if !state.alive {
                break;
            }
            if state.last_crate.is_empty() {
                // Nothing to display yet — cargo hasn't emitted a crate line
                drop(state);
                continue;
            }
            let elapsed = format_duration(hb_start.elapsed());
            let spin = spinner[tick % spinner.len()];
            tick += 1;
            let verb = state.last_verb.clone();
            let crate_name = state.last_crate.clone();
            let total = state.total;
            let est = state.estimated_total;
            drop(state);

            clear_line();
            if est > 0 {
                let counter = format!("[{total:>3}/~{est}]");
                eprint!("\r  \u{2502}  {spin} {verb} {crate_name:<32} {elapsed:>8}  {counter}");
            } else {
                eprint!("\r  \u{2502}  {spin} {verb} {crate_name:<32} {elapsed:>8}");
            }
            io::stderr().flush().ok();
        }
    })
}

fn process_compile_line(
    line: &str,
    counters: &mut CompileCounters,
    start: Instant,
    estimated_total: u32,
    heartbeat_state: &std::sync::Mutex<HeartbeatState>,
) {
    let trimmed = line.trim();

    if trimmed.starts_with("Compiling ") || trimmed.starts_with("Checking ") {
        counters.in_error_block = false;
        let is_compile = trimmed.starts_with("Compiling ");
        if is_compile {
            counters.compiled += 1;
        } else {
            counters.checked += 1;
        }

        let prefix = if is_compile {
            "Compiling "
        } else {
            "Checking "
        };
        let verb = if is_compile { "compiling" } else { "checking " };
        let crate_name = trimmed
            .strip_prefix(prefix)
            .unwrap_or(trimmed)
            .split_whitespace()
            .next()
            .unwrap_or("?");

        let layer = crate_layer(crate_name);
        let elapsed = format_duration(start.elapsed());
        let total = counters.compiled + counters.checked;

        // Update heartbeat shared state
        if let Ok(mut state) = heartbeat_state.lock() {
            state.last_verb = verb.to_string();
            state.last_crate = crate_name.to_string();
            state.total = total;
        }

        // Print layer transition header when entering a new layer
        if !layer.is_empty() && layer != counters.current_layer {
            counters.current_layer = layer;
            clear_line();
            eprintln!("  \u{251c}\u{2500} {layer}");
        }

        // Show progress with optional "X of ~Y" counter
        clear_line();
        if estimated_total > 0 {
            let counter = format!("[{total:>3}/~{estimated_total}]");
            eprint!("\r  \u{2502}  {verb} {crate_name:<32} {elapsed:>8}  {counter}");
        } else {
            eprint!("\r  \u{2502}  {verb} {crate_name:<32} {elapsed:>8}");
        }
        io::stderr().flush().ok();
    } else if trimmed.starts_with("warning:") {
        if trimmed.contains("generated") {
            return;
        }
        counters.warnings += 1;
        clear_line();
        let detail = trimmed.strip_prefix("warning: ").unwrap_or(trimmed);
        eprintln!("  \u{2502}  [warn] {detail}");
    } else if trimmed.starts_with("error") {
        counters.in_error_block = true;
        clear_line();
        counters.errors.push(trimmed.to_string());
        eprintln!("  \u{2502}  [ERROR] {trimmed}");
    } else if counters.in_error_block && !trimmed.is_empty() {
        eprintln!("  \u{2502}          {trimmed}");
    } else if trimmed.starts_with("Finished") {
        counters.in_error_block = false;
        clear_line();
    }
}

fn report_cargo_result(
    label: &str,
    counters: &CompileCounters,
    elapsed: &str,
    status: std::process::ExitStatus,
) {
    let total = counters.compiled + counters.checked;
    let compiled = counters.compiled;
    let checked = counters.checked;
    let warnings = counters.warnings;

    if status.success() {
        let summary = if compiled > 0 && checked > 0 {
            format!("{compiled} compiled + {checked} checked")
        } else {
            format!("{total} crates")
        };
        if warnings > 0 {
            println!(
                "  \u{2514}\u{2500} [OK] {label} \u{2014} {summary}, {warnings} warning(s) ({elapsed})"
            );
        } else {
            println!("  \u{2514}\u{2500} [OK] {label} \u{2014} {summary} ({elapsed})");
        }
    } else {
        eprintln!(
            "  \u{2514}\u{2500} [FAIL] {label} \u{2014} {} error(s) after {total} crates ({elapsed})",
            counters.errors.len().max(1)
        );
        for err in &counters.errors {
            eprintln!("           {err}");
        }
    }
}

/// Shared state between the main reader loop and the heartbeat thread.
struct HeartbeatState {
    last_verb: String,
    last_crate: String,
    total: u32,
    estimated_total: u32,
    alive: bool,
}

use anyhow::Context;

/// Format a duration as human-readable: "1.2s", "2m 15s", "45ms"
fn format_duration(d: std::time::Duration) -> String {
    let secs = d.as_secs();
    let ms = d.as_millis();

    if secs >= 60 {
        let mins = secs / 60;
        let remaining = secs % 60;
        format!("{mins}m {remaining}s")
    } else if secs > 0 {
        let tenths = (ms % 1000) / 100;
        format!("{secs}.{tenths}s")
    } else {
        format!("{ms}ms")
    }
}
