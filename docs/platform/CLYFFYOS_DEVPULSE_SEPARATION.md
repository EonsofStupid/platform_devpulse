# ClyffyOS ↔ DevPulse — The Separation (authoritative SSOT)

**Date:** 2026-07-05. **Status:** LOCKED. Single source of truth for what belongs to
DevPulse vs ClyffyOS. **Full best-practice separation — not the quickest route.** Where any
other doc disagrees, this wins; reconcile the other doc in the same change.

## The two products

- **DevPulse** — the desktop app (this repo, `platform_devpulse`). Tauri + Svelte + ColdLight.
  The user-facing platform. A **pure client**.
- **ClyffyOS** — the headless backend (separate repo `clyffyos`, runs on the **GB10 cluster**).
  The brain, the AI layer, and **ALL persistence**. Separately developed and released.

## Who owns what (LOCKED — do not re-derive)

| Concern | Owner | Notes |
|---|---|---|
| UI / windows / ColdLight | **DevPulse** | frontend only |
| "engine" (config, boot, services, wire client) | **DevPulse** | DevPulse's **core backend** — "the kernel" of DevPulse (there is no kernel in DevPulse) |
| **Turso** (local system of record) | **DevPulse** | replaces libSQL; installed; **the only local SSOT**; powers + backs DevPulse — projects / conversations / stats / config |
| "kernel" (vocabulary + code) | **ClyffyOS** | headless (GB10, optional local install later); connectome/cognition, model-loader, rrd/RRO |
| AI layer + all inference | **ClyffyOS** | on GB10 |
| **DuckDB — project analytics** | **DevPulse** | **local** OLAP *read model* over Turso data; powers standalone Tier-1 (non-AI) project stats; rebuildable, **NOT** a source of record |
| **DuckDB — AI analytics** | **ClyffyOS** | inference / model / reasoning metrics on GB10 |
| **Turso — synced replica** | **ClyffyOS** | Clyffy pulls a replica of DevPulse's Turso (sync bridge) so it has the project data it needs |
| **SurrealDB** (graph) | **ClyffyOS** | not local |
| Connectome persistence (all adapters) | **ClyffyOS** | not local |
| Project analytics computation | **DevPulse** | local DuckDB read model over Turso; standalone Tier-1 |
| AI analytics computation | **ClyffyOS** | DevPulse **displays** these over the wire; never computes or stores AI analytics |

**The one rule that ends the circle:** the only local **system of record** is **Turso**.
DevPulse also runs a **local DuckDB** as a *derived analytics read model* (rebuildable from
Turso) for its Tier-1 **project** stats. Everything else — SurrealDB, the persistence adapters,
the kernel, the AI, inference, and **AI-specific analytics** — lives on **ClyffyOS / GB10**.
DevPulse never compiles the kernel and never owns a *system of record* beyond Turso. And
there is **no kernel in DevPulse**: engine is DevPulse's core ("the kernel" of DevPulse), so
the old engine↔kernel vocabulary boundary is ClyffyOS-internal, not DevPulse's.

## The seam (best practice)

- **Contract SSOT:** `clyffyos-wire` (clyffyos repo) — `EndpointCapability`,
  `RegisteredEndpoint`, `LoadedSlotSummary`, `SlotStatus`. One serde definition, two consumers
  (`clyffyd` server + DevPulse client). **No parallel DTOs.**
- **DevPulse client:** `systems/devpulse-gb10-client` — thin HTTP/JSON client. Discovery via
  Bonjour (`_clyffy._tcp.local.`) + configured URLs; handshake `GET /v1/capability` → computed
  capability. Transports per mode: local / network / gb10, and over a **Tailscale/Netbird mesh**
  when the infra provides one — DevPulse joins the tailnet and reaches GB10 seamlessly in the
  background. No hardcoded host.
- **Serving side:** `clyffyd` (clyffyos repo, to be built) answers the contract on the GB10.
- **Litmus for "separated":** `cargo tree -p devpulse_desktop_backend` shows **no
  `devpulse-clyffy`, no `rrd`, no `model-loader`**. Today it still does → the app-side cut is
  not yet complete.
- **DevPulse owns a THIN store** (operator decision 2026-07-05): DevPulse authors its own minimal
  Turso + DuckDB access using the `turso`/`duckdb` crates **directly** — no kernel persistence
  adapter crosses into DevPulse. Supersedes engine-bisect decision #3 ("lift the relational
  adapter to a neutral crate"). Clyffy keeps the kernel's multi-DB connectome adapters.

## The data bridge

DevPulse writes its local **Turso**; Turso syncs (embedded replica: DevPulse `push()`, Clyffy
`pull()`) so ClyffyOS gets the data it needs. Least-privilege account, creds via the keyring
SSOT, never hardcoded. Additive — never a boot prerequisite.

## Load contract

- DevPulse **loads standalone** from Turso (Tier-1) with no backend reachable.
- AI + GB10 stats are **additive** — they light up when `devpulse-gb10-client` connects,
  capability **computed**. A subtle no-AI indicator (taskbar + in-platform + in-chat) shows
  while standalone.
- **Analytics are federated, not centralized:** the dashboard **combines** local project
  analytics (local DuckDB, read model over Turso) with AI analytics (ClyffyOS over the wire)
  into one view. Each analytics store sits next to its data; they merge at the presentation
  layer.

## Connection UX (non-technical, UI-driven)

DevPulse's UI is for **non-technical users** — fully UI-driven; the reliability/smoothness work
is done **upfront**.

- **First-run:** onboarding offers to connect the AI layer (remote / gb10-turnkey / mesh). If it
  is not available, the user clicks **"Not now" → DevPulse launches in offline mode**, fully
  usable on local Turso + DuckDB. Connect later, easily, from within the app.
- **After first-run:** the connection is editable if it changes, and DevPulse **seamlessly
  auto-reconnects** in the background from time to time if it ever drops — the user keeps working
  offline meanwhile.
- **Dynamic sourcing:** every component + devtool keeps its intent but reads **dynamically from
  wherever the source is** — local (Turso/DuckDB) or GB10 (over the wire). The AI layer (GB10)
  **extends the base program** once first-run setup completes; additive, never a precondition to
  render.

## Migration reality (2026-07-05)

- libSQL → **turso** crate migration **LANDED** (commit `f3748059`). Turso is the installed
  backing store. Naming lag only: the adapter type is still `LibSqlAdapter` pending the CC-007
  rename.
- `clyffyos` repo exists (Phase 3c) with the renamed kernel + `clyffyos-wire`, **but**
  `platform_devpulse` still contains `kernel/` and still compiles it → the app-side cut is
  **not done**. Completing it is the separation work; the phased plan lives in
  `.claude/plans/clyffyos-separation-plan.md` (correct it for: the **kernel + SurrealDB +
  persistence adapters + AI analytics stay on ClyffyOS**; DevPulse keeps **Turso (SSOT) + a
  derived local DuckDB for project analytics** and does NOT absorb the persistence adapters or
  the kernel).

## Related

- `.claude/charters/kernel-extraction.md` — the extraction charter.
- `systems/devpulse-gb10-client/SPEC.md` — the wire-client boundary spec.
- Memories: `project_engine_bisect_separation_decisions`, `project_devpulse_standalone_turso_local`,
  `project_turso_clyffy_bridge`, `project_ai_layer_optional_and_indicators`.
