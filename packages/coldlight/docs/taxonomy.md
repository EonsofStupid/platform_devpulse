# ColdLight Taxonomy

> Block kind, primitive, and contract reference for @devpulse/coldlight

---

## Overview

Taxonomy is the **spine of ColdLight**. It defines:

1. **What primitives exist** — registered in `primitiveKinds.ts`
2. **What slots each primitive has** — registered in `primitiveRegistry.ts`
3. **What blocks can be composed** — defined in `kinds.ts`
4. **What props are valid** — enforced via Zod in `contracts.ts`

```
Taxonomy = Registry + Validation + Enforcement
```

---

## Taxonomy First Principle

**Before writing ANY primitive code:**

1. Verify kind exists in `taxonomy/primitiveKinds.ts`
2. Verify slots exist in `taxonomy/primitiveRegistry.ts`
3. Verify state enum exists (if stateful)
4. THEN write the primitive

This ensures:
- Consistent naming
- Required structure
- Required attributes
- Required slots
- Predictable output

---

## File Structure

```
taxonomy/
├── index.ts              # SSOT export funnel
├── primitiveKinds.ts     # All data-kind values (43 primitives)
├── primitiveRegistry.ts  # Slots + metadata per primitive
├── kinds.ts              # Block kinds (shell, surface, widget)
├── contracts.ts          # Prop schemas (Zod)
└── slots.ts              # Block slot definitions
```

---

## Primitive Kinds

All primitive kinds registered in `primitiveKinds.ts`:

### Buttons & Toggles
- `button`, `toggle`, `toggleGroup`, `switch`

### Inputs & Forms
- `checkbox`, `radioGroup`, `slider`, `label`, `input`, `textarea`, `select`, `combobox`

### Date & Time
- `calendar`, `dateField`, `datePicker`, `timeField`

### Dialogs & Overlays
- `dialog`, `alertDialog`, `popover`, `hoverCard`, `tooltip`, `contextMenu`, `dropdownMenu`

### Navigation
- `tabs`, `accordion`, `collapsible`, `navigationMenu`, `menubar`, `pagination`, `breadcrumb`

### Layout & Display
- `aspectRatio`, `avatar`, `separator`, `scrollArea`, `progress`

### Feedback
- `toast`, `alert`, `badge`, `skeleton`, `spinner`

### Utilities
- `portal`, `presence`, `focusTrap`, `visuallyHidden`, `liveStatus`, `kbd`

---

## Primitive Slots

Each primitive has defined slots in `primitiveRegistry.ts`:

| Primitive | Slots |
|-----------|-------|
| `button` | `root` |
| `dialog` | `root`, `trigger`, `portal`, `overlay`, `content`, `header`, `title`, `description`, `footer`, `close` |
| `select` | `root`, `trigger`, `value`, `content`, `viewport`, `item`, `label`, `separator` |
| `tabs` | `root`, `list`, `trigger`, `content` |
| `popover` | `root`, `trigger`, `content`, `arrow`, `close` |
| `tooltip` | `root`, `trigger`, `content`, `arrow` |

---

## Block Kinds

Block kinds define what can be composed in VPB:

### Shell Kinds (CSS Grid required)

| Kind | Slots |
|------|-------|
| `appShell` | `topBar`, `sideNav`, `main`, `statusBar`, `dock` |
| `topBar` | `left`, `center`, `right` |
| `sideNav` | `header`, `body`, `footer` |
| `statusBar` | `left`, `center`, `right` |
| `dock` | `content` |

### Surface Kinds

| Kind | Slots |
|------|-------|
| `panel` | `header`, `body`, `footer` |
| `card` | `header`, `body`, `footer` |
| `modal` | `header`, `body`, `footer` |
| `glassFrame` | `content` |
| `inputFrame` | `prefix`, `input`, `suffix` |

### Widget Kinds

| Kind | Slots |
|------|-------|
| `widget` | `header`, `body` |
| `statMeter` | `value`, `label` |
| `chart` | `header`, `chart` |

### Chat Kinds

| Kind | Slots |
|------|-------|
| `chatDock` | `header`, `messages`, `input` |
| `chatThread` | `messages` |
| `chatBubble` | `content`, `meta` |

---

## Contracts (Prop Schemas)

Every kind has a Zod schema defining valid props.

### DsSurfaceProps (Base)

All surface kinds extend this:

```typescript
interface DsSurfaceProps {
  color: {
    mode: "mono" | "duo";
    a: AccentToken;
    b?: AccentToken;
  };
  surface: {
    finish: "glass" | "matte" | "solid";
    texture?: "none" | "noise" | "grain";
    clarity?: "void" | "deep" | "smoke" | "frost";
  };
  frame: {
    mode: "none" | "solid" | "glow";
    width: "thin" | "medium" | "thick";
    glow: GlowToken | "off";
  };
  depth: {
    intent: "flat" | "raised" | "sunken" | "floating";
    bevel: {
      level: "off" | "subtle" | "soft" | "medium";
      style: "outset" | "inset" | "imprint";
    };
  };
}
```

Props use **enum values only** — never raw colors or CSS.

---

## Layout Mode Rules

| Mode | Meaning | Required For |
|------|---------|--------------|
| `grid` | Must use CSS Grid | Shell kinds, dashboard layouts |
| `flex` | Can use flexbox | Inline content |
| `none` | No constraint | Leaf nodes |

**Shell kinds MUST use CSS Grid.** This is enforced.

---

## Validation

Props are validated at runtime using Zod:

```typescript
import { validateKindProps } from '#coldlight/taxonomy';

const result = validateKindProps('panel', props);
if (!result.success) {
  console.error(result.error);
}
```

---

## Adding New Kinds

1. Add kind to `taxonomy/kinds.ts`
2. Add contract to `taxonomy/contracts.ts`
3. Define slots in `taxonomy/slots.ts`
4. Create recipes with matching prefix
5. Document here

---

## Adding New Primitives

1. Add kind to `taxonomy/primitiveKinds.ts`
2. Add slots to `taxonomy/primitiveRegistry.ts`
3. Create primitive folder
4. Implement components
5. Write tests
6. Document in `a11y.md`

---

**This is the canonical taxonomy reference.**
