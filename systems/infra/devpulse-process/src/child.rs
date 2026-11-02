//! A long-lived child process `DevPulse` supervises — a runtime such as the
//! Surreal server (plan 0007 Part S, S2a).
//!
//! - No console window (`DevPulse` is a GUI app).
//! - Its own process group, so a graceful stop reaches it and only it
//!   ([`crate::stop`]).
//! - On Windows its own Job Object with kill-on-close: a forced stop ends it
//!   and everything it started, and it cannot outlive `DevPulse` however
//!   `DevPulse` ends (the job's handle closes with `DevPulse`).
//! - Every line it prints goes to the caller's sink, which decides where it
//!   lands (the kernel sends it into tracing and lifecycle events).
//! - Its exit is noticed: [`SupervisedChild::exited`] answers at any time,
//!   so a crash during startup is seen at once rather than after a timeout.
//!
//! The process is assigned to its job right after it starts. A runtime that
//! started its own children in that first instant would leave them outside
//! the job; the runtimes `DevPulse` supervises do not.

use std::path::PathBuf;
use std::process::{ExitStatus, Stdio};
use std::sync::Arc;

use anyhow::{Context, Result};
use tokio::io::{AsyncBufReadExt, AsyncRead, BufReader};

/// Which output stream a line came from.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Stream {
    /// Standard output.
    Stdout,
    /// Standard error.
    Stderr,
}

/// Receives each line the child prints (without its line ending).
pub type LineSink = Arc<dyn Fn(Stream, &str) + Send + Sync>;

/// What to start.
#[derive(Debug, Clone, Default)]
pub struct ChildSpec {
    /// A short name for logs, e.g. `surreal`.
    pub name: String,
    /// The program.
    pub program: PathBuf,
    /// Its arguments.
    pub args: Vec<String>,
    /// Environment variables added to the inherited environment.
    pub env: Vec<(String, String)>,
    /// Its working folder; the caller's own when `None`.
    pub dir: Option<PathBuf>,
}

/// A running child under supervision.
pub struct SupervisedChild {
    pub(crate) name: String,
    pub(crate) pid: u32,
    pub(crate) child: tokio::process::Child,
    /// The child's own kill-on-close job (Windows).
    #[cfg(windows)]
    pub(crate) job: crate::job::JobGuard,
}

impl std::fmt::Debug for SupervisedChild {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("SupervisedChild")
            .field("name", &self.name)
            .field("pid", &self.pid)
            .finish_non_exhaustive()
    }
}

impl SupervisedChild {
    /// Start `spec`, handing every output line to `lines`.
    ///
    /// # Errors
    /// Returns an error naming the program if it cannot be started, or (on
    /// Windows) put in the job; in that case the process is ended again.
    pub fn spawn(spec: &ChildSpec, lines: LineSink) -> Result<Self> {
        let mut child = Self::start(spec, Stdio::null())?;
        if let Some(out) = child.child.stdout.take() {
            forward(out, Stream::Stdout, Arc::clone(&lines));
        }
        if let Some(err) = child.child.stderr.take() {
            forward(err, Stream::Stderr, lines);
        }
        Ok(child)
    }

    /// Start a protocol peer. The caller owns stdin/stdout; only stderr is
    /// forwarded to the log sink. Dropping the supervisor still ends the
    /// child even when the caller retains a pipe.
    ///
    /// # Errors
    /// As [`Self::spawn`], or if a requested pipe is unavailable.
    pub fn spawn_piped(
        spec: &ChildSpec,
        lines: LineSink,
    ) -> Result<(
        Self,
        tokio::process::ChildStdin,
        tokio::process::ChildStdout,
    )> {
        let mut child = Self::start(spec, Stdio::piped())?;
        let input = child
            .child
            .stdin
            .take()
            .context("child stdin unavailable")?;
        let output = child
            .child
            .stdout
            .take()
            .context("child stdout unavailable")?;
        if let Some(err) = child.child.stderr.take() {
            forward(err, Stream::Stderr, lines);
        }
        Ok((child, input, output))
    }

    fn start(spec: &ChildSpec, input: Stdio) -> Result<Self> {
        let mut cmd = tokio::process::Command::new(&spec.program);
        cmd.args(&spec.args)
            .stdin(input)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .kill_on_drop(true);
        if let Some(dir) = &spec.dir {
            cmd.current_dir(dir);
        }
        for (key, value) in &spec.env {
            cmd.env(key, value);
        }
        #[cfg(windows)]
        {
            const CREATE_NEW_PROCESS_GROUP: u32 = 0x0000_0200;
            const CREATE_NO_WINDOW: u32 = 0x0800_0000;
            // Its own process group, so Ctrl-Break reaches it alone. With a
            // console of our own (a dev build) it shares that console, so the
            // signal can be sent; without one (a release build) it gets a
            // hidden console of its own, and no window flashes up.
            let flags = if crate::stop::console::attached() {
                CREATE_NEW_PROCESS_GROUP
            } else {
                CREATE_NO_WINDOW | CREATE_NEW_PROCESS_GROUP
            };
            cmd.creation_flags(flags);
        }
        #[cfg(unix)]
        {
            cmd.process_group(0);
        }

        #[cfg(windows)]
        let job = crate::job::JobGuard::new(crate::job::Breakaway::Refused)
            .with_context(|| format!("create the job for {}", spec.name))?;

        let child = cmd
            .spawn()
            .with_context(|| format!("start {} ({})", spec.name, spec.program.display()))?;
        #[cfg(windows)]
        let mut child = child;
        let pid = child
            .id()
            .with_context(|| format!("{} exited before it could be watched", spec.name))?;

        #[cfg(windows)]
        {
            let joined = child
                .raw_handle()
                .context("the child has no process handle")
                .and_then(|handle| job.assign(handle, pid));
            if let Err(e) = joined {
                let _ = child.start_kill();
                return Err(e).with_context(|| format!("supervise {}", spec.name));
            }
        }

        Ok(Self {
            name: spec.name.clone(),
            pid,
            child,
            #[cfg(windows)]
            job,
        })
    }

    /// The process id.
    #[must_use]
    pub fn pid(&self) -> u32 {
        self.pid
    }

    /// The name it was started under.
    #[must_use]
    pub fn name(&self) -> &str {
        &self.name
    }

    /// `Some(status)` once it has exited — how a crash is noticed.
    ///
    /// # Errors
    /// Returns the OS error if its state cannot be read.
    pub fn exited(&mut self) -> Result<Option<ExitStatus>> {
        self.child
            .try_wait()
            .with_context(|| format!("read the state of {}", self.name))
    }

    /// Wait until it exits.
    ///
    /// # Errors
    /// Returns the OS error if waiting fails.
    pub async fn wait(&mut self) -> Result<ExitStatus> {
        self.child
            .wait()
            .await
            .with_context(|| format!("wait for {}", self.name))
    }

    /// End it now, without asking — it and everything it started (its job on
    /// Windows, its process group on Unix). The forced half of a stop.
    ///
    /// # Errors
    /// Returns the OS error if it cannot be ended or waited for.
    pub async fn kill(&mut self) -> Result<ExitStatus> {
        if let Some(status) = self.exited()? {
            return Ok(status);
        }
        #[cfg(windows)]
        self.job
            .terminate()
            .with_context(|| format!("end {}", self.name))?;
        #[cfg(unix)]
        crate::stop::signal_group(self.pid, crate::stop::Signal::Kill)
            .with_context(|| format!("end {}", self.name))?;
        self.wait().await
    }
}

/// Hand each line of `reader` to `lines` until the stream closes. Bytes that
/// are not UTF-8 are replaced rather than ending the stream.
fn forward<R>(reader: R, stream: Stream, lines: LineSink)
where
    R: AsyncRead + Unpin + Send + 'static,
{
    devpulse_telemetry::spawn(async move {
        let mut reader = BufReader::new(reader);
        let mut buf = Vec::new();
        loop {
            buf.clear();
            match reader.read_until(b'\n', &mut buf).await {
                Ok(0) | Err(_) => break,
                Ok(_) => {
                    let line = String::from_utf8_lossy(&buf);
                    lines(stream, line.trim_end_matches(['\r', '\n']));
                }
            }
        }
    });
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;
    use std::sync::Mutex;
    use std::time::Duration;

    /// Every line a test child printed, in order.
    type Seen = Arc<Mutex<Vec<(Stream, String)>>>;

    fn collecting() -> (LineSink, Seen) {
        let seen = Arc::new(Mutex::new(Vec::new()));
        let sink_seen = Arc::clone(&seen);
        let sink: LineSink = Arc::new(move |stream, line| {
            sink_seen.lock().unwrap().push((stream, line.to_owned()));
        });
        (sink, seen)
    }

    /// A child that prints one line on each stream and exits with code 3.
    fn chatty() -> ChildSpec {
        #[cfg(windows)]
        let (program, args) = ("cmd", vec!["/c", "echo one& echo two 1>&2& exit 3"]);
        #[cfg(unix)]
        let (program, args) = ("sh", vec!["-c", "echo one; echo two >&2; exit 3"]);
        ChildSpec {
            name: "chatty".into(),
            program: program.into(),
            args: args.into_iter().map(str::to_owned).collect(),
            ..ChildSpec::default()
        }
    }

    /// A child that runs until it is ended.
    fn long() -> ChildSpec {
        #[cfg(windows)]
        let (program, args) = ("ping", vec!["-n", "60", "127.0.0.1"]);
        #[cfg(unix)]
        let (program, args) = ("sleep", vec!["60"]);
        ChildSpec {
            name: "long".into(),
            program: program.into(),
            args: args.into_iter().map(str::to_owned).collect(),
            ..ChildSpec::default()
        }
    }

    #[tokio::test]
    async fn lines_reach_the_sink_and_the_exit_is_noticed() {
        let (sink, seen) = collecting();
        let mut child = SupervisedChild::spawn(&chatty(), sink).expect("starts");
        assert!(child.pid() > 0);
        let status = child.wait().await.expect("exits");
        assert_eq!(status.code(), Some(3));
        assert_eq!(
            child.exited().expect("state").map(|s| s.code()),
            Some(Some(3))
        );

        // The readers finish just after the exit.
        for _ in 0..40 {
            if seen.lock().unwrap().len() >= 2 {
                break;
            }
            tokio::time::sleep(Duration::from_millis(50)).await;
        }
        let seen = seen.lock().unwrap().clone();
        assert!(
            seen.contains(&(Stream::Stdout, "one".into())),
            "stdout line: {seen:?}"
        );
        assert!(
            seen.iter()
                .any(|(s, l)| *s == Stream::Stderr && l.trim() == "two"),
            "stderr line: {seen:?}"
        );
    }

    #[tokio::test]
    async fn a_running_child_is_running_until_it_is_ended() {
        let (sink, _) = collecting();
        let mut child = SupervisedChild::spawn(&long(), sink).expect("starts");
        assert!(child.exited().expect("state").is_none(), "still running");
        let status = tokio::time::timeout(Duration::from_secs(10), child.kill())
            .await
            .expect("ends in time")
            .expect("ends");
        assert!(!status.success(), "ended, not finished: {status:?}");
        assert!(child.exited().expect("state").is_some());
    }

    #[tokio::test]
    async fn a_missing_program_is_an_error_that_names_it() {
        let (sink, _) = collecting();
        let spec = ChildSpec {
            name: "ghost".into(),
            program: "devpulse-no-such-program-7c2e".into(),
            ..ChildSpec::default()
        };
        let err = SupervisedChild::spawn(&spec, sink).expect_err("not installed");
        assert!(format!("{err:#}").contains("ghost"), "{err:#}");
    }

    #[tokio::test]
    async fn protocol_pipes_are_private_and_eof_stops_the_peer() {
        use tokio::io::AsyncWriteExt;

        #[cfg(windows)]
        let (program, args) = (
            "powershell",
            vec![
                "-NoProfile",
                "-NonInteractive",
                "-Command",
                "[Console]::Error.WriteLine('log'); while ($null -ne ($line = [Console]::ReadLine())) { [Console]::WriteLine($line) }",
            ],
        );
        #[cfg(unix)]
        let (program, args) = (
            "sh",
            vec![
                "-c",
                "echo log >&2; while IFS= read -r line; do printf '%s\\n' \"$line\"; done",
            ],
        );
        let spec = ChildSpec {
            name: "protocol".into(),
            program: program.into(),
            args: args.into_iter().map(str::to_owned).collect(),
            ..ChildSpec::default()
        };
        let (sink, seen) = collecting();
        let (mut child, mut input, output) =
            SupervisedChild::spawn_piped(&spec, sink).expect("starts");
        input.write_all(b"private payload\n").await.expect("write");
        input.flush().await.expect("flush");
        let mut output = BufReader::new(output).lines();
        assert_eq!(
            tokio::time::timeout(Duration::from_secs(10), output.next_line())
                .await
                .expect("response in time")
                .expect("read"),
            Some("private payload".into())
        );
        drop(input);
        assert!(
            tokio::time::timeout(Duration::from_secs(10), child.wait())
                .await
                .expect("EOF ends peer")
                .expect("exit")
                .success()
        );
        for _ in 0..40 {
            if !seen.lock().unwrap().is_empty() {
                break;
            }
            tokio::time::sleep(Duration::from_millis(25)).await;
        }
        assert_eq!(*seen.lock().unwrap(), vec![(Stream::Stderr, "log".into())]);
    }
}
