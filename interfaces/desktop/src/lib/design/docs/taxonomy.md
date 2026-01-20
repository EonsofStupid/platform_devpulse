# ColdLight Taxonomy

> Block kind and contract reference for @devpulse/coldlight

---

## Overview

Taxonomy defines **what blocks exist** and **what props they accept**. It's the schema layer that VPB uses to compose valid UIs.

---

## Block Kinds

A "kind" is a type of composable block. Each kind has:

- **Description** — What it is
- **Layout mode** — `grid`, `flex`, or `none`
- **Slots** — Named positions for children
- **Recipe prefix** — Which recipes apply

---

## Shell Kinds

Shell kinds make up the application chrome. They **require CSS Grid**.

### appShell

Root application shell.

| Property | Value |
|----------|-------|
| Layout | `grid` |
| Slots | `topBar`, `sideNav`, `main`, `statusBar`, `dock` |
| Recipe prefix | `shell` |

```svelte
<div class="grid grid-rows-shell">
  <slot name="topBar" />
  <slot name="sideNav" />
  <slot name="main" />
  <slot name="statusBar" />
  <slot name="dock" />
</div>
```

### topBar

Top navigation bar.

| Property | Value |
|----------|-------|
| Layout | `grid` |
| Slots | `left`, `center`, `right` |
| Recipe prefix | `shell.topBar` |

### sideNav

Side navigation panel.

| Property | Value |
|----------|-------|
| Layout | `grid` |
| Slots | `header`, `body`, `footer` |
| Recipe prefix | `shell.sideNav` |

### statusBar

Bottom status bar.

| Property | Value |
|----------|-------|
| Layout | `grid` |
| Slots | `left`, `center`, `right` |
| Recipe prefix | `shell.statusBar` |

### dock

Floating dock container.

| Property | Value |
|----------|-------|
| Layout | `grid` |
| Slots | `content` |
| Recipe prefix | `shell.dock` |

---

## Surface Kinds

General-purpose containers.

### panel

Generic container panel.

| Property | Value |
|----------|-------|
| Layout | `none` |
| Slots | `header`, `body`, `footer` |
| Recipe prefix | `panel` |

### card

Card surface for content.

| Property | Value |
|----------|-------|
| Layout | `none` |
| Slots | `header`, `body`, `footer` |
| Recipe prefix | `card` |

### modal

Modal overlay.

| Property | Value |
|----------|-------|
| Layout | `none` |
| Slots | `header`, `body`, `footer` |
| Recipe prefix | `modal` |

### glassFrame

Glass frame container.

| Property | Value |
|----------|-------|
| Layout | `none` |
| Slots | `content` |
| Recipe prefix | `glass` |

### inputFrame

Input field container.

| Property | Value |
|----------|-------|
| Layout | `none` |
| Slots | `prefix`, `input`, `suffix` |
| Recipe prefix | `input` |

---

## Widget Kinds

Dashboard widgets.

### widget

Dashboard widget container.

| Property | Value |
|----------|-------|
| Layout | `grid` |
| Slots | `header`, `body` |
| Recipe prefix | `widget` |

### statMeter

Stat display widget.

| Property | Value |
|----------|-------|
| Layout | `none` |
| Slots | `value`, `label` |
| Recipe prefix | `widget.stat` |

### chart

Chart widget.

| Property | Value |
|----------|-------|
| Layout | `none` |
| Slots | `header`, `chart` |
| Recipe prefix | `widget.chart` |

---

## Chat Kinds

Chat interface blocks.

### chatDock

Chat dock panel.

| Property | Value |
|----------|-------|
| Layout | `grid` |
| Slots | `header`, `messages`, `input` |
| Recipe prefix | `chat.dock` |

### chatThread

Chat message thread.

| Property | Value |
|----------|-------|
| Layout | `none` |
| Slots | `messages` |
| Recipe prefix | `chat.thread` |

### chatBubble

Single chat message bubble.

| Property | Value |
|----------|-------|
| Layout | `none` |
| Slots | `content`, `meta` |
| Recipe prefix | `chat.bubble` |

---

## Contracts (Prop Schemas)

Every kind has a Zod schema defining valid props.

### DsSurfaceProps (Base)

All surface kinds extend this:

```typescript
interface DsSurfaceProps {
  color: {
    mode: "mono" | "duo";
    a: AccentToken;        // "teal" | "purple" | "magenta" | "ember" | "frost"
    b?: AccentToken;
    blend?: {
      type: "none" | "dissipate";
      direction: "top" | "bottom" | "left" | "right" | "radial";
      softness: "sharp" | "soft" | "diffuse";
      bias: "start" | "center" | "end";
      strength: "subtle" | "medium" | "strong";
    };
  };
  surface: {
    finish: "glass" | "matte" | "solid";
    texture?: "none" | "noise" | "grain" | "scan";
    clarity?: "void" | "deep" | "smoke" | "frost";
  };
  frame: {
    mode: "none" | "solid" | "glow" | "gradient";
    width: "thin" | "medium" | "thick";
    treatment: "flat" | "beveled" | "rounded";
    glow: GlowToken | "off";
  };
  depth: {
    intent: "flat" | "raised" | "sunken" | "floating";
    bevel: {
      level: "off" | "subtle" | "soft" | "medium";
      style: "outset" | "inset" | "imprint";
    };
  };
  fx?: {
    rimLight?: "off" | "subtle" | "medium" | "strong";
    innerGlow?: "off" | "subtle" | "medium" | "strong";
    sparkle?: "off" | "subtle" | "medium";
    noiseOverlay?: "off" | "subtle" | "medium";
  };
  motion?: {
    idle?: "none" | "breathe" | "pulse" | "scan";
    hover?: "none" | "glow" | "lift" | "highlight";
    press?: "none" | "sink" | "flash";
    focus?: "none" | "ring" | "glow";
  };
}
```

### Kind-Specific Contracts

**PanelProps** (extends DsSurfaceProps):

```typescript
interface PanelProps extends DsSurfaceProps {
  panel: {
    padding: PaddingToken;  // "none" | "sm" | "md" | "lg" | "xl"
    scrollable: boolean;
  };
}
```

**ShellProps** (extends DsSurfaceProps):

```typescript
interface ShellProps extends DsSurfaceProps {
  chrome: {
    level: "appShell" | "panel" | "overlay";
    insetGrid: boolean;
    safeArea: boolean;
  };
}
```

**ChatDockProps** (extends DsSurfaceProps):

```typescript
interface ChatDockProps extends DsSurfaceProps {
  dock: {
    side: "left" | "right" | "floating";
    state: "open" | "minimized" | "closed";
  };
  header: {
    mode: "compact" | "full";
  };
  presence: "offline" | "active" | "busy";
}
```

**WidgetProps** (extends DsSurfaceProps):

```typescript
interface WidgetProps extends DsSurfaceProps {
  widget: {
    type: "chart" | "stat" | "list" | "meter";
    title: string;
    intent: "neutral" | "info" | "warn" | "critical";
  };
}
```

---

## Layout Mode Rules

| Mode | Meaning | Required For |
|------|---------|--------------|
| `grid` | Must use CSS Grid | Shell kinds, dashboard layouts |
| `flex` | Can use flexbox | Inline content |
| `none` | No constraint | Leaf nodes |

**Shell kinds MUST use CSS Grid.** This is enforced by the Vite plugin.

---

## Validation

Props are validated at runtime using Zod:

```typescript
import { validateKindProps } from '@devpulse/coldlight/taxonomy';

const result = validateKindProps('panel', props);
if (!result.success) {
  console.error(result.error);
}
```

---

## Adding New Kinds

1. Add kind definition to `taxonomy/kinds.ts`
2. Add contract to `taxonomy/contracts.ts`
3. Define slots in `taxonomy/slots.ts`
4. Create recipes with matching prefix
5. Document here
