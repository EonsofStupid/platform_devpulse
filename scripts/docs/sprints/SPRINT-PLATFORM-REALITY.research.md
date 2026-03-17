# Research: Platform Reality Sprint

**Date**: 2026-03-07
**Sprint**: SPRINT-PLATFORM-REALITY
**Status**: IN_PROGRESS

## Question/Goal
Fix ALL the gaps identified in the full audit. Make the app ACTUALLY work as intended.

## Codebase Analysis — RAW NOTES

### Shell Recipe: ACTUALLY LOADS (corrected)
- `design/index.ts:93` → `import "./recipes/layouts/shell/index.js"`
- `recipes/layouts/shell/index.ts` → `import "./shell.app.js"`
- `shell.app.ts` calls `registerRecipe({ id: "shell.app.default", ... })`
- Frame.svelte:30 calls `getRecipe("shell.app.default")` — this SHOULD return the recipe
- If it doesn't render styled, the issue is CSS custom properties not existing (--app-shell-bg-start, --app-shell-bg-end)
- OR the import order is wrong (recipe registers AFTER Frame reads it)
- NEED TO VERIFY: run pnpm dev and check console for recipe registration timing

### Widget recipe: ALSO LOADS
- `design/index.ts:94` → `import "./recipes/blocks/widget/index.js"` → `widget.default.js`

### Component recipes in recipes/components/ — 34 files — NEVER LOADED
- `recipes/components/button/button.default.ts` — calls registerRecipe() but NO side-effect import
- Same for all 34: alert, badge, banner, button, callout, card, checkbox, color-input, combobox, dialog, form, form-field, input, input-group, label, number-input, pagination, panel (4 variants), radio-group, search-input, select, slider, switch, tabs, tags-input, textarea, toggle, toggle-group
- These need side-effect imports added to `design/index.ts` or a barrel

### Rust Engine — REAL stores
- `platform.default.toml` configures 4 stores:
  - relational: LibSQL (kind="libsql", path="libsql/platform.db")  ← NOTE: NOT PostgreSQL! It's LibSQL!
  - analytics: DuckDB (kind="duckdb", path="duckdb/analytics.duckdb")
  - graph: SurrealDB (kind="surreal", path="surreal/reasoning", ns="maestro", db="devpulse")
  - cache: Moka in-memory (max_capacity=10000)
- NO RRO/Qdrant/vector store in the engine yet
- Platform::boot() emits InitEvent per store via Tauri events
- Platform::health() pings all stores, returns SubsystemHealth[]
- Store trait: name(), role(), ping(), is_ready()
- Names emitted: "Relational store", "Analytics store", "Graph store", "Cache store"

### CRITICAL: Relational is LibSQL NOT PostgreSQL
- MEMORY.md says PostgreSQL but platform.default.toml says LibSQL
- RelationalStore wraps LibSqlAdapter from maestro::cortex::persistence
- NEED TO CLARIFY with owner

### Frontend Label Maps — TWO DUPLICATES
1. `platformState.svelte.ts:31-35` FRIENDLY_NAMES:
   - "Relational store" → "Data Store"
   - "Analytics store" → "Analytics Engine"
   - "Graph store" → "Knowledge Graph"
   - "Cache store" → "Memory Cache"

2. `boot-labels.ts:13-18` FRIENDLY_LABELS:
   - "Data layer" → { label: "System", icon: "gear" }
   - "Relational store" → { label: "Data Store", icon: "database" }
   - "Analytics store" → { label: "Analytics Engine", icon: "chart" }
   - "Graph store" → { label: "Knowledge Graph", icon: "brain" }
   - "Cache store" → { label: "Memory Cache", icon: "lightning" }

Problems:
- boot-labels.ts is NEVER imported by StatusBar or platformState
- platformState has its own map that duplicates it
- Icon strings are dead — never resolved to Lucide components
- Missing: Graph store should be "Cortex" in prod, not "Knowledge Graph"
- Missing: RRO vector store entirely
- StatusBar uses `sub.friendlyName` which comes from platformState.FRIENDLY_NAMES

### StatusBar Dev/Prod Split
- `StatusBar.svelte:34` and `:99` — `{#if flags.DEV_MODE}` gates raw names
- Boot mode: shows per-subsystem badges with name + state + latency
- Post-boot: shows connection badge + subsystem text (dev only)
- Pattern is correct, just needs correct labels and icons

### Hub Pages — ALL EMPTY
- DevPulse: Most complete. Has gauges, charts, health widget. Uses devpulseState + platformState.
- Maestro: 3 empty Widgets. Text only. Zero icons.
- OverMind: 3 empty Widgets. Text only. Zero icons.
- WiredFront: 2 empty Widgets. Text only. Zero icons.
- DevForge: 2 empty Widgets. Text only. Zero icons.
- ALL hub pages import: Grid/Stack/HStack/Text from design + Widget from blocks

### Icon System
- lucide-svelte ^0.564.0 in package.json
- Only used in: Sidebar (8), TopBar (3), ChatOverlay (6), chat page (3)
- Zero icons on ANY hub dashboard page

### What Owner Wants Per Hub
- DevPulse: Home hub. System overview, stats, health, projects.
- OverMind: Playground, Testing, Experiments, Sandbox, Learning, Training
- WiredFront: Screenshot, Video, Audio, Image editing, Twitch/YouTube/AngryVibers streaming, Notes, Voice
- DevForge: Build pipeline, CI/CD, Environments, Node CLI
- Maestro: AI orchestrator (SENSITIVE IP). Minions, CAG, RAG, HyDE, KV cache

### Visual Tokens — Too Conservative
- v-g1 (glow teal): `--shadow-glow: 0 0 12px oklch(...)` at ~0.4 opacity
- References demand: 20-40px at 0.6-0.8 opacity
- Surfaces are flat semi-transparent fills, references show gradient backgrounds
- Borders are 1px solid, references show gradient/multi-layer glowing edges

## Files Referenced
- `design/index.ts` — Public API barrel, lines 93-94 import shell + widget recipes
- `recipes/layouts/shell/shell.app.ts` — Shell recipe, DOES load
- `recipes/layouts/shell/index.ts` — Barrel for shell recipes
- `recipes/components/*/` — 34 recipe files, NEVER loaded
- `sys/runes/platformState.svelte.ts:31-35` — FRIENDLY_NAMES duplicate
- `sys/boot/boot-labels.ts` — FRIENDLY_LABELS + icon strings (dead)
- `layouts/app/StatusBar.svelte` — Dev/prod split, correct pattern
- `layouts/app/Frame.svelte:30` — getRecipe("shell.app.default")
- `systems/devpulse-engine/platform.default.toml` — Store config (LibSQL, DuckDB, SurrealDB, Moka)
- `systems/devpulse-engine/src/platform/mod.rs` — Platform::boot() + health()
- `systems/devpulse-engine/src/platform/stores/*.rs` — 4 store wrappers
- `routes/(app)/overmind/+page.svelte` — Empty skeleton
- `routes/(app)/wiredfront/+page.svelte` — Empty skeleton
- `routes/(app)/devforge/+page.svelte` — Empty skeleton
- `routes/(app)/maestro/+page.svelte` — Empty skeleton

## Key Corrections from Research
1. Shell recipe DOES load — my audit was wrong about that. If Frame isn't styled, it's a CSS var issue.
2. Relational store is LibSQL, NOT PostgreSQL. Memory says PostgreSQL — needs clarification.
3. 34 component recipes exist but are never imported. Easy fix: barrel import in design/index.ts.
4. RRO (Qdrant rebranded) has NO Rust store wrapper yet. Engine only has 4 stores.
