//! Turnkey Clyffy endpoint discovery — the candidate ladder.
//!
//! Named `endpoint_discovery` (NOT `discovery`) because the engine already
//! owns model-FILE discovery under `platform/model_loader/models/discovery.rs`
//! — a different concern.
//!
//! The ladder enumerates candidates from what the machine already knows,
//! then verifies each with the ONLY authority that exists: the live
//! `GET /v1/capability` handshake. Anything that answers with a decodable
//! `EndpointCapability` IS a Clyffy (capability computed, never assumed).
//!
//! Rungs (charter modes local / network / gb10):
//!   1. Persisted — the operator's last connected endpoint
//!   2. Configured — `services.system.clyffy.base_url`
//!   3. Localhost — `http://127.0.0.1:{port}` per configured port
//!   4. mDNS — DNS-SD browse for `_clyffy._tcp.local.` (LAN; SRV carries the port; link-local, cannot cross the mesh)
//!   5. Mesh peers — `tailscale status --json` enumeration when a tailscaled (Headscale-identical) is present
//!
//! HARD RULES:
//! - READ-ONLY w.r.t. `ClyffyConnectionState`: this module streams
//!   candidates and returns; only `connect_clyffy` (the operator's
//!   confirm) writes connection state. The probe loop stays sole writer.
//! - Only enumerated candidates are probed — never CIDR sweeps
//!   (bounded fan-out, `discovery_max_probes`).
//! - A source that finds nothing (firewall-declined multicast, no
//!   tailscaled) reports honestly as a scanned-empty source, not an error.
//!
//! Signals: structured tracing under the `clyffy.discovery` target —
//! replayable via `query_scoped_log("clyffy.discovery", …)`.

use std::collections::HashSet;
use std::time::Duration;

use devpulse_gb10_client::{ClyffyClient, EndpointCapability};
use futures::stream::{self, StreamExt};
use serde::{Deserialize, Serialize};

/// Which rung of the ladder produced a candidate.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "snake_case")]
pub enum DiscoverySource {
    /// The operator's persisted last-connected endpoint.
    Persisted,
    /// The configured `base_url` from `services.system.clyffy`.
    Configured,
    /// Loopback probe on a configured discovery port.
    Localhost,
    /// DNS-SD answer on the LAN.
    Mdns,
    /// Enumerated tailscale/Headscale mesh peer.
    MeshPeer,
}

/// A verified endpoint: it answered the capability handshake.
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct DiscoveredEndpoint {
    /// Base URL, no trailing slash — what `connect_clyffy` takes verbatim.
    pub url: String,
    /// Which rung found it.
    pub source: DiscoverySource,
    /// What it advertised (computed from the live handshake, never assumed).
    pub capability: EndpointCapability,
}

/// Live progress from the ladder — the Tauri seam maps these onto the
/// typed `ClyffyDiscoveryProgress` event.
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum DiscoveryEvent {
    /// A rung finished enumerating; `candidates` is how many it contributed.
    SourceScanned {
        /// The rung that finished.
        source: DiscoverySource,
        /// Candidates contributed (pre-verification).
        candidates: u32,
    },
    /// A candidate URL was actually probed — true attempt telemetry.
    /// No-mock law: the UI may only render attempts that happened.
    CandidateProbed {
        /// The URL that was probed.
        url: String,
        /// Which rung enumerated it.
        source: DiscoverySource,
        /// Whether the capability handshake answered.
        reached: bool,
    },
    /// A candidate answered the capability handshake.
    Found {
        /// The verified endpoint.
        endpoint: DiscoveredEndpoint,
    },
    /// The ladder is done.
    Finished {
        /// Total verified endpoints.
        found: u32,
        /// Total candidates probed.
        probed: u32,
    },
}

/// Everything the ladder needs — assembled by the command from config
/// SSOT + the persisted connection record. No hardcoded hosts or ports.
#[derive(Debug, Clone)]
pub struct DiscoveryConfig {
    /// Operator's persisted last endpoint, if any.
    pub persisted: Option<String>,
    /// Configured `base_url` (empty = none).
    pub base_url: String,
    /// DNS-SD service type to browse.
    pub service_type: String,
    /// Candidate ports for localhost + mesh rungs.
    pub ports: Vec<u16>,
    /// mDNS collection window.
    pub mdns_wait: Duration,
    /// Per-probe HTTP timeout.
    pub probe_timeout: Duration,
    /// Bounded probe fan-out.
    pub max_probes: usize,
}

/// Normalize a candidate URL for dedup (`http://x:1/` == `http://x:1`).
fn normalize(url: &str) -> String {
    url.trim().trim_end_matches('/').to_string()
}

/// Rung 5: enumerate mesh peers from `tailscale status --json`. Absent or
/// failing tailscale binary = no mesh (honest empty), never an error.
/// The CLI's JSON output is the de-facto stable interface (upstream
/// #17619); the LocalAPI named pipe is deliberately not spoken here.
fn mesh_peer_ips() -> Vec<String> {
    let output = std::process::Command::new("tailscale")
        .args(["status", "--json"])
        .output();
    let Ok(output) = output else {
        tracing::info!(target: "clyffy.discovery", "tailscale binary not found — mesh rung skipped");
        return Vec::new();
    };
    if !output.status.success() {
        tracing::info!(target: "clyffy.discovery", "tailscale status failed — mesh rung skipped");
        return Vec::new();
    }
    let Ok(json) = serde_json::from_slice::<serde_json::Value>(&output.stdout) else {
        tracing::warn!(target: "clyffy.discovery", "tailscale status --json did not parse — mesh rung skipped");
        return Vec::new();
    };
    let Some(peers) = json.get("Peer").and_then(|p| p.as_object()) else {
        return Vec::new();
    };
    let mut ips = Vec::new();
    for peer in peers.values() {
        let online = peer
            .get("Online")
            .and_then(serde_json::Value::as_bool)
            .unwrap_or(false);
        if !online {
            continue;
        }
        if let Some(addrs) = peer.get("TailscaleIPs").and_then(|a| a.as_array()) {
            // IPv4 mesh address only — v6 needs bracket handling and the
            // v4 CGNAT address is always present on a tailscale peer.
            if let Some(ip) = addrs
                .iter()
                .filter_map(serde_json::Value::as_str)
                .find(|a| !a.contains(':'))
            {
                ips.push(ip.to_string());
            }
        }
    }
    ips
}

/// Rung 4: browse DNS-SD for the configured service type, collecting
/// resolved answers for the configured window. Firewall-declined multicast
/// or a missing responder = empty (the localhost rung covers same-host,
/// so querier-side loopback subtleties never block discovery).
fn mdns_browse(service_type: &str, wait: Duration) -> Vec<String> {
    let daemon = match mdns_sd::ServiceDaemon::new() {
        Ok(d) => d,
        Err(err) => {
            tracing::warn!(target: "clyffy.discovery", %err, "mDNS daemon unavailable — LAN rung skipped");
            return Vec::new();
        }
    };
    let receiver = match daemon.browse(service_type) {
        Ok(r) => r,
        Err(err) => {
            tracing::warn!(target: "clyffy.discovery", %err, "mDNS browse failed — LAN rung skipped");
            let _ = daemon.shutdown();
            return Vec::new();
        }
    };

    let deadline = std::time::Instant::now() + wait;
    let mut urls = Vec::new();
    while let Some(remaining) = deadline.checked_duration_since(std::time::Instant::now()) {
        match receiver.recv_timeout(remaining) {
            Ok(mdns_sd::ServiceEvent::ServiceResolved(info)) => {
                let port = info.get_port();
                for addr in info.get_addresses() {
                    if addr.is_ipv4() {
                        urls.push(format!("http://{addr}:{port}"));
                    }
                }
            }
            Ok(_) => {}
            Err(_) => break,
        }
    }
    let _ = daemon.shutdown();
    urls
}

/// Enumerate the ladder's candidates (rungs 1–5), reporting each rung as
/// it finishes. Dedup by normalized URL — the first rung to name a URL
/// owns it.
async fn enumerate_candidates(
    cfg: &DiscoveryConfig,
    on_event: &(impl Fn(DiscoveryEvent) + Send + Sync),
) -> Vec<(String, DiscoverySource)> {
    let mut seen: HashSet<String> = HashSet::new();
    let mut candidates: Vec<(String, DiscoverySource)> = Vec::new();
    let push = |url: String,
                source: DiscoverySource,
                seen: &mut HashSet<String>,
                out: &mut Vec<(String, DiscoverySource)>| {
        let url = normalize(&url);
        if !url.is_empty() && seen.insert(url.clone()) {
            out.push((url, source));
        }
    };
    let scanned = |source: DiscoverySource, count: usize| {
        on_event(DiscoveryEvent::SourceScanned {
            source,
            candidates: count as u32,
        });
    };

    // Rung 1 — persisted choice.
    let before = candidates.len();
    if let Some(url) = &cfg.persisted {
        push(
            url.clone(),
            DiscoverySource::Persisted,
            &mut seen,
            &mut candidates,
        );
    }
    scanned(DiscoverySource::Persisted, candidates.len() - before);

    // Rung 2 — configured base_url.
    let before = candidates.len();
    if !cfg.base_url.trim().is_empty() {
        push(
            cfg.base_url.clone(),
            DiscoverySource::Configured,
            &mut seen,
            &mut candidates,
        );
    }
    scanned(DiscoverySource::Configured, candidates.len() - before);

    // Rung 3 — localhost on every configured discovery port.
    let before = candidates.len();
    for port in &cfg.ports {
        push(
            format!("http://127.0.0.1:{port}"),
            DiscoverySource::Localhost,
            &mut seen,
            &mut candidates,
        );
    }
    scanned(DiscoverySource::Localhost, candidates.len() - before);

    // Rung 4 — mDNS browse (blocking socket work off the async runtime).
    let before = candidates.len();
    let service_type = cfg.service_type.clone();
    let wait = cfg.mdns_wait;
    let mdns_urls = devpulse_telemetry::spawn_blocking(move || mdns_browse(&service_type, wait))
        .await
        .unwrap_or_default();
    for url in mdns_urls {
        push(url, DiscoverySource::Mdns, &mut seen, &mut candidates);
    }
    scanned(DiscoverySource::Mdns, candidates.len() - before);

    // Rung 5 — mesh peers × configured ports.
    let before = candidates.len();
    let peer_ips = devpulse_telemetry::spawn_blocking(mesh_peer_ips)
        .await
        .unwrap_or_default();
    for ip in &peer_ips {
        for port in &cfg.ports {
            push(
                format!("http://{ip}:{port}"),
                DiscoverySource::MeshPeer,
                &mut seen,
                &mut candidates,
            );
        }
    }
    scanned(DiscoverySource::MeshPeer, candidates.len() - before);

    tracing::info!(
        target: "clyffy.discovery",
        total = candidates.len(),
        mesh_peers = peer_ips.len(),
        "candidate ladder enumerated — probing"
    );
    candidates
}

/// Run the ladder: enumerate candidates per rung, then verify every
/// deduped candidate with a bounded-concurrency capability probe.
pub async fn discover(
    cfg: DiscoveryConfig,
    on_event: impl Fn(DiscoveryEvent) + Send + Sync,
) -> Vec<DiscoveredEndpoint> {
    let candidates = enumerate_candidates(&cfg, &on_event).await;

    // Verify: every candidate gets the real handshake, bounded fan-out.
    let client = match ClyffyClient::new(cfg.probe_timeout) {
        Ok(c) => c,
        Err(err) => {
            tracing::warn!(target: "clyffy.discovery", %err, "probe client build failed — discovery aborted");
            on_event(DiscoveryEvent::Finished {
                found: 0,
                probed: 0,
            });
            return Vec::new();
        }
    };

    let probed = candidates.len() as u32;
    // Per-attempt telemetry: every probe emits CandidateProbed + a scoped
    // trace, success or not — the scan UI renders ONLY these true events.
    let on_event_ref = &on_event;
    let found: Vec<DiscoveredEndpoint> = stream::iter(candidates)
        .map(|(url, source)| {
            let client = client.clone();
            async move {
                let result = client.probe_capability(&url).await;
                let reached = result.is_ok();
                tracing::debug!(
                    target: "clyffy.discovery",
                    url = %url,
                    source = ?source,
                    reached,
                    "candidate probed"
                );
                on_event_ref(DiscoveryEvent::CandidateProbed {
                    url: url.clone(),
                    source,
                    reached,
                });
                match result {
                    Ok(capability) => Some(DiscoveredEndpoint {
                        url,
                        source,
                        capability,
                    }),
                    Err(_) => None,
                }
            }
        })
        .buffer_unordered(cfg.max_probes.max(1))
        .filter_map(|hit| async move { hit })
        .collect()
        .await;

    for endpoint in &found {
        tracing::info!(
            target: "clyffy.discovery",
            url = %endpoint.url,
            source = ?endpoint.source,
            kind = %endpoint.capability.kind,
            "endpoint verified via capability handshake"
        );
        on_event(DiscoveryEvent::Found {
            endpoint: endpoint.clone(),
        });
    }
    on_event(DiscoveryEvent::Finished {
        found: found.len() as u32,
        probed,
    });
    tracing::info!(target: "clyffy.discovery", found = found.len(), probed, "discovery complete");

    found
}
