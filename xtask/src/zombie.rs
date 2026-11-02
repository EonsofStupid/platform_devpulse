//! Process lifecycle management — ensures child processes die with the parent.
//!
//! ## Windows: Job Objects
//!
//! Creates a Win32 Job Object with `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`.
//! Every child process (cargo, pnpm, vite, rustc) is assigned to this job.
//! When xtask exits — normally, crash, Ctrl+C, Task Manager kill — the
//! Windows kernel terminates all children automatically. Zero zombies.
//!
//! This is how Chrome, VS Code, and Docker handle child processes on Windows.
//!
//! ## Unix: Process Groups
//!
//! Uses `setsid` so children share a process group. On exit, `SIGKILL`
//! to the group kills everything.
//!
//! ## Stale Process Cleanup
//!
//! On startup, scans for leftover processes from crashed sessions and
//! terminates them before they block the dev port or hold cargo locks.
//!
//! **Every subprocess call has a timeout.** If any OS tool (tasklist,
//! `PowerShell`, taskkill) hangs, we print a warning and move on. The
//! pipeline NEVER freezes silently.

use crate::stage::Stage;
use anyhow::Result;

/// Max seconds any single subprocess (tasklist, taskkill, powershell) is
/// allowed to run before we kill it and move on.
const SUBPROCESS_TIMEOUT_SECS: u64 = 5;

// ── Job Object (Windows) ─────────────────────────────────────────

#[cfg(windows)]
#[allow(unsafe_code)]
mod job {
    use anyhow::{Context, Result};
    use std::io;
    use std::os::windows::io::AsRawHandle;
    use windows_sys::Win32::Foundation::{CloseHandle, HANDLE};
    use windows_sys::Win32::System::JobObjects::{
        AssignProcessToJobObject, CreateJobObjectW, JOB_OBJECT_LIMIT_BREAKAWAY_OK,
        JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE, JOBOBJECT_EXTENDED_LIMIT_INFORMATION,
        JobObjectExtendedLimitInformation, SetInformationJobObject,
    };

    /// A Windows Job Object that kills all assigned processes on drop.
    pub struct JobGuard {
        handle: HANDLE,
    }

    // SAFETY: Job Object handles are thread-safe kernel objects.
    unsafe impl Send for JobGuard {}
    unsafe impl Sync for JobGuard {}

    impl JobGuard {
        /// Create a new Job Object with kill-on-close semantics.
        pub fn new() -> Result<Self> {
            // SAFETY: CreateJobObjectW with null name and null security attrs
            // creates an unnamed job object. Returns null on failure.
            let handle = unsafe { CreateJobObjectW(std::ptr::null(), std::ptr::null()) };

            anyhow::ensure!(
                !handle.is_null(),
                "CreateJobObjectW failed: {}",
                io::Error::last_os_error()
            );

            // Configure:
            //   * KILL_ON_JOB_CLOSE — when xtask exits (and the job handle
            //     closes), every assigned process dies. This is the zombie
            //     prevention this whole module exists for.
            //   * BREAKAWAY_OK — children that spawn themselves with
            //     `CREATE_BREAKAWAY_FROM_JOB` are allowed to escape. This
            //     is load-bearing for infrastructure daemons (sccache,
            //     future standalone dev services) that must SURVIVE xtask
            //     exiting. Without this flag, CREATE_BREAKAWAY_FROM_JOB
            //     would fail silently and the daemon would be silently
            //     assigned to the job and killed with it — the exact bug
            //     that plagued the sccache server before this fix.
            //
            //     BREAKAWAY_OK is explicitly opt-in (child requests it),
            //     NOT silent-breakaway. Build children (cargo, rustc,
            //     pnpm, vite, tauri dev, the app binary) do NOT pass
            //     CREATE_BREAKAWAY_FROM_JOB, so they stay in the job and
            //     get killed on xtask exit exactly as before.
            let mut info: JOBOBJECT_EXTENDED_LIMIT_INFORMATION = unsafe { std::mem::zeroed() };
            info.BasicLimitInformation.LimitFlags =
                JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE | JOB_OBJECT_LIMIT_BREAKAWAY_OK;

            // SAFETY: We're setting a well-defined limit flag on a valid job handle.
            let ok = unsafe {
                SetInformationJobObject(
                    handle,
                    JobObjectExtendedLimitInformation,
                    (&raw const info).cast(),
                    std::mem::size_of::<JOBOBJECT_EXTENDED_LIMIT_INFORMATION>() as u32,
                )
            };

            if ok == 0 {
                let err = io::Error::last_os_error();
                // SAFETY: Closing the handle we just created.
                unsafe { CloseHandle(handle) };
                return Err(err).context("SetInformationJobObject failed (kill-on-close flag)");
            }

            Ok(Self { handle })
        }

        /// Assign a child process to this job. It will be killed when the job closes.
        pub fn assign(&self, child: &std::process::Child) -> Result<()> {
            let child_handle = child.as_raw_handle() as HANDLE;

            // SAFETY: Both handles are valid — job from new(), child from spawn().
            let ok = unsafe { AssignProcessToJobObject(self.handle, child_handle) };

            anyhow::ensure!(
                ok != 0,
                "AssignProcessToJobObject failed (PID {}): {}",
                child.id(),
                io::Error::last_os_error()
            );
            Ok(())
        }
    }

    impl Drop for JobGuard {
        fn drop(&mut self) {
            // SAFETY: Closing our own valid handle. This triggers
            // JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE — all assigned processes die.
            unsafe { CloseHandle(self.handle) };
        }
    }
}

#[cfg(windows)]
pub use job::JobGuard;

// ── Timeout helper ──────────────────────────────────────────────

/// Run a subprocess with a timeout. Returns Ok(output) if it finishes
/// in time, or Err with a message if it times out (subprocess is killed).
/// Prints progress so the pipeline is NEVER silent.
fn run_with_timeout(
    cmd: &str,
    args: &[&str],
    timeout_secs: u64,
) -> Result<std::process::Output, String> {
    use std::process::Stdio;
    use std::time::{Duration, Instant};

    let mut child = crate::child_env::command(cmd)
        .args(args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("failed to spawn {cmd}: {e}"))?;

    let deadline = Instant::now() + Duration::from_secs(timeout_secs);

    loop {
        match child.try_wait() {
            Ok(Some(_status)) => {
                // Exited — collect output
                return child
                    .wait_with_output()
                    .map_err(|e| format!("{cmd} wait_with_output: {e}"));
            }
            Ok(None) => {
                if Instant::now() >= deadline {
                    let _ = child.kill();
                    let _ = child.wait();
                    return Err(format!(
                        "{cmd} timed out after {timeout_secs}s — killed and moving on"
                    ));
                }
                std::thread::sleep(Duration::from_millis(50));
            }
            Err(e) => {
                return Err(format!("{cmd} try_wait error: {e}"));
            }
        }
    }
}

// ── Stale process cleanup ────────────────────────────────────────

/// Process names that can become zombies from crashed dev sessions.
///
/// Must include ALL binary names that appear in our process tree:
/// - The Tauri app binary and backend
/// - Previous xtask instances that froze
/// - cargo-tauri (the Tauri CLI invoked by pnpm)
/// - Managed sidecars whose `kill_on_drop` did not fire because the
///   parent crashed (`surreal`, `llama-server`). Ollama is user-installed
///   and deliberately excluded — we never sweep a process we don't own.
const ZOMBIE_NAMES: &[&str] = &[
    "devpulse-desktop-app",
    "devpulse_desktop_backend",
    "devpulse-desktop-backend",
    "cargo-tauri",
    "xtask",
    // Managed sidecar binaries (Tauri `externalBin` targets).
    "surreal",
    "surreal-x86_64-pc-windows-msvc",
    "llama-server",
    "llama-server-x86_64-pc-windows-msvc",
];

/// Build command-line patterns that identify `DevPulse` dev processes.
/// Port is config-driven — no hardcoded values.
#[cfg_attr(
    not(windows),
    expect(
        dead_code,
        reason = "POSIX cleanup_unix currently does name-only matching against cargo/rustc; \
                  extending it to command-line pattern matching (tauri dev / vite --port) \
                  will reuse this helper. Kept cross-platform so the extension lands as a \
                  callsite change, not a re-author."
    )
)]
fn zombie_patterns(dev_port: u16) -> Vec<String> {
    vec![
        "tauri dev".to_string(),
        format!("vite --port {dev_port}"),
        format!("vite.bin.js --port {dev_port}"),
        "node_modules/.bin/tauri".to_string(),
        "node_modules\\.bin\\tauri".to_string(),
    ]
}

/// Report other Rust processes without assuming they own this workspace's lock.
/// Cargo coordinates its file locks; process names never establish ownership.
pub fn inspect_build_processes() -> u32 {
    let stage = Stage::start("build lock scan");

    #[cfg(windows)]
    let found = inspect_build_processes_windows();

    #[cfg(not(windows))]
    let found = inspect_build_processes_unix();

    if found == 0 {
        stage.ok_with("no other Rust processes observed; Cargo manages build locks");
    } else {
        stage.ok_with(format!(
            "{found} other Rust process(es) observed; left running, Cargo manages build locks"
        ));
    }

    found
}

#[cfg(windows)]
fn inspect_build_processes_windows() -> u32 {
    let my_pid = std::process::id();
    // Protect our entire ancestor chain — cargo.exe spawned us via `cargo xtask`,
    // and that cargo may itself have a parent (terminal, IDE, etc.).
    let ancestors = get_ancestor_pids_windows();
    let mut found = 0u32;

    for name in &["cargo", "rustc"] {
        println!("    checking running {name}.exe ...");

        let output = match run_with_timeout(
            "tasklist",
            &[
                "/FI",
                &format!("IMAGENAME eq {name}.exe"),
                "/NH",
                "/FO",
                "CSV",
            ],
            SUBPROCESS_TIMEOUT_SECS,
        ) {
            Ok(o) => o,
            Err(msg) => {
                eprintln!("  [!!] {msg}");
                continue;
            }
        };

        let stdout = String::from_utf8_lossy(&output.stdout);
        if stdout.contains("INFO:") || stdout.trim().is_empty() {
            continue;
        }

        for line in stdout.lines() {
            let line = line.trim();
            if line.is_empty() || line.starts_with("\"Image") {
                continue;
            }
            if let Some(pid) = parse_csv_pid(line) {
                if pid == my_pid {
                    continue;
                }
                if ancestors.contains(&pid) {
                    println!("    skipping {name}.exe (PID {pid}) — ancestor process");
                    continue;
                }
                println!(
                    "  [info] {name}.exe (PID {pid}) is running; ownership unknown, left untouched"
                );
                found += 1;
            }
        }
    }

    found
}

/// Collect the full ancestor chain of cargo.exe PIDs that lead to us.
/// We must never kill any of these — they're our own process tree.
#[cfg(windows)]
fn get_ancestor_pids_windows() -> Vec<u32> {
    let mut ancestors = Vec::new();
    let mut current = std::process::id();

    // Walk up the process tree (max 10 levels to avoid infinite loops)
    for _ in 0..10 {
        match get_parent_pid_of(current) {
            Some(parent) if parent != 0 && parent != current => {
                ancestors.push(parent);
                current = parent;
            }
            _ => break,
        }
    }
    ancestors
}

/// Get the parent PID of a specific process via `PowerShell` (reliable, unlike wmic).
#[cfg(windows)]
fn get_parent_pid_of(pid: u32) -> Option<u32> {
    let output = run_with_timeout(
        "powershell",
        &[
            "-NoProfile",
            "-Command",
            &format!("(Get-CimInstance Win32_Process -Filter \"ProcessId={pid}\").ParentProcessId"),
        ],
        SUBPROCESS_TIMEOUT_SECS,
    )
    .ok()?;
    let stdout = String::from_utf8_lossy(&output.stdout);
    stdout.trim().parse::<u32>().ok()
}

#[cfg(not(windows))]
fn inspect_build_processes_unix() -> u32 {
    let my_pid = std::process::id();
    let mut found = 0u32;

    for name in &["cargo", "rustc"] {
        println!("    checking running {name} ...");

        let output = match run_with_timeout("pgrep", &["-x", name], SUBPROCESS_TIMEOUT_SECS) {
            Ok(o) => o,
            Err(msg) => {
                eprintln!("  [!!] {msg}");
                continue;
            }
        };

        let stdout = String::from_utf8_lossy(&output.stdout);
        for pid in stdout.lines() {
            let pid = pid.trim();
            if pid.is_empty() {
                continue;
            }
            if pid.parse::<u32>().ok() == Some(my_pid) {
                continue;
            }
            println!("  [info] {name} (PID {pid}) is running; ownership unknown, left untouched");
            found += 1;
        }
    }

    found
}

/// Scan for and kill zombie processes from previous dev sessions.
///
/// `dev_port` is read from `[services.network.dev_server]` in `platform.default.toml`.
pub fn cleanup(dev_port: u16) -> u32 {
    let stage = Stage::start("zombie scan");

    #[cfg(windows)]
    let killed = cleanup_windows(dev_port);

    #[cfg(not(windows))]
    let killed = cleanup_unix(dev_port);

    if killed == 0 {
        stage.ok_with("no stale processes");
    } else {
        stage.ok_with(format!("killed {killed} stale process(es)"));
    }

    killed
}

#[cfg(windows)]
fn cleanup_windows(dev_port: u16) -> u32 {
    let my_pid = std::process::id();
    let mut killed = 0u32;

    // Phase 1: Kill by process name — each tasklist call is timeout-guarded.
    for name in ZOMBIE_NAMES {
        println!("    scanning for stale {name}.exe ...");

        let output = match run_with_timeout(
            "tasklist",
            &[
                "/FI",
                &format!("IMAGENAME eq {name}.exe"),
                "/NH",
                "/FO",
                "CSV",
            ],
            SUBPROCESS_TIMEOUT_SECS,
        ) {
            Ok(o) => o,
            Err(msg) => {
                eprintln!("  [!!] {msg}");
                continue;
            }
        };

        let stdout = String::from_utf8_lossy(&output.stdout);
        if stdout.contains("INFO:") || stdout.trim().is_empty() {
            continue;
        }

        for line in stdout.lines() {
            let line = line.trim();
            if line.is_empty() || line.starts_with("\"Image") {
                continue;
            }
            if let Some(pid) = parse_csv_pid(line) {
                if pid == my_pid {
                    continue;
                }
                println!("  [>>] killing stale {name}.exe (PID {pid})");
                // taskkill can also hang — timeout it too
                if let Err(msg) = run_with_timeout(
                    "taskkill",
                    &["/F", "/T", "/PID", &pid.to_string()],
                    SUBPROCESS_TIMEOUT_SECS,
                ) {
                    eprintln!("  [!!] {msg}");
                }
                killed += 1;
            }
        }
    }

    // Phase 2: Kill by command-line pattern via PowerShell (single invocation).
    // Uses Get-CimInstance (fast) instead of Get-WmiObject (deprecated, hangs).
    // Entire phase is timeout-guarded.
    let patterns = zombie_patterns(dev_port);
    let conditions: Vec<String> = patterns
        .iter()
        .map(|p| format!("$_.CommandLine -like '*{p}*'"))
        .collect();
    let filter = conditions.join(" -or ");

    let ps_script = format!(
        "Get-CimInstance Win32_Process | \
         Where-Object {{ ({filter}) -and $_.ProcessId -ne {my_pid} }} | \
         ForEach-Object {{ \
             Write-Host \"  [>>] killing stale PID $($_.ProcessId)\"; \
             Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue \
         }}"
    );

    println!("    scanning command lines for dev process patterns ...");
    match run_with_timeout(
        "powershell",
        &["-NoProfile", "-Command", &ps_script],
        10, // PowerShell+CIM gets a longer leash but still bounded
    ) {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            killed += stdout.matches("[>>]").count() as u32;
        }
        Err(msg) => {
            eprintln!("  [!!] {msg}");
        }
    }

    killed
}

#[cfg(not(windows))]
fn cleanup_unix(_dev_port: u16) -> u32 {
    let my_pid = std::process::id();
    let mut killed = 0u32;

    for name in ZOMBIE_NAMES {
        println!("    scanning for stale {name} ...");

        let output = match run_with_timeout("pgrep", &["-f", name], SUBPROCESS_TIMEOUT_SECS) {
            Ok(o) => o,
            Err(msg) => {
                eprintln!("  [!!] {msg}");
                continue;
            }
        };

        let stdout = String::from_utf8_lossy(&output.stdout);
        for pid in stdout.lines() {
            let pid = pid.trim();
            if pid.is_empty() {
                continue;
            }
            if pid.parse::<u32>().ok() == Some(my_pid) {
                continue;
            }
            println!("  [>>] killing stale {name} (PID {pid})");
            let _ = run_with_timeout("kill", &["-9", pid], SUBPROCESS_TIMEOUT_SECS);
            killed += 1;
        }
    }

    killed
}

/// Parse PID from tasklist CSV output: "name.exe","12345","Console","1","12,345 K"
#[cfg(windows)]
fn parse_csv_pid(line: &str) -> Option<u32> {
    let mut parts = line.split(',');
    let _name = parts.next()?;
    let pid_field = parts.next()?.trim().trim_matches('"');
    pid_field.parse::<u32>().ok()
}

#[cfg(all(test, windows))]
#[allow(clippy::unwrap_used, reason = "test assertions")]
mod tests {
    use std::process::{Child, Stdio};

    struct Compiler(Child);

    impl Drop for Compiler {
        fn drop(&mut self) {
            // Only this fixture is ours to stop; never kill by image name.
            let _ = self.0.kill();
            let _ = self.0.wait();
        }
    }

    #[test]
    fn build_inspection_leaves_an_unrelated_compiler_running() {
        let compiler = crate::child_env::command("rustup")
            .args(["which", "rustc"])
            .output()
            .unwrap();
        assert!(compiler.status.success());
        let path = String::from_utf8(compiler.stdout).unwrap();
        // An actual compiler waiting for source on stdin stays alive throughout
        // the scan. Its name cannot establish that it belongs to this launcher.
        let mut child = Compiler(
            crate::child_env::command(path.trim())
                .args([
                    "--crate-name",
                    "devpulse_lock_probe",
                    "--crate-type",
                    "lib",
                    "--emit",
                    "metadata",
                    "-",
                ])
                .stdin(Stdio::piped())
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .spawn()
                .unwrap(),
        );
        assert!(child.0.try_wait().unwrap().is_none());
        assert!(super::inspect_build_processes() > 0);
        assert!(child.0.try_wait().unwrap().is_none());
    }
}
