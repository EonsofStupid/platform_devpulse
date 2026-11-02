//! The supervised `AgentHub` executable. No listener, database or login store.

use std::path::PathBuf;
use std::time::Duration;

use anyhow::{Context, Result, bail};
use devpulse_agenthub::history::History;
use devpulse_agenthub::protocol::{self, Hello, Reply, Request};

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_writer(std::io::stderr)
        .with_ansi(false)
        .init();
    let data_dir = data_dir()?;
    let mut input = tokio::io::stdin();
    let mut output = tokio::io::stdout();
    tokio::time::timeout(Duration::from_secs(15), async {
        let hello: Hello = protocol::read(&mut input)
            .await?
            .context("parent disconnected before handshake")?;
        hello.verify()?;
        protocol::write(&mut output, &Hello::default()).await
    })
    .await
    .context("AgentHub parent handshake timed out")??;
    let history = History::new(data_dir);
    tracing::info!(target: "agenthub", pid = std::process::id(), "runtime ready");
    while let Some(request) = protocol::read(&mut input).await? {
        let result = match request {
            Request::Sessions => history.sessions().await.map(Reply::Sessions),
            Request::Page {
                provider_id,
                locator,
                cursor,
            } => history
                .page(provider_id, locator, cursor)
                .await
                .map(Reply::Page),
        };
        let reply = result.unwrap_or_else(|error| Reply::Error(format!("{error:#}")));
        protocol::write(&mut output, &reply).await?;
    }
    tracing::info!(target: "agenthub", "parent closed the connection; runtime stopped");
    Ok(())
}

fn data_dir() -> Result<PathBuf> {
    let mut args = std::env::args_os().skip(1);
    if args.next().as_deref() != Some(std::ffi::OsStr::new("--data-dir")) {
        bail!("AgentHub must be started by DevPulse with --data-dir");
    }
    let path = PathBuf::from(args.next().context("missing AgentHub data directory")?);
    if !path.is_absolute() || args.next().is_some() {
        bail!("AgentHub requires one absolute data directory");
    }
    Ok(path)
}
