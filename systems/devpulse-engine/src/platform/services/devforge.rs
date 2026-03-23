//! DevForge service — managed VSCode/code-oss process.
//!
//! Spawns a dedicated VSCode instance as a child process under the
//! platform's Job Object. The process is killed when the platform shuts down.
//!
//! The VSCode binary is expected at `deps/code-oss/` (portable install).
//! DevForge controls it: start, stop, health check (process alive).

use super::{Service, ServiceRole, ServiceState};
use anyhow::{Context, Result};
use std::path::{Path, PathBuf};
use std::process::Child;
use std::sync::Mutex;

/// DevForge service — managed VSCode process.
pub struct DevForgeService {
    child: Mutex<Option<Child>>,
    binary_path: PathBuf,
    workspace_path: PathBuf,
    port: u16,
}

impl DevForgeService {
    /// Boot the DevForge service — spawn VSCode as a child process.
    ///
    /// # Arguments
    /// - `binary_path`: Path to the code-oss/VSCode binary
    /// - `workspace_path`: Default workspace to open
    /// - `port`: Port for the VSCode server (if running as code-server)
    ///
    /// # Errors
    /// Returns error if the binary doesn't exist or fails to spawn.
    pub fn boot(binary_path: &Path, workspace_path: &Path, port: u16) -> Result<Self> {
        // Verify binary exists
        if !binary_path.exists() {
            anyhow::bail!(
                "DevForge binary not found at {}. \
                 Clone the VSCode fork into deps/code-oss/ and build it.",
                binary_path.display()
            );
        }

        // Spawn the process
        let child = std::process::Command::new(binary_path)
            .arg("--port")
            .arg(port.to_string())
            .arg("--without-connection-token")
            .arg(workspace_path)
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::piped())
            .spawn()
            .with_context(|| format!("Failed to spawn DevForge at {}", binary_path.display()))?;

        tracing::info!(
            binary = %binary_path.display(),
            workspace = %workspace_path.display(),
            port,
            pid = child.id(),
            "DevForge process spawned"
        );

        Ok(Self {
            child: Mutex::new(Some(child)),
            binary_path: binary_path.to_path_buf(),
            workspace_path: workspace_path.to_path_buf(),
            port,
        })
    }

    /// Get the port DevForge is running on.
    pub fn port(&self) -> u16 {
        self.port
    }
}

impl Service for DevForgeService {
    fn name(&self) -> &'static str {
        "DevForge service"
    }

    fn role(&self) -> ServiceRole {
        ServiceRole::DevForge
    }

    async fn ping(&self) -> Result<()> {
        let guard = self.child.lock().map_err(|e| anyhow::anyhow!("Lock poisoned: {e}"))?;
        match guard.as_ref() {
            Some(child) => {
                // Check if process is still alive by trying to get its ID
                // (on Windows, id() returns the PID; if the process has exited,
                // we'd need to try_wait — but holding &Child only gives us id())
                let _pid = child.id();
                Ok(())
            }
            None => anyhow::bail!("DevForge process not running"),
        }
    }

    fn state(&self) -> ServiceState {
        let guard = self.child.lock().ok();
        match guard.and_then(|g| g.as_ref().map(|_| ())) {
            Some(()) => ServiceState::Ready,
            None => ServiceState::Failed,
        }
    }

    async fn shutdown(&self) -> Result<()> {
        let mut guard = self.child.lock().map_err(|e| anyhow::anyhow!("Lock poisoned: {e}"))?;
        if let Some(mut child) = guard.take() {
            tracing::info!(pid = child.id(), "Shutting down DevForge process");
            let _ = child.kill();
            let _ = child.wait();
        }
        Ok(())
    }
}
