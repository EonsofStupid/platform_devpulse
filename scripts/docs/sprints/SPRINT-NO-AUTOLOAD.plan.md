# SPRINT: Rip Out All Auto-Load / Hot-Load Behavior

> **Mission**: No model ever gets loaded into GPU/RAM without an explicit user Apply click.
> **Owner directive 2026-04-20**: model loading is deliberate; never automatic.
> **Workflow**: foundational-author — read every file, note as I go, then execute.

## Ground truth (locked)

- `auto_assign_bundled_slots` is **metadata-only** — writes slot→model-id to the config backend (libSQL kv_store). Does NOT call `load_slot`. Keep.
- `auto_load_hot_slots` is the offender — it explicitly loads every slot marked `hot` strategy. Kill. Remove the function too if no callers remain after boot is cleaned.
- `finalize_registry` does: scan models → restore_assignments → auto_assign_bundled_slots. Also metadata-only. Keep.
- Anywhere else that calls `load_slot` / `warm_slot` / `swap_model` / `hot` without a user-triggered Tauri command path is suspect.

## Phase 1 — Read every file involved

### Starting call-site map (from grep)

| File | Line | Mention | Needs Read |
|---|---|---|---|
| `kernel/model-loader/src/service.rs` | 609, 1164 | `auto_assign_bundled_slots`, `auto_load_hot_slots` | YES |
| `kernel/model-loader/src/hardware/vram.rs` | 1, 13 | `auto_load` comments | YES |
| `kernel/model-loader/config/slots.default.toml` | 60, 283 | `auto_assign` docs | YES (skim) |
| `systems/devpulse-engine/src/platform/services/model_loader.rs` | 134, 144-146 | wrappers | YES |
| `systems/devpulse-engine/src/platform/boot/model_loader.rs` | 125 | CLEANED (comment only) | verify current state |
| `kernel/model-loader/tests/real_loader_smoke.rs` | 306, 521 | test calls | LOW (tests) |

### Files to read (Phase 1 order)

1. `kernel/model-loader/src/service.rs` — find `auto_load_hot_slots` body + every load path.
2. `systems/devpulse-engine/src/platform/services/model_loader.rs` — the facade exposing `auto_load_hot_slots`.
3. `systems/devpulse-engine/src/platform/boot/model_loader.rs` — verify cleaned.
4. Grep for MORE call sites I may have missed: `load_slot`, `warm_slot`, `is_hot`, `HotSlot`, `strategy.*hot`, `preload`, `activate` on a boot/init/startup path.
5. Frontend: `modelsState` + `wizardState` + any `$effect` that calls `load()` on mount.
6. `kernel/model-loader/config/slots.default.toml` — see what strategies are declared.

---

## Phase 1 findings — complete

### `kernel/model-loader/src/service.rs` (1372 LOC)

**Line 609-662 — `auto_assign_bundled_slots(&self) -> anyhow::Result<usize>`**
- Iterates slots where `assigned_model.is_none() && source_tier == Bundled`.
- For each: looks up the bundled file in the registry, sets `slot.assigned_model = Some(model_id)`, persists to `cfg.config.set("slot.{id}.model", &model_id)`.
- **METADATA ONLY.** No `load_slot`, no `warm_slot`, no GPU/RAM allocation.
- Status: **CORRECT — KEEP.**

**Line 1164-1183 — `auto_load_hot_slots(&self) -> usize`**
- Iterates slots where `loading == LoadingStrategy::Hot && assigned_model.is_some()`.
- Calls `self.load_slot(&slot_id).await` → real inference allocation.
- Status: **BROKEN by directive — DELETE.**

**Line 1114 — `self.load_slot(slot_id).await`**
- Inside `swap_model()`. User-initiated swap (unload → assign → load). OK.

### `kernel/model-loader/src/slots/defaults.rs:126-128`
- `fn default_loading_hot() -> LoadingStrategy { LoadingStrategy::Hot }` — serde default.
- If a slot TOML omits `loading = "..."`, it defaults to Hot.
- With `auto_load_hot_slots` removed, `Hot` becomes an inert hint. Safe to leave, but **better to change default to `OnDemand`** so new slots don't declare the intent-to-load without meaning it.
- Status: **FIX — rename to `default_loading_on_demand`, return `OnDemand`.**

### `kernel/model-loader/src/slots/persistence_class.rs:16`
- Comment: "wake-word detector has `LoadingStrategy::Hot` (load at boot) and `PersistenceClass::AlwaysOn`".
- This doc is wrong after the change. Status: **FIX — update comment.**

### `kernel/model-loader/src/slots/registry.rs:138` and `fallback.rs:75`
- Both set `loading: LoadingStrategy::Hot` inside test helpers or fallback factories.
- No auto-load consumer remains. Inert. Status: **LEAVE — cosmetic, inert.**

### `kernel/model-loader/config/slots.default.toml`
- Zero `loading = "Hot"` entries in production config. All slots are OnDemand / Warm / Signal.
- Status: **CORRECT — no change.**

### `systems/devpulse-engine/src/platform/services/model_loader.rs`
- Line 127-140: `finalize_registry` calls scan → restore_assignments → auto_assign_bundled_slots. All metadata. OK.
- Line 144-147: `auto_load_hot_slots` wrapper. No caller remains. Status: **DELETE.**

### `systems/devpulse-engine/src/platform/boot/model_loader.rs`
- Background task: `bg_service.finalize_registry().await` only. No `auto_load_hot_slots`. ALREADY CLEAN (commit 2da8e919).
- Status: **CORRECT.**

### Frontend audit
- Every `modelsState.load(slotId)` / `commands.loadSlot(slotId)` call is inside a named async function (`handleLoad`, `loadTts`, `loadSlot`, `handleLoadNow`, `assignAndLoad`).
- Every such function is called only from a button `onclick` or wizard Apply.
- No `$effect` or `onMount` triggers a model load.
- `bootstrapDownloadBridge` in `+layout.svelte:31` — subscribes to kernel events for download progress UI. Does NOT load models. Safe.
- **Bug found — `+layout.svelte:40-47`**: `hardwareState.ensureListening("root-layout")` fired on every root-layout mount. Hits `get_hardware_metrics` before platform boot reports Ready, so logs show "Hardware metrics unavailable: Platform not ready". Not a model load, but still an unsolicited auto-fetch. Removed.
- `ModelLoaderPanel.svelte:37-42` — `$effect { panelState.start() }` which calls `hardwareState.startListening()`. Runs only when the panel component mounts (opened via wizard/nav). User-triggered. **LEAVE**.
- `wizard.service.ts:51-53` — `hardwareState.ensureListening("wizard-start")` at wizard-start. User-triggered. **LEAVE**.
- Status: **FIXED — root-layout hardware auto-attach removed.**

---

## Phase 2 — Bug list

### Bug 1 — `auto_load_hot_slots` loads models without user consent
- File: `kernel/model-loader/src/service.rs`
- Lines: 1163-1183
- Broken code:
```rust
pub async fn auto_load_hot_slots(&self) -> usize { ... loops over Hot slots, calls self.load_slot(...) }
```
- Root cause: function exists and was called from boot. Boot call already removed, function remains orphaned.
- Fix: delete lines 1163-1183 entirely.
- Dependencies: must also delete engine wrapper (Bug 2).

### Bug 2 — Engine facade `auto_load_hot_slots` wrapper
- File: `systems/devpulse-engine/src/platform/services/model_loader.rs`
- Lines: 142-147
- Fix: delete lines 142-147.
- Dependencies: none beyond Bug 1.

### Bug 3 — `default_loading_hot` declares new TOML-omitted slots as Hot
- File: `kernel/model-loader/src/slots/defaults.rs`
- Lines: 126-128 (+ every #[serde(default = "default_loading_hot")] attribute referencing it)
- Fix: rename to `default_loading_on_demand`, return `LoadingStrategy::OnDemand`. Update any serde attr that names the fn.
- Dependencies: none.

### Bug 4 — Stale comment in `persistence_class.rs`
- File: `kernel/model-loader/src/slots/persistence_class.rs`
- Lines: 15-20
- Broken text: "wake-word detector has `LoadingStrategy::Hot` (load at boot)"
- Fix: change to note that `Hot` is an INERT hint after no-autoload policy (2026-04-20).
- Dependencies: none.

### Bug 5 — Root layout auto-fires hardware telemetry on mount
- File: `interfaces/desktop/src/routes/+layout.svelte`
- Lines: 40-47 (call site), line 9 (import), cleanup call in return.
- Broken code:
```svelte
hardwareState
    .ensureListening("root-layout")
    .then(() => { logInfo("layout", "hardware telemetry attached"); })
    .catch((e) => { logError("layout", `hardware telemetry FAILED to attach: ${e}`); });
```
- Root cause: fired on every layout mount, before platform boot reports Ready. `get_hardware_metrics` is gated on Ready and rejects with "Platform not ready", polluting the console.
- Fix: delete the `.ensureListening` call + its cleanup + the unused `hardwareState` import. Replace with a comment pointing routes that need live metrics at `hardwareState.ensureListening(reason)` in their own `onMount`.
- Dependencies: none.

---

## Phase 3 — Execution plan

1. `service.rs` — delete lines 1163-1183 (`auto_load_hot_slots`). Compile kernel.
2. `model_loader.rs` (engine facade) — delete lines 142-147. Compile desktop backend.
3. `defaults.rs` — rename serde default + search for `#[serde(default = "default_loading_hot")]` usages and update.
4. `persistence_class.rs` — update comment.
5. Final compile: `cargo check -p devpulse_desktop_backend`.
6. Commit.

