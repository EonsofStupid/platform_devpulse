# SPRINT: ColdLight Platform Architecture — Schema & Pipeline Foundation

**Date**: 2026-03-04
**Research**: `SPRINT-COLDLIGHT-PLATFORM-ARCHITECTURE.research.md`
**Depends On**: SPRINT-XTASK-FOUNDATION-V2 Phase 0 (SurrealDB 3.0.2 ✅)
**Status**: READY FOR REVIEW

## Goal

Establish the foundational schema enforcement, extensible effects, unified VPB shell, and database-backed devtools that make ColdLight a config/schema-driven, layman-friendly platform.

## Current State

```
✅ Token pipeline (SD5 DTCG → CSS + Tailwind @theme + TypeScript)
✅ 92 primitive contracts (Zod-validated, scanner-enforced)
✅ 7 effect categories (35+ effects, registry + Zod)
✅ dsAdapter system (60 ColdLight + 20 MeltUI)
✅ Recipe system (~50 presets, resolveVisual pipeline)
✅ VPB scaffolded (Canvas, Palette, Properties, Graph)
✅ Config system (8 fragments)
❌ No unified Zod schemas for ALL entities
❌ Effects hardcoded to 7 categories
❌ VPB is debug-only, not a tool shell
❌ No DB backing for devtools state
❌ No .userdata/ structure
❌ No HMR/restart visibility
```

---

## Phase 1: Entity Schema Foundation

**What**: Define and enforce Zod schemas for every ColdLight entity at every boundary.
**Why**: Industry standard (Carbon, Polaris, SLDS) — invalid state must be impossible.

### Tasks

- [ ] **1.1** Create `interfaces/desktop/src/lib/design/_schema/entities.ts`
  - Export Zod schemas for all 8 entities:
    - `DesignTokenSchema` (DTCG 1.0 format)
    - `RecipeDefinitionSchema` (exists in recipes/types.ts — extract and formalize)
    - `PresetDefinitionSchema` (new — validates preset registry entries)
    - `AdapterMappingSchema` (new — validates ComponentSchema from engine.ts)
    - `EncodingCategorySchema` (new — validates token-categories.ts entries)
    - `CategoryValueSchema` (new — validates individual category values)
  - Existing schemas stay in place: `PrimitiveContractSchema`, `EffectDefinitionSchema`
  - New file is the unified index that re-exports ALL entity schemas

- [ ] **1.2** Wire schemas to registration boundaries
  - Recipe registry (`recipes/index.ts`): validate on `registerRecipe()` — already partial, make strict
  - Preset registry (`registry/presets.ts`): validate on `register()` with `PresetDefinitionSchema`
  - Token category registry (`registry/token-categories.ts`): validate entries at module load
  - Adapter schemas (`api/adapters/{engine}/_internal/{kind}/schema.ts`): validate `ComponentSchema` shape

- [ ] **1.3** Wire schemas to scanner
  - Scanner already validates primitive contracts — extend to validate:
    - Recipe definitions (scan `recipes/` folder)
    - Preset definitions (scan `registry/presets.ts`)
    - Effect definitions (already done)
  - Add entity count to manifest: `{ primitives: 92, recipes: N, presets: N, effects: N }`

- [ ] **1.4** Create `_schema/index.ts` barrel export
  - Re-exports all entity schemas from one location
  - Used by scanner, config validation, runtime boundaries

- [ ] **1.5** Verify: `pnpm svelte-check` — 0 errors

---

## Phase 2: Extensible Effects Registry

**What**: Make effect categories a registered set, not a hardcoded const array.
**Why**: Owner needs to add new categories (parallax, distortion, etc.) without touching core.

### Tasks

- [ ] **2.1** Create `effects/category-registry.ts`
  - `EffectCategoryDefinitionSchema` (Zod)
  - `registerEffectCategory(def)` — validates + stores in Map
  - `getEffectCategory(id)` → `EffectCategoryDefinition | undefined`
  - `getAllCategories()` → array (replaces `EFFECT_CATEGORIES` const)
  - Conflict behavior: `"exclusive"` (one per element) vs `"stackable"` (multiple OK)

- [ ] **2.2** Migrate existing 7 categories to use registry
  - Each category file (`glass/`, `glow/`, etc.) calls `registerEffectCategory()` at import
  - Remove hardcoded `EFFECT_CATEGORIES` const from `_schema/types.ts`
  - Replace with `getRegisteredCategoryIds()` derived from registry
  - Update `EffectCategorySchema` to use dynamic validation: `z.string().refine(id => hasCategory(id))`

- [ ] **2.3** Update scanner to read effect categories from registry
  - Scanner currently imports `EFFECT_CATEGORIES` — switch to `getAllCategories()`
  - Manifest gets category definitions with metadata (label, conflict behavior, trigger defaults)

- [ ] **2.4** Update VPB controls to be category-driven
  - `PropControlFactory.svelte` reads category list from manifest, not hardcoded switch
  - New categories get a default "select" control automatically

- [ ] **2.5** Verify: `pnpm svelte-check` — 0 errors

---

## Phase 3: VPB Tool Shell Architecture

**What**: Transform VPB from a debug tool into a unified devtools shell with registered tool panels.
**Why**: Owner needs node editor, token configurator, component inspector — all in one.

### Tasks

- [ ] **3.1** Create tool registry: `sys/debug/vpb/tools/registry.ts`
  - `VpbToolSchema` (Zod) — id, label, icon, position, order, requiresManifest
  - `registerTool(def)` — validates + stores
  - `getTools()` → sorted by position + order
  - `getToolById(id)` → tool definition

- [ ] **3.2** Create shell layout: `sys/debug/vpb/VpbShell.svelte`
  - Toolbar with tool tabs (reads from registry)
  - Main panel (switches tool component based on active tab)
  - Sidebar panel (secondary tools)
  - Bottom panel (tertiary tools)
  - Persist active tool in tool state

- [ ] **3.3** Register existing VPB panels as tools
  - `page-builder` → current Canvas + Palette + Properties (main)
  - `contract-inspector` → current ContractInspector (sidebar)
  - `encoding-playground` → current EncodingOutput (bottom)

- [ ] **3.4** Create stub tools for future work
  - `node-editor` → placeholder with "Node Editor — coming soon" + tool boundary defined
  - `token-config` → placeholder with tool boundary defined
  - `preset-palette` → placeholder with tool boundary defined
  - `effect-composer` → placeholder with tool boundary defined

- [ ] **3.5** Verify: `pnpm svelte-check` — 0 errors, VPB shell renders with tool tabs

---

## Phase 4: Database Schema for Devtools

**What**: PostgreSQL (LibSQL) tables for VPB documents, user preferences, tool state.
**Why**: Devtools need persistence. Currently VPB state is volatile.

### Tasks

- [ ] **4.1** Define LibSQL schema: `systems/devpulse-engine/src/platform/stores/schemas/devtools.sql`
  - `vpb_documents` table (id, name, tree JSON, created_at, updated_at)
  - `user_preferences` table (key, value JSON, updated_at)
  - `tool_state` table (tool_id, key, value JSON)
  - All tables use `IF NOT EXISTS` for safe re-initialization

- [ ] **4.2** Add schema initialization to relational store boot
  - `RelationalStore::boot()` runs devtools schema after core schema
  - Schema is embedded via `include_str!()` (same pattern as platform schema)

- [ ] **4.3** Add IPC commands for devtools persistence
  - `save_vpb_document(doc: VpbDocument)` → upsert to `vpb_documents`
  - `load_vpb_documents()` → list all documents
  - `get_preference(key: String)` → Option<Value>
  - `set_preference(key: String, value: Value)` → ()
  - `get_tool_state(tool_id: String, key: String)` → Option<Value>
  - `set_tool_state(tool_id: String, key: String, value: Value)` → ()

- [ ] **4.4** Wire VPB state to IPC
  - `vpbConnection.svelte.ts` saves/loads via IPC instead of localStorage
  - Tool state (active panel, sidebar width, etc.) persisted per-tool

- [ ] **4.5** Verify: `cargo check -p devpulse_desktop_backend` + `pnpm svelte-check`

---

## Phase 5: .userdata/ Directory Structure

**What**: Organized user data directory with portable mode support.
**Why**: Self-enclosed distribution, professional data management.

### Tasks

- [ ] **5.1** Define directory layout in platform config
  - Add `[userdata]` section to `platform.default.toml`:
    ```toml
    [userdata]
    mode = "standard"  # "standard" (AppData) or "portable"
    ```
  - Portable mode: check for `.portable` sentinel file next to binary

- [ ] **5.2** Create `UserDataPaths` struct in platform config
  - `config/` — user config overrides
  - `db/` — database files (libsql/, duckdb/, surreal/)
  - `cache/` — cached manifests, parsed data
  - `projects/` — per-project VPB exports
  - `logs/` — rotated app logs
  - Methods: `config_dir()`, `db_dir()`, `cache_dir()`, `projects_dir()`, `logs_dir()`

- [ ] **5.3** Update `Platform::boot()` to use `UserDataPaths`
  - Store paths derived from `UserDataPaths.db_dir()` instead of hardcoded
  - Create all directories on first boot

- [ ] **5.4** Verify: `cargo check -p devpulse-engine`

---

## Phase 6: HMR / Restart Visibility

**What**: Toast notifications + StatusBar indicator for dev server state changes.
**Why**: Owner sees nothing when server restarts. Dead silence = bad UX.

### Tasks

- [ ] **6.1** Extend `PlatformHealth` rune with `rebuilding` state
  - Add `rebuilding: boolean` to health state
  - Add `lastError: string | null` to health state
  - Poll detects rebuilding via IPC `get_dev_state()` (or Vite WebSocket)

- [ ] **6.2** Update `StatusBar.svelte` with rebuilding indicator
  - Yellow dot + spinner when rebuilding
  - Red dot when error
  - Existing green/gray for connected/offline

- [ ] **6.3** Add toast notifications via svelte-sonner
  - HMR update → "Hot update applied" (2s auto-dismiss)
  - Full reload → "Dev server restarting..." → "Ready"
  - Build error → sticky toast with error summary
  - Store boot → "Platform stores initialized (4/4)" (3s)

- [ ] **6.4** Verify: `pnpm svelte-check`

---

## Verification

After all phases:
- `pnpm svelte-check` — 0 errors
- `cargo check --workspace` — 0 errors
- `pnpm coldlight:generate` — manifest includes entity counts
- `pnpm coldlight:verify` — all schemas validated
- VPB shell renders with tool tabs
- VPB documents persist across app restart
- StatusBar shows rebuilding state

---

## Parking Lot (Future Sprints)

- [ ] Node editor implementation (graph visualization library selection)
- [ ] Token configurator (visual DTCG token editing → file write)
- [ ] @theme inline optimization (runtime theming)
- [ ] Stylelint plugin for token enforcement
- [ ] DuckDB analytics tables (token usage, component coverage)
- [ ] Runtime feature flag toggle system
- [ ] Lab dual-boot integration
