# Research Notes: Foundation — Terminology Registry + Devtools Architecture

## Date: 2026-03-13

## What Was Completed This Session

### Terminology Registry (SSOT) — DONE
- Extended `systems/devpulse-engine/ip/kernel_terms.toml` — 55 terms with prod/dev fields, 6 features, 6 personality action types
- Built TOML→TS codegen: `scripts/build/terminology/generate.ts`
- Generated: `src/lib/sys/generated/terminology.ts` (runtime functions: resolveLabel, devLabel, prodLabel, minionStatus, sanitizeForProd, isFeatureEnabled, DEV_MODE)
- Created: `src/lib/sys/generated/terminology-icons.ts` (thin Lucide icon map)
- Deleted: `boot-labels.ts`, `flags.ts` — zero hand-maintained duplicates
- Updated all consumers: platformState.svelte.ts, StatusBar.svelte, maestro/+page.svelte, sys/index.ts
- Wired `pnpm generate:terminology` into dev/build scripts
- Fixed 3 broken VPB controls (DepthControl, AccentControl, VariantControl) — app no longer crashes
- **svelte-check: 0 errors**

---

## Database Verification

All 4 databases are EMBEDDED and boot automatically:
- **LibSQL** — `libsql = "0.9"`, file at `{data}/libsql/platform.db`
- **DuckDB** — `duckdb = "1.1" features=["bundled"]`, file at `{data}/duckdb/analytics.duckdb`
- **SurrealDB** — `surrealdb = "3.0" features=["kv-surrealkv"]`, pure Rust SurrealKV at `{data}/surreal/reasoning/`
- **Moka** — `moka = "0.12"`, in-memory concurrent cache
- **RRO/Qdrant** — declared in Cargo.toml but ZERO integration (no adapter, no boot step, no imports)

No Docker. No external services. `Platform::boot()` opens all 4 on startup, emits progress events per-store. Config in `platform.default.toml`.

## IP Protection — Rust Side (Already Working)

- `kernel_terms.toml` — 55 terms, SSOT
- `ip_term!()` macro — compile-time vocabulary swap
- `#[cfg(feature = "kernel")]` vs `#[cfg(feature = "engine")]` — struct-level redaction
- `TraceDetail` — two entirely different structs at compile time (kernel=full detail, engine=redacted)
- Engine facade pattern correct: Desktop → Engine → Kernel (kernel never exposed directly)

## IP Protection — Frontend Side (Now Working)

- `__DEV__` = `import.meta.env.DEV` — Vite strips in prod builds
- VPB behind `__DEV__` in app layout — correctly tree-shaken
- `DEV_MODE` from generated terminology replaces dead `flags.ts`
- `resolveLabel()` returns dev labels in dev mode, prod labels in prod mode
- `sanitizeForProd()` replaces all engine terms in a string with prod labels

## Feature Flags

- Old `flags.ts` — DELETED. Was dead code (zero imports anywhere)
- New: `FEATURES` in generated terminology.ts, driven from `[features]` section of kernel_terms.toml
- `isFeatureEnabled(name)` function available
- Feature flags: viper_memory(off), maestro_thoughts(off), journey_analytics(off), overmind(on), wiredfront(on), context_debugger(off)

---

## VPB Verdict: FULL REWRITE

Every VPB file uses:
- Hand-rolled CSS with `--vpb-*` custom properties — bypasses design system entirely
- Hardcoded color values (`var(--color-teal-600)` inline strings)
- Not based on block library, tokens, or recipes
- No config-driven or schema-driven patterns
- Cannot be themed or extended
- Scoped-out junior code — not production quality

**Decision: DELETE ALL VPB and reauthor under devtools/ architecture.**

---

## What Needs Sprint Planning

### 1. Boot Overlay
- BootOverlay.svelte — renders during `platformState.isBooting`
- Uses `resolveLabel()` + `getIcon()` from generated terminology
- Per-subsystem status with progress bar
- Content blocked until stores ready
- Domain pages need `platformState.isReady` gates

### 2. Devtools Platform Architecture (VibePulse)
Owner requirements:
- `devtools/` main folder — hypermodular boundary-aligned tools
- Config-driven and schema-driven — required files, naming, auto-import
- First-party naming established before scoped features
- Educational tooltips/nudges teaching SD5, build process, Svelte runtime
- Fun stimulating visuals — layman UI executing senior dev tasks
- AI-vetted workflow: scope → build → vet → submit

VPB sub-tools:
- Style Dictionary pipeline manager (author tokens → preview → validate)
- Octokit devtool (execute build tasks, generate tokens/CSS)
- Component editor (material/bevel/glow neumorphism engine)
- Block composer (drag-and-drop page building)
- Token inspector/editor

### 3. Token Reality
- Tokens NOT established correctly per real vision
- Raw JSON needs proper authoring (hex/px) → faithful SD5 generation
- Generated CSS must actually be consumed by components
- Pages currently use inline `style=` with raw `var()` calls — must change

### 4. ui/ Layer (4-Layer Architecture)
- Owner approved Radix/Ark/shadcn model
- primitives (config) → recipes (styling) → components (headless) → ui (styled)
- Reference implementation: Button, Card, Dialog
- `ui/` does NOT exist on disk yet

### 5. RRO/Qdrant Integration
- Write Rust adapter in persistence layer
- Add boot step to Platform::boot()
- Add to terminology mapping (already has entry in TOML)
- Add to StatusBar display

---

## Key Files Modified This Session

| File | Action |
|------|--------|
| `systems/devpulse-engine/ip/kernel_terms.toml` | EXTENDED — prod/dev/features/personality |
| `scripts/build/terminology/generate.ts` | NEW — TOML→TS codegen |
| `src/lib/sys/generated/terminology.ts` | NEW (generated) |
| `src/lib/sys/generated/terminology-icons.ts` | NEW — Lucide icon map |
| `src/lib/sys/boot/boot-labels.ts` | DELETED |
| `src/lib/sys/cfg/flags.ts` | DELETED |
| `src/lib/sys/runes/platformState.svelte.ts` | UPDATED — imports from terminology |
| `src/lib/layouts/app/StatusBar.svelte` | UPDATED — imports from terminology |
| `src/routes/(app)/maestro/+page.svelte` | UPDATED — DEV_MODE from terminology |
| `src/lib/sys/index.ts` | UPDATED — re-exports terminology |
| `src/lib/sys/debug/vpb/controls/DepthControl.svelte` | FIXED — local const |
| `src/lib/sys/debug/vpb/controls/AccentControl.svelte` | FIXED — local const |
| `src/lib/sys/debug/vpb/controls/VariantControl.svelte` | FIXED — local const |
| `package.json` | UPDATED — generate:terminology in dev/build |
