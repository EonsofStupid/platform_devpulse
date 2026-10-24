//! A long-lived child process `DevPulse` supervises — a runtime such as the
//! Surreal server (plan 0007 Part S, S2a).
//!
//! - No console window (`DevPulse` is a GUI app).
//! - On Windows it is put in one process-wide Job Object with kill-on-close,
//!   so it cannot outlive `DevPulse` however `DevPulse` ends. On Unix it gets
//!   its own process group, so a stop reaches what it started.
//! - Every line it prints goes to the caller's sink, which decides where it
//!   lands (the kernel sends it into tracing and lifecycle events).
//! - Its exit is noticed: [`SupervisedChild::exited`] answers at any time,
//!   so a crash during startup is seen at once rather than after a timeout.
//!
//! The process is assigned to the job right after it starts. A runtime that
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
#[derive(Debug)]
pub struct SupervisedChild {
    name: String,
    pid: u32,
    child: tokio::process::Child,
}

impl SupervisedChild {
    /// Start `spec`, handing every output line to `lines`.
    ///
    /// # Errors
    /// Returns an error naming the program if it cannot be started, or (on
    /// Windows) put in the job; in that case the process is ended again.
    pub fn spawn(spec: &ChildSpec, lines: LineSink) -> Result<Self> {
        let mut cmd = tokio::process::Command::new(&spec.program);
        cmd.args(&spec.args)
            .stdin(Stdio::null())
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
            // No console window flashes up from a GUI app.
            const CREATE_NO_WINDOW: u32 = 0x0800_0000;
            cmd.creation_flags(CREATE_NO_WINDOW);
        }
        #[cfg(unix)]
        {
            cmd.process_group(0);
        }

        let mut child = cmd
            .spawn()
            .with_context(|| format!("start {} ({})", spec.name, spec.program.display()))?;
        let pid = child
            .id()
            .with_context(|| format!("{} exited before it could be watched", spec.name))?;

        #[cfg(windows)]
        {
            let joined = child
                .raw_handle()
                .context("the child has no process handle")
                .and_then(|handle| runtime_job()?.assign(handle, pid));
            if let Err(e) = joined {
                let _ = child.start_kill();
                return Err(e).with_context(|| format!("supervise {}", spec.name));
            }
        }

        if let Some(out) = child.stdout.take() {
            forward(out, Stream::Stdout, Arc::clone(&lines));
        }
        if let Some(err) = child.stderr.take() {
            forward(err, Stream::Stderr, lines);
        }
        Ok(Self {
            name: spec.name.clone(),
            pid,
            child,
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

    /// End it now, without asking — the forced half of a stop.
    ///
    /// # Errors
    /// Returns the OS error if it cannot be ended or waited for.
    pub async fn kill(&mut self) -> Result<ExitStatus> {
        if let Some(status) = self.exited()? {
            return Ok(status);
        }
        self.child
            .start_kill()
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

/// The one Job Object every supervised child joins. It is never dropped, so
/// its handle closes only when `DevPulse` exits — and then the OS ends every
/// child in it.
#[cfg(windows)]
fn runtime_job() -> Result<&'static crate::job::JobGuard> {
    use crate::job::{Breakaway, JobGuard};
    use std::sync::OnceLock;

    static JOB: OnceLock<std::result::Result<JobGuard, String>> = OnceLock::new();
    JOB.get_or_init(|| JobGuard::new(Breakaway::Refused).map_err(|e| format!("{e:#}")))
        .as_ref()
        .map_err(|e| anyhow::anyhow!("the process job is unavailable: {e}"))
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
}
