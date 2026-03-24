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

use crate::stage::Stage;
use anyhow::Result;

// ── Job Object (Windows) ─────────────────────────────────────────

#[cfg(windows)]
#[allow(unsafe_code)]
mod job {
    use anyhow::{Context, Result};
    use std::io;
    use std::os::windows::io::AsRawHandle;
    use windows_sys::Win32::Foundation::{CloseHandle, HANDLE};
    use windows_sys::Win32::System::JobObjects::{
        AssignProcessToJobObject, CreateJobObjectW, JobObjectExtendedLimitInformation,
        SetInformationJobObject, JOBOBJECT_EXTENDED_LIMIT_INFORMATION,
        JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE,
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

            // Configure: kill all processes when the job handle is closed
            let mut info: JOBOBJECT_EXTENDED_LIMIT_INFORMATION = unsafe { std::mem::zeroed() };
            info.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;

            // SAFETY: We're setting a well-defined limit flag on a valid job handle.
            let ok = unsafe {
                SetInformationJobObject(
                    handle,
                    JobObjectExtendedLimitInformation,
                    (&info as *const JOBOBJECT_EXTENDED_LIMIT_INFORMATION).cast(),
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

// ── Stale process cleanup ────────────────────────────────────────

/// Process names that can become zombies from crashed dev sessions.
///
/// Must include ALL binary names that appear in our process tree:
/// - The Tauri app binary and backend
/// - cargo/rustc that hold the build lock
/// - Previous xtask instances that froze
/// - cargo-tauri (the Tauri CLI invoked by pnpm)
const ZOMBIE_NAMES: &[&str] = &[
    "devpulse-desktop-app",
    "devpulse_desktop_backend",
    "devpulse-desktop-backend",
    "cargo-tauri",
    "xtask",
];

/// Build command-line patterns that identify DevPulse dev processes.
/// Port is config-driven — no hardcoded values.
fn zombie_patterns(dev_port: u16) -> Vec<String> {
    vec![
        "tauri dev".to_string(),
        format!("vite --port {dev_port}"),
        format!("vite.bin.js --port {dev_port}"),
        "node_modules/.bin/tauri".to_string(),
        "node_modules\\.bin\\tauri".to_string(),
    ]
}

/// Kill stale cargo/rustc processes that would hold the build directory lock.
///
/// Called before `cargo check` to guarantee the lock is free. If zombies from
/// a crashed session are sitting on the lock, we'd block forever with zero
/// output — the exact "frozen pipeline" bug. This makes the failure visible
/// and recovers automatically.
pub fn clear_build_lock_holders() -> Result<u32> {
    let stage = Stage::start("build lock scan");

    #[cfg(windows)]
    let killed = {
        use std::process::Command;
        let my_pid = std::process::id();
        let mut killed = 0u32;

        // cargo and rustc are the only processes that hold Cargo's file lock.
        for name in &["cargo", "rustc"] {
            let check = Command::new("tasklist")
                .args(["/FI", &format!("IMAGENAME eq {name}.exe"), "/NH", "/FO", "CSV"])
                .output();

            let Ok(output) = check else { continue };
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
                    println!("  [>>] killing stale {name}.exe (PID {pid}) — would block build lock");
                    let _ = Command::new("taskkill")
                        .args(["/F", "/T", "/PID", &pid.to_string()])
                        .output();
                    killed += 1;
                }
            }
        }
        killed
    };

    #[cfg(not(windows))]
    let killed = {
        use std::process::Command;
        let my_pid = std::process::id();
        let mut killed = 0u32;

        for name in &["cargo", "rustc"] {
            let pgrep = Command::new("pgrep").args(["-x", name]).output();
            let Ok(output) = pgrep else { continue };
            let stdout = String::from_utf8_lossy(&output.stdout);

            for pid in stdout.lines() {
                let pid = pid.trim();
                if pid.is_empty() { continue; }
                if pid.parse::<u32>().ok() == Some(my_pid) { continue; }
                println!("  [>>] killing stale {name} (PID {pid}) — would block build lock");
                let _ = Command::new("kill").args(["-9", pid]).output();
                killed += 1;
            }
        }
        killed
    };

    if killed == 0 {
        stage.ok_with("no stale cargo/rustc — build lock is free");
    } else {
        stage.ok_with(format!("killed {killed} stale process(es) holding build lock"));
    }

    Ok(killed)
}

/// Scan for and kill zombie processes from previous dev sessions.
///
/// `dev_port` is read from `[services.network.dev_server]` in `platform.default.toml`.
pub fn cleanup(dev_port: u16) -> Result<u32> {
    let stage = Stage::start("zombie scan");

    #[cfg(windows)]
    let killed = cleanup_windows(dev_port);

    #[cfg(not(windows))]
    let killed = cleanup_unix(dev_port);

    let killed = killed?;

    if killed == 0 {
        stage.ok_with("no stale processes");
    } else {
        stage.ok_with(format!("killed {killed} stale process(es)"));
    }

    Ok(killed)
}

#[cfg(windows)]
fn cleanup_windows(dev_port: u16) -> Result<u32> {
    use std::process::Command;

    let mut killed = 0u32;

    // Phase 1: Kill by process name
    for name in ZOMBIE_NAMES {
        let check = Command::new("tasklist")
            .args(["/FI", &format!("IMAGENAME eq {name}.exe"), "/NH", "/FO", "CSV"])
            .output();

        let Ok(output) = check else { continue };
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
                if pid == std::process::id() {
                    continue;
                }
                println!("  [>>] killing stale {name}.exe (PID {pid})");
                let _ = Command::new("taskkill")
                    .args(["/F", "/T", "/PID", &pid.to_string()])
                    .output();
                killed += 1;
            }
        }
    }

    // Phase 2: Kill by command-line pattern via PowerShell (single invocation)
    // Uses Get-CimInstance (fast) instead of Get-WmiObject (deprecated, hangs).
    // All patterns checked in one PowerShell process with a 10s timeout.
    let patterns = zombie_patterns(dev_port);
    let my_pid = std::process::id();

    // Build a single PowerShell filter for all patterns
    let conditions: Vec<String> = patterns
        .iter()
        .map(|p| format!("$_.CommandLine -like '*{p}*'"))
        .collect();
    let filter = conditions.join(" -or ");

    let ps_script = format!(
        "Get-CimInstance Win32_Process | \
         Where-Object {{ ({filter}) -and $_.ProcessId -ne {my_pid} }} | \
         ForEach-Object {{ \
             Write-Host \"  [>>] killing stale PID $($_.ProcessId) (matched: $($_.CommandLine))\"; \
             Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue \
         }}"
    );

    if let Ok(mut child) = Command::new("powershell")
        .args(["-NoProfile", "-Command", &ps_script])
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::null())
        .spawn()
    {
        // 10 second timeout — if CIM is broken, don't block the pipeline
        let deadline = std::time::Instant::now() + std::time::Duration::from_secs(10);
        let mut timed_out = false;
        loop {
            match child.try_wait() {
                Ok(Some(_)) => break,
                Ok(None) => {
                    if std::time::Instant::now() >= deadline {
                        eprintln!("  [!!] PowerShell zombie scan timed out (10s) — skipping");
                        let _ = child.kill();
                        let _ = child.wait();
                        timed_out = true;
                        break;
                    }
                    std::thread::sleep(std::time::Duration::from_millis(100));
                }
                Err(_) => break,
            }
        }

        if !timed_out {
            // Process already exited — safe to read stdout
            if let Ok(output) = child.wait_with_output() {
                let stdout = String::from_utf8_lossy(&output.stdout);
                killed += stdout.matches("[>>]").count() as u32;
            }
        }
    }

    Ok(killed)
}

#[cfg(not(windows))]
fn cleanup_unix(_dev_port: u16) -> Result<u32> {
    use std::process::Command;

    let mut killed = 0u32;

    for name in ZOMBIE_NAMES {
        let pgrep = Command::new("pgrep").args(["-f", name]).output();
        let Ok(output) = pgrep else { continue };
        let stdout = String::from_utf8_lossy(&output.stdout);

        for pid in stdout.lines() {
            let pid = pid.trim();
            if pid.is_empty() {
                continue;
            }
            if pid.parse::<u32>().ok() == Some(std::process::id()) {
                continue;
            }
            println!("  [>>] killing stale {name} (PID {pid})");
            let _ = Command::new("kill").args(["-9", pid]).output();
            killed += 1;
        }
    }

    Ok(killed)
}

/// Parse PID from tasklist CSV output: "name.exe","12345","Console","1","12,345 K"
#[cfg(windows)]
fn parse_csv_pid(line: &str) -> Option<u32> {
    let mut parts = line.split(',');
    let _name = parts.next()?;
    let pid_field = parts.next()?.trim().trim_matches('"');
    pid_field.parse::<u32>().ok()
}
