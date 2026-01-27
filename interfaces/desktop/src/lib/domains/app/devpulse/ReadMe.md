# domains/app/devpulse

> **Status:** `SCAFFOLD`
> **Version:** `0.2.0`
> **Last Updated:** `2026-01-22`
> **Layer:** `domains`
> **Kind:** `hub`
> **Route:** `/devpulse`
> **Mode Default:** `GENERAL`

---

## Overview

> **Philosophy**: "Your home base. The pulse of your dev life."

The **DevPulse Hub** is the global overview and entry point. Community engagement, personal stats, settings management, and at-a-glance dashboards. This is where users land by default and return to check their overall status.

```
+------------------------------------------------------------------------------+
|  DEVPULSE                                             [Mode: GENERAL only]   |
+------------------------------------------------------------------------------+
|                                                                              |
|  +------------------------------------------------------------------------+  |
|  |  HOME DASHBOARD                                                        |  |
|  |  +--------------+  +--------------+  +--------------+                  |  |
|  |  |  STATS       |  |  ACTIVITY    |  |  COMMUNITY   |                  |  |
|  |  |  ----------  |  |  ----------  |  |  ----------  |                  |  |
|  |  |  Projects: 5 |  |  Streak: 12d |  |  Friends: 23 |                  |  |
|  |  |  Commits: 42 |  |  Last: 2h    |  |  Groups: 3   |                  |  |
|  |  +--------------+  +--------------+  +--------------+                  |  |
|  |                                                                        |  |
|  |  +----------------------------------------------------------------+   |  |
|  |  |  RECENT PROJECTS                               [View All ->]    |   |  |
|  |  |  +----------+ +----------+ +----------+ +----------+            |   |  |
|  |  |  | Project1 | | Project2 | | Project3 | | Project4 |            |   |  |
|  |  |  +----------+ +----------+ +----------+ +----------+            |   |  |
|  |  +----------------------------------------------------------------+   |  |
|  +------------------------------------------------------------------------+  |
|                                                                              |
+------------------------------------------------------------------------------+
```

---

## Architecture Alignment

> **This domain MUST align with ColdLight Registry-First Architecture.**
> **See:** `$lib/design/MASTER-PLAN.md` | `$lib/design/CONTRACT_SYSTEM.md`

### Technology Stack (NON-NEGOTIABLE)

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | SvelteKit 5 | App framework, routing, SSR |
| **Behavior** | MeltUI | Headless primitives (accessibility, keyboard, focus) |
| **Styling** | Tailwind CSS | Utility classes, JIT compilation |
| **Values** | tokens.ts -> CSS | SSOT for colors, spacing, shadows |
| **Composition** | VPB | Selects enums + recipes, outputs BlockNodes |

**BANNED:**
- Framework-agnostic abstractions
- Custom headless primitive implementations
- CSS-in-JS libraries
- Direct bits-ui imports (use `$lib/design/sys/api/_internal`)

---

## Taxonomy Integration

### 4-Level Hierarchy

| Level | Category | DevPulse Usage |
|-------|----------|----------------|
| **0** | **Tokens** | Raw values from `$lib/design/tokens/` |
| **1** | **Intent** | `DsIntent`: neutral, info, success, warning, danger |
| **2** | **Recipe** | `panel.glass`, `widget.glass`, `card.glass` |
| **3** | **Context** | FOCUS levels cascade to all children |

### FOCUS System (Global Attention Weights)

FOCUS is a global context that cascades to all children:

| Level | Blur | Shadow | Saturation | Use Case |
|-------|------|--------|------------|----------|
| `low` | 8px | subtle | 150% | Background widgets |
| `medium` | 12px | elevated | 180% | Default dashboard |
| `high` | 20px | deep | 200% | Active/focused card |
| `critical` | 24px | glow+deep | 200% | Alerts, critical actions |

```svelte
<!-- Context cascades to all children -->
<FocusProvider level="medium">
  <Dashboard>
    <!-- All widgets inherit medium focus -->
  </Dashboard>
</FocusProvider>
```

---

## Contract System

### DsCoreProps (Universal - ALL components)

```typescript
// Every component in DevPulse uses these
interface DsCoreProps {
  intent: "neutral" | "info" | "success" | "warning" | "danger";
  tone: "app" | "chat" | "maestro";
  state: "default" | "hover" | "active" | "focus" | "disabled" | "loading" | "readonly";
  density: "comfortable" | "compact" | "dense";
  importance?: "standard" | "elevated" | "critical";
  visibility?: "visible" | "hidden" | "collapsed";
  interaction?: { cursor?, pointerEvents?, userSelect? };
  a11y?: { ariaLabel?, role?, tabIndex? };
}
```

### DsSurfaceProps (Surface-Capable Kinds ONLY)

Surface props apply to **container/material kinds** like panels, cards, widgets:

```typescript
// ONLY for: panel, card, widget, modal, container
interface DsSurfaceProps {
  materialFamily?: "solid" | "glass" | "acrylic" | "metal" | "holo" | "liquid" | "void";
  clarity?: "clear" | "clean" | "mist" | "frosted" | "heavyFrost";
  tintMode?: "none" | "mono" | "duo" | "iridescent";
  backdropBlur?: "0" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  elevation?: "0" | "1" | "2" | "3" | "4" | "5";
  // ... see CONTRACT_SYSTEM.md for full spec
}
```

### SurfacePolicy by Kind

| Kind | SurfacePolicy | VPB Behavior |
|------|---------------|--------------|
| `widget` | `optional` | Surface UI shown in Advanced mode |
| `card` | `optional` | Surface UI shown in Advanced mode |
| `label` | `none` | Surface UI hidden entirely |
| `icon` | `none` | Surface UI hidden entirely |

---

## Class Composition Pattern

Classes follow a layered composition pattern:

```
base + semantic + recipe + modifiers
```

### Example

```html
<button class="btn btn-primary v-cyber s-glass e-2 sz-md">
```

### Class Categories

| Prefix | Purpose | Example |
|--------|---------|---------|
| (none) | Base component | `.btn`, `.panel`, `.widget` |
| `-{intent}` | Semantic intent | `.btn-primary`, `.card-info` |
| `v-` | Recipe variant | `.v-cyber`, `.v-frost` |
| `s-` | Surface material | `.s-glass`, `.s-metal` |
| `e-` | Elevation | `.e-1`, `.e-2`, `.e-3` |
| `sz-` | Size | `.sz-sm`, `.sz-md`, `.sz-lg` |

---

## Adapter Pattern (CRITICAL)

**NEVER import directly from bits-ui. Use the adapter layer.**

```svelte
<!-- WRONG -->
<script>
  import { Button } from "bits-ui";
</script>

<!-- CORRECT -->
<script>
  import { BitsButton } from "$lib/design/sys/api/_internal";
</script>
```

### Why Adapters

- ColdLight owns ALL accessibility attributes
- MeltUI provides behavior only (open/close, focus trap, keyboard)
- Adapter adds `data-kind`, `data-slot`, `data-state`, ARIA

---

## 6-Stage Gate (Renderers ONLY)

**Before any `.svelte` renderer can be created in DevPulse:**

| Stage | Checkpoint |
|-------|------------|
| **0** | Kind name exists, purpose documented, slots defined |
| **1** | Uses existing semantic tokens (no new component-specific tokens) |
| **2** | Kind added to `taxonomy/kinds.ts` with prop schema |
| **3** | Recipe added to `recipes/index.ts` with `requires` actions |
| **4** | Block added to VPB palette with defaults |
| **5** | NOW create `.svelte` - receives `{ recipe, props, slots }` ONLY |

**If any stage fails: STOP. Fix registry first.**

---

## Hub Structure (Hyper-Modular)

```
domains/app/devpulse/
├── README.md               # This file
├── CHECKLIST.md            # Quality gates
├── index.ts                # Barrel exports (TODO)
│
├── components/             # Hub-level shared components
│   ├── Carousel.svelte     # EXISTS
│   ├── StatusBar.svelte    # EXISTS
│   ├── TopBar.svelte       # EXISTS
│   ├── Viewport.svelte     # EXISTS
│   └── widgets/            # Dashboard widgets (TODO)
│
├── features/               # Self-contained feature modules
│   ├── community/          # EMPTY - needs scaffold
│   ├── dashboard/          # EMPTY - needs scaffold
│   ├── profile/            # EMPTY - needs scaffold
│   ├── settings/           # EMPTY - needs scaffold
│   └── stats/              # EMPTY - needs scaffold
│
├── pages/                  # Hub-level pages
│   ├── DevpulseDashboard.svelte  # EXISTS
│   ├── HomeDashboard.svelte      # EXISTS
│   └── DevpulseFrame.svelte/     # ERROR: Directory, should be file
│
├── runes/                  # Hub-level runes (trickle-down source)
│                           # EMPTY - needs devpulse.runes.svelte.ts
│
├── services/               # Hub-level services
│                           # EMPTY - needs devpulse.service.ts
│
├── types/                  # Hub-level types
│                           # EMPTY - needs devpulse.types.ts
│
└── utils/                  # Hub-level utilities
                            # EMPTY
```

---

## Feature Scaffold Pattern

Each feature follows the **hyper-modular pattern** with self-contained structure.

```
features/{feature-name}/
├── components/         # Feature-specific UI components
├── pages/              # Feature pages/views
├── services/           # Feature microservices
├── types/              # Feature type definitions
├── utils/              # Feature utilities
└── runes/              # (Optional) Feature-local runes
```

---

## Runes Trickle-Down Pattern

```
layouts/app/runes ─────> sys/runes/global.svelte.ts
                              │
                              v
                    devpulse/runes/devpulse.runes.svelte.ts
                              │
          ┌───────────────────┼───────────────────┐
          v                   v                   v
   dashboard.runes      stats.runes      community.runes
```

### Hub Runes Contract

```typescript
// devpulse/runes/devpulse.runes.svelte.ts

/**
 * @module domains/app/devpulse/runes/devpulse.runes.svelte
 * @description Hub-level reactive state for DevPulse
 *
 * @consumes sys/runes/global.svelte.ts
 * @provides devpulse-specific derived state
 */
class DevPulseState {
  // Derived from global
  isActive = $derived(global.current_domain === 'devpulse');

  // Hub-specific state
  activeWidget = $state<string | null>(null);
  dashboardLayout = $state<'grid' | 'list'>('grid');
  focusLevel = $state<'low' | 'medium' | 'high' | 'critical'>('medium');

  // Computed
  widgetCount = $derived(this.widgets.length);
}

export const devpulse = new DevPulseState();
```

---

## Services Pattern

```
Feature Services               Hub Service              Rust Engine
─────────────────             ────────────             ────────────
stats.service.ts    ──┐
                      │
community.service.ts ─┼──> devpulse.service.ts ──> Tauri IPC
                      │
profile.service.ts  ──┘
```

### Hub Service Contract

```typescript
// devpulse/services/devpulse.service.ts

/**
 * @module domains/app/devpulse/services/devpulse.service
 * @description Hub-level service orchestrating feature services
 *
 * @fires devpulse:stats-request
 * @fires devpulse:profile-update
 * @listens engine:stats-response
 */
class DevPulseService {
  async getStats(): Promise<UserStats> { /* ... */ }
  async updateProfile(data: ProfileData): Promise<void> { /* ... */ }
  async getFriends(): Promise<Friend[]> { /* ... */ }
}

export const devpulseService = new DevPulseService();
```

---

## Zod Validation at Boundaries

### VPB Creates Only Legal Nodes

```typescript
// When VPB creates a widget block:
const widgetNode = createBlock({
  kind: "widget",
  recipe: "widget.glass",  // Must be in KindRegistry.widget.allowedRecipes
  props: {
    core: { intent: "neutral", tone: "app", state: "default", density: "comfortable" },
    surface: { materialFamily: "glass", clarity: "clean", elevation: "2" }
  }
});

// Zod validates before creation - invalid state impossible
```

### Renderer Validates at Runtime

```typescript
// Renderers are a boundary - DB gives untyped JSON
async function loadDashboardLayout(layoutId: string): Promise<BlockNode[]> {
  const { tree_json } = await db.ds_block_tree.findUnique({ layout_version_id: layoutId });

  const validated = BlockNodeArraySchema.safeParse(tree_json);
  if (!validated.success) {
    throw new BlockTreeValidationError(validated.errors);
  }

  return validated.data;
}
```

---

## CSS Grid for Shell/Dashboard Layout

**Rule E from MASTER-PLAN.md: Shell kinds MUST use CSS Grid.**

```html
<!-- Dashboard uses CSS Grid, NOT flexbox -->
<div class="grid grid-cols-shell-nav-aside grid-rows-shell">
  <TopBar slot="topbar" />
  <SideNav slot="nav" />
  <main slot="content">
    <!-- Widget grid also uses CSS Grid -->
    <div class="grid grid-cols-3 gap-4">
      <Widget />
      <Widget />
      <Widget />
    </div>
  </main>
  <StatusBar slot="status" />
</div>
```

**Flexbox allowed ONLY for inline content** (buttons in a row, icon + text).

---

## Features

### Dashboard Feature

> **Route:** `/devpulse` (default)
> **Purpose:** Home dashboard with overview widgets
> **SurfacePolicy:** `optional` for all containers

| Component | Status | DsCoreProps | DsSurfaceProps |
|-----------|--------|-------------|----------------|
| `DashboardPage.svelte` | TODO | Required | N/A (page) |
| `WidgetGrid.svelte` | TODO | Required | Optional |
| `QuickActions.svelte` | TODO | Required | Optional |

### Stats Feature

> **Route:** `/devpulse/stats`
> **Purpose:** Personal development statistics

| Component | Status | Kind | SurfacePolicy |
|-----------|--------|------|---------------|
| `StatsPage.svelte` | TODO | page | none |
| `CommitGraph.svelte` | TODO | chart | required |
| `ProjectMetrics.svelte` | TODO | widget | optional |

### Community Feature

> **Route:** `/devpulse/community`
> **Purpose:** Social features, friends, groups

### Profile Feature

> **Route:** `/devpulse/profile`
> **Purpose:** User profile management

### Settings Feature

> **Route:** `/devpulse/settings`
> **Purpose:** App-wide settings

---

## Component Inventory

### Existing Components

| Component | Status | Kind | DsCoreProps | DsSurfaceProps |
|-----------|--------|------|-------------|----------------|
| `Carousel.svelte` | PARTIAL | container | TODO | optional |
| `StatusBar.svelte` | PARTIAL | shell | TODO | optional |
| `TopBar.svelte` | PARTIAL | shell | TODO | optional |
| `Viewport.svelte` | PARTIAL | container | TODO | optional |

### Widgets (TODO)

| Widget | Kind | Recipe | Priority |
|--------|------|--------|----------|
| `ProjectCard.svelte` | card | `card.glass` | HIGH |
| `StatsCard.svelte` | widget | `widget.glass` | HIGH |
| `ActivityFeed.svelte` | panel | `panel.glass` | MEDIUM |
| `CommunityCard.svelte` | card | `card.glass` | LOW |

---

## Data Attributes Contract

All DevPulse components emit consistent data attributes:

```html
<div
  data-kind="widget"     <!-- Kind from taxonomy -->
  data-slot="content"    <!-- Slot within kind -->
  data-state="default"   <!-- Current state -->
  data-id="stats-card"   <!-- Stable ID for testing -->
>
```

---

## State Dependencies

### Reads From

| Source | State | Purpose |
|--------|-------|---------|
| `sys/runes/global.svelte.ts` | `current_domain` | Active hub check |
| `sys/runes/global.svelte.ts` | `user` | User data |
| `sys/runes/global.svelte.ts` | `theme` | Theme state |

### Writes To

| Target | State | Trigger |
|--------|-------|---------|
| `devpulse/runes` | `activeWidget` | Widget focus |
| `devpulse/runes` | `dashboardLayout` | Layout toggle |
| `devpulse/runes` | `focusLevel` | Attention context change |

---

## Data Sources

| Source | Purpose | Cache |
|--------|---------|-------|
| `libSQL` | User profile, settings | 5min |
| `SurrealDB` | Social graph, community | 1min |
| `DuckDB` | Stats aggregation | 15min |

---

## Cleanup Required

| Item | Issue | Action |
|------|-------|--------|
| `pages/DevpulseFrame.svelte/` | Directory instead of file | Delete or convert |
| `features/*` | All empty | Scaffold internal structure |
| `runes/` | Empty | Create `devpulse.runes.svelte.ts` |
| `services/` | Empty | Create `devpulse.service.ts` |
| `types/` | Empty | Create `devpulse.types.ts` |
| Existing components | Missing DsCoreProps | Add contract compliance |

---

## ADR References

| ADR | Status | Title |
|-----|--------|-------|
| ADR-013 | PENDING | Dashboard widget system |
| ADR-014 | PENDING | Stats aggregation pipeline |

---

## Related

| Resource | Path | Purpose |
|----------|------|---------|
| MASTER-PLAN | `$lib/design/MASTER-PLAN.md` | Registry-First Architecture |
| CONTRACT_SYSTEM | `$lib/design/CONTRACT_SYSTEM.md` | Prop contracts |
| TAXONOMY | `$lib/design/TAXONOMY.md` | Kind registry, FOCUS system |
| App Layout | `layouts/app/` | Shell container |
| GlobalState | `sys/runes/global.svelte.ts` | Shared state |
| WiredFront | `domains/app/wiredfront/` | Gold standard scaffold |
| OverMind | `domains/app/overmind/` | Sandbox peer |
| DevForge | `domains/app/devforge/` | Project workspace |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 0.2.0 | 2026-01-22 | Rewrote with full ColdLight architecture alignment |
| 0.1.0 | 2026-01-22 | Initial scaffold with hyper-modular pattern |
