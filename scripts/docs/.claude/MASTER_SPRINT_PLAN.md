# DevPulse Platform — Master Sprint Plan

> **Last audit**: 2026-03-06
> **Status**: HONEST REALITY CHECK — NO BULLSHIT

---

## BRUTAL TRUTH: What Actually Works vs What Doesn't

### WORKING (Verified in Codebase)

| System | Status | Evidence |
|--------|--------|----------|
| Progressive hydration boot | WORKING | `lib.rs` spawns `boot_task()`, setup returns immediately, window visible instantly |
| Resilient store boot | WORKING | Each store wrapped in `match`, failed = `None` not crash |
| SurrealDB auto-recovery | PARTIAL | Clears stale data + retries, but SurrealDB STILL FAILS on fresh install |
| Tracing + structured logging | WORKING | `logging.rs` has stderr + JSON file layers, `std::mem::forget(guard)` |
| Log rotation (3 sessions) | WORKING | `rotate_logs()` keeps last 3 `session-*.jsonl` files |
| Platform state rune | WORKING | `platformState.svelte.ts` tracks boot phase + subsystems + health polling |
| StatusBar boot progress | WORKING | Shows per-subsystem status during boot, transitions to health display |
| Splashscreen deleted | DONE | No splashscreen route, no splashscreen window, single-window progressive hydration |
| ColdLight primitives | 87+ EXIST | `primitives/` has 87+ kinds with index.ts |
| ColdLight components | 80+ EXIST | `components/` has 80+ kinds with index.ts |
| dsAdapter system | EXISTS | `api/adapters/` with meltui + coldlight engines |
| Token category registry | EXISTS | 8 axes (s/z/d/b/g/f/m/t), encoding system |
| Preset registry | EXISTS | ~50 system presets |
| VPB | EXISTS | 22+ Svelte files in `sys/debug/vpb/` |
| Builders | 55 EXIST | `builders/` directory, 1286 tests claimed |
| Design index.ts | EXISTS | Public API exports 80+ components, SVG surfaces, blocks, recipes |

### BROKEN / NOT WORKING

| System | Status | Root Cause |
|--------|--------|------------|
| **SurrealDB** | **BROKEN** | Fails on BRAND NEW fresh install. Even after clearing data + retry. `.context("Failed to open SurrealDB")` hides real error. Suspected: `SurrealKv` path handling with Windows backslashes in URI scheme |
| **LibSQL health** | **SUSPECT** | Boots at 2ms successfully but health verification may show Down. Needs investigation |
| **Chat UI** | **BASIC** | Uses ColdLight Box/Button/Text but looks NOTHING like reference images. Plain text on black. No neuromorphic glass, no liquid metal, no proper surfaces. Input uses raw `<input>` with inline styles instead of ColdLight Input component |
| **Dashboard UI** | **NONEXISTENT** | Reference shows gauges, charts, data panels with liquid metal aesthetic. Nothing built |
| **ColdLight visual fidelity** | **GAP** | Components exist structurally but the VISUAL OUTPUT doesn't match references. Tokens/recipes/SVG filters need to produce the liquid metal / neuromorphic / glass aesthetic shown in references |
| **VPB** | **DEV TOOL ONLY** | Exists in `sys/debug/` — not exposed as product feature. User says it should be 3 modes: Dev, Production, Customer |
| **Command HUD** | **NONEXISTENT** | Referenced in chat reference images — expandable command interface, not built |

### NEVER STARTED

| System | Sprint Doc Exists? | Code Exists? |
|--------|-------------------|-------------|
| RRO/Qdrant vector store integration | Yes (SPRINT-PLATFORM-WIRING) | NO |
| Database seeding system | Yes (SPRINT-PLATFORM-WIRING Phase 4) | NO |
| Voice synthesis (kokoros) | Yes (SPRINT-PLATFORM-WIRING Phase 3) | NO |
| Lefthook preflight in xtask | Yes (SPRINT-FOUNDATION-V2 Phase 4) | NO |
| Typed routes generator | Yes (MASTER_SPRINT_PLAN Sprint 2) | NO |
| URL-driven routing | Yes (SPRINT-01B) | NO |
| Domain public APIs | Yes (Master Plan Sprint 4) | NO |
| Enforcement system (AST checks) | Yes (Master Plan Sprint 5-6) | NO |
| CI pipeline | Yes (SPRINT-PLATFORM-WIRING Phase 6) | NO |

---

## SPRINT DOCUMENT INVENTORY

There are **63 sprint files** in `scripts/docs/sprints/`. Many are duplicative or superseded.

### Active / Relevant

| Sprint | Purpose | Status |
|--------|---------|--------|
| SPRINT-FOUNDATION-V2 | Progressive boot, tracing, resilient stores | **IN PROGRESS** — Phases 1-3 done, Phase 4+ not started |
| SPRINT-PLATFORM-WIRING | RRO, seeding, real health UI | **NOT STARTED** |
| SPRINT-COLDLIGHT-PIPELINE | SD5 token pipeline | **NEEDS AUDIT** — pipeline may partially exist |

### Superseded (SPRINT-STARTUP-EXPERIENCE)

`SPRINT-STARTUP-EXPERIENCE.md` describes the OLD splashscreen approach (`rt.block_on`, separate splashscreen window, window swap). This was **replaced** by SPRINT-FOUNDATION-V2's progressive hydration. The sprint doc still exists but is DEAD — do not follow it.

### Design System Sprints (Many, Overlapping)

| Sprint | Notes |
|--------|-------|
| SPRINT-PRIMITIVES-FOUNDATION | Primitives exist (87+). May be partially done |
| SPRINT-COMPONENT-FOUNDATION | Components exist (80+). May be partially done |
| SPRINT-BUILDERS-REAUTHOR | Builders exist (55). May be partially done |
| SPRINT-DSADAPTER-ALIGNMENT | dsAdapter architecture exists |
| SPRINT-SD5-FOUNDATION | Token pipeline exists |
| SPRINT-TAXONOMY-FOUNDATION | Taxonomy exists |
| SPRINT-EFFECTS-FOUNDATION | Effects system (7 categories) exists |
| SPRINT-VISUAL-SCAFFOLDING | CRITICAL — visual fidelity gap |
| SPRINT-COLDLIGHT-SOLE-PROVIDER | ColdLight owns all UI — principle established but NOT enforced everywhere |

---

## WHAT ACTUALLY NEEDS TO HAPPEN (Priority Order)

### P0: Fix Broken Foundation (BLOCKING EVERYTHING)

1. **Fix SurrealDB on fresh install**
   - Expose full error chain (remove `.context()` hiding)
   - Fix path handling: `SurrealKv` gets Windows backslashes in path
   - Convert path to forward slashes or use canonical form
   - File: `kernel/devpulse-maestro/src/cortex/persistence/surreal.rs`

2. **Verify LibSQL health check works**
   - File: `kernel/devpulse-maestro/src/cortex/persistence/libsql.rs`
   - The ping does `SELECT 1` — should work, but need to verify after boot

3. **Verify log files actually persist**
   - Check `{data_dir}/logs/session-*.jsonl` exist after boot

### P1: Visual Fidelity (THE ACTUAL PRODUCT)

This is the user's core complaint. The platform has structural components but the visual output is BASIC. Reference images show:

- **Liquid metal** surfaces with teal/cyan glow
- **Neuromorphic** depth and bevel effects
- **Glass panels** with blur and transparency
- **SVG-driven** premium surfaces (NeuPanel, NeuGauge, NeuFrame exist but are they used?)
- **Chat** has a full HUD: thread sidebar, graph visualization, command expansion, voice button
- **Dashboard** has gauges, charts, data panels with proper ColdLight aesthetic

**Gap**: Components exist structurally. Tokens exist. Recipes exist. But the COMPOSITION — using them together to produce the reference aesthetic — is not done. Chat uses basic Box/Text/Button. Dashboard doesn't exist.

### P2: VPB as Product Feature

VPB currently lives in `sys/debug/vpb/` — it's a dev tool. User's vision is 3 modes:
- **Dev mode**: Full control, raw prop editing
- **Production mode**: Guided, template-driven composition
- **Customer mode**: Layman-friendly, visual drag-and-drop

### P3: Platform Wiring (RRO, Seeding, Voice)

Only after P0 and P1 are solid. No point wiring more stores when the existing ones don't work.

### P4: Routing, Domains, Enforcement

Infrastructure sprints (1B through 8 in old master plan). Important but not blocking the product from looking like the references.

---

## RULES GOING FORWARD

1. **No sprint starts without owner approval**
2. **Fix what's broken before building new things**
3. **Visual fidelity is the product** — structural code that produces basic UI is not done
4. **Read existing docs before writing plans** — the user has millions of pages of documentation
5. **Do NOT run builds** — the user runs builds in their terminal
6. **Cross-platform paths** — NO hardcoded Windows paths anywhere
7. **Full error chains** — never hide errors behind `.context("vague message")`
8. **Delete dead code** — no deprecation, no backwards compatibility
9. **Every visual MUST use ColdLight** — no raw HTML, no inline styles, no plain CSS
