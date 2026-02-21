# Research: Design System Enforcement

**Date**: 2026-02-09
**Sprint**: SPRINT-DESIGN-SYSTEM-ENFORCEMENT
**Status**: COMPLETE

## Question/Goal
What enforcement tooling exists, what's missing, and what's the fastest path to enforcing ColdLight design system rules at commit time?

## Codebase Analysis

### What exists today

**Biome (v2.3.13)** at `interfaces/desktop/biome.json`:
- `noUnusedVariables`, `noUnusedImports`, `noExplicitAny` — all error
- `useImportType`, `useConst` — error
- `useFilenamingConvention` — warn (camelCase, PascalCase, kebab-case)
- `organizeImports` — on
- CSS tailwind directive parsing — on
- Excludes: `_archive`, `.cowlevel`, generated files
- **MISSING**: `noRestrictedImports` — not configured at all
- **MISSING**: GritQL plugins — none loaded
- **MISSING**: No CSS property bans, no folder boundary rules, no archive import blocking

**Preflight engine** at `scripts/docs/preflight/`:
- 3 checks: `domain-boundaries`, `typed-routes`, `naming-conventions`
- Policy-driven via `cowlevel.policy.json`
- Has check/fix/dry-run modes
- Registry pattern for adding new checks
- `domain-boundaries` uses ts-morph for import analysis
- Runs as lefthook hook `docs-preflight`
- **Currently Tier 3 (advisory) only** — warnings, not errors

**Lefthook hooks**:
- `no-legacy-prefixes` — blocks `--dp-`/`--cl-` prefixes (being fixed in SPRINT-LEFTHOOK-HARDENING)
- `biome-lint` — runs biome check
- `docs-preflight` — runs preflight engine
- `coldlight-verify` — runs manifest verification
- `svelte-check` — type checking

### What the STYLE_GUIDE demands but isn't enforced

From `STYLE_GUIDE.md` section 9 "Enforcement (Vite Plugin - MANDATORY)":

| Rule | What to enforce | Current state |
|------|----------------|---------------|
| No CSS vars in renderers | `var(--` in `renderers/*.svelte` | NOT ENFORCED |
| No arbitrary Tailwind | `[` in class attributes | NOT ENFORCED |
| No `<style>` in primitives | `<style` in `primitives/*.svelte` | NOT ENFORCED |
| No inline styles in renderers | `style="` in `renderers/*.svelte` | NOT ENFORCED |
| No raw colors outside tokens | `#`, `oklch(`, `rgb(`, `hsl(` outside tokens | NOT ENFORCED |
| No archive imports | import from `_archive` | NOT ENFORCED |
| Primitive folder structure | contract.ts, types.ts, index.ts, *.svelte | NOT ENFORCED |
| Component folder structure | schema.ts, context.ts, types.ts, index.ts, *.svelte | NOT ENFORCED |
| Taxonomy is source of truth | primitives import from taxonomy contracts | NOT ENFORCED |

### What biome CAN enforce (confirmed from docs)

1. **`noRestrictedImports`** — can block `_archive` imports, cross-layer imports
   - Supports `paths` (exact) and `patterns` with `group` (glob-style)
   - Available since v1.6.0, patterns since v2.0

2. **GritQL plugins** — can enforce CSS rules
   - Supported languages: JavaScript, CSS
   - Can match CSS declarations and report diagnostics
   - Example: block `color:` outside `.color-*` classes
   - Can be used for: no raw colors, no arbitrary values, no CSS vars in wrong layers

3. **Per-folder overrides** — can set different rules per directory
   - Already used for `*.svelte`, `scripts/*.ts`
   - Can add overrides for `primitives/`, `renderers/`, `components/`

### What biome CANNOT enforce

1. **Folder structure completeness** — "does button/ have contract.ts?" → custom check needed
2. **Taxonomy alignment** — "does primitive import its taxonomy contract?" → custom check or GritQL
3. **ARIA on every primitive** — needs custom check (does .svelte have aria attributes/actions?)
4. **Style Dictionary v4 compliance** — needs custom check against token schema

### What the preflight engine should handle

The preflight engine already has the architecture for custom checks with the registry pattern.
New checks to add:
1. `check.primitive-structure` — verify each primitive folder has required files
2. `check.component-structure` — verify each component folder has required files
3. `check.taxonomy-alignment` — verify primitives import from taxonomy
4. `check.no-css-outside-design` — verify no CSS/style in wrong layers
5. `check.aria-primitives` — verify ARIA usage in primitives

## External Research

### Biome noRestrictedImports
- [Config docs](https://biomejs.dev/linter/rules/no-restricted-imports/)
- Supports `paths` and `patterns` with custom messages
- Can block entire path prefixes

### Biome GritQL plugins
- [Plugin docs](https://biomejs.dev/linter/plugins/)
- CSS pattern matching confirmed working
- Can register custom diagnostics with span locations

## Findings

1. **Biome can handle ~40% of enforcement** — import restrictions, CSS pattern bans, per-folder overrides
2. **Preflight engine handles the other ~60%** — structure validation, taxonomy alignment, ARIA checks
3. **Both already run in lefthook** — no new hooks needed, just new rules/checks
4. **Preflight checks are currently advisory (Tier 3)** — need to be promoted to Tier 1 (error) for real enforcement
5. **The Vite plugin from STYLE_GUIDE is the long-term goal** — but biome + preflight gives commit-time enforcement NOW

## Recommendations

### Phase 1: Biome hardening (fast, config-only)
- Add `noRestrictedImports` to block `_archive`, cross-layer imports
- Add GritQL plugin for CSS property bans (no raw colors, no arbitrary Tailwind, no CSS vars in components)
- Add per-folder overrides for primitives/ and renderers/

### Phase 2: Preflight new checks (medium, new check files)
- `check.primitive-structure` — verify folder contents
- `check.component-structure` — verify folder contents
- `check.no-style-tags` — no `<style>` in primitives
- Promote to Tier 1 enforcement

### Phase 3: Taxonomy alignment + ARIA (deeper)
- `check.taxonomy-alignment` — import verification
- `check.aria-primitives` — ARIA attribute verification
- Style Dictionary v4 token schema validation

## Files Referenced
- `interfaces/desktop/biome.json`: current biome config
- `interfaces/desktop/src/lib/design/STYLE_GUIDE.md`: the rules that must be enforced
- `scripts/docs/preflight/engine/preflight.ts`: preflight runner
- `scripts/docs/preflight/checks/check.domain-boundaries.ts`: existing check pattern
- `scripts/docs/policy/cowlevel.policy.json`: policy config
- `lefthook.yml`: hook orchestration
