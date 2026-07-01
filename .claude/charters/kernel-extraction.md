# Charter: Kernel Extraction → DevPulse Standalone

> Durable session charter. A forked session reads this as its primary mission.
> **Verify every claim against the current repo before trusting it** — this
> charter is durable; the code moves. (June 2026 handoff discipline.)

**Primary goal:** Remove the kernel from `platform_devpulse` into a separate headless **ClyffyOS** backend, and make **DevPulse load as a clean standalone app** (Tauri + Svelte + ColdLight) with its own local store and **configs for three connection modes: local / network (WiFi·Ethernet) / GB10**.

## Why (the problem)

DevPulse can't "just load" today because the frontend statically compiles and
boots the entire kernel + inference stack. Verified 2026-06-28:

- `interfaces/desktop/src-tauri` → `devpulse-engine` (features `rro,candle,inference,burn`) → `devpulse-clyffy` (workspace member). `persona-mcp` also depends on the kernel.
- Rendering a window therefore drags in Burn, candle, llama.cpp, RRO/Qdrant. The kernel is **not separated**.

## The move (locked: `clyffyos-extraction-first`, 2026-06-24)

Extract into a new **ClyffyOS** repo + `clyffyd` headless server:

- `kernel/devpulse-clyffy`, `kernel/model-loader`, `kernel/rrd`
- `systems/devpulse-engine`, `systems/devpulse-persona-mcp`

Stays in `platform_devpulse` (which becomes the standalone DevPulse app):

- `interfaces/desktop/` — Tauri shell + Svelte (dumb UI) + ColdLight
- NEW `systems/devpulse-gb10-client/` — thin wire client
- a NEW DevPulse-local store: **Turso** (projects / conversations / stats) + **DuckDB** (analytics)
- `xtask/` split; telemetry crates shared

DevPulse = "VSCode, but with a DB tied to it" — projects, old conversations
(RRO), stats; eventually file-editing; observability of the wire to Clyffy.

## Connection-mode configs (the standalone requirement)

DevPulse boots standalone regardless of connection, then connects Clyffy
additively. Three tailored modes (capability is **computed** from the endpoint,
never a static toggle):

- **local** — Clyffy/ClyffyOS on the same machine (direct).
- **network** — WiFi / Ethernet to a Clyffy on the LAN (Bonjour `_clyffy._tcp.local.` discovery + `/v1/capability`).
- **gb10** — the MSI EdgeXpert GB10 headless node (WiFi + Ethernet + USB-C 20Gbps).

## Data bridge: DevPulse Turso ↔ Clyffy

Now the two split, **maximize ways to bridge the local store to Clyffy**:

- DevPulse-local **Turso** gets a **designed least-privilege service account** (creds via keyring SSOT — never in the frontend) so Clyffy can access it.
- Primary mechanism: **sync** DevPulse's local Turso to a remote ("the site"); Clyffy **pulls** (embedded-replica sync). Additive — never a boot prerequisite.
- TENSION: the pure-Rust `turso`/Limbo crate is local-only (no sync); the `libsql` crate has embedded-replica sync. The bridge choice **interacts with the libsql→turso crate decision** — reconcile in the held Turso plan (`wg4az7jvm`). See memory `turso-clyffy-bridge`.

## Vehicle + discipline

- Use **`/clean-extract clyffyos`** (fork-survey → catamorphic fold → phased execute, lefthook-gated, STOP between phases).
- **`/spec-first`** before each boundary; **no hardcoding** (agnostic paths/ids/hosts); **Svelte is the dumb UI**, Rust is the brain; kernel vocabulary stays in `kernel/`; **no shims**, no partial migration; **ABSORB before DELETE**; **no force-push / revert without permission**.
- **Review the existing code as you separate** — the fork-survey is a real code review, not a file inventory. Separate cleanly for **scale + growth**; do not rush.

## Decisions (resolved by operator 2026-06-28)

1. **ClyffyOS repo** = `clyffyos`, **local-first** at `D:\localdev\clyffyos` (GitHub wired later).
2. **Telemetry** (`devpulse-telemetry` + macros) = **published versioned crate**; both DevPulse + ClyffyOS depend on it.
3. **`devpulse-media`** = **stays in DevPulse** (capture is client-side; heavy processing runs on GB10 via the wire).
4. **WardenClyffe** = **separate, unrelated** (`D:\localdev\wardenclyffe`); the extraction does not touch it.

Resolved 2026-06-30 — NON-blocking (a later DevPulse UI surface, not needed to extract):

- **"obs under wiredfront"** — answered by the recovered `docs/technical_references/wiredfront.md`
  (purged in 581ac988, restored 2026-06-30). **WiredFront** = DevPulse's native in-house
  broadcasting / real-time collaboration engine (Zed-collab-class) + **PixVix** capture tool
  (Pix=screenshot, Vix=recording). "obs" = OBS-style broadcasting/capture, not observability.
  Both `wiredfront` + `pixvix` are already commitlint scopes. Backed by the DevPulse-local
  **Turso** store. See memory `wiredfront-broadcast-surface`. (Confirm OBS-broadcast vs
  observability with operator before building; lead with broadcasting.)

## Success criteria

- `platform_devpulse` compiles + boots **without** `devpulse-clyffy` / engine / persona-mcp in the desktop build graph.
- DevPulse renders + runs its local store (projects / conversations / stats) with **no backend reachable**.
- DevPulse discovers + connects a Clyffy endpoint in each mode (local / network / gb10); capability computed.
- ClyffyOS builds + `clyffyd` serves `/v1/capability` + chat / embed / persona.

## Starter references

- Memory: `clyffyos-extraction-first`, `devpulse-vscode-shell-local-db`, `devpulse-standalone-turso-local`, `devpulse-data-collector-gb10-inference`, `gb10-edgexpert-topology`, `svelte-dumb-ui-rust-logic`.
- Skills: `/clean-extract` (+ `/fork-survey`, `/fold-and-execute`), `/spec-first`.
- Seam: the Cargo dependency chain above — engine + persona-mcp are the only kernel consumers.
- Held: the libSQL→Turso plan (workflow `wg4az7jvm`) — **re-scope post-extraction** (most of it travels to ClyffyOS; DevPulse-local Turso is a new, smaller store).

## First actions for the forked session

1. Re-verify the dependency graph (`grep devpulse-clyffy **/Cargo.toml`) — it may have changed since 2026-06-28.
2. Confirm the working tree is clean (`/clean-extract` requires it) — commit any pending work first.
3. Run `/clean-extract clyffyos` — source `d:\localdev\platform_devpulse`, **destination `D:\localdev\clyffyos`**, exemplar `kernel/devpulse-clyffy/`. Proceed phase by phase, STOP between phases. Telemetry → published versioned crate; `devpulse-media` stays in DevPulse; WardenClyffe untouched.
