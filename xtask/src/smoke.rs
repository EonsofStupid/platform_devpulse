//! Post-build smoke test — launch the compiled exe and confirm it
//! actually boots past the platform Services stage.
//!
//! # What "passing" means
//!
//! A pass means `http://127.0.0.1:8822/health` answered with a body
//! containing `"status":"healthy"` within the timeout. That port is the
//! SurrealDB engine HTTP surface and it only comes up after the boot
//! pipeline clears system relational → system analytics → graph. If the
//! :8822 answer is healthy, the frontend mount path executed and the
//! desktop backend survived IPC bring-up — black-screen regressions
//! surface as a timeout here instead of at the user's desk.
//!
//! # Why raw TCP instead of a crate like `ureq`
//!
//! xtask already carries `cargo_metadata`, `uuid`, `serde_json`, and
//! friends. Adding a HTTP client for one GET is bloat. Raw TCP with
//! `HTTP/1.0` (no chunked body, no keep-alive, server closes the
//! socket after writing the response) reads to EOF in one pass and
//! gives us the body we need. If the smoke test ever needs HTTPS or
//! headers we can swap then.
//!
//! # Why not `--smoke-test-mode` in the app
//!
//! Intentionally tests the REAL boot path. A dedicated mode would
//! bypass exactly the slot that broke last time (e.g. the IPC bindings
//! loading in the renderer).

use anyhow::{Context, Result};
use std::io::{Read, Write};
use std::net::TcpStream;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::thread;
use std::time::{Duration, Instant};

/// Maximum time to wait for the app to boot before giving up.
/// Cold first-run on a fresh install can take ~60s depending on disk.
const SMOKE_TIMEOUT: Duration = Duration::from_secs(90);
/// Gap between health probes. 500 ms keeps CPU use negligible while
/// catching a healthy signal within a quarter-second of it landing.
const PROBE_INTERVAL: Duration = Duration::from_millis(500);
/// Per-probe TCP connect + read timeout. Short enough that probes during
/// early boot (before the port is listening) don't stall the whole loop.
const PROBE_TIMEOUT: Duration = Duration::from_secs(2);
/// Health endpoint. Kept as a constant so a future endpoint rename is a
/// single-line change.
const HEALTH_HOST: &str = "127.0.0.1";
const HEALTH_PORT: u16 = 8822;
const HEALTH_PATH: &str = "/health";

/// Outcome of a smoke run. `Healthy` is the only pass.
#[derive(Debug)]
pub enum SmokeResult {
	Healthy {
		elapsed: Duration,
		body_snippet: String,
	},
	Unhealthy {
		elapsed: Duration,
		last_body: String,
	},
	Timeout {
		elapsed: Duration,
		last_error: String,
	},
}

impl SmokeResult {
	/// True when the run passed — used by callers to decide whether to
	/// quarantine artifacts or keep them.
	pub const fn is_healthy(&self) -> bool {
		matches!(self, Self::Healthy { .. })
	}

	/// Short one-line summary for logs + stage event `detail`.
	pub fn summary(&self) -> String {
		match self {
			Self::Healthy { elapsed, body_snippet } => {
				format!("healthy in {:.1}s: {}", elapsed.as_secs_f64(), body_snippet)
			}
			Self::Unhealthy { elapsed, last_body } => {
				format!(
					"unhealthy after {:.1}s: {}",
					elapsed.as_secs_f64(),
					truncate(last_body, 160)
				)
			}
			Self::Timeout { elapsed, last_error } => format!(
				"timeout after {:.1}s (last error: {})",
				elapsed.as_secs_f64(),
				truncate(last_error, 160)
			),
		}
	}
}

/// Launch `exe`, poll `:8822/health`, kill the child, return the verdict.
///
/// The child is spawned with null stdio so it does not pollute the
/// xtask transcript. Killing uses `Child::kill()` on the direct child.
/// For a deeper teardown (subprocesses that broke away), rely on the
/// `JobGuard` the caller already holds in `build_release.rs`.
pub fn run_smoke(exe: &Path) -> Result<SmokeResult> {
	if !exe.exists() {
		anyhow::bail!("smoke target does not exist: {}", exe.display());
	}

	let start = Instant::now();
	let mut child = spawn_detached(exe)
		.with_context(|| format!("failed to spawn smoke target {}", exe.display()))?;

	let result = poll_until_healthy(&mut child, start);

	// Always attempt to stop the child, even if polling returned an error —
	// leaving a rogue copy running would block the next smoke or the next
	// build (port :8822 already bound).
	let _ = child.kill();
	let _ = child.wait();

	result
}

fn spawn_detached(exe: &Path) -> Result<Child> {
	// CWD = exe dir so the launched binary resolves relative paths
	// (`.userdata/`, `models/`, `binaries/`) the same way a user would.
	let cwd: PathBuf = exe.parent().map(Path::to_path_buf).unwrap_or_default();
	let child = Command::new(exe)
		.current_dir(&cwd)
		.stdin(Stdio::null())
		.stdout(Stdio::null())
		.stderr(Stdio::null())
		.spawn()?;
	Ok(child)
}

fn poll_until_healthy(child: &mut Child, start: Instant) -> Result<SmokeResult> {
	let mut last_error = String::from("no probe attempted");
	let mut last_body = String::new();

	while start.elapsed() < SMOKE_TIMEOUT {
		// If the child died before answering, no point polling any longer.
		if let Ok(Some(status)) = child.try_wait() {
			anyhow::bail!(
				"smoke target exited before health probe succeeded (status={})",
				status
					.code()
					.map_or_else(|| "signal".to_string(), |c| c.to_string())
			);
		}

		match probe_health() {
			Ok(body) => {
				if body.contains("\"status\":\"healthy\"") {
					return Ok(SmokeResult::Healthy {
						elapsed: start.elapsed(),
						body_snippet: truncate(body.trim(), 120),
					});
				}
				last_body = body;
			}
			Err(e) => {
				last_error = e.to_string();
			}
		}

		thread::sleep(PROBE_INTERVAL);
	}

	if !last_body.is_empty() {
		Ok(SmokeResult::Unhealthy {
			elapsed: start.elapsed(),
			last_body,
		})
	} else {
		Ok(SmokeResult::Timeout {
			elapsed: start.elapsed(),
			last_error,
		})
	}
}

fn probe_health() -> Result<String> {
	let mut stream = TcpStream::connect_timeout(
		&format!("{HEALTH_HOST}:{HEALTH_PORT}")
			.parse()
			.context("health host/port failed to parse")?,
		PROBE_TIMEOUT,
	)
	.with_context(|| format!("tcp connect failed to {HEALTH_HOST}:{HEALTH_PORT}"))?;

	stream.set_read_timeout(Some(PROBE_TIMEOUT))?;
	stream.set_write_timeout(Some(PROBE_TIMEOUT))?;

	let request = format!(
		"GET {HEALTH_PATH} HTTP/1.0\r\nHost: {HEALTH_HOST}\r\nConnection: close\r\n\r\n"
	);
	stream.write_all(request.as_bytes())?;

	let mut buf = Vec::with_capacity(512);
	stream.read_to_end(&mut buf)?;
	let raw = String::from_utf8_lossy(&buf).into_owned();

	// Separate headers from body on the blank line. If no body was seen,
	// return the whole response so the summary can show what came back.
	let body = raw.split_once("\r\n\r\n").map_or(raw.clone(), |(_, b)| b.to_string());
	Ok(body)
}

fn truncate(s: &str, max: usize) -> String {
	if s.chars().count() <= max {
		return s.to_string();
	}
	let mut out: String = s.chars().take(max).collect();
	out.push('…');
	out
}

#[cfg(test)]
mod tests {
	use super::*;

	#[test]
	fn truncate_short_returns_input() {
		assert_eq!(truncate("hello", 10), "hello");
	}

	#[test]
	fn truncate_long_appends_ellipsis() {
		let out = truncate("abcdefghij", 4);
		assert_eq!(out, "abcd…");
	}

	#[test]
	fn summary_healthy_formats_elapsed_and_body() {
		let r = SmokeResult::Healthy {
			elapsed: Duration::from_millis(1500),
			body_snippet: "{\"status\":\"healthy\",\"engine\":\"surrealkv\"}".to_string(),
		};
		let s = r.summary();
		assert!(s.contains("healthy in"));
		assert!(s.contains("surrealkv"));
		assert!(r.is_healthy());
	}

	#[test]
	fn summary_timeout_is_not_healthy() {
		let r = SmokeResult::Timeout {
			elapsed: Duration::from_secs(90),
			last_error: "connect refused".to_string(),
		};
		assert!(!r.is_healthy());
		assert!(r.summary().contains("timeout"));
	}

	#[test]
	fn summary_unhealthy_is_not_healthy() {
		let r = SmokeResult::Unhealthy {
			elapsed: Duration::from_secs(10),
			last_body: "{\"status\":\"booting\"}".to_string(),
		};
		assert!(!r.is_healthy());
		assert!(r.summary().contains("unhealthy"));
	}
}
