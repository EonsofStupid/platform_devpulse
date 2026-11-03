//! The memory's one owner, and the relay that reaches it (plan 0001 B6.2).
//!
//! Turso lets one process hold a database, so a stdio server per session
//! cannot work: the second exits with "File is locked by another process".
//! And stdio is the transport every ACP agent must support, so sessions use
//! it. So the process that owns the database runs a [`Bridge`] on a private
//! local pipe (a named pipe on Windows, a socket only you can open elsewhere;
//! no port), and each vendor's CLI starts this crate's binary, which [`relay`]s
//! its stdio to that pipe.
//!
//! A connection presents a token. The owner maps it to what the [`Grant`] was
//! issued for, so a session's project comes from the owner, never from the
//! caller. Dropping the grant ends the session's connections and refuses new
//! ones.

use std::collections::HashMap;
use std::path::Path;
use std::sync::{Arc, Mutex, MutexGuard, PoisonError};
use std::time::Duration;

use anyhow::{Context, Result, anyhow};
use devpulse_clyffy::providers::ToolServer;
use serde::{Deserialize, Serialize};
use tokio::io::{AsyncBufReadExt, AsyncRead, AsyncReadExt, AsyncWrite, AsyncWriteExt, BufReader};
use tokio::sync::watch;
use tokio_util::task::AbortOnDropHandle;
use uuid::Uuid;

use crate::auth::AuthGate;
use crate::binding::Binding;
use crate::server::Server;
use crate::store::PersonaStore;

/// The variable naming the owner's pipe; set, the binary relays to it.
pub const PIPE_ENV: &str = "DEVPULSE_MEMORY_PIPE";
/// The variable carrying the session's token.
pub const TOKEN_ENV: &str = "DEVPULSE_MEMORY_TOKEN";

/// The binary's name, shipped beside the desktop executable.
pub const EXECUTABLE: &str = if cfg!(windows) {
    "devpulse-persona-mcp.exe"
} else {
    "devpulse-persona-mcp"
};
/// What an agent calls the memory.
pub const TOOL_SERVER_NAME: &str = "devpulse-memory";

/// How long a connection has to present its token.
const HANDSHAKE_WAIT: Duration = Duration::from_secs(5);
/// The most a hello may be: a token, and a little JSON around it.
const HELLO_BYTES: u64 = 512;

#[derive(Serialize, Deserialize)]
struct Hello {
    token: String,
}

#[derive(Serialize, Deserialize)]
struct Welcome {
    ok: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

struct Entry {
    binding: Binding,
    revoked: watch::Receiver<()>,
}

struct Shared {
    store: Arc<PersonaStore>,
    grants: Mutex<HashMap<String, Entry>>,
    handshake_wait: Duration,
}

impl Shared {
    fn grants(&self) -> MutexGuard<'_, HashMap<String, Entry>> {
        self.grants.lock().unwrap_or_else(PoisonError::into_inner)
    }
}

/// The owner's end: listens until dropped.
pub struct Bridge {
    shared: Arc<Shared>,
    address: String,
    _accepting: AbortOnDropHandle<()>,
}

impl Bridge {
    /// Start serving `store` on a new private pipe. Call inside a Tokio
    /// runtime.
    ///
    /// # Errors
    /// When the pipe cannot be created.
    pub fn start(store: Arc<PersonaStore>) -> Result<Self> {
        Self::start_with(store, HANDSHAKE_WAIT)
    }

    fn start_with(store: Arc<PersonaStore>, handshake_wait: Duration) -> Result<Self> {
        let id = Uuid::new_v4().simple().to_string();
        // Short enough for a socket path under a long temp folder.
        let address = transport::address(&id[..16]);
        let listener = transport::Listener::bind(&address)
            .with_context(|| format!("create the memory pipe {address}"))?;
        let shared = Arc::new(Shared {
            store,
            grants: Mutex::new(HashMap::new()),
            handshake_wait,
        });
        let accepting = AbortOnDropHandle::new(devpulse_telemetry::spawn(accept(
            listener,
            Arc::clone(&shared),
        )));
        Ok(Self {
            shared,
            address,
            _accepting: accepting,
        })
    }

    /// Where a relay connects ([`PIPE_ENV`]).
    #[must_use]
    pub fn address(&self) -> &str {
        &self.address
    }

    /// What an agent starts to reach this owner with `grant`: the relay at
    /// `program`.
    #[must_use]
    pub fn tool_server(&self, grant: &Grant, program: &Path) -> ToolServer {
        ToolServer {
            name: TOOL_SERVER_NAME.to_owned(),
            command: program.to_path_buf(),
            args: Vec::new(),
            env: vec![
                (PIPE_ENV.to_owned(), self.address.clone()),
                (TOKEN_ENV.to_owned(), grant.token().to_owned()),
            ],
        }
    }

    /// Let one session in, bound to `project`.
    pub fn grant(&self, project: &str) -> Grant {
        let token = Uuid::new_v4().simple().to_string();
        let (held_by_grant, revoked) = watch::channel(());
        self.shared.grants().insert(
            token.clone(),
            Entry {
                binding: Binding::Project(project.to_owned()),
                revoked,
            },
        );
        Grant {
            token,
            shared: Arc::clone(&self.shared),
            _revoke: held_by_grant,
        }
    }
}

/// One session's way in; dropping it ends the session's connections.
#[must_use = "dropping a grant revokes it"]
pub struct Grant {
    token: String,
    shared: Arc<Shared>,
    _revoke: watch::Sender<()>,
}

impl Grant {
    /// What the session's relay presents ([`TOKEN_ENV`]).
    #[must_use]
    pub fn token(&self) -> &str {
        &self.token
    }
}

impl std::fmt::Debug for Grant {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("Grant(..)")
    }
}

impl Drop for Grant {
    fn drop(&mut self) {
        self.shared.grants().remove(&self.token);
    }
}

async fn accept(mut listener: transport::Listener, shared: Arc<Shared>) {
    // Held here so they end with the bridge.
    let mut connections: Vec<AbortOnDropHandle<()>> = Vec::new();
    loop {
        match listener.accept().await {
            Ok(stream) => {
                connections.retain(|connection| !connection.is_finished());
                connections.push(AbortOnDropHandle::new(devpulse_telemetry::spawn(
                    connection(stream, Arc::clone(&shared)),
                )));
            }
            Err(error) => {
                tracing::warn!(target = "persona_mcp", %error, "memory pipe accept failed");
                tokio::time::sleep(Duration::from_millis(200)).await;
            }
        }
    }
}

async fn connection<S>(stream: S, shared: Arc<Shared>)
where
    S: AsyncRead + AsyncWrite + Send + Unpin + 'static,
{
    let (input, mut output) = tokio::io::split(stream);
    let mut input = BufReader::new(input);
    let Ok(token) = tokio::time::timeout(shared.handshake_wait, read_hello(&mut input)).await
    else {
        tracing::debug!(
            target = "persona_mcp",
            "a memory connection sent no token in time"
        );
        return;
    };
    let admitted = token.and_then(|token| {
        let grants = shared.grants();
        let entry = grants.get(&token)?;
        Some((entry.binding.clone(), entry.revoked.clone()))
    });
    let Some((binding, mut revoked)) = admitted else {
        let refused = Welcome {
            ok: false,
            error: Some("DevPulse did not recognize this session's memory token".to_owned()),
        };
        let _ = send(&mut output, &refused).await;
        return;
    };
    if send(
        &mut output,
        &Welcome {
            ok: true,
            error: None,
        },
    )
    .await
    .is_err()
    {
        return;
    }
    let server = Server::new(Arc::clone(&shared.store), AuthGate::offline()).bound(binding);
    tokio::select! {
        outcome = server.serve(input, output) => {
            if let Err(error) = outcome {
                tracing::debug!(target = "persona_mcp", %error, "a memory connection ended");
            }
        }
        _ = revoked.changed() => {
            tracing::debug!(target = "persona_mcp", "a memory session ended");
        }
    }
}

/// The token in a connection's first line; `None` when it is no hello.
async fn read_hello<R>(input: &mut BufReader<R>) -> Option<String>
where
    R: AsyncRead + Unpin,
{
    let mut line = String::new();
    input.take(HELLO_BYTES).read_line(&mut line).await.ok()?;
    serde_json::from_str::<Hello>(line.trim())
        .ok()
        .map(|hello| hello.token)
}

async fn send<W, T>(output: &mut W, message: &T) -> std::io::Result<()>
where
    W: AsyncWrite + Unpin,
    T: Serialize,
{
    let mut frame = serde_json::to_vec(message)?;
    frame.push(b'\n');
    output.write_all(&frame).await?;
    output.flush().await
}

/// Relay this process's stdio to the owner, until either side ends. Run by
/// the binary when [`PIPE_ENV`] is set.
///
/// # Errors
/// When the owner cannot be reached or refuses `token`, or the relay fails.
pub async fn relay(address: &str, token: &str) -> Result<()> {
    let stream = transport::connect(address)
        .await
        .with_context(|| format!("reach DevPulse's memory at {address}"))?;
    let (input, mut output) = tokio::io::split(stream);
    let mut input = BufReader::new(input);
    let hello = Hello {
        token: token.to_owned(),
    };
    send(&mut output, &hello)
        .await
        .context("present the session's token")?;
    let mut line = String::new();
    tokio::time::timeout(HANDSHAKE_WAIT, input.read_line(&mut line))
        .await
        .context("DevPulse's memory did not answer")?
        .context("read DevPulse's answer")?;
    let welcome: Welcome = serde_json::from_str(line.trim())
        .with_context(|| format!("DevPulse's memory answered {line:?}"))?;
    if !welcome.ok {
        return Err(anyhow!(welcome.error.unwrap_or_else(|| {
            "DevPulse's memory refused this session".to_owned()
        })));
    }
    let mut stdin = tokio::io::stdin();
    let mut stdout = tokio::io::stdout();
    // Whichever side ends first ends the relay: a pipe has no half-close on
    // Windows, so the owner learns of it when this process exits.
    tokio::select! {
        sent = tokio::io::copy(&mut stdin, &mut output) => {
            sent.context("relay to DevPulse's memory")?;
        }
        received = tokio::io::copy(&mut input, &mut stdout) => {
            received.context("relay from DevPulse's memory")?;
        }
    }
    Ok(())
}

#[cfg(windows)]
mod transport {
    use std::io;
    use std::time::Duration;

    use tokio::net::windows::named_pipe::{
        ClientOptions, NamedPipeClient, NamedPipeServer, ServerOptions,
    };

    /// `ERROR_PIPE_BUSY`: every instance is taken, for the moment between the
    /// owner accepting one connection and offering the next instance.
    const PIPE_BUSY: i32 = 231;

    pub(super) fn address(id: &str) -> String {
        format!(r"\\.\pipe\devpulse-memory-{id}")
    }

    pub(super) struct Listener {
        address: String,
        next: NamedPipeServer,
    }

    impl Listener {
        pub(super) fn bind(address: &str) -> io::Result<Self> {
            // Local clients only, and `first_pipe_instance` fails if anyone
            // already holds this name.
            let next = ServerOptions::new()
                .first_pipe_instance(true)
                .reject_remote_clients(true)
                .create(address)?;
            Ok(Self {
                address: address.to_owned(),
                next,
            })
        }

        pub(super) async fn accept(&mut self) -> io::Result<NamedPipeServer> {
            self.next.connect().await?;
            let next = ServerOptions::new()
                .reject_remote_clients(true)
                .create(&self.address)?;
            Ok(std::mem::replace(&mut self.next, next))
        }
    }

    pub(super) async fn connect(address: &str) -> io::Result<NamedPipeClient> {
        for _ in 0..100 {
            match ClientOptions::new().open(address) {
                Err(error) if error.raw_os_error() == Some(PIPE_BUSY) => {
                    tokio::time::sleep(Duration::from_millis(20)).await;
                }
                other => return other,
            }
        }
        ClientOptions::new().open(address)
    }
}

#[cfg(unix)]
mod transport {
    use std::io;
    use std::os::unix::fs::PermissionsExt;
    use std::path::PathBuf;

    use tokio::net::{UnixListener, UnixStream};

    pub(super) fn address(id: &str) -> String {
        std::env::temp_dir()
            .join(format!("devpulse-memory-{id}.sock"))
            .display()
            .to_string()
    }

    pub(super) struct Listener {
        path: PathBuf,
        inner: UnixListener,
    }

    impl Listener {
        pub(super) fn bind(address: &str) -> io::Result<Self> {
            let inner = UnixListener::bind(address)?;
            std::fs::set_permissions(address, std::fs::Permissions::from_mode(0o600))?;
            Ok(Self {
                path: PathBuf::from(address),
                inner,
            })
        }

        pub(super) async fn accept(&mut self) -> io::Result<UnixStream> {
            self.inner.accept().await.map(|(stream, _)| stream)
        }
    }

    impl Drop for Listener {
        fn drop(&mut self) {
            let _ = std::fs::remove_file(&self.path);
        }
    }

    pub(super) async fn connect(address: &str) -> io::Result<UnixStream> {
        UnixStream::connect(address).await
    }
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;

    async fn store() -> (tempfile::TempDir, Arc<PersonaStore>) {
        let dir = tempfile::tempdir().unwrap();
        #[cfg(feature = "rro")]
        let store = PersonaStore::open(&dir.path().join("memory.db"), None)
            .await
            .unwrap();
        #[cfg(not(feature = "rro"))]
        let store = PersonaStore::open(&dir.path().join("memory.db"))
            .await
            .unwrap();
        (dir, store)
    }

    /// The owner's first answer on a raw connection, or `None` if it closed.
    async fn answer<S>(stream: S) -> Option<Welcome>
    where
        S: AsyncRead + Unpin,
    {
        let mut line = String::new();
        BufReader::new(stream).read_line(&mut line).await.ok()?;
        serde_json::from_str(line.trim()).ok()
    }

    #[tokio::test]
    async fn a_silent_connection_is_dropped_and_holds_nothing_up() {
        let (_dir, store) = store().await;
        let bridge = Bridge::start_with(store, Duration::from_millis(100)).unwrap();
        let grant = bridge.grant("alpha");

        let silent = transport::connect(bridge.address()).await.unwrap();

        // A real session gets in while the silent one is still waiting.
        let mut session = transport::connect(bridge.address()).await.unwrap();
        send(
            &mut session,
            &Hello {
                token: grant.token().to_owned(),
            },
        )
        .await
        .unwrap();
        assert!(answer(&mut session).await.expect("an answer").ok);

        // The silent one is closed without being told anything.
        let closed = tokio::time::timeout(Duration::from_secs(5), answer(silent))
            .await
            .expect("closed after the wait");
        assert!(closed.is_none());
    }

    #[tokio::test]
    async fn a_hello_that_is_not_one_is_refused() {
        let (_dir, store) = store().await;
        let bridge = Bridge::start_with(store, Duration::from_secs(5)).unwrap();
        let _grant = bridge.grant("alpha");
        for garbage in [
            b"not json\n".to_vec(),
            b"{\"token\":\"nobody\"}\n".to_vec(),
            // Past the limit, with no line end: the read stops at the limit.
            vec![b'x'; 4096],
        ] {
            let mut stream = transport::connect(bridge.address()).await.unwrap();
            stream.write_all(&garbage).await.unwrap();
            let welcome = answer(&mut stream).await.expect("an answer");
            assert!(!welcome.ok);
            assert!(welcome.error.unwrap().contains("did not recognize"));
        }
    }

    #[tokio::test]
    async fn tokens_are_distinct_and_a_debug_print_hides_them() {
        let (_dir, store) = store().await;
        let bridge = Bridge::start(store).unwrap();
        let (a, b) = (bridge.grant("alpha"), bridge.grant("alpha"));
        assert_ne!(a.token(), b.token());
        assert!(!format!("{a:?}").contains(a.token()));
    }
}
