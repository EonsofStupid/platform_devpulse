# xtask Dev Environment Overhaul Plan

**Date:** 2026-01-07
**Goal:** Make `cargo xtask dev` a proper developer experience with clear logging, prerequisite checks, and actionable errors.

---

## Current State (Broken)

```rust
// main.rs lines 120-141 - Current garbage implementation
async fn dev() -> Result<()> {
    // Prints banner
    // Runs check_all()
    // Spawns npm directly (FAILS on Windows)
    // No error handling
    // No prerequisite checks
    // User sees "program not found" with zero context
}
```

**Problems:**
1. `Command::new("npm")` fails on Windows - needs `cmd /C npm`
2. No check if node/npm installed before trying to run
3. No check if `lab/ui/` or `desktop/` have node_modules
4. Error messages are useless ("program not found")
5. No live status - user stares at nothing
6. No way to know which service failed or why

---

## Target State

```
$ cargo xtask dev

╔══════════════════════════════════════════════════════════════╗
║  DevPulse Dev Environment                                    ║
╚══════════════════════════════════════════════════════════════╝

Checking prerequisites...

  [✓] cargo         1.75.0
  [✓] node          v20.10.0
  [✓] npm           10.2.0
  [✓] lab/ui        node_modules present
  [✓] desktop       node_modules present

Compiling Rust crates...

  [1/5] shared           OK (1.2s)
  [2/5] orchestrator     OK (12.4s)
  [3/5] engine           OK (6.1s)
  [4/5] lab              OK (3.2s)
  [5/5] devpulse-desktop OK (4.8s)

Starting services...

  [1/3] Lab Backend      ● http://127.0.0.1:3001
  [2/3] Lab UI           ● http://127.0.0.1:5174
  [3/3] Desktop          ● Tauri window launched

╔══════════════════════════════════════════════════════════════╗
║  All services running. Press Ctrl+C to stop.                 ║
╚══════════════════════════════════════════════════════════════╝
```

**On Error:**
```
  [2/3] Lab UI           ✗ FAILED

ERROR: node_modules not found in lab/ui/

  The Lab UI dependencies are not installed.

  To fix, run:
    cd alpha/lab/ui
    npm install

  Then retry:
    cargo xtask dev
```

---

## Implementation Plan

### Step 1: Add Prerequisite Struct and Check Function

**Location:** `main.rs` after imports (around line 15)

```rust
/// Prerequisite check result
struct Prereq {
    name: &'static str,
    check: PrereqStatus,
}

enum PrereqStatus {
    Ok(String),           // Version string
    Missing(String),      // Fix instructions
    Warning(String),      // Non-fatal issue
}

/// Check all prerequisites before starting
fn check_prerequisites(alpha_dir: &str) -> Vec<Prereq> {
    let mut results = vec![];

    // 1. Check cargo (should always exist since we're running via cargo)
    results.push(check_cargo());

    // 2. Check node
    results.push(check_node());

    // 3. Check npm
    results.push(check_npm());

    // 4. Check lab/ui/node_modules exists
    results.push(check_node_modules(&format!("{}/lab/ui", alpha_dir), "lab/ui"));

    // 5. Check desktop/node_modules exists
    results.push(check_node_modules(&format!("{}/desktop", alpha_dir), "desktop"));

    results
}
```

### Step 2: Individual Check Functions

**Location:** After `check_prerequisites`

```rust
fn check_cargo() -> Prereq {
    match Command::new("cargo").arg("--version").output() {
        Ok(output) => {
            let version = String::from_utf8_lossy(&output.stdout);
            let version = version.trim().replace("cargo ", "");
            Prereq { name: "cargo", check: PrereqStatus::Ok(version) }
        }
        Err(_) => Prereq {
            name: "cargo",
            check: PrereqStatus::Missing("Install Rust from https://rustup.rs".into())
        }
    }
}

fn check_node() -> Prereq {
    let cmd = if cfg!(windows) { "node.exe" } else { "node" };
    match Command::new(cmd).arg("--version").output() {
        Ok(output) => {
            let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
            Prereq { name: "node", check: PrereqStatus::Ok(version) }
        }
        Err(_) => Prereq {
            name: "node",
            check: PrereqStatus::Missing(
                "Install Node.js from https://nodejs.org\nRestart terminal after install.".into()
            )
        }
    }
}

fn check_npm() -> Prereq {
    let cmd = if cfg!(windows) { "npm.cmd" } else { "npm" };
    match Command::new(cmd).arg("--version").output() {
        Ok(output) => {
            let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
            Prereq { name: "npm", check: PrereqStatus::Ok(version) }
        }
        Err(_) => Prereq {
            name: "npm",
            check: PrereqStatus::Missing(
                "npm should come with Node.js.\nReinstall Node from https://nodejs.org".into()
            )
        }
    }
}

fn check_node_modules(dir: &str, display_name: &str) -> Prereq {
    let node_modules = format!("{}/node_modules", dir);
    if std::path::Path::new(&node_modules).exists() {
        Prereq { name: display_name, check: PrereqStatus::Ok("deps installed".into()) }
    } else {
        Prereq {
            name: display_name,
            check: PrereqStatus::Missing(format!(
                "Run: cd {} && npm install", dir
            ))
        }
    }
}
```

### Step 3: Print Helpers

**Location:** After check functions

```rust
/// Print a step with consistent formatting
fn print_step(current: usize, total: usize, name: &str, status: &str, detail: &str) {
    let status_icon = match status {
        "OK" => "✓",
        "FAILED" => "✗",
        "RUNNING" => "●",
        "STARTING" => "○",
        _ => " ",
    };

    if detail.is_empty() {
        println!("  [{}/{}] {:<20} {} {}", current, total, name, status_icon, status);
    } else {
        println!("  [{}/{}] {:<20} {} {} → {}", current, total, name, status_icon, status, detail);
    }
}

/// Print prereq check result
fn print_prereq(prereq: &Prereq) -> bool {
    match &prereq.check {
        PrereqStatus::Ok(version) => {
            println!("  [✓] {:<15} {}", prereq.name, version);
            true
        }
        PrereqStatus::Missing(fix) => {
            println!("  [✗] {:<15} MISSING", prereq.name);
            false
        }
        PrereqStatus::Warning(msg) => {
            println!("  [!] {:<15} {}", prereq.name, msg);
            true
        }
    }
}

/// Print error with actionable fix
fn print_error_with_fix(title: &str, details: &str, fix: &str) {
    println!();
    println!("ERROR: {}", title);
    println!();
    if !details.is_empty() {
        println!("  {}", details);
        println!();
    }
    println!("  To fix:");
    for line in fix.lines() {
        println!("    {}", line);
    }
    println!();
}
```

### Step 4: NPM Spawn Helper (Windows-safe)

**Location:** After print helpers

```rust
/// Spawn npm command (handles Windows cmd requirement)
fn spawn_npm(args: &[&str], dir: &str) -> Result<std::process::Child> {
    if cfg!(windows) {
        let mut cmd_args = vec!["/C", "npm"];
        cmd_args.extend(args);
        Command::new("cmd")
            .args(&cmd_args)
            .current_dir(dir)
            .stdout(Stdio::inherit())
            .stderr(Stdio::inherit())
            .spawn()
            .map_err(|e| anyhow::anyhow!("Failed to spawn npm: {}", e))
    } else {
        Command::new("npm")
            .args(args)
            .current_dir(dir)
            .stdout(Stdio::inherit())
            .stderr(Stdio::inherit())
            .spawn()
            .map_err(|e| anyhow::anyhow!("Failed to spawn npm: {}", e))
    }
}
```

### Step 5: Rewrite dev() Function

**Location:** Replace existing dev() function (lines 92-165)

```rust
/// Launch development environment: Lab backend + Lab UI + Desktop
async fn dev() -> Result<()> {
    // Banner
    println!();
    println!("╔══════════════════════════════════════════════════════════════╗");
    println!("║  DevPulse Dev Environment                                    ║");
    println!("╚══════════════════════════════════════════════════════════════╝");
    println!();

    let alpha_dir = env!("CARGO_MANIFEST_DIR").replace("\\xtask", "");

    // === PHASE 1: Prerequisites ===
    println!("Checking prerequisites...");
    println!();

    let prereqs = check_prerequisites(&alpha_dir);
    let mut all_ok = true;
    let mut missing_fixes: Vec<(&str, &str)> = vec![];

    for prereq in &prereqs {
        if !print_prereq(prereq) {
            all_ok = false;
            if let PrereqStatus::Missing(fix) = &prereq.check {
                missing_fixes.push((prereq.name, fix));
            }
        }
    }

    if !all_ok {
        println!();
        println!("Prerequisites missing. Fix the following:");
        println!();
        for (name, fix) in missing_fixes {
            println!("  {}:", name);
            for line in fix.lines() {
                println!("    {}", line);
            }
            println!();
        }
        anyhow::bail!("Prerequisites not met");
    }

    println!();

    // === PHASE 2: Compile Rust ===
    println!("Compiling Rust crates...");
    println!();

    let crates = [
        ("shared", "SSOT types"),
        ("orchestrator", "Llm/inference"),
        ("engine", "Hub/facades"),
        ("lab", "Dev dashboard"),
        ("devpulse-desktop", "Desktop app"),
    ];

    for (i, (crate_name, _desc)) in crates.iter().enumerate() {
        let start = std::time::Instant::now();

        let status = Command::new("cargo")
            .args(["build", "-p", crate_name])
            .current_dir(&alpha_dir)
            .stdout(Stdio::null())
            .stderr(Stdio::piped())
            .status()?;

        let elapsed = start.elapsed().as_secs_f32();

        if status.success() {
            print_step(i + 1, crates.len(), crate_name, "OK", &format!("{:.1}s", elapsed));
        } else {
            print_step(i + 1, crates.len(), crate_name, "FAILED", "");
            println!();
            // Re-run to show errors
            Command::new("cargo")
                .args(["build", "-p", crate_name])
                .current_dir(&alpha_dir)
                .status()?;
            anyhow::bail!("Compilation failed for: {}", crate_name);
        }
    }

    println!();

    // === PHASE 3: Start Services ===
    println!("Starting services...");
    println!();

    // 1. Lab Backend (Axum)
    print_step(1, 3, "Lab Backend", "STARTING", "compiling...");
    let lab_backend = Command::new("cargo")
        .args(["run", "-p", "lab"])
        .current_dir(&alpha_dir)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()?;

    // Give it time to start
    tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
    println!("\x1b[1A\x1b[2K"); // Clear previous line
    print_step(1, 3, "Lab Backend", "RUNNING", "http://127.0.0.1:3001");

    // 2. Lab UI (SvelteKit)
    print_step(2, 3, "Lab UI", "STARTING", "npm run dev...");
    let lab_ui_dir = format!("{}/lab/ui", alpha_dir);
    let lab_ui = spawn_npm(&["run", "dev"], &lab_ui_dir)?;

    tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
    println!("\x1b[1A\x1b[2K");
    print_step(2, 3, "Lab UI", "RUNNING", "http://127.0.0.1:5174");

    // 3. Desktop (Tauri)
    print_step(3, 3, "Desktop", "STARTING", "tauri dev...");
    let desktop_dir = format!("{}/desktop", alpha_dir);
    let desktop = spawn_npm(&["run", "tauri:dev"], &desktop_dir)?;

    tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
    println!("\x1b[1A\x1b[2K");
    print_step(3, 3, "Desktop", "RUNNING", "Tauri window");

    println!();
    println!("╔══════════════════════════════════════════════════════════════╗");
    println!("║  All services running                                        ║");
    println!("╠══════════════════════════════════════════════════════════════╣");
    println!("║  Lab API:    http://127.0.0.1:3001/api/health                ║");
    println!("║  Lab UI:     http://127.0.0.1:5174                           ║");
    println!("║  Desktop:    Tauri window (Ctrl+G for chat overlay)          ║");
    println!("╠══════════════════════════════════════════════════════════════╣");
    println!("║  Press Ctrl+C to stop all services                           ║");
    println!("╚══════════════════════════════════════════════════════════════╝");
    println!();

    // Wait for Ctrl+C
    tokio::signal::ctrl_c().await?;

    println!();
    println!("Shutting down...");

    // Note: Child processes should be killed here
    // The current implementation loses the handles - need to store them

    Ok(())
}
```

### Step 6: Store Child Process Handles

**Issue:** Current code loses child process handles because they're shadowed by `mut` rebinding.

**Fix:** Store handles in a struct or vec:

```rust
struct RunningServices {
    lab_backend: std::process::Child,
    lab_ui: std::process::Child,
    desktop: std::process::Child,
}

impl Drop for RunningServices {
    fn drop(&mut self) {
        let _ = self.lab_backend.kill();
        let _ = self.lab_ui.kill();
        let _ = self.desktop.kill();
    }
}
```

---

## File Changes Summary

| File | Lines | Change |
|------|-------|--------|
| `xtask/src/main.rs` | 15-50 | Add `Prereq`, `PrereqStatus` structs |
| `xtask/src/main.rs` | 50-100 | Add `check_*` functions |
| `xtask/src/main.rs` | 100-150 | Add `print_*` helpers |
| `xtask/src/main.rs` | 150-170 | Add `spawn_npm()` helper |
| `xtask/src/main.rs` | 92-165 | Replace `dev()` function entirely |
| `xtask/src/main.rs` | 170-180 | Add `RunningServices` struct |

---

## Verification Steps

After implementation:

1. `cargo build -p xtask` - Verify it compiles
2. Test missing node: Temporarily rename node, run `cargo xtask dev`, verify clear error
3. Test missing node_modules: Delete `lab/ui/node_modules`, run, verify clear error
4. Test happy path: All prereqs met, verify all services start
5. Test Ctrl+C: Verify all processes killed cleanly

---

## Dependencies

No new crates needed. Uses only:
- `std::process::Command` (already imported)
- `std::io::{self, Write}` (already imported)
- `anyhow::Result` (already imported)

---

## Estimated Changes

- ~200 new lines of code
- 1 file modified (`xtask/src/main.rs`)
- 0 new dependencies

---

Ready to implement when approved.
