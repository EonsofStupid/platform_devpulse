//! Port allocation for managed sidecars — probe / attach / bump.
//!
//! Every managed sidecar (`Ollama`, `SurrealDB`, ...) asks for a configured
//! port. If that port is free, we spawn on it. If it is already bound by
//! an instance of the same service we ATTACH. If it is bound by something
//! else we BUMP `+1` and try again, up to [`DEFAULT_MAX_BUMPS`] attempts.
//!
//! # Why this lives in the kernel
//!
//! Port-bump is a cross-cutting concern for cortex resource adapters
//! (persistence + model runtimes), not engine-facade logic. The engine
//! facade returns the resolved [`PortAllocation`] to the UI so the
//! devtool can show `configured` vs `actual` and render the bump badge.
//!
//! # Identity probe
//!
//! Each caller supplies an `identity_probe` closure that talks to the
//! port and answers "is this OUR service already?". If yes → attach.
//! If no → bump. This is how we avoid stomping on another app that
//! happened to bind our default port (e.g. a user's own `SurrealDB`
//! binary running outside `DevPulse`).

use anyhow::{anyhow, Result};
use std::future::Future;
use tokio::net::TcpListener;

/// Maximum sequential ports to try before giving up.
///
/// At 20, a configured port of 8822 will try up to 8841. Beyond that
/// the caller sees an error with the exhausted range — better than
/// silently scanning the whole dynamic range.
pub const DEFAULT_MAX_BUMPS: u16 = 20;

/// Outcome of a port allocation attempt.
///
/// `bumps == 0` means the configured port was free / attached-as-ours
/// on the first try. `bumps > 0` means we had to walk forward; the UI
/// should surface a "port bumped" badge in that case.
#[derive(Debug, Clone, Copy)]
pub struct PortAllocation {
    /// The port the caller originally asked for.
    pub configured: u16,
    /// The port we actually bound / attached to.
    pub actual: u16,
    /// Number of `+1` bumps it took to get here (`actual - configured`).
    pub bumps: u16,
    /// Disposition at `actual`: spawn fresh, or attach to an existing
    /// instance of our service.
    pub disposition: Disposition,
}

/// What happens at the resolved port.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Disposition {
    /// Nothing is listening — caller should spawn the sidecar child here.
    Spawn,
    /// An instance of our service is already listening — caller should
    /// attach (client connection only, no child spawn, no kill-on-drop).
    Attach,
}

impl PortAllocation {
    /// `true` when the configured port was satisfied without any bumps.
    #[must_use]
    pub fn is_clean(&self) -> bool {
        self.bumps == 0
    }
}

/// Resolve a port for a sidecar: attach if our service is already
/// listening, otherwise find the first free port via `+1` bumps.
///
/// The `identity_probe` closure is called against every port that has
/// a listener on it. It should return `Ok(())` iff the listener is an
/// instance of our service (e.g. `GET /api/version` for `Ollama`,
/// `RPC INFO FOR KV` for `SurrealDB`). Any error means "not ours" and
/// the allocator bumps past it.
///
/// # Errors
/// - All `max_bumps` ports are bound by foreign services.
/// - Binding a TCP listener fails for a non-address-in-use reason
///   (e.g. permission denied on a privileged port).
pub async fn allocate<F, Fut>(
    host: &str,
    configured: u16,
    max_bumps: u16,
    identity_probe: F,
) -> Result<PortAllocation>
where
    F: Fn(u16) -> Fut,
    Fut: Future<Output = Result<()>>,
{
    // Clamp bump ceiling so we don't overflow u16 near 65535.
    let ceiling = configured.saturating_add(max_bumps);

    for port in configured..=ceiling {
        match probe_state(host, port).await? {
            ProbeState::Free => {
                return Ok(PortAllocation {
                    configured,
                    actual: port,
                    bumps: port - configured,
                    disposition: Disposition::Spawn,
                });
            }
            ProbeState::Bound => {
                // Something is on this port — is it us?
                if identity_probe(port).await.is_ok() {
                    tracing::info!(
                        host,
                        configured,
                        actual = port,
                        bumps = port - configured,
                        "Port is bound by our service — attaching"
                    );
                    return Ok(PortAllocation {
                        configured,
                        actual: port,
                        bumps: port - configured,
                        disposition: Disposition::Attach,
                    });
                }
                tracing::warn!(host, port, "Port bound by a foreign listener — bumping +1");
                // continue to next port
            }
        }
    }

    Err(anyhow!(
        "port allocation exhausted: every port in {configured}..={ceiling} \
         on {host} is bound by a foreign listener (max_bumps={max_bumps}). \
         Edit the service's `port` in the devtool or free one of these ports."
    ))
}

/// Shorthand over [`allocate`] with [`DEFAULT_MAX_BUMPS`].
///
/// # Errors
/// Propagates every failure from [`allocate`] — namely:
/// - All [`DEFAULT_MAX_BUMPS`] ports are bound by foreign listeners.
/// - Binding a TCP listener fails for a non-address-in-use reason
///   (e.g. permission denied on a privileged port).
pub async fn allocate_default<F, Fut>(
    host: &str,
    configured: u16,
    identity_probe: F,
) -> Result<PortAllocation>
where
    F: Fn(u16) -> Fut,
    Fut: Future<Output = Result<()>>,
{
    allocate(host, configured, DEFAULT_MAX_BUMPS, identity_probe).await
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum ProbeState {
    Free,
    Bound,
}

/// Probe whether `host:port` accepts a fresh bind right now.
///
/// Returns `Free` if a listener can be created (then immediately
/// dropped), `Bound` if the bind returns `AddrInUse`. Any other
/// error (e.g. permission denied, invalid address) propagates.
async fn probe_state(host: &str, port: u16) -> Result<ProbeState> {
    match TcpListener::bind((host, port)).await {
        Ok(listener) => {
            drop(listener);
            Ok(ProbeState::Free)
        }
        Err(e) if e.kind() == std::io::ErrorKind::AddrInUse => Ok(ProbeState::Bound),
        Err(e) => Err(anyhow!(
            "port probe failed for {host}:{port}: {e} (kind={:?})",
            e.kind()
        )),
    }
}

#[cfg(test)]
#[allow(clippy::unwrap_used, clippy::expect_used)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn allocate_clean_when_port_free() {
        // Use a high ephemeral port that's almost certainly free.
        // If this test is flaky, another process grabbed 59999 — rerun.
        let port = 59999;
        let result = allocate("127.0.0.1", port, 5, |_| async { Ok(()) })
            .await
            .expect("free port should allocate");
        assert_eq!(result.configured, port);
        assert_eq!(result.actual, port);
        assert_eq!(result.bumps, 0);
        assert_eq!(result.disposition, Disposition::Spawn);
        assert!(result.is_clean());
    }

    #[tokio::test]
    async fn allocate_attaches_when_probe_ok() {
        // Bind a listener to simulate "our service already running".
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let port = listener.local_addr().unwrap().port();

        // Identity probe returns Ok → attach.
        let result = allocate("127.0.0.1", port, 5, |_| async { Ok(()) })
            .await
            .expect("attach should succeed");
        assert_eq!(result.actual, port);
        assert_eq!(result.disposition, Disposition::Attach);
        assert_eq!(result.bumps, 0);
    }

    #[tokio::test]
    async fn allocate_bumps_when_probe_fails() {
        // Bind a listener. Identity probe fails → bump to next port.
        let occupier = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let configured = occupier.local_addr().unwrap().port();

        let result = allocate("127.0.0.1", configured, 10, |_| async {
            Err(anyhow!("not our service"))
        })
        .await
        .expect("bump should find free port");

        assert_eq!(result.configured, configured);
        assert!(result.actual > configured);
        assert!(result.bumps >= 1);
        assert_eq!(result.disposition, Disposition::Spawn);
    }
}
