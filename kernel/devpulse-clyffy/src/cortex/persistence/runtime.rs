//! A runtime `DevPulse` starts and keeps — a built binary in a supervised
//! subprocess, reached over its network address (plan 0007 phase 4; Part S,
//! S3).
//!
//! Re-authored from the April `SurrealLifecycle` (`251b0a52^`) and the
//! [`super::ollama`] adapter that copied it, onto `devpulse-process`:
//!
//! - **Port.** The configured port, bumped past a foreign listener
//!   ([`port_alloc`]). A runtime here owns its data, so it never attaches to
//!   a server it did not start: an occupied port is always someone else's.
//! - **Process.** Its own job (Windows) or process group (Unix), no console
//!   window; every line it prints reaches the caller's events; its exit is
//!   seen at once.
//! - **Ready.** An HTTP `GET` on its ready path answering 2xx. A child that
//!   exits while starting fails the start immediately, with its last lines;
//!   one that never answers is stopped after the startup timeout.
//! - **Crash.** The watchdog restarts it with backoff, up to the crash-loop
//!   cap within the window; past that it stays down and says why.
//! - **Stop.** Graceful first, forced only after the owner's checks
//!   (`devpulse_process::StopPolicy`, R-G19).

use std::collections::VecDeque;
use std::path::PathBuf;
use std::sync::{Arc, Mutex, PoisonError};
use std::time::{Duration, Instant, SystemTime};

use anyhow::{Context, Result, anyhow, bail};
use devpulse_process::{ChildSpec, LineSink, StopPolicy, Stopped, Stream, SupervisedChild};

use super::port_alloc::{self, PortAllocation};

/// Replaced by the port the runtime gets, in its arguments and environment.
pub const PORT: &str = "{port}";

/// How many of the child's last output lines a failure quotes.
const RECENT_LINES: usize = 20;

/// How often the watchdog looks at a running child.
const WATCH_INTERVAL: Duration = Duration::from_millis(500);

/// What to run and how to keep it.
#[derive(Debug, Clone)]
pub struct RuntimeSpec {
    /// A short name for logs and events, e.g. `surreal`.
    pub name: String,
    /// The built binary.
    pub program: PathBuf,
    /// Its arguments; [`PORT`] is replaced by the port it gets.
    pub args: Vec<String>,
    /// Environment added to the inherited one; [`PORT`] is replaced too.
    pub env: Vec<(String, String)>,
    /// Its working folder; the caller's own when `None`.
    pub dir: Option<PathBuf>,
    /// The address it listens on, e.g. `127.0.0.1`.
    pub host: String,
    /// The configured port.
    pub port: u16,
    /// How far past the configured port to look for a free one.
    pub max_bumps: u16,
    /// The path that answers 2xx once it is ready, e.g. `/health`.
    pub ready_path: String,
    /// How long it may take to become ready.
    pub startup_timeout: Duration,
    /// How crashes are handled.
    pub restart: RestartPolicy,
    /// How a stop proceeds.
    pub stop: StopPolicy,
}

/// How crashes are handled.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RestartPolicy {
    /// Restarts allowed within [`Self::window`] before it stays down.
    pub max_restarts: u32,
    /// The window the restarts are counted in.
    pub window: Duration,
    /// The wait before the first restart; it doubles each time.
    pub first_backoff: Duration,
    /// The longest wait between restarts.
    pub max_backoff: Duration,
}

impl Default for RestartPolicy {
    fn default() -> Self {
        Self {
            max_restarts: 5,
            window: Duration::from_secs(300),
            first_backoff: Duration::from_secs(1),
            max_backoff: Duration::from_secs(30),
        }
    }
}

/// Where the runtime stands.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RuntimeState {
    /// Starting and not yet answering.
    Starting,
    /// Answering on its address.
    Ready,
    /// It crashed; this is restart number `attempt` in the current window.
    Restarting {
        /// The restart count within the window.
        attempt: u32,
    },
    /// Stopped on request.
    Stopped,
    /// Down and staying down.
    Failed {
        /// Why.
        reason: String,
    },
}

/// What the runtime reports while it runs.
#[derive(Debug, Clone)]
pub enum RuntimeEvent {
    /// A line it printed.
    Line {
        /// The stream it came from.
        stream: Stream,
        /// The line.
        text: String,
    },
    /// Its state changed.
    State(RuntimeState),
}

/// Receives every [`RuntimeEvent`].
pub type RuntimeEvents = Arc<dyn Fn(&RuntimeEvent) + Send + Sync>;

/// A running (or stopped) runtime.
pub struct Runtime {
    spec: RuntimeSpec,
    events: RuntimeEvents,
    http: reqwest::Client,
    inner: Mutex<Inner>,
    recent: Arc<Mutex<VecDeque<String>>>,
}

#[derive(Default)]
struct Inner {
    child: Option<SupervisedChild>,
    allocation: Option<PortAllocation>,
    state: Option<RuntimeState>,
    stopping: bool,
    /// Restarts after a crash, over its whole life.
    restarts: u32,
    /// When it last started answering.
    ready_at: Option<SystemTime>,
}

impl std::fmt::Debug for Runtime {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Runtime")
            .field("name", &self.spec.name)
            .field("state", &self.state())
            .finish_non_exhaustive()
    }
}

impl Runtime {
    /// Start `spec` and wait until it answers.
    ///
    /// # Errors
    /// Returns an error naming the runtime if no port is free, it cannot be
    /// started, it exits while starting (with its last lines), or it does not
    /// answer within the startup timeout (it is stopped first).
    pub async fn start(spec: RuntimeSpec, events: RuntimeEvents) -> Result<Arc<Self>> {
        let http = reqwest::Client::builder()
            .timeout(Duration::from_secs(5))
            .build()
            .context("build the runtime's HTTP client")?;
        let runtime = Arc::new(Self {
            spec,
            events,
            http,
            inner: Mutex::new(Inner::default()),
            recent: Arc::new(Mutex::new(VecDeque::with_capacity(RECENT_LINES))),
        });
        runtime.launch().await?;
        Ok(runtime)
    }

    /// Its address, e.g. `http://127.0.0.1:8822`; `None` before it has a port.
    #[must_use]
    pub fn endpoint(&self) -> Option<String> {
        self.allocation()
            .map(|a| format!("http://{}:{}", self.spec.host, a.actual))
    }

    /// The port it was given: configured, actual, bumps.
    #[must_use]
    pub fn allocation(&self) -> Option<PortAllocation> {
        self.lock().allocation
    }

    /// Where it stands.
    #[must_use]
    pub fn state(&self) -> RuntimeState {
        self.lock().state.clone().unwrap_or(RuntimeState::Starting)
    }

    /// The process id, while it runs.
    #[must_use]
    pub fn pid(&self) -> Option<u32> {
        self.lock().child.as_ref().map(SupervisedChild::pid)
    }

    /// How many times it was restarted after a crash, over its whole life.
    #[must_use]
    pub fn restarts(&self) -> u32 {
        self.lock().restarts
    }

    /// When it last started answering; `None` while it is not answering.
    #[must_use]
    pub fn ready_since(&self) -> Option<SystemTime> {
        let inner = self.lock();
        match inner.state {
            Some(RuntimeState::Ready) => inner.ready_at,
            _ => None,
        }
    }

    /// The spec it runs.
    #[must_use]
    pub fn spec(&self) -> &RuntimeSpec {
        &self.spec
    }

    /// Keep it running: restart it when it crashes, by its restart policy.
    /// The watch ends when it is stopped or has failed for good.
    pub fn watch(self: &Arc<Self>) {
        let me = Arc::clone(self);
        devpulse_telemetry::spawn(async move { me.watchdog().await });
    }

    /// Stop it: graceful first, forced after the checks.
    ///
    /// # Errors
    /// Returns the OS error if it cannot be stopped.
    pub async fn stop(&self) -> Result<Option<Stopped>> {
        let child = {
            let mut inner = self.lock();
            inner.stopping = true;
            inner.child.take()
        };
        let stopped = match child {
            Some(mut child) => Some(child.stop(self.spec.stop).await?),
            None => None,
        };
        self.set_state(RuntimeState::Stopped);
        Ok(stopped)
    }

    async fn launch(&self) -> Result<()> {
        self.set_state(RuntimeState::Starting);
        let name = self.spec.name.clone();
        // Every occupied port belongs to someone else: never attach.
        let allocation = port_alloc::allocate(
            &self.spec.host,
            self.spec.port,
            self.spec.max_bumps,
            |_port| async { Err(anyhow!("a runtime that owns its data never attaches")) },
        )
        .await
        .with_context(|| format!("find a port for {name}"))?;
        let port = allocation.actual.to_string();

        let recent = Arc::clone(&self.recent);
        let events = Arc::clone(&self.events);
        let sink: LineSink = Arc::new(move |stream, line| {
            {
                let mut recent = recent.lock().unwrap_or_else(PoisonError::into_inner);
                if recent.len() == RECENT_LINES {
                    recent.pop_front();
                }
                recent.push_back(line.to_owned());
            }
            events(&RuntimeEvent::Line {
                stream,
                text: line.to_owned(),
            });
        });
        let child = SupervisedChild::spawn(
            &ChildSpec {
                name: name.clone(),
                program: self.spec.program.clone(),
                args: self
                    .spec
                    .args
                    .iter()
                    .map(|a| a.replace(PORT, &port))
                    .collect(),
                env: self
                    .spec
                    .env
                    .iter()
                    .map(|(k, v)| (k.clone(), v.replace(PORT, &port)))
                    .collect(),
                dir: self.spec.dir.clone(),
            },
            sink,
        )?;
        {
            let mut inner = self.lock();
            inner.child = Some(child);
            inner.allocation = Some(allocation);
        }
        tracing::info!(
            target: "runtime",
            runtime = %name,
            configured = allocation.configured,
            actual = allocation.actual,
            bumps = allocation.bumps,
            "started; waiting until it answers"
        );

        if let Err(e) = self.wait_ready(allocation.actual).await {
            let child = self.lock().child.take();
            if let Some(mut child) = child {
                let _ = child.kill().await;
            }
            let reason = format!("{e:#}");
            self.set_state(RuntimeState::Failed {
                reason: reason.clone(),
            });
            bail!("{reason}");
        }
        self.lock().ready_at = Some(SystemTime::now());
        self.set_state(RuntimeState::Ready);
        Ok(())
    }

    async fn wait_ready(&self, port: u16) -> Result<()> {
        let url = format!("http://{}:{port}{}", self.spec.host, self.spec.ready_path);
        let deadline = Instant::now() + self.spec.startup_timeout;
        loop {
            if let Some(status) = self.exited()? {
                bail!(
                    "{} exited while starting ({status}){}",
                    self.spec.name,
                    self.last_lines()
                );
            }
            let answered = matches!(
                self.http.get(&url).send().await,
                Ok(answer) if answer.status().is_success()
            );
            // Only its own answer counts: one that comes after it exited is
            // from something else on the port, and the next pass reports the
            // exit.
            if answered && self.exited()?.is_none() {
                return Ok(());
            }
            if Instant::now() >= deadline {
                bail!(
                    "{} did not answer {url} within {}s{}",
                    self.spec.name,
                    self.spec.startup_timeout.as_secs(),
                    self.last_lines()
                );
            }
            tokio::time::sleep(Duration::from_millis(250)).await;
        }
    }

    async fn watchdog(self: Arc<Self>) {
        let mut crashes: VecDeque<Instant> = VecDeque::new();
        let mut backoff = self.spec.restart.first_backoff;
        loop {
            tokio::time::sleep(WATCH_INTERVAL).await;
            if self.lock().stopping {
                return;
            }
            let status = match self.exited() {
                Ok(Some(status)) => status,
                Ok(None) => continue,
                Err(e) => {
                    tracing::warn!(target: "runtime", runtime = %self.spec.name, error = %format!("{e:#}"), "cannot read the child's state");
                    continue;
                }
            };
            if matches!(self.state(), RuntimeState::Failed { .. }) {
                return;
            }
            let now = Instant::now();
            while crashes
                .front()
                .is_some_and(|t| now.duration_since(*t) > self.spec.restart.window)
            {
                crashes.pop_front();
            }
            crashes.push_back(now);
            let attempt = u32::try_from(crashes.len()).unwrap_or(u32::MAX);
            tracing::warn!(target: "runtime", runtime = %self.spec.name, %status, attempt, "exited unexpectedly");
            if attempt > self.spec.restart.max_restarts {
                let reason = format!(
                    "{} crashed {attempt} times within {}s; it stays down until it is started again{}",
                    self.spec.name,
                    self.spec.restart.window.as_secs(),
                    self.last_lines()
                );
                self.lock().child = None;
                self.set_state(RuntimeState::Failed { reason });
                return;
            }
            self.lock().restarts += 1;
            self.set_state(RuntimeState::Restarting { attempt });
            tokio::time::sleep(backoff).await;
            backoff = (backoff * 2).min(self.spec.restart.max_backoff);
            if self.lock().stopping {
                return;
            }
            if let Err(e) = self.launch().await {
                tracing::warn!(target: "runtime", runtime = %self.spec.name, error = %format!("{e:#}"), "restart failed");
            } else {
                backoff = self.spec.restart.first_backoff;
            }
        }
    }

    fn exited(&self) -> Result<Option<std::process::ExitStatus>> {
        match self.lock().child.as_mut() {
            Some(child) => child.exited(),
            None => Ok(None),
        }
    }

    fn last_lines(&self) -> String {
        let recent = self.recent.lock().unwrap_or_else(PoisonError::into_inner);
        if recent.is_empty() {
            return String::new();
        }
        let lines: Vec<&str> = recent.iter().map(String::as_str).collect();
        format!("; its last lines:\n{}", lines.join("\n"))
    }

    fn set_state(&self, state: RuntimeState) {
        self.lock().state = Some(state.clone());
        tracing::info!(target: "runtime", runtime = %self.spec.name, ?state, "state");
        (self.events)(&RuntimeEvent::State(state));
    }

    fn lock(&self) -> std::sync::MutexGuard<'_, Inner> {
        self.inner.lock().unwrap_or_else(PoisonError::into_inner)
    }
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;
    use std::io::{Read, Write};

    /// Serves `HTTP/1.1 200` on `DEVPULSE_TEST_HTTP_PORT`; exits after
    /// `DEVPULSE_TEST_EXIT_AFTER_MS` when set. Run as a child by the tests.
    #[test]
    #[ignore = "helper: the runtime the tests start"]
    fn http_helper() {
        let port: u16 = std::env::var("DEVPULSE_TEST_HTTP_PORT")
            .expect("port")
            .parse()
            .expect("number");
        if let Ok(ms) = std::env::var("DEVPULSE_TEST_EXIT_AFTER_MS") {
            let ms: u64 = ms.parse().expect("number");
            std::thread::spawn(move || {
                std::thread::sleep(Duration::from_millis(ms));
                std::process::exit(3);
            });
        }
        println!("listening on {port}");
        let listener = std::net::TcpListener::bind(("127.0.0.1", port)).expect("bind");
        for stream in listener.incoming() {
            let Ok(mut stream) = stream else { continue };
            let mut buf = [0u8; 1024];
            let _ = stream.read(&mut buf);
            let _ = stream
                .write_all(b"HTTP/1.1 200 OK\r\nContent-Length: 2\r\nConnection: close\r\n\r\nok");
        }
    }

    /// The tests pick ports from the OS and start servers on them; run in
    /// parallel, one test's server lands on the port another just picked.
    /// Each test holds this while it uses ports.
    static PORTS: tokio::sync::Mutex<()> = tokio::sync::Mutex::const_new(());

    fn free_port() -> u16 {
        std::net::TcpListener::bind(("127.0.0.1", 0))
            .expect("bind")
            .local_addr()
            .expect("addr")
            .port()
    }

    fn helper(port: u16, exit_after_ms: Option<u64>) -> RuntimeSpec {
        let mut env = vec![("DEVPULSE_TEST_HTTP_PORT".to_owned(), PORT.to_owned())];
        if let Some(ms) = exit_after_ms {
            env.push(("DEVPULSE_TEST_EXIT_AFTER_MS".to_owned(), ms.to_string()));
        }
        RuntimeSpec {
            name: "helper".into(),
            program: std::env::current_exe().expect("test binary"),
            args: [
                "cortex::persistence::runtime::tests::http_helper",
                "--exact",
                "--ignored",
                "--nocapture",
            ]
            .map(str::to_owned)
            .to_vec(),
            env,
            dir: None,
            host: "127.0.0.1".into(),
            port,
            max_bumps: 20,
            ready_path: "/health".into(),
            startup_timeout: Duration::from_secs(20),
            restart: RestartPolicy::default(),
            stop: StopPolicy {
                graceful_attempts: 2,
                checks: 3,
                window: Duration::from_secs(6),
            },
        }
    }

    fn quiet() -> RuntimeEvents {
        Arc::new(|_| {})
    }

    #[tokio::test]
    async fn it_answers_on_its_port_and_stops() {
        let _ports = PORTS.lock().await;
        let port = free_port();
        let runtime = Runtime::start(helper(port, None), quiet())
            .await
            .expect("starts");
        assert_eq!(runtime.state(), RuntimeState::Ready);
        assert!(runtime.ready_since().is_some());
        assert_eq!(runtime.restarts(), 0);
        assert_eq!(
            runtime.endpoint().as_deref(),
            Some(format!("http://127.0.0.1:{port}").as_str())
        );
        let stopped = runtime.stop().await.expect("stops").expect("was running");
        assert_eq!(
            stopped.kind,
            devpulse_process::StopKind::Graceful,
            "{stopped:?}"
        );
        assert_eq!(runtime.state(), RuntimeState::Stopped);
        assert!(runtime.ready_since().is_none());
    }

    #[tokio::test]
    async fn an_occupied_port_is_someone_elses_so_it_bumps() {
        let _ports = PORTS.lock().await;
        let held = std::net::TcpListener::bind(("127.0.0.1", 0)).expect("bind");
        let port = held.local_addr().expect("addr").port();
        let runtime = Runtime::start(helper(port, None), quiet())
            .await
            .expect("starts");
        let allocation = runtime.allocation().expect("allocated");
        assert_eq!(allocation.configured, port);
        assert!(allocation.bumps >= 1, "{allocation:?}");
        assert_ne!(allocation.actual, port);
        runtime.stop().await.expect("stops");
        drop(held);
    }

    #[tokio::test]
    async fn exiting_while_starting_fails_at_once_with_its_lines() {
        let _ports = PORTS.lock().await;
        let mut spec = helper(free_port(), None);
        #[cfg(windows)]
        {
            spec.program = "cmd".into();
            spec.args = ["/c", "echo cannot open the store& exit 7"]
                .map(str::to_owned)
                .to_vec();
        }
        #[cfg(unix)]
        {
            spec.program = "sh".into();
            spec.args = ["-c", "echo cannot open the store; exit 7"]
                .map(str::to_owned)
                .to_vec();
        }
        let started = Instant::now();
        let err = Runtime::start(spec, quiet()).await.expect_err("fails");
        let message = format!("{err:#}");
        assert!(
            started.elapsed() < Duration::from_secs(5),
            "not a timeout: {message}"
        );
        assert!(message.contains("exited while starting"), "{message}");
        assert!(message.contains("cannot open the store"), "{message}");
    }

    #[tokio::test]
    async fn a_child_that_never_answers_is_stopped_after_the_timeout() {
        let _ports = PORTS.lock().await;
        let mut spec = helper(free_port(), None);
        #[cfg(windows)]
        {
            spec.program = "ping".into();
            spec.args = ["-n", "60", "127.0.0.1"].map(str::to_owned).to_vec();
        }
        #[cfg(unix)]
        {
            spec.program = "sleep".into();
            spec.args = vec!["60".to_owned()];
        }
        spec.startup_timeout = Duration::from_secs(2);
        let err = Runtime::start(spec, quiet()).await.expect_err("times out");
        assert!(format!("{err:#}").contains("did not answer"), "{err:#}");
    }

    #[tokio::test]
    async fn a_crash_restarts_it_and_a_crash_loop_keeps_it_down() {
        let _ports = PORTS.lock().await;
        let mut spec = helper(free_port(), Some(1_500));
        spec.restart = RestartPolicy {
            max_restarts: 2,
            window: Duration::from_secs(120),
            first_backoff: Duration::from_millis(100),
            max_backoff: Duration::from_millis(200),
        };
        let seen = Arc::new(Mutex::new(Vec::new()));
        let record = Arc::clone(&seen);
        let events: RuntimeEvents = Arc::new(move |event| {
            if let RuntimeEvent::State(state) = event {
                record.lock().unwrap().push(state.clone());
            }
        });
        let runtime = Runtime::start(spec, events).await.expect("starts");
        runtime.watch();
        for _ in 0..120 {
            if matches!(runtime.state(), RuntimeState::Failed { .. }) {
                break;
            }
            tokio::time::sleep(Duration::from_millis(250)).await;
        }
        let states = seen.lock().unwrap().clone();
        let restarts = states
            .iter()
            .filter(|s| matches!(s, RuntimeState::Restarting { .. }))
            .count();
        assert_eq!(restarts, 2, "{states:?}");
        assert_eq!(runtime.restarts(), 2);
        assert!(runtime.ready_since().is_none(), "down, so not ready");
        assert!(
            matches!(runtime.state(), RuntimeState::Failed { ref reason } if reason.contains("crashed 3 times")),
            "{:?}",
            runtime.state()
        );
    }
}
