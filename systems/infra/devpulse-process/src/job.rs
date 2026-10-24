//! A Windows Job Object that ends every process assigned to it when it is
//! closed — when `DevPulse` exits, normally or not, the kernel terminates
//! the runtimes it started. Zero leftovers.
//!
//! Moved here from `xtask/src/zombie.rs` (the dev tree's guard) so the app's
//! own subprocesses get the same guarantee (plan 0007 Part S, S2a). This is
//! how Chrome, VS Code and Docker handle child processes on Windows.

use std::io;
use std::os::windows::io::RawHandle;

use anyhow::{Context, Result};
use windows_sys::Win32::Foundation::{CloseHandle, HANDLE};
use windows_sys::Win32::System::JobObjects::{
    AssignProcessToJobObject, CreateJobObjectW, JobObjectExtendedLimitInformation,
    SetInformationJobObject, JOBOBJECT_EXTENDED_LIMIT_INFORMATION, JOB_OBJECT_LIMIT_BREAKAWAY_OK,
    JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE,
};

/// Whether a process in the job may leave it by asking to
/// (`CREATE_BREAKAWAY_FROM_JOB`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Breakaway {
    /// Allowed on request. The dev tree needs it: infrastructure daemons
    /// such as the sccache server must outlive xtask.
    Allowed,
    /// Never. The app's runtimes must not outlive `DevPulse`.
    Refused,
}

/// A Job Object with kill-on-close: dropping it (or the process holding it
/// exiting) ends every assigned process.
pub struct JobGuard {
    handle: HANDLE,
}

// SAFETY: Job Object handles are thread-safe kernel objects.
#[allow(unsafe_code)]
unsafe impl Send for JobGuard {}
// SAFETY: as above; the handle is only read after construction.
#[allow(unsafe_code)]
unsafe impl Sync for JobGuard {}

impl JobGuard {
    /// Create an unnamed Job Object with kill-on-close.
    ///
    /// # Errors
    /// Returns the OS error if the job cannot be created or configured.
    #[allow(unsafe_code)]
    pub fn new(breakaway: Breakaway) -> Result<Self> {
        // SAFETY: null name and null security attributes create an unnamed
        // job object; a null return is checked below.
        let handle = unsafe { CreateJobObjectW(std::ptr::null(), std::ptr::null()) };
        anyhow::ensure!(
            !handle.is_null(),
            "CreateJobObjectW failed: {}",
            io::Error::last_os_error()
        );

        // SAFETY: a zeroed limit structure is its documented empty value.
        let mut info: JOBOBJECT_EXTENDED_LIMIT_INFORMATION = unsafe { std::mem::zeroed() };
        info.BasicLimitInformation.LimitFlags = match breakaway {
            Breakaway::Allowed => {
                JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE | JOB_OBJECT_LIMIT_BREAKAWAY_OK
            }
            Breakaway::Refused => JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE,
        };
        let size = u32::try_from(std::mem::size_of::<JOBOBJECT_EXTENDED_LIMIT_INFORMATION>())
            .context("job limit structure size")?;
        // SAFETY: a valid job handle and a correctly sized limit structure.
        let ok = unsafe {
            SetInformationJobObject(
                handle,
                JobObjectExtendedLimitInformation,
                (&raw const info).cast(),
                size,
            )
        };
        if ok == 0 {
            let err = io::Error::last_os_error();
            // SAFETY: closing the handle created above.
            unsafe { CloseHandle(handle) };
            return Err(err).context("SetInformationJobObject failed (kill-on-close)");
        }
        Ok(Self { handle })
    }

    /// Put a process (by its handle) in this job.
    ///
    /// # Errors
    /// Returns the OS error if the process cannot be assigned.
    #[allow(unsafe_code)]
    pub fn assign(&self, process: RawHandle, pid: u32) -> Result<()> {
        // SAFETY: both handles are valid — the job from `new`, the process
        // from a live child the caller holds.
        let ok = unsafe { AssignProcessToJobObject(self.handle, process as HANDLE) };
        anyhow::ensure!(
            ok != 0,
            "AssignProcessToJobObject failed (pid {pid}): {}",
            io::Error::last_os_error()
        );
        Ok(())
    }
}

impl Drop for JobGuard {
    #[allow(unsafe_code)]
    fn drop(&mut self) {
        // SAFETY: closing our own valid handle; kill-on-close then ends every
        // assigned process.
        unsafe { CloseHandle(self.handle) };
    }
}
