# SPRINT: A2UI Integration — AI-Driven UI as a Submodule

**Status**: PLANNED
**Priority**: P1 — Enables AI (Maestro/Clyffy) to generate rich UI dynamically.
**Prerequisites**: SPRINT-TABS-FIX (Tabs must work), SPRINT-KIND-REGISTRY (components must be cataloged)
**Category**: Platform / AI Integration

---

## Problem Statement

Maestro/Clyffy needs to generate rich, interactive UI for chat responses, dashboards, and tool outputs. A2UI (github.com/EonsofStupid/a2ui) provides the declarative JSON format — agents emit JSON describing component trees, a renderer turns it into real UI. DevPulse needs a Svelte renderer that maps A2UI component types to ColdLight components.

---

## Pre-Execution Research (Verified 2026-03-21)

### What A2UI Is

- **Repo**: github.com/EonsofStupid/a2ui (v0.8 Public Preview, Apache 2.0)
- **Purpose**: Declarative JSON format for AI-generated UIs — "safe like data, expressive like code"
- **Stack**: TypeScript (87.9%), Python (10.3%)
- **Renderers**: Lit, Markdown, Web Core (React planned)
- **Pattern**: Agent emits JSON → client renders from pre-approved component catalog
- **Key feature**: "Smart Wrapper" registry pattern maps server types to client components

### How It Fits DevPulse

```
Maestro/Clyffy (kernel)
  → emits A2UI JSON (component tree + data model)
  → Tauri IPC delivers JSON to frontend
  → A2UI Svelte renderer reads JSON
  → Maps each component type to ColdLight component via registry
  → Renders full interactive UI with 8-axis styling, ARIA, recipes
```

### What Exists on Disk

| Asset | Status |
|-------|--------|
| a2ui repo | EXISTS on GitHub, NOT cloned locally |
| deps/ directory | EXISTS — other submodules live here (kokoros, rro, outlines-core, etc.) |
| A2UI renderer for Svelte | DOES NOT EXIST — needs to be built |
| ColdLight component catalog | 89 component kinds exist, only 2 registered in kind-definitions |

### SSOT Map

| Concept | SSOT | Notes |
|---------|------|-------|
| A2UI spec | `deps/a2ui/specification/` | The JSON format definition |
| Component catalog | `registry/kind-definitions.ts` | Maps kind names to ColdLight components |
| Renderer | `src/lib/design/a2ui/` (NEW) | Svelte renderer consuming the catalog |
| Agent SDK | `deps/a2ui/agent_sdks/` | What Maestro uses to emit A2UI JSON |

---

## Tasks

### Task 1: Add a2ui as git submodule
```bash
cd d:/localdev/platform_devpulse
git submodule add https://github.com/EonsofStupid/a2ui.git deps/a2ui
```

### Task 2: Read the A2UI specification
Read `deps/a2ui/specification/` to understand the exact JSON schema — component types, data binding, event model, incremental updates.

### Task 3: Read existing renderers
Read the Lit renderer in `deps/a2ui/renderers/` to understand the rendering pattern — how it maps component types to implementations, how data binding works, how events flow back.

### Task 4: Design the Svelte renderer

**STOP — Owner Decision Required**

**Location**: Where does the Svelte renderer live?
- **Option A**: `src/lib/design/a2ui/` — inside the design system (renderer is a ColdLight concern)
- **Option B**: `src/lib/a2ui/` — parallel to design (renderer is a platform concern that uses ColdLight)
- **Option C**: `deps/a2ui/renderers/svelte/` — contribute back to the a2ui repo

**Recommendation**: Option A — the renderer maps directly to ColdLight kinds and must import from the design system.

### Task 5: Build the component registry mapper
Maps A2UI component type names to ColdLight component imports:
```typescript
// a2ui/registry.ts
const A2UI_CATALOG = {
  'button': () => import('$lib/design/components/button/index.js'),
  'card': () => import('$lib/design/components/card/index.js'),
  'tabs': () => import('$lib/design/components/tabs/index.js'),
  'widget': () => import('$lib/design/blocks/widgets/index.js'),
  // ... all registered kinds
} as const;
```

### Task 6: Build the Svelte renderer component
A single `<A2UIRenderer>` component that takes A2UI JSON and renders the component tree:
```svelte
<A2UIRenderer payload={a2uiJson} catalog={A2UI_CATALOG} />
```

### Task 7: Wire Maestro agent SDK
Ensure the Rust kernel (Maestro) can construct A2UI JSON payloads. This may use the Python agent SDK from `deps/a2ui/agent_sdks/` or a Rust equivalent.

### Task 8: Verify end-to-end
Maestro emits a simple A2UI payload (e.g., a card with text) → IPC → Svelte renderer → ColdLight Card renders on screen.

---

## Exit Criteria

- a2ui submodule cloned and accessible
- Svelte renderer renders A2UI JSON payloads using ColdLight components
- Component registry maps A2UI types to ColdLight kinds
- At least 5 component types mapped and rendering
- Maestro can emit A2UI JSON that renders in the chat panel

---

## Files Changed (Estimate)

| File | Action |
|------|--------|
| `.gitmodules` | Add a2ui submodule |
| `deps/a2ui/` | Submodule checkout |
| `src/lib/design/a2ui/registry.ts` | NEW — component type → ColdLight mapping |
| `src/lib/design/a2ui/renderer.svelte` | NEW — A2UI JSON → Svelte component tree |
| `src/lib/design/a2ui/types.ts` | NEW — A2UI payload types |
| `src/lib/design/a2ui/index.ts` | NEW — public exports |
