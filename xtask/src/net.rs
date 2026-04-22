//! Network utilities — cross-platform port management.
//!
//! Vite runs with `strictPort: true` on the port defined in
//! `[services.network.dev_server]` of `platform.default.toml`.
//! If a stale process holds the port from a crashed session, the dev pipeline dies.
//! This module detects and clears port conflicts before launch.

use anyhow::{Context, Result};
use std::net::TcpListener;
use std::process::Command;

use crate::stage::Stage;

// Port is now config-driven — read from [services.network.dev_server] in platform.default.toml.
// No hardcoded constant. Callers pass the port from PlatformConfig.

/// Check if a TCP port is free by probing both IPv4 and IPv6 loopback.
///
/// Returns `true` only if BOTH binds succeed — Vite/Node may bind either.
pub fn port_is_free(port: u16) -> bool {
    TcpListener::bind(("127.0.0.1", port)).is_ok() && TcpListener::bind(("::1", port)).is_ok()
}

/// Ensure a port is free before launching the dev server.
///
/// If occupied, kills the stale process and verifies release.
pub fn ensure_port_free(port: u16) -> Result<()> {
    let stage = Stage::start("port check");

    if port_is_free(port) {
        stage.ok_with(format!(":{port} free"));
        return Ok(());
    }

    stage.warn(format!(":{port} occupied, clearing..."));

    let killed = kill_port(port)?;
    if killed {
        // Brief pause for OS to release the socket.
        std::thread::sleep(std::time::Duration::from_millis(300));
    }

    anyhow::ensure!(
        port_is_free(port),
        "port {port} still occupied after kill — close it manually"
    );

    let confirm = Stage::start("port cleared");
    confirm.ok_with(format!(":{port}"));
    Ok(())
}

/// Kill whatever process holds `port`. Returns `true` if something was killed.
fn kill_port(port: u16) -> Result<bool> {
    #[cfg(windows)]
    {
        kill_port_windows(port)
    }

    #[cfg(not(windows))]
    {
        kill_port_unix(port)
    }
}

/// Windows: `netstat -ano` → parse PID from LISTENING line → `taskkill /F /PID`.
#[cfg(windows)]
fn kill_port_windows(port: u16) -> Result<bool> {
    let output = Command::new("netstat")
        .args(["-ano"])
        .output()
        .context("failed to run netstat")?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let suffix = format!(":{port}");
    let mut killed = false;

    for line in stdout.lines() {
        if !line.contains("LISTENING") {
            continue;
        }

        // netstat columns: Proto  LocalAddress  ForeignAddress  State  PID
        let cols: Vec<&str> = line.split_whitespace().collect();
        if cols.len() < 5 {
            continue;
        }

        // Match exact port suffix — prevents :14200 matching :1420.
        let local_addr = cols[1];
        if !local_addr.ends_with(&suffix) {
            continue;
        }

        let pid = cols[4];
        if pid.is_empty() || pid.chars().any(|c| !c.is_ascii_digit()) {
            continue;
        }

        println!("  [>>] killing PID {pid} on :{port}");
        let kill = Command::new("taskkill")
            .args(["/F", "/PID", pid])
            .output()
            .context("failed to run taskkill")?;

        if kill.status.success() {
            killed = true;
        } else {
            let stderr = String::from_utf8_lossy(&kill.stderr);
            eprintln!("  [!!] taskkill PID {pid}: {}", stderr.trim());
        }
    }

    Ok(killed)
}

/// Unix: `lsof -ti :{port}` → `kill -9 {pid}`.
#[cfg(not(windows))]
fn kill_port_unix(port: u16) -> Result<bool> {
    let output = Command::new("lsof")
        .args(["-ti", &format!(":{port}")])
        .output()
        .context("failed to run lsof")?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut killed = false;

    for pid in stdout.lines() {
        let pid = pid.trim();
        if pid.is_empty() {
            continue;
        }

        println!("  [>>] killing PID {pid} on :{port}");
        let kill = Command::new("kill")
            .args(["-9", pid])
            .output()
            .context("failed to run kill")?;

        if kill.status.success() {
            killed = true;
        }
    }

    Ok(killed)
}
