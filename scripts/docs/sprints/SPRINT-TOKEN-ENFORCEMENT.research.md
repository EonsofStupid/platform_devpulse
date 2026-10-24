# Research: Token Enforcement Layer

**Date**: 2026-03-18
**Sprint**: SPRINT-TOKEN-ENFORCEMENT
**Status**: COMPLETE

## SSOT Map

### Token Source of Truth
| What | Location | Status |
|------|----------|--------|
| DTCG JSON tokens (17 files) | `scripts/build/styledictionary/tokens/src/*.json` | SSOT, working |
| SD5 config (28 platforms) | `scripts/build/styledictionary/sd.config.ts` | SSOT, working |
| Generated CSS custom props | `src/lib/design/css/{domain}/tokens.css` | Generated, never edit |
| Generated Tailwind @theme | `src/lib/design/theme/{domain}/theme.css` | Generated, never edit |
| Generated TypeScript types | `src/lib/design/types/{domain}/types.ts` | Generated, never edit |
| Token manifest (VPB) | `src/lib/design/generated/token-manifest.json` | Generated, never edit |

All paths relative to `interfaces/desktop/`.

### Existing Enforcement Mechanisms
| What | Location | Status | Scope |
|------|----------|--------|-------|
| no-legacy-prefixes.sh | `scripts/hooks/no-legacy-prefixes.sh` | ACTIVE in lefthook pre-commit | Blocks `--dp-`, `--cl-`, `--tw-`, etc. |
| no-raw-colors.grit | `interfaces/desktop/gritql/no-raw-colors.grit` | EXISTS but DORMANT — not wired to any hook | Blocks `color: #hex` in CSS |
| no-kernel-terms.grit | `interfaces/desktop/gritql/no-kernel-terms.grit` | EXISTS but DORMANT — not wired to any hook | IP boundary (separate concern) |
| token-contract.ts validator | `scripts/dev/design/sd/validators/token-contract.ts` | Runs via `pnpm ds:validate` (manual) | Tier 1 `:root` ↔ `@theme` sync |
| Biome CSS parser | `interfaces/desktop/biome.json` | ACTIVE, parses Tailwind directives | No token enforcement rules |
| ip-boundary-check.sh | `scripts/hooks/ip-boundary-check.sh` | ACTIVE in lefthook pre-commit | Kernel terms (separate concern) |

### Duplicates Found
None. No competing enforcement systems exist. The gap is that enforcement barely exists at all.

---

## Question/Goal

How do we prevent developers from bypassing the token system by writing raw CSS values (`color: #ff0000`, `padding: 16px`, `bg-[#ff0000]`) instead of using SD5-generated tokens?

---

## Codebase Analysis

### What's ACTIVE today
1. **no-legacy-prefixes.sh** — Shell script scanning staged diff for banned CSS custom property prefixes. Works reliably. Pattern: `grep -E "^\+.*--(${BANNED})-"` against staged files.
2. **Biome** — Lints TS/Svelte/CSS with `biome check`. Has `css.parser.tailwindDirectives: true`. No CSS value enforcement rules.
3. **SD5 token-contract.ts** — Post-build validator ensuring Tier 1 tokens exist in both `:root` and `@theme`. Not a gate — runs on `pnpm ds:build:full` only.

### What's DORMANT
1. **no-raw-colors.grit** — 7-line GritQL pattern matching `color: #hex` in CSS. File exists at `interfaces/desktop/gritql/no-raw-colors.grit`. NOT in lefthook.yml. NOT in `.gitignore` (desktop `.gitignore` only ignores `node_modules`, `.env`, `generated/prisma`, `dist`).

### What DOES NOT exist
- No Stylelint configuration
- No eslint-plugin-tailwindcss
- No Tailwind arbitrary value restriction
- No build-time CSS value scanning
- No Vitest tests validating token adherence
- No Biome custom rules for CSS values

### app.css verification
Verified: `app.css` uses `var(--*)` throughout. No raw values. Good pattern to enforce everywhere.

---

## External Research

### Tool Options Evaluated

#### 1. Stylelint — `declaration-property-value-disallowed-list` / `declaration-property-value-allowed-list`
**What**: Purpose-built CSS linter with rules specifically designed to block raw values and enforce token usage.
**Key rules**:
- `declaration-property-value-disallowed-list` — Block specific values per property (e.g., hex colors on `color`, `background-color`)
- `declaration-property-unit-disallowed-list` — Block specific units per property (e.g., `px` on spacing)
- `declaration-property-value-allowed-list` — Allowlist approach: ONLY `var(--*)` permitted for color properties
- `color-named` — Block named colors (`red`, `blue`)
- `color-no-hex` — Block ALL hex colors

**Real-world usage**: Shopify Polaris uses `stylelint-polaris` plugin with exactly this approach. Their rules block raw values and force Polaris token usage.

**Pros**: Industry standard, battle-tested, IDE integration (VS Code extension), rich CSS-specific rules
**Cons**: Another tool in the chain, needs `.stylelintrc`, runs separately from Biome

**Sources**:
- [declaration-property-value-disallowed-list](https://stylelint.io/user-guide/rules/declaration-property-value-disallowed-list/)
- [declaration-property-value-allowed-list](https://github.com/stylelint/stylelint/blob/main/lib/rules/declaration-property-value-allowed-list/README.md)
- [Shopify Polaris Stylelint](https://polaris.shopify.com/tools/stylelint-polaris/rules/layout-declaration-property-value-disallowed-list)

#### 2. Biome CSS Rules
**What**: Biome 2.4 has CSS linting but limited rules.
**Available CSS rules**: `noImportantStyles`, `noUnknownProperty`, `noUnknownUnit`, `noDuplicateProperties`, `noShorthandPropertyOverrides`, `noInvalidDirectionInLinearGradient`, `noValueAtRule`, `noUnknownPseudoClass`, `noUnknownPseudoElement`, `noUnknownFunction`, `noUnknownMediaFeatureName`, `noDescendingSpecificity`, `noMissingGenericFamilyKeyword`
**Missing**: No rules to block raw hex, block raw px, or enforce `var(--*)` usage. Nursery has `noHexColors` but it's experimental and not configurable.
**Verdict**: Biome CANNOT enforce token usage today. Not viable as primary enforcement tool for CSS values.

**Source**: [Biome CSS Rules](https://biomejs.dev/linter/css/rules/)

#### 3. eslint-plugin-tailwindcss — `no-arbitrary-value`
**What**: ESLint plugin with rule that blocks Tailwind bracket syntax (`text-[#ff0000]`, `p-[16px]`).
**Problem**: Requires ESLint. Project uses Biome for JS/TS linting. Running both ESLint and Biome creates tooling conflict and duplication.
**Verdict**: Would work but introduces ESLint dependency. Consider only if no alternative exists.

**Source**: [eslint-plugin-tailwindcss no-arbitrary-value](https://github.com/francoismassart/eslint-plugin-tailwindcss/blob/master/docs/rules/no-arbitrary-value.md)

#### 4. Tailwind v4 @theme lockdown
**What**: In Tailwind v4, setting a namespace to `initial` disables the default scale and only allows explicitly defined values.
```css
@theme {
  --spacing: initial;
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
}
```
**Effect**: `p-3` becomes invalid because `--spacing-3` doesn't exist. Only `p-1` and `p-2` work.
**Limitation**: Does NOT block bracket arbitrary values (`p-[16px]`). Only restricts the utility scale.
**Current state**: SD5 already generates `@theme` blocks with all token values registered. The generated values ARE the theme. But Tailwind doesn't enforce "only these values" — it still allows bracket syntax.
**Verdict**: Useful for intent (theme = tokens only) but not a hard gate. Combine with other enforcement.

**Source**: [Tailwind CSS Theme Variables](https://tailwindcss.com/docs/theme)

#### 5. GritQL (already on disk)
**What**: Pattern-matching language for code. `no-raw-colors.grit` already exists matching `color: #hex` in CSS.
**Limitation**: Current rule is CSS-only and narrow (only matches `color` property, not `background-color`, `border-color`, etc.). Doesn't cover Svelte `style:` directives or Tailwind classes.
**Can be extended**: GritQL supports JS/TS/CSS patterns. Could write rules for inline styles in Svelte templates.
**Integration**: Can run via `gritql check` CLI. Needs to be wired into lefthook.yml.
**Verdict**: Good for commit gate. Needs rule expansion beyond just `color: #hex`.

#### 6. Shell hook (proven pattern)
**What**: Extend the `no-legacy-prefixes.sh` approach with a `no-raw-values.sh` script scanning staged diffs.
**Pattern**: `git diff --cached | grep -E "^\+.*#[0-9a-fA-F]{3,8}"` to catch hex colors in added lines.
**Pros**: Zero dependencies, fast, proven pattern in this project, easy to understand and maintain.
**Cons**: Regex-based (can have false positives in comments, strings), no IDE feedback, commit-time only.
**Verdict**: Excellent as final gate. Not a replacement for lint-time IDE feedback.

---

## Findings

### The 3-Layer Enforcement Model

Senior engineering teams enforce design tokens at three levels. Each layer catches a different class of violation at a different point in time:

| Layer | When | Tool | What It Catches | Developer Experience |
|-------|------|------|-----------------|---------------------|
| **Lint-time** | While typing in IDE | Stylelint | Raw hex, raw px, named colors, inline raw values | Red squiggly in editor, immediate feedback |
| **Build-time** | `pnpm build` / `pnpm dev` | Tailwind @theme + token-contract validator | Unregistered theme values, :root/theme drift | Build fails |
| **Commit-time** | `git commit` | Shell hook or GritQL in lefthook | Everything that slipped past linter | Commit blocked |

### Recommended Stack

1. **Stylelint** — Primary CSS enforcement. Rules: `color-no-hex`, `color-named` (error), `declaration-property-value-allowed-list` for color/spacing properties to only permit `var(--*)`.
2. **Shell hook** — Commit gate. Scan staged diffs for raw hex colors, raw px values, and inline style attributes with raw values. Same pattern as `no-legacy-prefixes.sh`.
3. **GritQL expansion** — Extend `no-raw-colors.grit` to cover more properties, wire into lefthook as optional additional gate.
4. **token-contract.ts** — Already exists. Wire into pre-commit via lefthook (currently manual only).
5. **Tailwind @theme** — Already generated by SD5. No changes needed.

### Why NOT eslint-plugin-tailwindcss
The project uses Biome, not ESLint. Adding ESLint just for one Tailwind rule introduces:
- A second JS linter running alongside Biome
- Config duplication
- Potential rule conflicts
- Extra node_modules weight

The shell hook can catch `[#hex]` bracket syntax in staged diffs without ESLint.

### Why Stylelint specifically
- It's the industry standard for CSS-specific linting (Shopify, GitHub, Google use it)
- Biome doesn't have CSS value enforcement rules
- Stylelint and Biome don't conflict — Biome handles JS/TS lint + formatting, Stylelint handles CSS value rules
- VS Code Stylelint extension provides real-time IDE feedback
- It's the ONLY tool that provides lint-time (in-editor) enforcement for raw CSS values

---

## Anti-Pattern Risks

| Risk | How It Happens | Prevention |
|------|---------------|------------|
| **Over-broad regex** | Shell hook catches hex in comments, SVG data URIs, token source files | Exclude `scripts/build/`, `*.json`, comments. Only scan `src/**/*.{svelte,css,ts}` |
| **False positive fatigue** | Too many warnings → developers ignore enforcement | Start strict on colors (highest impact), relaxed on spacing. Tighten over time. |
| **Generated file scanning** | Linting the SD5 output CSS that legitimately contains raw values | Exclude `src/lib/design/css/`, `src/lib/design/theme/`, `src/lib/design/generated/` — already excluded in biome.json |
| **Stylelint ↔ Biome conflict** | Both trying to lint/format the same CSS | Disable Stylelint formatting — use it ONLY for value rules. Biome owns formatting. |
| **Tailwind class false positives** | Stylelint trying to parse Tailwind `@apply` or `@theme` | Configure Stylelint to ignore Tailwind directives or only scan component `<style>` blocks |

---

## Recommendations

### Phased Approach

**Phase 1: Commit Gate (Zero new deps)**
- New shell hook: `no-raw-values.sh`
- Wire into lefthook.yml as pre-commit
- Blocks: raw hex in color properties, raw named colors
- Excludes: generated files, token source JSON, comments
- Pattern proven by existing `no-legacy-prefixes.sh`

**Phase 2: Stylelint (IDE Feedback)**
- Install `stylelint` + `stylelint-config-standard`
- Configure `.stylelintrc.json` with value enforcement rules
- Wire into lefthook.yml pre-commit
- Wire into `pnpm lint` script
- VS Code workspace recommendation for Stylelint extension

**Phase 3: Expand Coverage**
- Expand GritQL rules beyond `color: #hex`
- Add `declaration-property-unit-disallowed-list` for px enforcement on spacing
- Wire `token-contract.ts` into pre-commit (currently manual only)

---

## Files Referenced
- `lefthook.yml`: Hook definitions — where enforcement gates live
- `scripts/hooks/no-legacy-prefixes.sh`: Proven shell hook pattern to follow
- `interfaces/desktop/gritql/no-raw-colors.grit`: Dormant GritQL rule
- `interfaces/desktop/biome.json`: Current Biome config — excludes generated files
- `scripts/dev/design/sd/validators/token-contract.ts`: Tier 1 sync validator
- `interfaces/desktop/src/app.css`: Verified clean — uses var(--*) throughout
- `interfaces/desktop/src/lib/design/index.css`: CSS entry point
- `interfaces/desktop/package.json`: Script definitions (ds:validate, ds:build:full)
