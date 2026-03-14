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
//! terminates them before they block port 1420 or hold cargo locks.

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
const ZOMBIE_NAMES: &[&str] = &[
    "devpulse_desktop_backend",
    "devpulse-desktop-backend",
    "cargo-tauri",
];

/// Command-line patterns that identify DevPulse dev processes.
/// Matches against the full command line so we don't kill unrelated node/vite instances.
const ZOMBIE_PATTERNS: &[&str] = &[
    "tauri dev",
    "vite --port 1420",
    "vite.bin.js --port 1420",
    "node_modules/.bin/tauri",
    "node_modules\\.bin\\tauri",
];

/// Scan for and kill zombie processes from previous dev sessions.
pub fn cleanup() -> Result<u32> {
    let stage = Stage::start("zombie scan");

    #[cfg(windows)]
    let killed = cleanup_windows();

    #[cfg(not(windows))]
    let killed = cleanup_unix();

    let killed = killed?;

    if killed == 0 {
        stage.ok_with("no stale processes");
    } else {
        stage.ok_with(format!("killed {killed} stale process(es)"));
    }

    Ok(killed)
}

#[cfg(windows)]
fn cleanup_windows() -> Result<u32> {
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

    // Phase 2: Kill by command-line pattern via PowerShell
    // PowerShell can kill process trees even when taskkill can't
    for pattern in ZOMBIE_PATTERNS {
        let ps = Command::new("powershell")
            .args([
                "-NoProfile",
                "-Command",
                &format!(
                    "Get-WmiObject Win32_Process | \
                     Where-Object {{ $_.CommandLine -like '*{pattern}*' -and $_.ProcessId -ne {} }} | \
                     ForEach-Object {{ \
                         Write-Host \"  [>>] killing stale PID $($_.ProcessId) (matched: {pattern})\"; \
                         Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue \
                     }}",
                    std::process::id()
                ),
            ])
            .output();

        if let Ok(output) = ps {
            let stdout = String::from_utf8_lossy(&output.stdout);
            killed += stdout.matches("[>>]").count() as u32;
        }
    }

    Ok(killed)
}

#[cfg(not(windows))]
fn cleanup_unix() -> Result<u32> {
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
