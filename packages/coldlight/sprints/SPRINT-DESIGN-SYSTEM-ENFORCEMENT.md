# SPRINT: Design System Enforcement

> **Status**: READY
> **Priority**: CRITICAL
> **Goal**: Enforce ColdLight design system rules at commit time — no more drift, no more lies
> **Research**: [SPRINT-DESIGN-SYSTEM-ENFORCEMENT.research.md](SPRINT-DESIGN-SYSTEM-ENFORCEMENT.research.md)
> **Reference**: [STYLE_GUIDE.md](../../../packages/coldlight/STYLE_GUIDE.md)

## Problem

The STYLE_GUIDE defines strict rules. None of them are enforced. Previous sessions claimed enforcement was in place. It was not. Biome has zero restricted imports, zero GritQL plugins, zero per-folder overrides for design system layers. Preflight runs 3 advisory checks — none for structure, taxonomy, or CSS boundaries.

## Phase 1: Biome Hardening (config changes only)

### Task 1.1: Block archive imports
- [ ] Add `noRestrictedImports` to `biome.json`
- [ ] Block: `#coldlight/primitives/_archive` with message "Archive imports are banned"
- [ ] Block: any path containing `_archive`
- [ ] Verify: `pnpm exec biome check .` passes

### Task 1.2: Block cross-layer imports
- [ ] Add patterns to `noRestrictedImports`:
  - Block `#coldlight/tokens/` imports from outside `design/` (tokens are consumed via Tailwind preset)
  - Block direct recipe imports from routes (go through components/renderers)
- [ ] Verify: biome check passes

### Task 1.3: GritQL plugin — no raw colors outside tokens
- [ ] Create `interfaces/desktop/gritql/no-raw-colors.gql`
- [ ] Pattern: in CSS, match `color:`, `background:`, `border-color:` with `#`, `rgb(`, `hsl(`, `oklch(` values
- [ ] Exclude: `tokens/tokens.css`, `tokens/tokens.ts`
- [ ] Register in `biome.json` under `plugins`
- [ ] Verify: biome check passes

### Task 1.4: GritQL plugin — no arbitrary Tailwind
- [ ] Create `interfaces/desktop/gritql/no-arbitrary-tailwind.gql`
- [ ] Pattern: in JS/TS/Svelte, match class strings containing `[` (arbitrary values)
- [ ] Verify: biome check passes

### Task 1.5: Per-folder overrides
- [ ] Add biome override for `**/primitives/**/*.svelte`: error on `<style>` presence (via GritQL)
- [ ] Add biome override for `**/renderers/**/*.svelte`: error on inline `style=` (via GritQL)
- [ ] Verify: biome check passes

**CHECKPOINT: Verify all biome checks pass. Report to user.**

## Phase 2: Preflight Structure Checks

### Task 2.1: Primitive folder structure check
- [ ] Create `scripts/docs/preflight/checks/check.primitive-structure.ts`
- [ ] For each folder in `design/primitives/` (excluding `_archive`, `index.ts`, `types.ts`):
  - Must contain: `types.ts`, `index.ts`, at least one `.svelte` file
- [ ] Register in preflight engine (import in `preflight.ts`)
- [ ] Add policy rule in `cowlevel.policy.json` — Tier 1, enforcement: error

### Task 2.2: Component folder structure check
- [ ] Create `scripts/docs/preflight/checks/check.component-structure.ts`
- [ ] For each folder in `design/components/`:
  - Must contain: `schema.ts`, `context.ts`, `types.ts`, `index.ts`, at least one `.svelte` file
- [ ] Register in preflight engine
- [ ] Add policy rule — Tier 1, enforcement: error

### Task 2.3: No style tags in primitives
- [ ] Create `scripts/docs/preflight/checks/check.no-style-primitives.ts`
- [ ] Scan `primitives/**/*.svelte` for `<style` tags
- [ ] Report as error if found — primitives are unstyled
- [ ] Register in preflight engine
- [ ] Add policy rule — Tier 1, enforcement: error

### Task 2.4: Promote preflight to blocking
- [ ] Change cowlevel.policy.json Tier 3 rules to Tier 1 where appropriate
- [ ] Ensure `docs-preflight` hook exit code blocks commit on failures

**CHECKPOINT: Verify preflight catches structure violations. Report to user.**

## Phase 3: Taxonomy + ARIA Enforcement

### Task 3.1: Taxonomy alignment check
- [ ] Create `scripts/docs/preflight/checks/check.taxonomy-alignment.ts`
- [ ] For each primitive, verify it imports from `taxonomy/kinds/primitives/{name}/contract`
- [ ] Report misalignment as error
- [ ] Register + policy rule

### Task 3.2: ARIA on primitives check
- [ ] Create `scripts/docs/preflight/checks/check.aria-primitives.ts`
- [ ] For each primitive `.svelte` file, verify it has:
  - `use:aria` action, OR
  - `role=` attribute, OR
  - semantic HTML element (`<button>`, `<dialog>`, `<input>`, etc.)
- [ ] Report missing ARIA as error

### Task 3.3: Token schema validation
- [ ] Create `scripts/docs/preflight/checks/check.token-schema.ts`
- [ ] Validate `tokens/tokens.ts` exports match Style Dictionary v4 structure
- [ ] Verify all token categories have required keys

**CHECKPOINT: Full enforcement in place. Report to user.**

## Scope

**In scope**: Enforcement rules that block bad code at commit time
**Out of scope**: Fixing existing violations (separate sprint), Vite plugin (future), VPB integration (future)

## Verification

After all phases:
```bash
# All must pass
cd interfaces/desktop && pnpm exec biome check .
cd scripts/docs && pnpm preflight:check
lefthook run pre-commit
```
