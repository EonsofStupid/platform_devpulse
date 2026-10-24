# SPRINT: Tabs Fix — Broken Import, Chrome Tabs as Reusable Pattern

**Status**: PLANNED
**Priority**: P0 — Tabs are foundational. Every widget with chrome tabs depends on them.
**Prerequisites**: SPRINT-PIPELINE-VALIDATION
**Category**: ColdLight / Components

---

## Problem Statement

The Tabs component exists with proper pipeline (primitive → recipe → component) but has a broken import. `Tabs.svelte` imports `ColdLightTabs` from `$lib/design/api/dsadapters/coldlight/_internal/tabs/tabs.svelte.js` — that path does not exist on disk. Additionally, `WidgetTabs` inside the Widget block is a simple custom implementation, not the reusable Tabs component. Chrome-style tabs need to be a proper reusable pattern.

---

## Pre-Execution Research (Verified 2026-03-21)

### What Exists (Verified on Disk)

| Asset | Location | Status |
|-------|----------|--------|
| Tabs component | `components/tabs/` | 7 files: Tabs.svelte, TabsList, TabsTrigger, TabsContent, contract.ts, context.ts, types.ts |
| Tabs primitive | `primitives/tabs/` | use-tabs.svelte.ts hook with ARIA behavior |
| Tabs recipe | `recipes/components/tabs/` | tabs.default.ts with size variants (sm/md/lg) |
| Tabs kind definition | `registry/kind-definitions.ts` | Registered: engine="meltui", preset="tabs-default" |
| WidgetTabs | `blocks/widgets/WidgetTabs.svelte` | Simple chrome-style tabs, Widget-internal only |
| ColdLightTabs adapter | `api/dsadapters/coldlight/_internal/tabs/` | **DOES NOT EXIST** |

### Broken Import Chain

```
components/tabs/Tabs.svelte
  → import { ColdLightTabs } from "$lib/design/api/dsadapters/coldlight/_internal/tabs/tabs.svelte.js"
  → PATH DOES NOT EXIST
  → Tabs component cannot compile
```

### ARIA Contract (from contract.ts)

- Root: No ARIA
- List: `role="tablist"`, optional `aria-orientation`
- Trigger: `role="tab"`, required `aria-selected`, optional `aria-controls`, `aria-disabled`
- Content: `role="tabpanel"`, optional `aria-labelledby`
- Keyboard: ArrowRight/Left, ArrowUp/Down, Home, End, roving tabindex

### Architecture Decision Needed

The kind definition says `engine: "meltui"` but the CLAUDE.md says "ColdLight OWNS all ARIA — no MeltUI dependency." The primitive `use-tabs.svelte.ts` already provides ARIA behavior. The adapter import suggests MeltUI was planned but never wired.

---

## Tasks

### Task 1: Read the full Tabs.svelte to understand what ColdLightTabs provides
Determine the exact API surface expected: `getTrigger()`, `getContent()`, `list` slot attrs.

### Task 2: Decide — fix adapter or inline the ARIA
**STOP — Owner Decision Required**

**Option A**: Create the ColdLightTabs adapter at the expected path, wrapping the existing primitive hook
**Option B**: Remove the adapter import, use the primitive hook directly in Tabs.svelte (ColdLight-owned ARIA, no adapter layer)
**Option C**: Wire to MeltUI createTabs (contradicts ColdLight-owned ARIA policy)

**Recommendation**: Option B. The primitive already handles ARIA. The adapter layer adds indirection without value.

### Task 3: Fix the kind definition engine field
Change `engine: "meltui"` to `engine: "coldlight"` since the primitive owns ARIA.

### Task 4: Make WidgetTabs use the real Tabs component
Currently WidgetTabs is a custom implementation inside Widget. It should compose the real Tabs component so chrome-tab behavior is consistent everywhere.

### Task 5: Verify Tabs compiles and renders
After fix, verify with `pnpm svelte-check` that Tabs has zero type errors.

---

## Exit Criteria

- Tabs component compiles with zero errors
- ARIA contract is met (roving tabindex, arrow key nav, role attributes)
- WidgetTabs uses the real Tabs component
- Kind definition reflects correct engine
- Chrome tabs work as a reusable pattern across widgets

---

## Files Changed (Estimate)

| File | Action |
|------|--------|
| `components/tabs/Tabs.svelte` | Fix import, wire to primitive |
| `registry/kind-definitions.ts` | Change engine to "coldlight" |
| `blocks/widgets/WidgetTabs.svelte` | Compose real Tabs component |
| Possibly: adapter file | Create or delete depending on decision |
