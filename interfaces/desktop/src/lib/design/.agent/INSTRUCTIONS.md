# COLD LIGHT Design System - AI Agent Instructions

> **READ THIS BEFORE WRITING ANY CODE IN THIS DESIGN SYSTEM.**

---

## 🛑 MANDATORY PRE-CODE SEQUENCE

Before writing ANY CSS or component code, execute these steps IN ORDER:

### Step 1: Identify the Tier
- [ ] Which of the 8 tiers does this belong to?
- [ ] Am I in the correct folder for that tier?

### Step 2: Check if Required Tokens Exist
```bash
# Grep for the token you need
grep -r "dp-hue-" tokens/tokens.css
```
- [ ] If the token DOES NOT exist → **STOP. Add it to tokens.css FIRST.**
- [ ] If the token exists → proceed.

### Step 3: Write Code Using ONLY Token Variables
- [ ] Every color value uses `var(--dp-*)` or `oklch(... var(--dp-hue-*))`
- [ ] Every spacing value uses `var(--dp-space-*)`
- [ ] Every radius uses `var(--dp-radius-*)`
- [ ] Every duration uses `var(--dp-duration-*)`
- [ ] NO hardcoded values. Period.

### Step 4: Verify After Writing
- [ ] Grep the file for hardcoded values:
```bash
grep -E "oklch\([0-9]" myfile.css  # Should return NOTHING
grep -E "[0-9]+px" myfile.css      # Should return NOTHING (except calc())
```

---

## 🚨 FORBIDDEN PATTERNS

```css
/* ❌ NEVER DO THIS */
color: oklch(70% 0.18 195);
border-radius: 8px;
padding: 16px;

/* ✅ ALWAYS DO THIS */
color: oklch(70% 0.18 var(--dp-hue-teal));
border-radius: var(--dp-radius-md);
padding: var(--dp-space-4);
```

---

## Token Creation Flow

When you need a new token:

1. **Open `tokens/tokens.css`**
2. **Find the correct section** (hues, spacing, blur, etc.)
3. **Add the new token with a comment**
4. **Then use it in your component**

Example:
```css
/* tokens.css - add new hue */
--dp-hue-electric: 220;   /* Electric blue for cyber accent */

/* Then in your component */
color: oklch(70% 0.20 var(--dp-hue-electric));
```

---

## Import Boundary Rules

| From | Can Import | CANNOT Import |
|------|------------|---------------|
| `primitives/` | `bits-ui`, `tokens` | - |
| `components/` | `primitives/`, `tokens` | `bits-ui` directly |
| `blocks/` | `components/`, `tokens` | `bits-ui` directly |
| `domains/plugins/` | `tokens`, `components` | `bits-ui` directly |

---

## Svelte-Native State Pattern (Bits UI Style)

Use `data-*` attributes for component state, NOT class modifiers:

```svelte
<!-- ✅ CORRECT: Svelte-native + Bits UI pattern -->
<button
  class="vpb-tab"
  data-state={isActive ? "active" : "inactive"}
>

<!-- ❌ WRONG: Framework-agnostic BEM modifier -->
<button
  class="vpb-tab"
  class:vpb-tab--active={isActive}
>
```

CSS uses attribute selectors:
```css
.vpb-tab[data-state="active"] { ... }
```

Common data-* attributes:
- `data-state` - active/inactive/disabled
- `data-mode` - docked/floating/minimized
- `data-variant` - primary/secondary/ghost
- `data-size` - sm/md/lg

---

## File Header Template

Every file MUST have:

```typescript
/**
 * @file src/lib/design/[tier]/[filename]
 * @layer [tier-name]
 * @description [what this does]
 * @since 1.0.0
 */
```

---

## Self-Check Before Committing

Run these commands:

```bash
# Check for hardcoded colors
grep -rE "oklch\([0-9]" --include="*.css" .

# Check for hardcoded pixels (excluding calc)
grep -rE "[0-9]+px" --include="*.css" . | grep -v "calc"

# Check for bits-ui imports outside primitives
grep -r "from 'bits-ui'" --include="*.svelte" components/ blocks/ domains/
```

All should return EMPTY results.
