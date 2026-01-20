# COLD LIGHT Design System

> Enterprise NO-CODE visual design system for DevPulse.
> **SvelteKit 5 + Bits UI + Tailwind CSS + VPB (Visual Page Builder)**

---

## Quick Start

**Before writing ANY code:**
1. Read [.claude/CLAUDE.md](./.claude/CLAUDE.md) — comprehensive system context
2. Read [.agent/INSTRUCTIONS.md](./.agent/INSTRUCTIONS.md) — enforcement rules

---

## System Architecture

```
tokens.ts (SSOT)
    ↓ pnpm ds:tokens:build
    ↓
├── tokens.css (CSS custom properties)
├── types.ts (TypeScript types)
├── tailwind.preset.ts (Tailwind theme mapping)
└── surfaces.gen.css (Recipe CSS)
    ↓
Components apply data-* attributes
    ↓
Generated CSS rules match and apply styles
```

---

## Core Concepts

### 1. Registry-First Architecture
Nothing exists until registries define it:
```
Tokens → Taxonomy → Recipes → VPB Blocks → Renderers
```

### 2. Recipes are REUSABLE PRESETS
Recipes are a **library of visual presets** that ANY element can use.
Components CONSUME recipes via `data-*` attributes — they don't own effects.

```svelte
<!-- Component uses recipes, doesn't own them -->
<button
  class="dp-surface"
  data-surface="glass"
  data-glow="cyber"
  data-effect="glitch-pulse"
>
```

### 3. Token Pipeline
```bash
# Edit tokens.ts (SSOT), then:
pnpm ds:tokens:build
```

### 4. VPB (Visual Page Builder)
NO-CODE tool for composing UI. Users select blocks, recipes, and props from dropdowns.
- Stores BlockNodes (kind + recipe + props + slots)
- NEVER stores CSS, colors, or classnames

---

## File Rules

### ✅ Can Edit
| File | Purpose |
|------|---------|
| `tokens/tokens.ts` | SSOT for all design values |
| `recipes/css/keyframes.css` | ONLY manually written CSS (motion only) |
| `taxonomy/*.ts` | Block kinds, contracts, slots |
| `recipes/*.ts` | Recipe definitions |
| `recipes/actions/*.ts` | Svelte actions for effects |
| `primitives/*.svelte` | Bits UI wrappers ONLY |
| `components/*.svelte` | Styled compositions |
| `renderers/*.svelte` | VPB block renderers |

### ❌ Never Edit (Generated)
| File | Generated From |
|------|---------------|
| `tokens/tokens.css` | tokens.ts |
| `tokens/types.ts` | tokens.ts |
| `tokens/tailwind.preset.ts` | tokens.ts |
| `recipes/css/surfaces.gen.css` | tokens.ts |

---

## Data Attribute Pattern

Styling is driven by `data-*` attributes:

```svelte
<div
  class="dp-surface"
  data-surface="glass"      <!-- glass | matte | solid -->
  data-variant="deep"       <!-- void | deep | smoke | frost -->
  data-role="panel"         <!-- button | input | panel | card -->
  data-tint="teal"          <!-- teal | purple | gold | coral -->
  data-glow="cyber"         <!-- off | teal | purple | cyber | etc. -->
  data-bevel="subtle"       <!-- off | subtle | soft | medium -->
  data-size="md"            <!-- sm | md | lg -->
  data-effect="glitch-pulse"
>
```

---

## Folder Structure

```
src/lib/design/
├── .claude/              # Claude AI context
│   ├── CLAUDE.md         # Comprehensive documentation
│   └── settings.json     # Quick reference
├── .agent/               # AI agent instructions
│   └── INSTRUCTIONS.md   # Enforcement rules
├── tokens/
│   ├── tokens.ts         # ✅ SSOT
│   ├── tokens.css        # ❌ Generated
│   ├── types.ts          # ❌ Generated
│   └── tailwind.preset.ts # ❌ Generated
├── taxonomy/
│   ├── kinds.ts          # Block kinds
│   ├── contracts.ts      # Prop schemas
│   └── slots.ts          # Slot definitions
├── recipes/
│   ├── index.ts          # Registry
│   ├── css/
│   │   ├── keyframes.css # ✅ Only manual CSS
│   │   └── surfaces.gen.css # ❌ Generated
│   └── actions/          # Svelte actions
├── primitives/           # Bits UI wrappers ONLY
├── components/           # Styled compositions
├── renderers/            # VPB block renderers
└── plugins/              # Special plugins (Parasite, etc.)
```

---

## Commands

```bash
# Token pipeline
pnpm ds:tokens:build      # Generate token outputs
pnpm ds:tokens:watch      # Watch mode

# Verification
pnpm tsx src/scripts/dev/design/scan-violations.ts
```

---

## The 8 Rules

1. **tokens.ts is SSOT** — edit this, run generator
2. **keyframes.css is ONLY manual CSS** — motion only, no colors
3. **data-* attributes drive styling** — not class manipulation
4. **Bits UI only in primitives/** — nowhere else
5. **VPB never stores CSS** — only kind + recipe + props
6. **No arbitrary Tailwind** — no `[...]` brackets
7. **Recipes are REUSABLE** — library of presets
8. **Components CONSUME recipes** — don't own effects

---

## Forbidden Patterns

```svelte
❌ class="bg-[#00ff00]"           <!-- Arbitrary Tailwind -->
❌ style="color: oklch(...)"      <!-- Inline colors -->
❌ import { X } from "bits-ui"    <!-- Outside primitives/ -->
❌ onmousemove for glow           <!-- Should be action -->
```

---

## Quick Decision Tree

**Adding a visual effect?**
1. New color/value? → Add to `tokens.ts`, run generator
2. Animation? → Add keyframe to `keyframes.css` (motion only)
3. Triggered by interaction? → Create action in `recipes/actions/`
4. Component applies `data-effect="my-effect"`

**Creating a component?**
- Wraps Bits UI? → `primitives/`
- Composes primitives + recipes? → `components/`
- VPB block renderer? → `renderers/`
