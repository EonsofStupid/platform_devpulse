# S0 Research — Unified Signal System Audit

**Date**: 2026-04-21
**Source**: Deep audit agent, ground-truth from source inspection
**Parent**: `SPRINT-FOUNDATIONAL-REBUILD-MASTER.md`
**Verdict**: **(b) partially wired with clear gaps** — registry + types exist, wiring does not

---

## 1. What IS built (verified on disk)

### Registry + doctrine (100%)
- `systems/devpulse-engine/ip/signals.registry.yaml` — OTel-shaped SSOT
  - 5 families: `context`, `interaction`, `action`, `diagnostics`, `learning`
  - 7 groups: `rro`, `prompt`, `a2ui`, `minion`, `recipe`, `diagnostics`, `lesson`
  - 40+ signal IDs with stability tiers + enum members
- `systems/devpulse-engine/ip/signals.narrations.yaml` — 30 curated narration phrasings with visibility tiers
- `.claude/rules/ip-protection.md` — one-sided IP boundary doctrine (rewritten 2026-04-14)
- `systems/devpulse-engine/ip/kernel_terms.toml` — **DEPRECATED** legacy two-column mapping; 15 active readers block deletion

### Engine signal types (~800 LOC, ready to ship)
- `systems/devpulse-engine/src/signals/` (7 files)
- `Signal` struct with `SignalHeader { id: Uuid (v7), correlation_id, timestamp, source }`
- **6 typed payload structs**, all `#[derive(Type)]` specta-exported:
  - `ChatPayload`
  - `AnalyticsPayload`
  - `ContextPayload`
  - `InferencePayload`
  - `SystemPayload`
  - `GovernancePayload`
- `SignalRouter` = `tokio::sync::broadcast::Sender<Signal>` with capacity **1024**
- **One single emit site today**: engine startup "System Ready" signal

---

## 2. What's half-built

### Kernel bridge — STUB ONLY
- Expected: `kernel/clyffy/src/signals/mod.rs`
- **Does not exist.** Kernel-side emissions pending. Scheduled for P3 in `SPRINT-SIGNALS-GOLDEN-PATTERN.md`.

### Frontend signal domain — MISSING 100%
- Expected: `interfaces/desktop/src/lib/domains/app/signals/`
- **Completely absent**: no `data-access/`, no `util/`, no `feature/`, no `index.ts`.
- Specta types are ready to export but no Tauri IPC command handler for `subscribe_signals` exists.
- Scheduled for P4–P6.

---

## 3. Fragmentation — three competing event systems live simultaneously

### System A — New Signal System (registry-backed)
- Infrastructure: READY
- Consumers: **ZERO**
- Status: built but not wired. Calling `Signal::new()` today broadcasts into a router with no subscribers.

### System B — Old Event Facade (kernel internal, deprecated)
- Location: `systems/devpulse-engine/src/platform/facade/`
- Types: `InternalEvent` enum with 8 categories
- Channels: `surface_tx` (512 capacity) + `dev_tx` (1024 capacity)
- Status: **live and in use** by platform; being deprecated but not retired

### System C — Ad-hoc Tauri emits (uncoordinated)
- Examples: `platform:models-status`, `llama:server-ready`
- Pattern: every domain invents its own event names
- Status: **live and proliferating** — zero coordination with the registry

**Impact**: three event systems mean three places to look when debugging, three naming conventions, three serialization shapes. The charter's "one signal bus" requirement is directly blocked by the presence of B and C.

---

## 4. Codegen status

- ✓ `signals.registry.yaml` frozen and ready to be source
- ✗ **Zero codegen FROM the registry** — all types hand-written
- ⚠ Codegen still reads legacy `kernel_terms.toml` (that file must die before registry takes over)
- ✓ Specta payloads ready to export
- ✗ No Tauri `subscribe_signals` command bound to frontend

---

## 5. Channel inventory (for signal work)

Only **one channel type** currently used for signals: `tokio::sync::broadcast`.

| Channel | Capacity | Consumers today |
|---|---|---|
| `SignalRouter.tx` (new system) | 1024 | 0 |
| `facade::surface_tx` (old system) | 512 | live |
| `facade::dev_tx` (old system) | 1024 | live |

No flume or mpsc used for signals. Charter's `tokio::sync::broadcast` pick is validated by current code.

---

## 6. Consumer migration blocker — 15 readers of legacy `kernel_terms.toml`

Before `signals.registry.yaml` can be promoted to SOLE source, these 15 consumers must migrate:

1. `build.rs` (Rust codegen)
2. Frontend terminology generator
3. Architecture tests
4. GritQL enforcement rules
5. Pre-commit hooks (lefthook)
6. (+10 more — enumerated in `SPRINT-SIGNALS-GOLDEN-PATTERN.md` P0)

This migration is **P0 (blocker)** in the existing signals sprint. Any foundational rebuild must either (a) complete P0 first, or (b) accept running both systems during transition.

---

## 7. Gaps against owner's "unified signal system" ask

| Owner's requirement | Current state |
|---|---|
| One bus for all events | Three: registry router, old facade, ad-hoc Tauri emits |
| Every module emits through the bus | Only engine startup emits. Kernel silent. Frontend silent. |
| Registry-enforced vocabulary | Legacy `kernel_terms.toml` still authoritative for 15 consumers |
| Frontend subscribes via typed Tauri events | No `subscribe_signals` command; no domain to consume |
| Narrations piped to UI | Catalog exists; no consumer wires it |

---

## 8. What the charter must specify

1. **System B retirement plan** — `facade::InternalEvent` and its two broadcast channels must either fold into the new `SignalRouter` or be explicitly documented as "kept for kernel-internal debug, never crosses boundary."
2. **System C amnesty/ban** — every ad-hoc `platform:models-status`-style emit must be migrated to `signals.registry.yaml` IDs, or deleted. Charter preflight should ban un-registered Tauri `emit(...)` calls outside `signals/` module.
3. **Tauri command**: `subscribe_signals(filter: SignalFilter) -> EventStream<Signal>` — define it, wire it, the frontend signal domain depends on it.
4. **Codegen**: a `scripts/build/codegen-signals.rs` that reads `signals.registry.yaml` and emits:
   - Rust: `const SIGNAL_IDS: &[&str] = &[...]` + typed enum for compile-time `ip_term!` validation
   - TS: const string literals + Zod/ArkType schemas
5. **Legacy migration**: commit to P0 (kernel_terms.toml consumer migration) as the first chunk of S0 — not deferred to S1.
6. **Panic-safe spawn integration**: every spawned task that might emit signals must use `devpulse_telemetry::spawn()` (from the logging audit finding) so panics in signal emitters still capture breadcrumbs.

---

## 9. New STOP points surfaced

**C13** — Retirement of `facade::InternalEvent`:
- (A) Fold into `SignalRouter`; single bus
- (B) Keep kernel-internal facade; new `SignalRouter` for cross-boundary signals only
- (C) Keep both for now; document the boundary; revisit in S1

**C14** — Migration of 15 `kernel_terms.toml` consumers:
- (A) Block S0 on completing P0 (do the migration now)
- (B) Allow both systems during S0; P0 migration becomes its own pre-S1 sprint
- (C) Freeze `kernel_terms.toml` additions, migrate incrementally per module as each is rebuilt

**C15** — Signal codegen timing:
- (A) S0 ships codegen + registry-enforced compile-time validation (+1 week scope)
- (B) S0 ships runtime validation only; compile-time proc macro lands in S1

**C16** — Ad-hoc Tauri `emit` ban:
- (A) Preflight hard-fails any `emit(` outside the signals module (strict)
- (B) Preflight warns; violations are per-module tech debt (soft)
- (C) Allow through S0; strict ban in S1

---

## Verdict

The signal architecture is **sound by design but fundamentally incomplete in practice**.

If you call `Signal::new()` from the kernel today, it broadcasts into a router with zero subscribers. The frontend cannot consume signals at all. Legacy systems (facade + ad-hoc emits) remain authoritative because migration hasn't happened.

**To meet the owner's "unified signal system" bar**, S0 must include:
- Signal codegen from registry (replaces 15 legacy consumers)
- Frontend signal domain (empty → functional)
- `subscribe_signals` Tauri command
- Charter mandate that every module's `[signals]` section is the ONLY way to emit events
- Panic-safe spawn integration

Without these, the signal system stays "partially wired" and the charter's §§Unified Signal is aspirational.
