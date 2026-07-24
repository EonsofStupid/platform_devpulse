# C4 — ConnectionMode becomes REAL: local / network / gb10 filter the ladder

## GOAL

Kill B3 (operator ruling 2026-07-14: modes are REAL). A typed
`ConnectionMode` (charter: local / network / gb10) is modeled in Rust,
selected in the wizard (third ModeCard joins), passed to discovery, FILTERS
which rungs run, and persists with the connection choice. Svelte stays dumb —
the mode is one prop/argument; all filtering logic is Rust.

## MODE → RUNG TABLE (from 04, the spec of record)

| Mode | Rungs that run |
| --- | --- |
| local | Persisted + Localhost |
| network | Persisted + Mdns + MeshPeer |
| gb10 | Persisted + Configured + MeshPeer |
| (no mode / None) | ALL five (today's behavior — the default) |

Persisted always runs: it is the operator's own saved endpoint. `None` keeps
"Find my Clyffy" turnkey when the operator hasn't picked a card. ScanPanel
(08/R4b) needs NO change: rungs that don't run are provably silent at
`finished` and render `scan_rung_not_run` honestly.

## PRECONDITIONS

1. 08/R2 (mode_network_* copy keys), 08/R4a (ModeCard exists), C3 (schemes
   field — keeps `DiscoveryConfig` churn ordered) all DONE. Tree clean.
2. Probe: `grep -n "mode = \$state" interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/feature/views/EndpointView.svelte`
   → the two-value union (`"local" | "gb10"`). Different → re-read the view.
3. Probe: `grep -n "struct ClyffyConnectionRecord" -A 12 interfaces/desktop/src-tauri/src/connection_store.rs`
   → record the exact current fields (endpoint, setup_decided at minimum)
   and its serde attrs — the additive `mode` field must deserialize old
   files (`#[serde(default)]`).

## FILES

1. `interfaces/desktop/src-tauri/src/endpoint_discovery.rs` —
   `ConnectionMode` enum + rung filter.
2. `interfaces/desktop/src-tauri/src/commands/sys/clyffy.rs` —
   `discover_clyffy(mode: Option<ConnectionMode>)` + persist mode on
   connect.
3. `interfaces/desktop/src-tauri/src/connection_store.rs` —
   `ClyffyConnectionRecord.mode: Option<ConnectionMode>` (serde default).
4. `interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/feature/views/EndpointView.svelte`
   — third ModeCard + mode state + pass to command.
5. Regenerated `bindings.ts`.

## STEPS

1. endpoint_discovery.rs — the type, beside `DiscoverySource` (mirror its
   derive list EXACTLY, plus `specta::Type` + serde for the command
   boundary):

```rust
/// Operator's connection-mode choice — filters which discovery rungs run.
/// `local` = this machine · `network` = another box on the LAN/mesh ·
/// `gb10` = the GB10 over the private mesh. Charter: three modes, computed
/// never hardcoded; `None` at the command boundary runs the full ladder.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub enum ConnectionMode {
    Local,
    Network,
    Gb10,
}
```

   `DiscoveryConfig` gains `pub mode: Option<ConnectionMode>`. In the ladder,
   gate each rung with one helper so the table lives in ONE place:

```rust
/// Whether `source` participates under `mode` — the mode→rung table.
/// Persisted always runs (the operator's own saved endpoint).
fn rung_enabled(mode: Option<ConnectionMode>, source: DiscoverySource) -> bool
```

   (match implementing the table above; `None` → true for all). Each rung
   wraps its enumeration in `if rung_enabled(cfg.mode, DiscoverySource::X)`;
   a skipped rung emits NOTHING (provably-silent = ScanPanel's honest
   "didn't run" at finish). Unit-test the table in-module
   (`#[cfg(test)] mod tests` — one test asserting the full 4×5 matrix; the
   module's existing test style is the template — read it first).
2. clyffy.rs — `discover_clyffy` signature gains `mode: Option<ConnectionMode>`
   (specta command arg; camelCase over the wire); pass into
   `DiscoveryConfig { mode, … }`; the tracing line records it:
   `tracing::info!(target: "clyffy.discovery", ?mode, "operator started discovery")`.
   `connect_clyffy` persists the operator's mode: read how `persist_choice`
   writes the record today (same file) and extend it to carry
   `mode: Option<ConnectionMode>` — the caller passes the mode the UI held
   when Confirm fired. Signature change ONLY if persist_choice is private to
   this file (probe `grep -rn "persist_choice" interfaces/desktop/src-tauri/src/`);
   external callers → enumerate + repoint.
3. connection_store.rs — `ClyffyConnectionRecord` gains
   `#[serde(default)] pub mode: Option<ConnectionMode>` (import from the
   discovery module; if that creates a module cycle, the enum moves to a
   types-appropriate shared module WITHIN src-tauri — probe the module tree
   first; NO new files unless the cycle is real, and then STOP and report
   instead).
4. EndpointView.svelte — mode state becomes
   `let mode = $state<"local" | "network" | "gb10" | null>(null)` (null =
   no filter, turnkey default — no card pre-selected, honest); THIRD
   ModeCard between local and gb10 using `copy.mode_network_*` keys (icon:
   `Network` from lucide — verify the icon name exists in lucide-svelte
   before import); `discover()` passes
   `commands.discoverClyffy(mode)` (camelCase enum value per bindings);
   `connect()` unchanged unless step 2 changed the command signature — then
   mirror it. `.mode-row` grid becomes `repeat(3, 1fr)` with a cqi-clamped
   collapse (`grid-template-columns: repeat(auto-fit, minmax(clamp(10rem, 18cqi, 14rem), 1fr))`).
5. `cargo check -p devpulse_desktop_backend` (+ `cargo test -p
   devpulse_desktop_backend rung_enabled` for the table test) →
   `cargo xtask regen-bindings` → `pnpm check` 0/0 · `no-raw-values` 0.
6. HMR gate: operator picks each mode, fires the scan, and the ScanPanel
   SHOWS the filter truth — e.g. gb10 mode: localhost/mdns rows read
   "didn't run", mesh + configured probe. The mode is doing something REAL
   and the panel proves it.
7. Commit + push: `feat(desktop): ConnectionMode real — three modes filter the ladder, persisted with the choice (C4/B3)`.

## IMPORT REPOINTS

- `discoverClyffy` frontend callers: probe
  `grep -rn "discoverClyffy" interfaces/desktop/src/` — EndpointView is the
  expected sole caller; more → each gets the mode argument (or `null`).
- `persist_choice` callers per step 2 probe.

## VERIFY

Step 5 raw output · the rung-table unit test green · diff-stat ⊆ 5 files ·
step 6 operator-witnessed.

## KNOWN REDS

Baseline only.

## ROLLBACK

`git checkout -- <files>` + `cargo xtask regen-bindings`.

## STOP CONDITIONS

- Module cycle on the enum placement (step 3) → STOP, report the tree.
- `discover_clyffy`'s specta arg encoding of `Option<enum>` produces an
  awkward TS shape (probe bindings after regen) → STOP and show it before
  wiring the frontend.
- Any temptation to filter rungs frontend-side → forbidden; Rust owns the
  table.
