# Sprint: Token Prefix Removal & Pre-commit Fix

> **Scope**: `interfaces/desktop/scripts/dev/design/ds-tokens-build.ts` + generated tokens
> **Goal**: Remove ALL `dp-` prefix from token generation. Fix ALL pre-commit hook failures.
> **Gate**: `pnpm lefthook run pre-commit` passes. Tokens generate as `--glass-void` NOT `--dp-glass-void`.
> **Created**: 2026-02-05
> **Status**: ACTIVE

---

## Problem Statement

Token generation script uses `const PREFIX = "dp"` which produces prefixed tokens:
- WRONG: `--dp-glass-void`, `--dp-color-teal-500`
- CORRECT: `--glass-void`, `--color-teal-500`

This prefix was NEVER requested and pollutes the entire design system.

---

## Current State Audit

| File | Problem | Line |
|------|---------|------|
| `scripts/dev/design/ds-tokens-build.ts` | `const PREFIX = "dp"` | 47 |
| `scripts/dev/design/ds-tokens-build.ts` | 35+ usages of `${PREFIX}-` in template literals | 73, 76, 110, 113, 121, 129, 136, 143, 150, 157, 164, 171, 178, 185, 192, 252, 254, 263, 270, 277, 280, 287 |
| `scripts/dev/design/ds-tokens-build.ts` | CRLF line endings | all |
| `biome.json` | CRLF line endings | all |

---

## Phase 1: Fix ds-tokens-build.ts

### 1.1: Remove PREFIX constant

**File**: `scripts/dev/design/ds-tokens-build.ts`
**Line**: 47

DELETE:
```typescript
const PREFIX = "dp";
```

### 1.2: Fix generateCss() addSection function

**Lines 72-77** — Nested objects (color scales):

BEFORE:
```typescript
lines.push(`\t--${PREFIX}-${prefix}-${key}-${subKey}: ${subValue};`);
```

AFTER:
```typescript
lines.push(`\t--${prefix}-${key}-${subKey}: ${subValue};`);
```

BEFORE:
```typescript
lines.push(`\t--${PREFIX}-${prefix}-${key}: ${value};`);
```

AFTER:
```typescript
lines.push(`\t--${prefix}-${key}: ${value};`);
```

### 1.3: Fix @theme block — Surface materials

**Lines 109-114**:

BEFORE:
```typescript
lines.push(`\t--color-glass-${key}: var(--${PREFIX}-glass-${key});`);
lines.push(`\t--color-matte-${key}: var(--${PREFIX}-matte-${key});`);
```

AFTER:
```typescript
lines.push(`\t--color-glass-${key}: var(--glass-${key});`);
lines.push(`\t--color-matte-${key}: var(--matte-${key});`);
```

### 1.4: Fix @theme block — Color scales

**Line 121**:

BEFORE:
```typescript
lines.push(`\t--color-${PREFIX}-${name}-${step}: var(--${PREFIX}-color-${name}-${step});`);
```

AFTER:
```typescript
lines.push(`\t--color-${name}-${step}: var(--color-${name}-${step});`);
```

### 1.5: Fix @theme block — Text colors

**Line 129**:

BEFORE:
```typescript
lines.push(`\t--color-${PREFIX}-text-${key}: var(--${PREFIX}-text-${key});`);
```

AFTER:
```typescript
lines.push(`\t--color-text-${key}: var(--text-${key});`);
```

### 1.6: Fix @theme block — Radius

**Line 136**:

BEFORE:
```typescript
lines.push(`\t--radius-${PREFIX}-${key}: var(--${PREFIX}-radius-${key});`);
```

AFTER:
```typescript
lines.push(`\t--radius-${key}: var(--radius-${key});`);
```

### 1.7: Fix @theme block — Shadows

**Line 143**:

BEFORE:
```typescript
lines.push(`\t--shadow-${PREFIX}-${key}: var(--${PREFIX}-shadow-${key});`);
```

AFTER:
```typescript
lines.push(`\t--shadow-${key}: var(--shadow-${key});`);
```

### 1.8: Fix @theme block — Glows

**Line 150**:

BEFORE:
```typescript
lines.push(`\t--shadow-${PREFIX}-glow-${key}: var(--${PREFIX}-glow-${key});`);
```

AFTER:
```typescript
lines.push(`\t--shadow-glow-${key}: var(--glow-${key});`);
```

### 1.9: Fix @theme block — Bevels

**Line 157**:

BEFORE:
```typescript
lines.push(`\t--shadow-${PREFIX}-bevel-${key}: var(--${PREFIX}-bevel-${key});`);
```

AFTER:
```typescript
lines.push(`\t--shadow-bevel-${key}: var(--bevel-${key});`);
```

### 1.10: Fix @theme block — Spacing

**Line 164**:

BEFORE:
```typescript
lines.push(`\t--spacing-${PREFIX}-${key}: var(--${PREFIX}-space-${key});`);
```

AFTER:
```typescript
lines.push(`\t--spacing-${key}: var(--space-${key});`);
```

### 1.11: Fix @theme block — Text sizes

**Line 171**:

BEFORE:
```typescript
lines.push(`\t--font-size-${PREFIX}-${key}: var(--${PREFIX}-text-size-${key});`);
```

AFTER:
```typescript
lines.push(`\t--font-size-${key}: var(--text-size-${key});`);
```

### 1.12: Fix @theme block — Blur

**Line 178**:

BEFORE:
```typescript
lines.push(`\t--blur-${PREFIX}-${key}: var(--${PREFIX}-blur-${key});`);
```

AFTER:
```typescript
lines.push(`\t--blur-${key}: var(--blur-${key});`);
```

### 1.13: Fix @theme block — Duration

**Line 185**:

BEFORE:
```typescript
lines.push(`\t--transition-duration-${PREFIX}-${key}: var(--${PREFIX}-duration-${key});`);
```

AFTER:
```typescript
lines.push(`\t--transition-duration-${key}: var(--duration-${key});`);
```

### 1.14: Fix @theme block — Easing

**Line 192**:

BEFORE:
```typescript
lines.push(`\t--transition-timing-function-${PREFIX}-${key}: var(--${PREFIX}-ease-${key});`);
```

AFTER:
```typescript
lines.push(`\t--transition-timing-function-${key}: var(--ease-${key});`);
```

### 1.15: Fix generateTailwindPreset() — Colors

**Lines 252-254**:

BEFORE:
```typescript
lines.push(`\t\t\t\t"${PREFIX}-${name}": {`);
lines.push(`\t\t\t\t\t${step}: "var(--${PREFIX}-color-${name}-${step})",`);
```

AFTER:
```typescript
lines.push(`\t\t\t\t"${name}": {`);
lines.push(`\t\t\t\t\t${step}: "var(--color-${name}-${step})",`);
```

### 1.16: Fix generateTailwindPreset() — Spacing

**Line 263**:

BEFORE:
```typescript
lines.push(`\t\t\t\t"${PREFIX}-${key}": "var(--${PREFIX}-space-${key})",`);
```

AFTER:
```typescript
lines.push(`\t\t\t\t"${key}": "var(--space-${key})",`);
```

### 1.17: Fix generateTailwindPreset() — Border radius

**Line 270**:

BEFORE:
```typescript
lines.push(`\t\t\t\t"${PREFIX}-${key}": "var(--${PREFIX}-radius-${key})",`);
```

AFTER:
```typescript
lines.push(`\t\t\t\t"${key}": "var(--radius-${key})",`);
```

### 1.18: Fix generateTailwindPreset() — Box shadow (glow)

**Line 277**:

BEFORE:
```typescript
lines.push(`\t\t\t\t"${PREFIX}-glow-${key}": "var(--${PREFIX}-glow-${key})",`);
```

AFTER:
```typescript
lines.push(`\t\t\t\t"glow-${key}": "var(--glow-${key})",`);
```

### 1.19: Fix generateTailwindPreset() — Box shadow (shadow)

**Line 280**:

BEFORE:
```typescript
lines.push(`\t\t\t\t"${PREFIX}-${key}": "var(--${PREFIX}-shadow-${key})",`);
```

AFTER:
```typescript
lines.push(`\t\t\t\t"${key}": "var(--shadow-${key})",`);
```

### 1.20: Fix generateTailwindPreset() — Z-index

**Line 287**:

BEFORE:
```typescript
lines.push(`\t\t\t\t"${PREFIX}-${key}": "var(--${PREFIX}-z-${key})",`);
```

AFTER:
```typescript
lines.push(`\t\t\t\t"${key}": "var(--z-${key})",`);
```

---

## Phase 2: Fix Line Endings

### 2.1: Convert ds-tokens-build.ts to LF

```bash
cd interfaces/desktop
dos2unix scripts/dev/design/ds-tokens-build.ts
```

### 2.2: Convert biome.json to LF

```bash
dos2unix biome.json
```

---

## Phase 3: Regenerate Tokens

### 3.1: Run token generation

```bash
cd interfaces/desktop
pnpm ds:tokens:build
```

### 3.2: Verify generated output

**tokens.css** should contain:
- `--glass-void` NOT `--dp-glass-void`
- `--color-teal-500` NOT `--dp-color-teal-500`

---

## Phase 4: Verify Pre-commit

### 4.1: Run lefthook

```bash
cd interfaces/desktop
pnpm lefthook run pre-commit
```

All checks must pass.

---

## Phase 5: Commit

```bash
git add scripts/dev/design/ds-tokens-build.ts biome.json src/lib/design/tokens/
git commit -m "fix(tokens): remove dp- prefix from all generated tokens

- Remove PREFIX constant from ds-tokens-build.ts
- Generate unprefixed CSS variables: --glass-void, --color-teal-500
- Fix CRLF line endings
- Regenerate tokens.css, types.ts, tailwind.preset.ts

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Files Changed

### Modified Files
```
scripts/dev/design/ds-tokens-build.ts  — remove PREFIX, fix all template literals, LF endings
biome.json                              — LF endings
src/lib/design/tokens/tokens.css        — regenerated without prefix
src/lib/design/tokens/types.ts          — regenerated
src/lib/design/tokens/tailwind.preset.ts — regenerated without prefix
```

---

## Expected Token Output (samples)

### :root block
```css
--hue-teal: 180;
--color-teal-50: oklch(0.97 0.02 180);
--color-teal-500: oklch(0.65 0.15 180);
--glass-void: oklch(0.15 0.02 220 / 0.4);
--glass-smoke: oklch(0.18 0.02 220 / 0.5);
--matte-dark: oklch(0.12 0.01 220);
--text-primary: oklch(0.95 0.01 220);
--space-1: 0.25rem;
--radius-sm: 0.25rem;
--shadow-z1: 0 1px 2px oklch(0 0 0 / 0.1);
--glow-teal: 0 0 20px oklch(0.65 0.15 180 / 0.3);
```

### @theme block
```css
--color-glass-void: var(--glass-void);
--color-teal-500: var(--color-teal-500);
--color-text-primary: var(--text-primary);
--radius-sm: var(--radius-sm);
--shadow-z1: var(--shadow-z1);
--shadow-glow-teal: var(--glow-teal);
--spacing-1: var(--space-1);
```

---

## Invariants

1. **NO PREFIX** — All tokens are unprefixed.
2. **LF line endings** — All TypeScript files use Unix line endings.
3. **Biome passes** — All linting/formatting checks pass.
4. **Tokens regenerate** — Generated files match source tokens.ts exactly.
