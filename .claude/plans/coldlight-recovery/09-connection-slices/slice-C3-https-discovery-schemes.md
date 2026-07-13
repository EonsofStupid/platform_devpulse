# C3 — https-capable discovery: schemes come from config, never hardcoded

## GOAL

Kill B4: the localhost and mesh URL builders hardcode `http://` (and the
mDNS resolver builds its URL the same way), so an https clyffyd is
undiscoverable. `discovery_schemes: Vec<String>` (default `["http"]`) joins
the config SSOT; every builder iterates the configured schemes. Nothing
hardcoded — an operator running TLS adds `"https"` in config and discovery
finds it.

## AUDIT FACTS (read this session)

- `systems/devpulse-engine/src/platform/config/loader.rs:374` —
  `ClyffyServiceEntry` already carries `discovery_service_type`,
  `discovery_ports`, `discovery_mdns_wait_ms`, `discovery_max_probes`, each
  with a `default_*` fn — the additive pattern to mirror exactly.
- `interfaces/desktop/src-tauri/src/commands/sys/clyffy.rs:207-215` —
  `discover_clyffy` assembles `DiscoveryConfig` from
  `platform_arc.boot_config().services.system.clyffy` — the ONE seam where
  config crosses to the ladder.
- `interfaces/desktop/src-tauri/src/endpoint_discovery.rs` — DiscoveryConfig
  struct (~:105-120); the three URL constructions: localhost rung
  `format!("http://127.0.0.1:{port}")` (~:265), mesh rung
  `format!("http://{ip}:{port}")` (~:290+), and the mDNS resolved-service
  URL build (~:193-200 — read the exact construction; it may use the
  resolved host + port).

## PRECONDITIONS

1. Tree clean. C2 recommended DONE first (same crate, keeps commits ordered).
2. Probe: `grep -n "http://" interfaces/desktop/src-tauri/src/endpoint_discovery.rs`
   → exactly the builder sites (record them all — the count is the truth
   this slice must zero out, minus doc-comment examples).

## FILES

1. `systems/devpulse-engine/src/platform/config/loader.rs` — add field +
   default fn.
2. `interfaces/desktop/src-tauri/src/endpoint_discovery.rs` —
   `DiscoveryConfig.schemes: Vec<String>` + builders iterate.
3. `interfaces/desktop/src-tauri/src/commands/sys/clyffy.rs` — pass
   `schemes: clyffy_cfg.discovery_schemes.clone()`.

## STEPS

1. loader.rs — after `discovery_ports`, mirroring the existing field pattern
   verbatim (doc comment, serde default fn, placement):

```rust
/// URL schemes discovery builds candidates with, in probe order. TLS
/// operators add "https". Never hardcoded at a call site — the ladder
/// iterates this list for localhost, mDNS, and mesh candidates.
#[serde(default = "default_clyffy_discovery_schemes")]
pub discovery_schemes: Vec<String>,
```

   with `fn default_clyffy_discovery_schemes() -> Vec<String> { vec!["http".into()] }`
   beside the other `default_clyffy_*` fns. Check whether a
   `platform.default.toml` / documented config template exists
   (`grep -rn "discovery_ports" systems/devpulse-engine/config/`) — if the
   key family is documented there, document `discovery_schemes` in the same
   place, same comment style.
2. endpoint_discovery.rs:
   - `DiscoveryConfig` gains `pub schemes: Vec<String>` (doc: "URL schemes
     to build candidates with — config SSOT, default http").
   - Localhost rung: `for scheme in &cfg.schemes { for port in &cfg.ports {
     push(format!("{scheme}://127.0.0.1:{port}"), …) } }`.
   - Mesh rung: same nesting over `cfg.schemes`.
   - mDNS: read the resolved-URL construction first. mDNS answers carry
     host+port via SRV; scheme is NOT in the answer — iterate `cfg.schemes`
     there too (an https clyffyd advertising on mDNS is reachable only if
     its scheme is probed). Keep dedup (`seen`) — scheme multiplication must
     not double-push identical URLs.
   - `max_probes` bound already caps the fan-out — note in the report how
     candidate count scales (schemes × ports × hosts) and that the bound
     holds.
3. clyffy.rs — one line in the `DiscoveryConfig` literal:
   `schemes: clyffy_cfg.discovery_schemes.clone(),`.
4. `cargo check -p devpulse-engine` → 0/0 (config struct) and
   `cargo check -p devpulse_desktop_backend` → 0/0.
5. Post-probe: `grep -n "format!(\"http://" interfaces/desktop/src-tauri/src/endpoint_discovery.rs`
   → ZERO hits.
6. Commit + push: `feat(desktop): discovery schemes from config — https-capable ladder, zero hardcoded schemes (C3/B4)`.

## IMPORT REPOINTS

None — additive config field; `DiscoveryConfig` is constructed only in
clyffy.rs (probe: `grep -rn "DiscoveryConfig {" interfaces/desktop/src-tauri/src/` → exactly one constructor + the struct def; more → repoint each).

## VERIFY

Steps 4-5 raw output · diff-stat = 3 files.

## KNOWN REDS

None in these crates.

## ROLLBACK

`git checkout -- <the three files>`

## STOP CONDITIONS

- The mDNS URL build resolves scheme some other way (e.g. TXT record
  advertising scheme) → STOP, report the actual wire shape; the config list
  may be the wrong seam for that rung.
- `ClyffyServiceEntry` deserialization has a deny-unknown-fields or
  user-file-merge behavior the additive pattern doesn't cover → STOP.
