# COLD LIGHT Design System

> **A Tesla-inspired design system for DevPulse.**
> Bits UI primitives + OKLCH tokens + VPB no-code editing.

---

## Architecture Overview

```
lib/design/
├── STYLE_GUIDE.md      ← Coding standards (READ FIRST)
├── README.md           ← This file
│
├── tokens/             ← Layer 0: Atomic values (SSOT)
│   ├── index.ts        ← Barrel export
│   └── tokens.css      ← CSS custom properties
│
├── primitives/         ← Layer 1: Headless components
│   ├── index.ts        ← Barrel export
│   ├── Button.svelte   ← Bits UI + ARIA
│   ├── Surface.svelte  ← Container primitive
│   ├── Tabs.svelte     ← Tab panel primitive
│   └── Popover.svelte  ← Floating content
│
├── semantics/          ← Layer 2: Token-mapped styles
│   ├── index.ts
│   └── [component].css ← Recipes per primitive
│
├── compositions/       ← Layer 3: Combined primitives
│   ├── index.ts
│   ├── TabPanel.svelte ← Surface + Tabs
│   └── FloatingPanel.svelte
│
└── plugins/            ← Layer 4: Custom extensible
    ├── index.ts
    └── ParasiteLogo.svelte
```

---

## Layer Responsibilities

| Layer | Contains | Imports From | VPB Editable |
|-------|----------|--------------|--------------|
| **tokens** | CSS variables | Nothing | Values |
| **primitives** | Headless behavior | tokens, Bits UI | Props |
| **semantics** | Token maps, CSS recipes | tokens | Variants |
| **compositions** | Multi-primitive layouts | primitives, semantics | Layout |
| **plugins** | Custom features | All above | Custom UI |

---

## Core Principles

### 1. Single Source of Truth
- ONE location per concept
- NO duplicate components
- Tokens define ALL visual values

### 2. Constraint-Based Props
```typescript
// Every prop is a finite set
type Variant = "default" | "primary" | "ghost";
type Size = "sm" | "md" | "lg";
```

### 3. Token Map Pattern
```typescript
const sizeMap: Record<Size, string> = {
  sm: "var(--dp-space-2)",
  md: "var(--dp-space-4)",
  lg: "var(--dp-space-6)",
};
```

### 4. CSS Variable Injection
```svelte
<div style:--size={sizeMap[size]}>
```

### 5. Zero Hardcoded Values
```css
/* ✅ CORRECT */
padding: var(--dp-space-4);

/* ❌ FORBIDDEN */
padding: 16px;
```

---

## VPB Integration

VPB (Visual Page Builder) can edit components that follow these rules:

1. **Props use union literals** → VPB shows dropdown
2. **Token maps exist** → VPB can list valid values
3. **CSS variable injection** → VPB can override runtime
4. **`@vpb-editable` tag** → Declares editable scope

---

## Technology Stack

| Concern | Technology |
|---------|------------|
| Primitives | [Bits UI](https://bits-ui.com) (Svelte 5) |
| Color System | OKLCH (perceptual uniformity) |
| Layout | CSS Grid (no flexbox hacks) |
| State | Svelte Runes ($state, $derived) |
| Accessibility | WAI-ARIA via Bits UI |

---

## Implementation Checklist

### Phase 0: Foundation
- [x] Create STYLE_GUIDE.md
- [x] Create README.md
- [ ] Create tokens/index.ts with header
- [ ] Create tokens/tokens.css with header
- [ ] Verify all tokens use OKLCH

### Phase 1: Primitives
- [ ] Install Bits UI (`pnpm add bits-ui`)
- [ ] Create primitives/Button.svelte (Bits UI)
- [ ] Create primitives/Surface.svelte (token maps)
- [ ] Create primitives/Tabs.svelte (Bits UI)
- [ ] Create primitives/Popover.svelte (Bits UI)
- [ ] Verify all use union literal props
- [ ] Verify no hardcoded values in styles

### Phase 2: Semantics
- [ ] Create semantics/button.css recipe
- [ ] Create semantics/surface.css recipe
- [ ] Create semantics/tabs.css recipe
- [ ] Verify all reference tokens only

### Phase 3: Compositions
- [ ] Create compositions/TabPanel.svelte
- [ ] Create compositions/DockingPanel.svelte
- [ ] Verify CSS Grid usage (no negative margins)

### Phase 4: Plugins
- [ ] Migrate ParasiteLogo to plugins/
- [ ] Add @vpb-editable custom UI spec

### Phase 5: VPB Consumption
- [ ] VPB imports from compositions/
- [ ] VPB extends with domain styles
- [ ] VPB no-code editing works

---

## File Header Verification

Run this to check all design system files have headers:

```bash
# Find files missing @file or @fileoverview
grep -rL "@file\|@fileoverview" src/lib/design/**/*.{ts,css,svelte}
```

---

## Import Aliases

Configure in `vite.config.ts`:

```typescript
resolve: {
  alias: {
    '@design': './src/lib/design',
    '@design/tokens': './src/lib/design/tokens',
    '@design/primitives': './src/lib/design/primitives',
  }
}
```

---

## Quick Reference

```typescript
// Tokens
import { tokens } from '@design/tokens';

// Primitives
import { Button, Surface, Tabs } from '@design/primitives';

// Compositions
import { TabPanel, DockingPanel } from '@design/compositions';
```
