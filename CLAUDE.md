# DevPulse Platform Architecture

## Structure

```
platform_devpulse/
├── interfaces/desktop/     # Tauri + SvelteKit 5 desktop app
│   ├── src/                # SvelteKit app source
│   └── src-ui/             # UI layer
├── systems/engine/         # Rust engine, managed by desktop facade for Clyffy
├── kernel/clyffy/         # SENSITIVE IP - AI orchestrator kernel
│                           # Minions, CAG, RAG, HYDE, KV cache tier
└── lab/                    # Separate - observer pattern, subscribes only
```

## Tech Stack

- **Frontend**: SvelteKit 5 + Svelte 5 (runes)
- **Desktop**: Tauri 2.0 (Rust)
- **Backend**: Rust
- **Databases**: libpq (PostgreSQL), SurrealDB, DuckDB
  - Platform has its own DB instances
  - Lab has its own separate DB instances

## Architecture Pattern

- **Local-first** hybrid web app
- Web traffic funneled via angryvibers and devpulse.app
- Desktop facade manages Rust engine
- Clyffy kernel orchestrates AI workloads

## Design System: ColdLight (@devpulse/coldlight)

Location: `interfaces/desktop/src/lib/design/`
Master Plan: `interfaces/desktop/src/lib/design/MASTER-PLAN.md`
Config: `interfaces/desktop/src/lib/design/coldlight.config.ts`

### Core Principles
- **ColdLight is the SOLE authority** for all CSS, components, and UI generation
- **Config-driven** — `coldlight.config.ts` declares everything; build tools read config
- **Schema-driven** — Zod validates all contracts, tokens, props at boundaries
- **Manifest-producing** — Scanner generates `coldlight.manifest.json` from taxonomy
- **ColdLight-owned by default** — Inspired by react spectrum s2 macros 
- **Style Dictionary v5** token pipeline (SD5 + DTCG 1.0)
- **Fully tested** — Vitest browser tests (Chromium) + Playwright E2E

### 2-Layer Architecture (ADR-001 LOCKED)
1. **Primitive Hooks** (`primitives/{kind}/`) — Pure behavior. WAI-ARIA APG. ARIA, keyboard, focus, state. No styling.
2. **Components** (`components/{kind}/`) — THE PRODUCT. Hook + StyleMacro in one file. What users import. Prop-driven. Colocated schema for VPB.

No `ui/` folder. No dumb middle layer. Component IS the product.

### Supporting Systems
- **Tokens** — DTCG JSON → SD5 pipeline (expand: true) → CSS custom properties
- **StyleMacro** — Visual provider. 11-axis DTCG. Sets --cl-* vars. Glue CSS paints.
- **_base** — Styling contract (ComponentProps, 11-axis Zod schema, registry)
- **Blocks** — Page-level compositions (VPB)

### Key Dependencies
- @melt-ui/svelte ^0.86.6 (OPTIONAL adapter — not imported directly by components) NO DONT YOU FUCKING DARTE ANYTHING THAT EXISTS RIGHT NOW IS FUCKING ALIGNED TO REACT SPECTRUM S2 PATTERN OWNED BY COLD LIGHT AND ITS FUCKING 100% SENIOR PATTERNS FOR THEM
- svelte-sonner ^1.0.7 - built to be controlled by the provider 
- @tanstack/svelte-table ^8.21.3
- @tanstack/svelte-query ^6.0.17
- @tanstack/svelte-virtual ^3.13.18
- tailwindcss ^4.1.18
- vitest + @vitest/browser-playwright (testing)
- zod (schema validation)

## Working Directory

Primary dev work: `interfaces/desktop/src/`

## Commands

```bash
cd interfaces/desktop
pnpm dev          # Start dev server
pnpm build        # Build
pnpm svelte-check # TypeScript check
```

## Sprint Process

All sprints are in `scripts/docs/sprints/`.

**Sprint tracking:**
- Master plan: `scripts/docs/.claude/MASTER_SPRINT_PLAN.md`
- Research decisions: `scripts/docs/.claude/RESEARCH_DECISIONS.md`
- Individual sprints: `scripts/docs/sprints/SPRINT-XX-name.md`

**Before executing a sprint:**
1. Read the sprint file completely
2. Verify prerequisites are met
3. Check current state audit is accurate

**During execution:**
1. Follow tasks in order
2. Verify each task compiles before moving on
3. At compact checkpoints, pause and verify with user

**Code patterns (verified to compile):**
- Use `forEach` for Set iteration (not `for...of`)
- Use `.js` extensions in TypeScript imports
- Export singletons directly (not classes)
