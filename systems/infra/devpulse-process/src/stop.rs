//! Stopping a supervised child: gracefully first, forced only after repeated
//! checks show no progress (plan 0007 Part S, S2b).
//!
//! The owner's rule (R-G19): "WHEN I CLOSE APP IT WILL PROPERLY END ALL OF THE
//! SERVICES AND CLEAR THE PROCESSES RUNNING FIRST GRACEFULLY THEN FORCED AFTER
//! TWO ATTEMPTS … YOU DO 3 CHECKS IF NO PROGRESS ON THE THIRD CHECK OVER 30
//! SECONDS". [`StopPolicy::default`] is exactly that: up to two graceful
//! requests, three checks spread over thirty seconds, then forced.
//!
//! A graceful request is Ctrl-Break to the child's own process group on
//! Windows (servers such as Surreal treat it as a clean shutdown) and SIGTERM
//! to its process group on Unix. A forced stop ends the child and everything
//! it started ([`SupervisedChild::kill`]). When a graceful request cannot be
//! sent at all, the stop says why and forces at once instead of waiting out a
//! request that never left.

use std::process::ExitStatus;
use std::time::{Duration, Instant};

use anyhow::Result;

use crate::child::SupervisedChild;

/// How a stop proceeds.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct StopPolicy {
    /// Graceful requests before forcing ("forced after two attempts").
    pub graceful_attempts: u32,
    /// Checks for progress ("3 checks").
    pub checks: u32,
    /// The time those checks are spread over ("over 30 seconds").
    pub window: Duration,
}

impl Default for StopPolicy {
    /// The owner's rule: two graceful attempts, three checks, thirty seconds.
    fn default() -> Self {
        Self {
            graceful_attempts: 2,
            checks: 3,
            window: Duration::from_secs(30),
        }
    }
}

/// How the child ended.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StopKind {
    /// It had already exited.
    AlreadyExited,
    /// It exited after a graceful request.
    Graceful,
    /// It was ended without asking.
    Forced,
}

/// The outcome of a stop.
#[derive(Debug)]
pub struct Stopped {
    /// How it ended.
    pub kind: StopKind,
    /// Its exit status.
    pub status: ExitStatus,
    /// How long the stop took.
    pub elapsed: Duration,
    /// Why no graceful request could be sent, when none could.
    pub graceful_unavailable: Option<String>,
}

impl SupervisedChild {
    /// Stop it by `policy`: graceful requests and checks, then forced.
    ///
    /// # Errors
    /// Returns the OS error if its state cannot be read or it cannot be ended.
    pub async fn stop(&mut self, policy: StopPolicy) -> Result<Stopped> {
        let started = Instant::now();
        let outcome = |kind, status, graceful_unavailable| Stopped {
            kind,
            status,
            elapsed: started.elapsed(),
            graceful_unavailable,
        };
        if let Some(status) = self.exited()? {
            return Ok(outcome(StopKind::AlreadyExited, status, None));
        }

        let checks = policy.checks.max(1);
        let interval = policy.window / checks;
        let mut sent = 0;
        for _ in 0..checks {
            if sent < policy.graceful_attempts {
                if let Err(e) = request_stop(self.pid) {
                    // Nothing was asked of it, so waiting would gain nothing.
                    let status = self.kill().await?;
                    return Ok(outcome(StopKind::Forced, status, Some(format!("{e:#}"))));
                }
                sent += 1;
            }
            if let Some(status) = self.exited_within(interval).await? {
                return Ok(outcome(StopKind::Graceful, status, None));
            }
        }
        let status = self.kill().await?;
        Ok(outcome(StopKind::Forced, status, None))
    }

    /// Its exit status if it exits within `limit`, checked every 100 ms.
    async fn exited_within(&mut self, limit: Duration) -> Result<Option<ExitStatus>> {
        let deadline = Instant::now() + limit;
        loop {
            if let Some(status) = self.exited()? {
                return Ok(Some(status));
            }
            let left = deadline.saturating_duration_since(Instant::now());
            if left.is_zero() {
                return Ok(None);
            }
            tokio::time::sleep(left.min(Duration::from_millis(100))).await;
        }
    }
}

/// Ask the child to stop.
fn request_stop(pid: u32) -> Result<()> {
    #[cfg(windows)]
    {
        console::send_break(pid)
    }
    #[cfg(unix)]
    {
        signal_group(pid, Signal::Terminate)
    }
}

/// Ctrl-Break to a child's process group.
///
/// Console control events reach only processes on the sender's console.
/// With a console of our own, the child shares it ([`attached`] decides the
/// spawn flags) and the event goes straight to its group. Without one, the
/// child has a hidden console of its own: we attach to it for the moment it
/// takes, under a lock, since a process holds one console at a time.
#[cfg(windows)]
pub(crate) mod console {
    use std::io;
    use std::sync::Mutex;

    use anyhow::Result;
    use windows_sys::Win32::System::Console::{
        AttachConsole, FreeConsole, GenerateConsoleCtrlEvent, GetConsoleProcessList,
        CTRL_BREAK_EVENT,
    };

    /// One console attachment at a time, process-wide.
    static ATTACH: Mutex<()> = Mutex::new(());

    /// Whether this process has a console.
    #[allow(unsafe_code)]
    pub(crate) fn attached() -> bool {
        let mut first = [0u32; 1];
        // SAFETY: a one-element buffer and its length; the call only writes
        // within it and returns how many processes share the console (0 when
        // there is no console).
        unsafe { GetConsoleProcessList(first.as_mut_ptr(), 1) != 0 }
    }

    /// Send Ctrl-Break to the process group `pid` leads.
    #[allow(unsafe_code)]
    pub(crate) fn send_break(pid: u32) -> Result<()> {
        let _one = ATTACH
            .lock()
            .unwrap_or_else(std::sync::PoisonError::into_inner);
        if attached() {
            // SAFETY: plain call; the group id is the child's pid.
            let ok = unsafe { GenerateConsoleCtrlEvent(CTRL_BREAK_EVENT, pid) };
            anyhow::ensure!(
                ok != 0,
                "Ctrl-Break to {pid} failed: {}",
                io::Error::last_os_error()
            );
            return Ok(());
        }
        // SAFETY: attaching to the console of a live process.
        let ok = unsafe { AttachConsole(pid) };
        anyhow::ensure!(
            ok != 0,
            "attach to the console of {pid} failed: {}",
            io::Error::last_os_error()
        );
        // SAFETY: as above; we share its console now.
        let sent = unsafe { GenerateConsoleCtrlEvent(CTRL_BREAK_EVENT, pid) };
        let err = io::Error::last_os_error();
        // SAFETY: leaving the console attached just above.
        unsafe { FreeConsole() };
        anyhow::ensure!(sent != 0, "Ctrl-Break to {pid} failed: {err}");
        Ok(())
    }
}

/// A signal to a whole process group.
#[cfg(unix)]
#[derive(Debug, Clone, Copy)]
pub(crate) enum Signal {
    /// SIGTERM — please stop.
    Terminate,
    /// SIGKILL — stop now.
    Kill,
}

/// Send `signal` to the process group `pid` leads.
#[cfg(unix)]
#[allow(unsafe_code)]
pub(crate) fn signal_group(pid: u32, signal: Signal) -> Result<()> {
    let group = libc::pid_t::try_from(pid)?;
    let signal = match signal {
        Signal::Terminate => libc::SIGTERM,
        Signal::Kill => libc::SIGKILL,
    };
    // SAFETY: plain syscall on a process group we created at spawn.
    let ok = unsafe { libc::killpg(group, signal) };
    anyhow::ensure!(
        ok == 0,
        "signal to group {group} failed: {}",
        std::io::Error::last_os_error()
    );
    Ok(())
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;
    use crate::child::{ChildSpec, LineSink};
    use std::sync::Arc;

    fn quiet() -> LineSink {
        Arc::new(|_, _| {})
    }

    fn spec(name: &str, program: &str, args: &[&str]) -> ChildSpec {
        ChildSpec {
            name: name.into(),
            program: program.into(),
            args: args.iter().map(|a| (*a).to_owned()).collect(),
            ..ChildSpec::default()
        }
    }

    /// Short enough for a test, same shape as the owner's rule.
    fn quick() -> StopPolicy {
        StopPolicy {
            graceful_attempts: 2,
            checks: 3,
            window: Duration::from_secs(6),
        }
    }

    /// A child that exits on a graceful request: this test binary itself,
    /// running only the ignored `sleeper` below (it installs no handler, so
    /// Ctrl-Break ends it) — on Unix, `sleep`, which SIGTERM ends.
    fn polite() -> ChildSpec {
        #[cfg(windows)]
        {
            let exe = std::env::current_exe().expect("test binary");
            let mut s = spec(
                "polite",
                "",
                &[
                    "stop::tests::sleeper",
                    "--exact",
                    "--ignored",
                    "--nocapture",
                ],
            );
            s.program = exe;
            s
        }
        #[cfg(unix)]
        {
            spec("polite", "sleep", &["60"])
        }
    }

    /// A child that ignores a graceful request: `ping` prints its statistics
    /// on Ctrl-Break and carries on; on Unix, a loop that ignores SIGTERM.
    fn stubborn() -> ChildSpec {
        #[cfg(windows)]
        {
            spec("stubborn", "ping", &["-n", "120", "127.0.0.1"])
        }
        #[cfg(unix)]
        {
            spec(
                "stubborn",
                "sh",
                &["-c", "trap '' TERM; while :; do sleep 1; done"],
            )
        }
    }

    #[test]
    #[ignore = "helper: the child the graceful test starts"]
    fn sleeper() {
        std::thread::sleep(Duration::from_secs(60));
    }

    #[test]
    fn the_default_is_the_owners_rule() {
        assert_eq!(
            StopPolicy::default(),
            StopPolicy {
                graceful_attempts: 2,
                checks: 3,
                window: Duration::from_secs(30)
            }
        );
    }

    #[tokio::test]
    async fn a_child_that_listens_stops_gracefully() {
        let mut child = SupervisedChild::spawn(&polite(), quiet()).expect("starts");
        tokio::time::sleep(Duration::from_millis(300)).await;
        let stopped = child.stop(quick()).await.expect("stops");
        assert_eq!(stopped.kind, StopKind::Graceful, "{stopped:?}");
        assert!(stopped.elapsed < Duration::from_secs(2), "{stopped:?}");
    }

    /// A release build has no console: the request goes by attaching to the
    /// child's hidden console. Run alone — it drops this process's console:
    /// `cargo test -p devpulse-process -- --ignored --exact
    /// stop::tests::without_a_console_the_request_still_lands`.
    #[cfg(windows)]
    #[tokio::test]
    #[ignore = "run alone: drops this process's console to take the release path"]
    #[allow(unsafe_code)]
    async fn without_a_console_the_request_still_lands() {
        // SAFETY: detaching this test process from its console, on purpose.
        unsafe { windows_sys::Win32::System::Console::FreeConsole() };
        assert!(!console::attached(), "the console was dropped");
        let mut child = SupervisedChild::spawn(&polite(), quiet()).expect("starts");
        tokio::time::sleep(Duration::from_millis(300)).await;
        let stopped = child.stop(quick()).await.expect("stops");
        assert_eq!(stopped.kind, StopKind::Graceful, "{stopped:?}");
    }

    #[tokio::test]
    async fn a_child_that_ignores_it_is_forced_after_the_checks() {
        let mut child = SupervisedChild::spawn(&stubborn(), quiet()).expect("starts");
        tokio::time::sleep(Duration::from_millis(300)).await;
        let stopped = child.stop(quick()).await.expect("stops");
        assert_eq!(stopped.kind, StopKind::Forced, "{stopped:?}");
        assert!(stopped.graceful_unavailable.is_none(), "{stopped:?}");
        assert!(
            stopped.elapsed >= Duration::from_secs(5),
            "forced only after the checks: {stopped:?}"
        );
        assert!(child.exited().expect("state").is_some());
    }

    #[tokio::test]
    async fn a_child_that_already_exited_says_so() {
        #[cfg(windows)]
        let s = spec("done", "cmd", &["/c", "exit 0"]);
        #[cfg(unix)]
        let s = spec("done", "true", &[]);
        let mut child = SupervisedChild::spawn(&s, quiet()).expect("starts");
        child.wait().await.expect("exits");
        let stopped = child.stop(quick()).await.expect("stops");
        assert_eq!(stopped.kind, StopKind::AlreadyExited);
    }
}
