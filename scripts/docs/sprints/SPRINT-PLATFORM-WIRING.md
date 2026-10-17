# SPRINT: Platform Wiring — Chat + Dashboard + Specta + Rendering

**Date**: 2026-03-29
**Status**: DRAFT — Owner approval required
**Prerequisites**: Primitives (DONE), Components (DONE), Visual System (DONE)

---

## Current State — Honest

### DONE (this session)
- 64 primitives — gold standard, all verified
- 91 components — aligned to primitives, anatomy spreads, typed
- Visual system — 6 families × 6 variants = 36 presets, all compiled
- SD5 pipeline — TS→JSON→SD5→40,513 lines CSS on :root
- resolveMacro — typed (KindName, PresetId, SemanticIntent)
- Animation keyframes — 6 new family-specific animations
- Central type registry — KindName, PresetFamily, PresetId, SizeName, VisualAxis

### NOT DONE
- `bindings.ts` not generated (specta hasn't run in dev mode)
- 85 components have hardcoded @defaults (should reference presets)
- 3 deprecated aliases in _base (ComponentProps, ComponentCategory, ComponentDef)
- ADR-001 is stale — doesn't match current architecture
- State overrides (hover/active/disabled) authored in TS but NOT compiled to SD5 JSON
- Chat page uses raw `invoke()` strings — not typed specta bindings
- Dashboard uses ColdLight components but NOT the new preset system
- SurrealDB not running (platform engine not booted)
- Only 3 `invoke()` calls used from 15 registered commands
- Routes exist but most render placeholder content

---

## Priority Order

### P0: Generate Specta Bindings (30 min)
**Why first:** Every frontend→backend call is untyped. One `cargo build` in dev mode
generates `bindings.ts` with typed wrappers for all 15 commands. Every invoke becomes
type-safe instantly. Zero effort, massive safety gain.

**Steps:**
1. `cd interfaces/desktop/src-tauri && cargo build` (dev mode generates bindings)
2. Verify `src/lib/sys/generated/bindings.ts` exists with typed functions
3. Replace raw `invoke("command")` calls with typed `commands.commandName()`
4. svelte-check

### P1: Delete Deprecated Aliases (15 min)
**Why:** Pre-release. No backwards compat. Delete:
- `ComponentProps` → consumers use `UIBaseProps`
- `ComponentCategory` → consumers use `UICategory`
- `ComponentDef` → consumers use `UIDef`
Find consumers, update imports, delete aliases.

### P2: Compile State Overrides to SD5 (1 hr)
**Why:** Hover/active/disabled presets are authored in TS but the build script
only emits default state values. The JSON needs `{kind}-{preset}-hover-*` entries.

**Steps:**
1. Update `generate-style-presets.ts` to emit state override entries
2. Each state becomes: `--style-button-neuro-elevated-hover-background-color: ...`
3. Update `resolveMacro` to accept state and read `${p}-${state}-${axis}` vars
4. Update `macro-base.css` to apply state vars on `:hover`, `:active`, `[disabled]`
5. Regenerate + recompile SD5

### P3: Replace @defaults with @defaultPreset (agent batch, 1 hr)
**Why:** 85 components have identical hardcoded oklch values in HTML comments.
Replace with `@defaultPreset neuro-elevated` reference. The scanner reads this.

**Steps:**
1. For each component .svelte: replace `@defaults { ... }` block with `@defaultPreset neuro-elevated`
2. Add `@presets neuro-elevated, glass-deep, retro-solid, chrome-elevated, flat-minimal, stark-elevated`
3. Agent batch — 91 files, same mechanical edit

### P4: Wire Chat Route to Typed Commands (2 hr)
**Why:** Chat is the dogfooding surface. It must use typed specta bindings,
connect to the engine via Tauri IPC, persist messages to LibSQL.

**Steps:**
1. Import generated `commands` from `bindings.ts`
2. Replace `invoke("send_message", {...})` with `commands.sendMessage({...})`
3. Wire `load_recent` → thread history on mount
4. Wire `post_reaction` → message reactions
5. Verify message persistence (requires engine boot)

### P5: Wire Dashboard Route to Preset System (2 hr)
**Why:** Dashboard is the visual showcase. It should demonstrate the preset
system — different widgets using different presets from different families.

**Steps:**
1. Update dashboard widgets to use diverse presets
   - Health gauge: `neuro-glow` (teal emission for live data)
   - Stats cards: `glass-elevated` (frosted panels)
   - Activity feed: `neuro-deep` (recessed container)
   - Charts: `chrome-minimal` (brushed aluminum frame)
2. Verify preset switching works visually
3. Add a preset picker demo (dropdown → live visual change)

### P6: ADR-001 Rewrite (1 hr)
**Why:** The architecture evolved but the document didn't. ADR-001 references
StyleMacro.svelte (deleted), intent (now preset), catalog.ts (deleted),
ComponentDef (now UIDef), Zod (now ArkType). Needs complete rewrite.

**Steps:**
1. Document actual architecture as-built
2. Remove references to deleted systems
3. Add visual system (preset families, typed registry)
4. Add SD5 pipeline as-built
5. Update component pattern to match gold standard

### P7: Boot Platform Engine (2 hr)
**Why:** Without the engine, SurrealDB is down, chat can't persist,
dashboard has no data. The engine manages all services.

**Steps:**
1. `cargo xtask run-dev` — boots Tauri + engine + all services
2. Verify SurrealDB health: `curl http://127.0.0.1:8822/health`
3. Verify chat persistence end-to-end
4. Verify dashboard data flow

---

## Execution Order

```
P0: Specta bindings     ─┐
P1: Delete aliases       ├── Foundation (same day, quick)
                        ─┘
P2: State overrides     ─── Visual completion
P3: Replace @defaults   ─── Component cleanup (agent batch)
P4: Chat wiring         ─┐
P5: Dashboard wiring     ├── Route rendering
P6: ADR-001 rewrite      │
P7: Boot engine         ─┘── Full stack running
```

---

## BLOCKED BY (external)

- Engine boot requires all Rust crates to compile (currently passes `cargo check`)
- Chat persistence requires SurrealDB on 8822 (starts with engine)
- Dashboard data requires engine → devpulse service running

---

## Owner Decision Gates

1. **P2**: Should state overrides be per-kind or shared across kinds?
   (Per-kind = `button-neuro-elevated-hover-*`, shared = `neuro-elevated-hover-*`)
2. **P5**: Which presets should each dashboard widget use?
3. **P6**: Should ADR-001 be a single doc or split into multiple ADRs?
