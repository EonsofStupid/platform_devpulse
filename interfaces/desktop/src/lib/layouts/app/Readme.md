# layouts/app

> **Status:** `IN_PROGRESS`
> **Version:** `0.1.0`
> **Last Updated:** `2026-01-22`
> **Layer:** `layouts`
> **Kind:** `shell`

---

## Overview

The **dumb shell** layout providing persistent navigation, status indicators, and content framing for all four hubs. **No business logic** — only presentational components with minimal UI state.

```
┌──────────────────────────────────────────────────────────────────┐
│ TOPBAR (100%)                                                    │
│ ParasiteLogo │ ─ spacer ─ │ [search] [user] [web] [notifications]│
├────────┬─────────────────────────────────────────────────────────┤
│ SIDEBAR│ CONTENT AREA                                            │
│ 64px   │ (scrollable, hub dashboards render here)                │
│ icons  │                                                         │
│ only   │                                                         │
├────────┴─────────────────────────────────────────────────────────┤
│ STATUSBAR (100%)                                                 │
│ [●] online │ ─ uptime ─ │ v0.1.0                                 │
└──────────────────────────────────────────────────────────────────┘
```

### Hubs Powered

| Hub | Route | Purpose |
|-----|-------|---------|
| **DevPulse** | `/devpulse` | Global overview, entry point, community |
| **OverMind** | `/overmind` | Ephemeral sandbox, theorycrafting |
| **DevForge** | `/devforge` | Active project workspace |
| **WiredFront** | `/wiredfront` | Media capture, gallery, editing |

---

## Architecture

### CSS Grid Specification

```css
grid-template-rows: 48px 1fr 32px;
grid-template-columns: 64px 1fr;
grid-template-areas:
    "topbar  topbar"
    "sidebar content"
    "status  status";
```

### Component Flow

```mermaid
flowchart TD
    A[Frame.svelte] --> B[TopBar.svelte]
    A --> C[Sidebar.svelte]
    A --> D[StatusBar.svelte]
    A --> E[Content Slot]

    B --> F[Parasite Logo]
    B --> G[Search Overlay]
    B --> H[Icon Group - TODO]

    C --> I[Hub Navigation]
    C --> J[Tooltips]

    D --> K[Connection Status]
    D --> L[Uptime]
    D --> M[Version]

    E --> N[Domain Dashboard]
```

### State Contract

```mermaid
flowchart LR
    subgraph GlobalState["sys/runes/global.svelte.ts"]
        A[current_domain]
        B[sidebar_expanded]
        C[theme]
    end

    subgraph Shell["layouts/app"]
        D[Sidebar] -->|reads| A
        D -->|reads| B
        E[Frame] -->|reads| C
    end

    subgraph Domains["domains/app/*"]
        F[Hub Dashboards] -->|writes| A
    end
```

---

## Engine Facade Integration

> **ADR-PENDING**: All engine communication flows through the facade pattern.

### Rules

1. **No direct Tauri commands** from layout components
2. **Event bus pattern** for status updates
3. **Type alignment** with `systems/engine` bindings

### Tauri Commands (Reference)

| Command | Source | Consumer |
|---------|--------|----------|
| `get_connection_status` | Engine | StatusBar |
| `get_system_uptime` | Engine | StatusBar |
| `get_vram_usage` | Engine | StatusBar (future) |

### Event Bus (Planned)

```typescript
// Events layout components may LISTEN to (never emit)
interface ShellEvents {
    'engine:connection-change': { status: 'online' | 'offline' | 'hybrid' };
    'engine:telemetry-update': { vram: number; uptime: string };
}
```

---

## Component Inventory

### Stateful Components (6 Allowed)

Only these components may have local `$state()`:

| Component | Runes | Purpose |
|-----------|-------|---------|
| `TopBar.svelte` | `$state()` | Search overlay toggle |
| `Sidebar.svelte` | `$state()` | Hover/animation state |
| `StatusBar.svelte` | `$state()` | Status indicator state |
| `Avatar.svelte` | `$state()` | User menu toggle (TODO) |
| `Logo.svelte` | `$state()` | Interaction animations (TODO) |
| `Status.svelte` | `$state()` | Detailed status popover (TODO) |

### Current Status

| Component | Status | TSDoc | Tests | Notes |
|-----------|--------|-------|-------|-------|
| `Frame.svelte` | SCAFFOLD | TODO | - | Grid shell, `$props()` only |
| `TopBar.svelte` | PARTIAL | TODO | - | Missing icon group |
| `Sidebar.svelte` | PARTIAL | TODO | - | Missing expand/collapse |
| `StatusBar.svelte` | SCAFFOLD | TODO | - | Hardcoded values |
| `index.ts` | EMPTY | - | - | No exports |

---

## TruClamp Utility

> **Location:** `layouts/app/utils/truclamp.ts`

A CSS utility for clamping values with enhanced control.

```typescript
/**
 * @file layouts/app/utils/truclamp.ts
 * @layer layouts
 * @kind utility
 *
 * TruClamp - Enhanced CSS clamping utility for layouts
 *
 * @example
 * const width = truclamp(200, '15vw', 400); // min, preferred, max
 *
 * @since 0.1.0
 */
export function truclamp(min: number, preferred: string, max: number): string {
    return `clamp(${min}px, ${preferred}, ${max}px)`;
}
```

---

## Data Attributes Contract

All shell components MUST use these data attributes:

```html
<!-- Frame -->
<div data-layout="app" data-route="{current_domain}">

<!-- TopBar -->
<header data-slot="topbar">

<!-- Sidebar -->
<aside data-slot="sidebar" data-expanded="{boolean}">

<!-- StatusBar -->
<footer data-slot="statusbar">

<!-- Content -->
<main data-slot="content">
```

---

## Token Dependencies

```css
/* ========== REQUIRED TOKENS ========== */

/* Spacing */
--space-1, --space-2, --space-3, --space-4

/* Surfaces */
--surface-glass-void    /* TopBar, StatusBar background */
--surface-glass-deep    /* Sidebar background */
--surface-glass-smoke   /* Icon button default */
--surface-glass-frost   /* Icon button active */
--color-void            /* Frame background */

/* Borders */
--border-subtle, --border-soft, --border-medium

/* Effects */
--bevel-outset-subtle, --bevel-outset-soft, --bevel-outset-medium
--bevel-inset-soft
--shadow-z3, --shadow-z4, --shadow-glow-teal
--blur-lg, --blur-xl

/* Typography */
--text-white, --text-secondary, --text-muted
--text-xs, --text-sm
--font-sans, --font-mono

/* Signals */
--signal-teal, --signal-success, --signal-error

/* Animation */
--duration-fast, --duration-normal
--ease-out, --ease-in-out, --ease-bounce

/* Radius */
--radius-md, --radius-lg, --radius-full
```

---

## File Structure

```
layouts/app/
├── README.md           # This file
├── CHECKLIST.md        # Quality gates
├── index.ts            # Barrel exports (TODO)
├── Frame.svelte        # CSS Grid shell (SSOT)
├── TopBar.svelte       # Persistent header
├── Sidebar.svelte      # Icon navigation
├── StatusBar.svelte    # Persistent footer
├── AppLayout.svelte    # (REMOVE - duplicate)
├── utils/
│   └── truclamp.ts     # TruClamp utility (TODO)
└── components/
    └── shell/          # (REMOVE - consolidate to root)
        ├── Frame.svelte
        ├── Sidebar.svelte
        └── TopBar.svelte
```

> **Action:** Delete `components/shell/` and `AppLayout.svelte` after confirming root versions are canonical.

---

## Usage

```svelte
<!-- +layout.svelte -->
<script lang="ts">
    import { Frame } from '$lib/layouts/app';
</script>

<Frame>
    {@render children()}
</Frame>
```

---

## ADR References

| ADR | Status | Title |
|-----|--------|-------|
| ADR-001 | PENDING | Shell state isolation pattern |
| ADR-002 | PENDING | Engine facade communication |
| ADR-003 | PENDING | Z-index layering system |

---

## Related

| Resource | Path | Purpose |
|----------|------|---------|
| GlobalState | `lib/sys/runes/global.svelte.ts` | Shared state singleton |
| Parasite Logo | `lib/design/plugins/parasite` | Brand typography |
| Chat Overlay | `layouts/chat/README.md` | Floating chat layer |
| Hub Hierarchy | `HUB_ROUTE_HIERARCHY.md` | Navigation spec |
| ColdLight | `lib/design/` | Design system tokens |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | 2026-01-22 | Initial scaffold with CSS Grid layout |
