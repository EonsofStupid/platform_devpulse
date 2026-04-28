//! Post-build smoke test — launch the compiled exe and confirm it
//! actually boots past the platform Services stage.
//!
//! # What "passing" means
//!
//! A pass means `http://127.0.0.1:8822/health` answered with `HTTP/1.1
//! 200 OK` AND a `surreal-version:` response header, within the timeout.
//! That port is the SurrealDB sidecar HTTP surface; it only comes up
//! after the boot pipeline clears system relational → system analytics
//! → graph. The 200 status confirms the sidecar bound and is serving;
//! the `surreal-version:` header rules out any other process holding
//! the port (orphans from prior runs, dev servers, etc.). Black-screen
//! regressions on the engine side surface as a timeout here instead
//! of at the user's desk.
//!
//! Note: this gate validates the SurrealDB sidecar specifically, not
//! the renderer. A passing smoke means the engine + IPC bring-up
//! survived as far as the graph stage; whether the Tauri window
//! actually mounted is not asserted by this probe.
//!
//! # Why HTTP 200 + identity header (not body content)
//!
//! SurrealDB 3.x `/health` returns `200 OK` with `Content-Length: 0`
//! by design — the status code is the contract, not a JSON body.
//! Earlier revisions of this file searched the body for
//! `"status":"healthy"`, which never matched a 3.x server and turned
//! every passing build into a timeout. Status code + identity header
//! is what the kernel itself relies on
//! (`SurrealLifecycle::ping → reqwest error_for_status`).
//!
//! # Why raw TCP instead of a crate like `ureq`
//!
//! xtask already carries `cargo_metadata`, `uuid`, `serde_json`, and
//! friends. Adding an HTTP client for one GET is bloat. Raw TCP +
//! `Connection: close` reads the response in one pass, with a hard
//! cap on bytes so a misbehaving server cannot stall a probe past
//! [`PROBE_TIMEOUT`]. If smoke ever needs HTTPS or richer headers we
//! can swap then.
//!
//! # Why not `--smoke-test-mode` in the app
//!
//! Intentionally tests the REAL boot path. A dedicated mode would
//! bypass exactly the slot that broke last time (e.g. the IPC bindings
//! loading in the renderer).

use anyhow::Result;
use std::io::{Read, Write};
use std::net::{SocketAddr, TcpStream};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::thread;
use std::time::{Duration, Instant};

/// Maximum time to wait for the app to boot before giving up.
/// Cold first-run on a fresh install can take ~60s depending on disk
/// and RocksDB initialization. 90s leaves head-room for slow CI hosts
/// and HDD-backed dev boxes.
const SMOKE_TIMEOUT: Duration = Duration::from_secs(90);
/// Gap between health probes. 500 ms keeps CPU use negligible while
/// catching a healthy signal within a quarter-second of it landing.
const PROBE_INTERVAL: Duration = Duration::from_millis(500);
/// Per-probe TCP connect + read timeout. Short enough that probes
/// during early boot (before the port is listening) don't stall the
/// whole loop.
const PROBE_TIMEOUT: Duration = Duration::from_secs(2);
/// Hard cap on bytes read per probe. SurrealDB headers fit in ~300 B;
/// 8 KiB is generous and bounds the pathological-server case where
/// `Connection: close` is ignored and the read would otherwise block
/// until [`PROBE_TIMEOUT`].
const PROBE_READ_CAP: usize = 8 * 1024;
/// Health endpoint host. Loopback is the only contract — the smoke
/// gate is a build-machine check, not a network test.
const HEALTH_HOST: &str = "127.0.0.1";
/// Default Surreal sidecar port from `config/platform/network.toml`.
/// If the port allocator bumps past 8822 (foreign listener already
/// holding it), this probe will miss the actual sidecar and the smoke
/// times out — that case is rare on a build host and the timeout is
/// the correct outcome (build host should have a clean port).
const HEALTH_PORT: u16 = 8822;
/// Surreal HTTP health path.
const HEALTH_PATH: &str = "/health";
/// Identifying response header. SurrealDB sets this on every reply
/// (`surreal-version: surrealdb/<semver>`). Used as the identity
/// check so a stray process holding `:8822` cannot pass smoke.
const IDENTITY_HEADER: &str = "surreal-version";

/// Outcome of a smoke run. `Healthy` is the only pass.
#[derive(Debug)]
pub enum SmokeResult {
	Healthy {
		elapsed: Duration,
		/// What we observed: status code + identifying header value.
		/// Goes into the build-event `detail` so logs show the real
		/// signal (e.g. `HTTP 200 surreal-version=surrealdb/3.0.5`).
		signal: String,
	},
	Unhealthy {
		elapsed: Duration,
		/// First few non-empty lines of the unexpected response —
		/// status line + headers, joined with " | " for log readability.
		response_snippet: String,
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
			Self::Healthy { elapsed, signal } => {
				format!("healthy in {:.1}s: {}", elapsed.as_secs_f64(), signal)
			}
			Self::Unhealthy { elapsed, response_snippet } => format!(
				"unhealthy after {:.1}s: {}",
				elapsed.as_secs_f64(),
				truncate(response_snippet, 200)
			),
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
/// For deeper teardown (subprocesses that broke away — surreal.exe is
/// the known case because the desktop app spawns it via tokio
/// `kill_on_drop`, which only fires when the parent's drop runs, and
/// `TerminateProcess` skips drop), rely on the `JobGuard` the caller
/// holds in `build_release.rs`.
pub fn run_smoke(exe: &Path) -> Result<SmokeResult> {
	if !exe.exists() {
		anyhow::bail!("smoke target does not exist: {}", exe.display());
	}

	let start = Instant::now();
	let mut child = spawn_detached(exe).map_err(|e| {
		anyhow::anyhow!("failed to spawn smoke target {}: {e}", exe.display())
	})?;

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
	let mut last_response: Option<String> = None;

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
			ProbeOutcome::Healthy { signal } => {
				return Ok(SmokeResult::Healthy {
					elapsed: start.elapsed(),
					signal,
				});
			}
			ProbeOutcome::Unexpected { snippet } => {
				// Probe reached the server. Replace any stale
				// connect-refused diagnosis with the actual response
				// snippet — without this reset, a Timeout fallback
				// would carry an "early-boot connect refused" error
				// that hasn't been the live failure mode for 60s.
				// That stale error masked SurrealDB 3.x's empty-body
				// `/health` for the entire build-release cycle.
				last_error = format!(
					"probe connected but response did not match contract: {}",
					truncate(&snippet, 160)
				);
				last_response = Some(snippet);
			}
			ProbeOutcome::Error(e) => {
				last_error = e;
			}
		}

		thread::sleep(PROBE_INTERVAL);
	}

	if let Some(snippet) = last_response {
		Ok(SmokeResult::Unhealthy {
			elapsed: start.elapsed(),
			response_snippet: snippet,
		})
	} else {
		Ok(SmokeResult::Timeout {
			elapsed: start.elapsed(),
			last_error,
		})
	}
}

/// Outcome of a single probe attempt.
#[derive(Debug)]
enum ProbeOutcome {
	/// `:8822/health` returned 200 with the SurrealDB identity header.
	Healthy { signal: String },
	/// We connected and read a response but it did not match the
	/// `200 + surreal-version` contract. Snippet is the first few
	/// lines of the response for the build-event log.
	Unexpected { snippet: String },
	/// Connect failed, write failed, or read errored before any bytes
	/// arrived. Carries the formatted error chain.
	Error(String),
}

fn probe_health() -> ProbeOutcome {
	let addr_str = format!("{HEALTH_HOST}:{HEALTH_PORT}");
	let addr: SocketAddr = match addr_str.parse() {
		Ok(a) => a,
		Err(e) => return ProbeOutcome::Error(format!("parse {addr_str}: {e}")),
	};

	let mut stream = match TcpStream::connect_timeout(&addr, PROBE_TIMEOUT) {
		Ok(s) => s,
		Err(e) => return ProbeOutcome::Error(format!("tcp connect {addr_str}: {e}")),
	};
	if let Err(e) = stream.set_read_timeout(Some(PROBE_TIMEOUT)) {
		return ProbeOutcome::Error(format!("set_read_timeout: {e}"));
	}
	if let Err(e) = stream.set_write_timeout(Some(PROBE_TIMEOUT)) {
		return ProbeOutcome::Error(format!("set_write_timeout: {e}"));
	}

	let request = format!(
		"GET {HEALTH_PATH} HTTP/1.1\r\n\
		 Host: {HEALTH_HOST}:{HEALTH_PORT}\r\n\
		 Connection: close\r\n\
		 Accept: */*\r\n\
		 \r\n"
	);
	if let Err(e) = stream.write_all(request.as_bytes()) {
		return ProbeOutcome::Error(format!("write request: {e}"));
	}

	// Bounded read. SurrealDB honors `Connection: close` so the server
	// closes after writing, read returns 0 (EOF) and we exit. The cap
	// is the safety belt: if an unexpected server keeps the socket
	// open, PROBE_READ_CAP bounds the bytes so we never block past
	// PROBE_TIMEOUT on the read deadline.
	let mut buf = Vec::with_capacity(1024);
	let mut chunk = [0u8; 512];
	loop {
		match stream.read(&mut chunk) {
			Ok(0) => break,
			Ok(n) => {
				buf.extend_from_slice(&chunk[..n]);
				if buf.len() >= PROBE_READ_CAP {
					break;
				}
			}
			Err(e) => {
				// If we read at least the status line + some headers
				// before the read errored (RST, timeout), classify
				// what we have. Empty buffer with an error is a real
				// error.
				if buf.is_empty() {
					return ProbeOutcome::Error(format!("read: {e}"));
				}
				break;
			}
		}
	}

	let raw = String::from_utf8_lossy(&buf).into_owned();
	classify(&raw)
}

/// Decide whether `raw` (the bytes we read off the socket) is a healthy
/// SurrealDB `/health` response.
///
/// Pure function — no I/O. Lifted out for unit-testing the classify
/// rules without spinning up a TCP listener.
fn classify(raw: &str) -> ProbeOutcome {
	let status_code = raw.lines().next().and_then(parse_status_code);
	let identity = extract_identity(raw);

	match (status_code, identity) {
		(Some(200), Some(version)) => ProbeOutcome::Healthy {
			signal: format!("HTTP 200 {IDENTITY_HEADER}={version}"),
		},
		_ => ProbeOutcome::Unexpected {
			snippet: response_snippet(raw, 4),
		},
	}
}

/// Parse the numeric status from an HTTP status line.
///
/// Accepts `HTTP/1.0 200 OK`, `HTTP/1.1 200 OK`, `HTTP/2 200`. Returns
/// `None` for anything that doesn't have at least three space-separated
/// tokens with a parsable middle one.
fn parse_status_code(status_line: &str) -> Option<u16> {
	let mut parts = status_line.splitn(3, ' ');
	let _version = parts.next()?;
	let code = parts.next()?;
	code.parse().ok()
}

/// Pull the `surreal-version: ...` header value, if present.
///
/// Header names are case-insensitive per RFC 7230; SurrealDB happens
/// to lowercase its names today, but we normalize anyway so a future
/// `Surreal-Version:` change wouldn't silently fail the identity check.
fn extract_identity(raw: &str) -> Option<String> {
	raw.lines().find_map(|line| {
		let mut split = line.splitn(2, ':');
		let name = split.next()?.trim();
		if name.eq_ignore_ascii_case(IDENTITY_HEADER) {
			let value = split.next()?.trim();
			if value.is_empty() {
				None
			} else {
				Some(value.to_string())
			}
		} else {
			None
		}
	})
}

/// First `n` non-empty lines, joined with " | ", for log snippets.
fn response_snippet(raw: &str, n: usize) -> String {
	raw.lines()
		.filter(|l| !l.is_empty())
		.take(n)
		.collect::<Vec<_>>()
		.join(" | ")
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
	fn summary_healthy_formats_elapsed_and_signal() {
		let r = SmokeResult::Healthy {
			elapsed: Duration::from_millis(1500),
			signal: "HTTP 200 surreal-version=surrealdb/3.0.5".to_string(),
		};
		let s = r.summary();
		assert!(s.contains("healthy in"));
		assert!(s.contains("surrealdb/3.0.5"));
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
			response_snippet: "HTTP/1.1 500 Internal Server Error".to_string(),
		};
		assert!(!r.is_healthy());
		assert!(r.summary().contains("unhealthy"));
	}

	#[test]
	fn parse_status_code_extracts_200_from_http11() {
		assert_eq!(parse_status_code("HTTP/1.1 200 OK"), Some(200));
	}

	#[test]
	fn parse_status_code_extracts_500_from_http10() {
		assert_eq!(
			parse_status_code("HTTP/1.0 500 Internal Server Error"),
			Some(500)
		);
	}

	#[test]
	fn parse_status_code_rejects_garbage() {
		assert_eq!(parse_status_code("not a status line"), None);
		assert_eq!(parse_status_code(""), None);
		assert_eq!(parse_status_code("HTTP/1.1"), None);
	}

	#[test]
	fn extract_identity_finds_surreal_version_lowercase() {
		let raw =
			"HTTP/1.1 200 OK\r\nsurreal-version: surrealdb/3.0.5\r\ncontent-length: 0\r\n\r\n";
		assert_eq!(extract_identity(raw), Some("surrealdb/3.0.5".to_string()));
	}

	#[test]
	fn extract_identity_is_case_insensitive() {
		let raw = "HTTP/1.1 200 OK\r\nSurreal-Version: surrealdb/3.0.5\r\n\r\n";
		assert_eq!(extract_identity(raw), Some("surrealdb/3.0.5".to_string()));
	}

	#[test]
	fn extract_identity_missing_returns_none() {
		let raw = "HTTP/1.1 200 OK\r\nserver: nginx\r\n\r\n";
		assert_eq!(extract_identity(raw), None);
	}

	#[test]
	fn extract_identity_empty_value_returns_none() {
		let raw = "HTTP/1.1 200 OK\r\nsurreal-version:   \r\n\r\n";
		assert_eq!(extract_identity(raw), None);
	}

	#[test]
	fn classify_healthy_on_200_with_surreal_version() {
		let raw =
			"HTTP/1.1 200 OK\r\nsurreal-version: surrealdb/3.0.5\r\ncontent-length: 0\r\n\r\n";
		let ProbeOutcome::Healthy { signal } = classify(raw) else {
			panic!("expected Healthy");
		};
		assert!(signal.contains("HTTP 200"));
		assert!(signal.contains("surrealdb/3.0.5"));
	}

	#[test]
	fn classify_unexpected_on_200_without_identity() {
		let raw = "HTTP/1.1 200 OK\r\nserver: nginx\r\n\r\n";
		assert!(matches!(classify(raw), ProbeOutcome::Unexpected { .. }));
	}

	#[test]
	fn classify_unexpected_on_500_with_identity() {
		let raw =
			"HTTP/1.1 500 Internal Server Error\r\nsurreal-version: surrealdb/3.0.5\r\n\r\n";
		assert!(matches!(classify(raw), ProbeOutcome::Unexpected { .. }));
	}

	#[test]
	fn classify_unexpected_on_garbage() {
		let raw = "totally not http at all\r\n";
		assert!(matches!(classify(raw), ProbeOutcome::Unexpected { .. }));
	}

	#[test]
	fn response_snippet_joins_with_pipe_and_skips_blanks() {
		let raw = "HTTP/1.1 200 OK\r\nfoo: bar\r\n\r\nbody";
		let snippet = response_snippet(raw, 3);
		assert!(snippet.contains("HTTP/1.1 200 OK"));
		assert!(snippet.contains(" | "));
		assert!(snippet.contains("foo: bar"));
		assert!(snippet.contains("body"));
	}
}
