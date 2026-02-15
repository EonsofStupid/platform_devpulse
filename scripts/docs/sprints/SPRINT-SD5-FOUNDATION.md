# Sprint: SD5 Foundation — Style Dictionary v5 Token Pipeline

**Created**: 2026-02-15
**Research**: [SPRINT-SD5-FOUNDATION.research.md](./SPRINT-SD5-FOUNDATION.research.md)
**Priority**: CRITICAL — Blocks Phase 4 (Token Bridge) in MASTER-PLAN
**Dependencies**: style-dictionary@5.3.0 (installed), aria-query@5.3.2 (installed), @floating-ui/dom@1.7.5 (installed)

---

## Goal

Replace the hand-rolled `ds-tokens-build.ts` with a proper Style Dictionary v5 pipeline. Establish enterprise-grade token configuration so the dev UI can display settings and walk admin through setup. Bridge existing `tokens.ts` SSOT into SD v5 via custom preprocessor.

---

## Prerequisites

- [x] `style-dictionary` v5.3.0 installed
- [x] `aria-query` v5.3.2 installed
- [x] `@floating-ui/dom` v1.7.5 installed
- [x] `tokens/tokens.ts` Tier 1 SSOT exists
- [x] `tokens/semantic.ts` Tier 2 exists
- [x] `tokens/components.ts` Tier 3 exists
- [x] `config/coldlight/` fragment pattern exists

---

## Tasks

### Phase A: SD v5 Configuration

- [ ] **A1.** Create `config/coldlight/tokens.cfg.ts` — SD v5 token pipeline config fragment
  - Source paths (tokens.ts, semantic.ts, components.ts)
  - Platform definitions (css, typescript, tailwind)
  - Output paths (tokens.css, types.ts)
  - Token prefix: NONE (unprefixed, per MASTER-PLAN locked decision)
  - `outputReferences: true` (preserve var() chains for Tier 2/3)
  - Framework target: SvelteKit 5

- [ ] **A2.** Create `scripts/dev/design/sd.config.ts` — SD v5 config entry point
  - Imports token pipeline config from `config/coldlight/tokens.cfg.ts`
  - Registers custom preprocessor: reads tokens.ts TS exports → DTCG structure
  - Registers custom format for Tailwind v4 @theme block output
  - Registers custom format for TypeScript enum/type output
  - Defines platforms:
    - `css`: CSS custom properties (:root block + @theme block)
    - `ts`: TypeScript types + runtime arrays
  - Single file, clean, documented so dev UI can parse settings

- [ ] **A3.** Create `scripts/dev/design/sd-preprocessor.ts` — TS→DTCG bridge
  - Dynamically imports tokens.ts, semantic.ts, components.ts
  - Converts each token category to DTCG format: `{ $value, $type, $description }`
  - Maps token types: color→`color`, spacing→`dimension`, shadow→`shadow`, etc.
  - Preserves 3-tier hierarchy (Tier 1 raw, Tier 2 alias, Tier 3 component-scoped)
  - Validates via existing Zod schemas before conversion

- [ ] **A4.** Update `config/coldlight/types.ts` — Add token pipeline types to ColdLightConfig
  - Add `tokens` section to `ColdLightConfig` type
  - Source paths, output paths, platform targets, prefix settings

- [ ] **A5.** Update `config/coldlight/index.ts` — Export new tokens.cfg.ts fragment

### Phase B: SD v5 Build Integration

- [ ] **B1.** Create `scripts/dev/design/sd-build.ts` — SD v5 build runner
  - Imports config from sd.config.ts
  - Instantiates StyleDictionary
  - Calls `buildAllPlatforms()`
  - Logs output paths and token counts
  - Exit code 1 on failure (for CI/CD)

- [ ] **B2.** Update `package.json` scripts
  - `ds:tokens:build` → `npx tsx scripts/dev/design/sd-build.ts`
  - `ds:tokens:watch` → watch mode wrapper around sd-build.ts
  - Keep old script as `ds:tokens:build:legacy` temporarily

- [ ] **B3.** Verify SD v5 output matches existing tokens.css
  - Run both old and new build
  - Diff CSS output — must produce equivalent :root block
  - Diff @theme output — must produce equivalent Tailwind v4 mappings
  - Verify Tier 2 semantic tokens output with var() references preserved
  - Verify Tier 3 component tokens output

### Phase C: Clean Up

- [ ] **C1.** Delete `tokens/tailwind.preset.ts` — Tailwind v3 preset is dead code (TW4 uses @theme)
- [ ] **C2.** Update `tokens/README.md` — Document SD v5 pipeline replaces hand-rolled script
- [ ] **C3.** Update MASTER-PLAN.md line 101 — Change "Style Dictionary 4" to "Style Dictionary 5"

### Phase D: aria-query + @floating-ui Wiring (Prep Only)

- [ ] **D1.** Create `config/coldlight/aria.cfg.ts` — ARIA configuration fragment
  - Import aria-query role/attribute data
  - Map to ColdLight vocabulary types (ARIA_ROLES, ARIA_ATTRIBUTES already in vocabularies.cfg.ts)
  - Validate vocabulary arrays against aria-query spec data at build time

- [ ] **D2.** Create `config/coldlight/positioning.cfg.ts` — Floating UI config fragment
  - Default middleware stack (offset, flip, shift, arrow)
  - Z-index mapping to ColdLight z tokens
  - Placement preferences per primitive kind (tooltip, popover, dropdown, etc.)

---

## Verification

After each task, verify:
```bash
pnpm ds:tokens:build    # Must succeed
pnpm svelte-check       # Must pass
```

After all tasks:
```bash
pnpm dev                # App must start
pnpm ds:tokens:build    # SD v5 pipeline works
```

---

## Acceptance Criteria

| Criteria | How to verify |
|----------|---------------|
| SD v5 config exists at `config/coldlight/tokens.cfg.ts` | File exists, imports cleanly |
| `pnpm ds:tokens:build` runs SD v5 pipeline | Build succeeds, logs token count |
| tokens.css output is equivalent to current | Diff old vs new, no regressions |
| @theme block generates correct TW4 mappings | TW4 utilities resolve in dev server |
| TypeScript types still generated | types.ts exists, schema.ts imports work |
| Config is single-file parseable | Dev UI can read tokens.cfg.ts settings |
| aria-query wired to vocabulary validation | Build-time check passes |
| @floating-ui config fragment exists | Positioning defaults declared |

---

## Out of Scope

- Migrating tokens.ts to pure DTCG JSON (tokens.ts stays as human-authored SSOT)
- Building the dev UI settings screen (this sprint establishes the config it will read)
- Taxonomy contract fixes (separate sprint)
- Preflight violation fixes (separate sprint)
- Component implementations (separate sprint)
