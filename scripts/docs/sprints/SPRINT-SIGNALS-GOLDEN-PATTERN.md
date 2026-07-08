# Sprint — Signals Capability (Golden Pattern)

> **Status:** drafted 2026-04-14, not yet executed.
> **Owner gate:** P0 requires explicit approval before any consumer migration touches existing tooling.

First DevPulse capability built under:

- **Corrected SvelteKit DDD doctrine** — thin routes, domain owns logic, pure `load()`, mandatory dashboard, state in `state/*.svelte.ts` modules (not routes). See prior conversation research — the doctrine in `docs/platform/Desktop.md` is out of alignment with official SvelteKit guidance and will be revised after this sprint lands.
- **New IP boundary doctrine** — one-sided signal registry, kernel-only implementation names, OTel-shaped vocabulary. See `.claude/rules/ip-protection.md` (rewritten 2026-04-14).

Every future capability (chat, models, devpulse hub, overmind, etc.) is scaffolded by copying this structure and renaming.

## Artifacts Already Landed

- `systems/devpulse-engine/ip/signals.registry.yaml` — OTel-shaped SSOT, 5 families, 7 groups
- `systems/devpulse-engine/ip/signals.narrations.yaml` — hand-curated seed catalog
- `.claude/rules/ip-protection.md` — one-sided doctrine, 3 anti-patterns, CI regex lint

## Directory Tree (target state after this sprint)

```
systems/devpulse-engine/ip/
├── signals.registry.yaml              [DONE]
├── signals.narrations.yaml            [DONE]
└── kernel_terms.toml                  [LIVE — deprecated, deleted in P0]

systems/devpulse-engine/src/signals/
├── mod.rs                             [P1] public facade
├── types.rs                           [P1] Rust enums matching registry (hand-written, codegen later)
├── bridge.rs                          [P2] fake emitter → tokio::broadcast
└── ipc.rs                             [P2] Tauri command handlers

kernel/clyffy/src/signals/
└── mod.rs                             [P3] kernel-side stub — real emissions later sprint

interfaces/desktop/src-tauri/src/commands/signals/
└── mod.rs                             [P2] Tauri command wiring

interfaces/desktop/src/lib/domains/app/signals/
├── index.ts                           [P4] PUBLIC BARREL — only import surface for routes
├── contracts/signals.contract.ts      [P4] ArkType schemas matching registry
├── state/signals.state.svelte.ts      [P4] $state stream + $derived family/visibility filters
├── services/signals.svc.ts            [P4] Tauri invoke() + event subscription
├── features/
│   ├── inspector/SignalInspector.svelte        [P5] live stream, family/visibility filters
│   ├── registry-browser/RegistryBrowser.svelte [P5] runtime YAML browse
│   └── dashboard/SignalsDashboard.svelte       [P5] mandatory domain dashboard
└── utils/visibility-filter.ts         [P5] domain-private helper

interfaces/desktop/src/routes/(app)/signals/
├── +layout.svelte                     [P6] ~10 lines, shell chrome only
├── +layout.ts                         [P6] load(): fetch registry metadata
├── +page.ts                           [P6] load(): return subscription token
└── +page.svelte                       [P6] <SignalsDashboard {data} /> — ~15 lines

lefthook.yml → ip-boundary-check       [P7] CI regex lint hook (new or updated)
```

---

## P0 — Consumer Migration (BLOCKER, requires owner approval)

**Why this phase exists:** The legacy `systems/devpulse-engine/ip/kernel_terms.toml` has 15 active consumers. Deleting it without migrating them nukes the build. The new signal registry cannot fully replace the old file until each consumer either:

1. Migrates to read from `signals.registry.yaml`, OR
2. Is deleted outright (for tooling that no longer serves a purpose under the new doctrine).

### Known consumers (grep `kernel_terms` across the repo, 2026-04-14)

| # | File | Kind | Migration path |
|---|---|---|---|
| 1 | `systems/devpulse-engine/build.rs` | Rust build script — regenerates vocabulary HashMap | Rewrite to read `signals.registry.yaml`, produce typed Rust consts from registry IDs |
| 2 | `systems/devpulse-engine/src/ip/mod.rs` | Engine IP module | Rewrite to export registry-backed types; keep `ip_term!` macro working against new SSOT |
| 3 | `kernel/devpulse-clyffy/src/interactions/mod.rs` | Kernel interactions — may reference toml path | Audit; kernel side may keep its own internal names, only update if it reads the toml for cross-boundary mapping |
| 4 | `interfaces/desktop/scripts/build/terminology/generate.ts` | Frontend codegen — TOML → TS | Rewrite to read `signals.registry.yaml`; emit typed signal enums + narration keys |
| 5 | `interfaces/desktop/src/lib/sys/generated/terminology.ts` | Generated output | Regenerate after (4) lands |
| 6 | `interfaces/desktop/src/lib/sys/generated/terminology-icons.ts` | Generated output | Regenerate after (4) lands; audit whether icon mapping belongs with signals or a separate registry |
| 7 | `interfaces/desktop/src/lib/sys/index.ts` | Barrel re-export | Update imports |
| 8 | `interfaces/desktop/tests/architecture/ip-boundary.test.ts` | Architecture test | Rewrite to assert against registry YAML instead of TOML |
| 9 | `interfaces/desktop/gritql/no-kernel-terms.grit` | GritQL enforcement rule | Rewrite to use the regex from `ip-protection.md` |
| 10 | `scripts/hooks/ip-boundary-check.sh` | Pre-commit hook | Replace with the regex from `ip-protection.md`; wire into `lefthook.yml` as `ip-boundary-check` |
| 11 | `.claude/rules/ip-protection.md` | Doctrine | DONE — rewritten 2026-04-14 |
| 12 | `interfaces/desktop/IP_PROTECTION.md` | Duplicate doctrine in desktop subtree | Delete (SSOT is `.claude/rules/ip-protection.md`) |
| 13 | `interfaces/desktop/SPRINT_STATE_CONFIG.md` | Old sprint doc reference | Update or archive |
| 14 | `scripts/docs/sprints/dev-onboarding/MODEL-LOADER-REQUIREMENTS.md` | Sprint doc reference | Update or archive |
| 15 | `scripts/docs/.claude/UNIFIED_SYSTEM_ARCHITECTURE.md` | Architecture doc reference | Update to point at new SSOT |

### P0 Gate

Each consumer migrated or deleted. `git grep kernel_terms` returns zero results outside allowlisted archives. `kernel_terms.toml` is deleted. Build passes on all crates. `pnpm svelte-check` passes. Architecture test passes.

**Nothing in P1–P7 proceeds until P0 is green.**

---

## P1 — Rust types + public facade (engine crate only)

Files:
- `systems/devpulse-engine/src/signals/mod.rs`
- `systems/devpulse-engine/src/signals/types.rs`

Hand-write Rust enums matching the registry's enum members. Codegen is a later sprint. Export a `Signal` envelope struct and `SignalFamily` enum from `mod.rs`.

**Gate:** `cargo check -p devpulse-engine` passes. 0 errors, 0 warnings.

## P2 — Bridge + Tauri IPC (fake emitter)

Files:
- `systems/devpulse-engine/src/signals/bridge.rs` — fake emitter cycles `rro.state` through `gathering → processing → ruminating → ready` on a timer. Proves the wire without needing real kernel emissions.
- `systems/devpulse-engine/src/signals/ipc.rs` — Tauri command `subscribe_signals` returning a channel token
- `interfaces/desktop/src-tauri/src/commands/signals/mod.rs` — wires the command into the Tauri runtime

**Gate:** `cargo check -p devpulse_desktop_backend` passes. `invoke('subscribe_signals')` is callable from the frontend.

## P3 — Kernel-side stub

Files:
- `kernel/clyffy/src/signals/mod.rs` — empty shell declaring the bridge trait the engine consumes

**Gate:** `cargo check -p devpulse-clyffy` passes. Real kernel emissions are a later sprint.

## P4 — Frontend domain sister (logic only, no UI yet)

Files:
- `interfaces/desktop/src/lib/domains/app/signals/index.ts`
- `interfaces/desktop/src/lib/domains/app/signals/contracts/signals.contract.ts`
- `interfaces/desktop/src/lib/domains/app/signals/state/signals.state.svelte.ts`
- `interfaces/desktop/src/lib/domains/app/signals/services/signals.svc.ts`

Services call `invoke('subscribe_signals')`. State exposes `$state` array of recent signals with `$derived` filters by family and visibility tier.

**Gate:** `pnpm svelte-check` passes. Nothing renders yet.

## P5 — Feature components

Files:
- `interfaces/desktop/src/lib/domains/app/signals/features/inspector/SignalInspector.svelte`
- `interfaces/desktop/src/lib/domains/app/signals/features/registry-browser/RegistryBrowser.svelte`
- `interfaces/desktop/src/lib/domains/app/signals/features/dashboard/SignalsDashboard.svelte`
- `interfaces/desktop/src/lib/domains/app/signals/utils/visibility-filter.ts`

Uses ColdLight components (Box, Text, Button, Table) — no raw HTML, no inline styles.

**Gate:** `pnpm svelte-check` passes. `pnpm coldlight:verify` passes.

## P6 — Thin routes (corrected DDD doctrine)

Files:
- `interfaces/desktop/src/routes/(app)/signals/+layout.svelte`
- `interfaces/desktop/src/routes/(app)/signals/+layout.ts`
- `interfaces/desktop/src/routes/(app)/signals/+page.ts`
- `interfaces/desktop/src/routes/(app)/signals/+page.svelte` — ~15 lines, `<SignalsDashboard {data} />`

`load()` is pure — fetches registry metadata and subscription token via `SignalsService`, returns both. Zero state writes in load. Zero state owned in route.

**Gate:** `xtask run-dev` renders `/signals`. Fake emitter signals flow end-to-end into the inspector UI. **First visible proof of the golden pattern.**

## P7 — CI lint

Files:
- `lefthook.yml` adds or updates `ip-boundary-check` hook running the regex from `ip-protection.md`.

**Gate:** Test commit with `BM25` in a non-kernel test file fails pre-commit.

---

## Copy-Paste Scaffold

Once P7 lands, the golden pattern is frozen. Future capabilities are scaffolded by:

1. Copying `interfaces/desktop/src/lib/domains/app/signals/` → `interfaces/desktop/src/lib/domains/app/{new_capability}/`
2. Copying `interfaces/desktop/src/routes/(app)/signals/` → `interfaces/desktop/src/routes/(app)/{new_capability}/`
3. Renaming interior references
4. Declaring any new signal vocabulary in `signals.registry.yaml` (PR, reviewed)

A `devpulse capability:create {name}` CLI scaffolder is its own later sprint.

---

## Out of Scope (Explicit)

- YAML → Rust/TS codegen tooling (later sprint — hand-written enums in P1)
- Real kernel emissions from existing kernel code (later sprint — fake emitter only in P2)
- Renaming existing euphemisms across the codebase (`"thinking"` / `"Memory"` / `"smart ranking"` → registry vocabulary) (later sprint, one surface at a time)
- Migrating existing domains (chat, models, devpulse hub, overmind) to the corrected DDD pattern (later sprint, one domain at a time — golden pattern is the reference)
- Full OTel SDK integration (later sprint — P2 uses `tokio::broadcast`; swap to OTel tracing when SDK is installed)
- A2UI surface buildout (later sprint)
- COSTAR+ → `prompt` layman management UI (later sprint)
- Revising `docs/platform/Desktop.md` DDD doctrine to match official SvelteKit guidance (follow-up sprint — spec rewrite)

---

## Verification Matrix

| Phase | Command | Pass criteria |
|---|---|---|
| P0 | `git grep kernel_terms` (outside allowlist) | 0 results |
| P0 | `cargo check --workspace` | 0 errors |
| P0 | `pnpm svelte-check` | 0 errors |
| P0 | `pnpm test` (architecture test) | 0 failures |
| P1 | `cargo check -p devpulse-engine` | 0 errors |
| P2 | `cargo check -p devpulse_desktop_backend` | 0 errors |
| P3 | `cargo check -p devpulse-clyffy` | 0 errors |
| P4 | `pnpm svelte-check` | 0 errors |
| P5 | `pnpm svelte-check` + `pnpm coldlight:verify` | 0 errors |
| P6 | `xtask run-dev` → open `/signals` | Inspector renders live fake signals |
| P7 | `git commit` test with `BM25` in non-kernel file | lefthook blocks commit |

Each phase is a discrete commit. No phase merges until its gate passes.

---

## Doctrine Notes

- **Pre-release mode.** No backwards compatibility, no stubs, no shims. P0 migrates or deletes each consumer; it does not wrap the old TOML in a compatibility layer.
- **Don't delegate understanding.** Each P0 consumer migration requires reading the actual file and understanding what it does — not grep-and-replace.
- **Compile before claiming done.** Every phase gate runs a real command. Library crate checks are insufficient for crates that feed the Tauri binary — use `devpulse_desktop_backend` explicitly.
- **Owner approval between phases.** P0 is a blocker. P1–P7 each end with a real artifact the owner can see (check output, rendered route, blocked commit) before the next phase starts.
