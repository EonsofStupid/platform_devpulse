# Component Layer Planning — Resume Document

> **Created**: 2026-02-01
> **Status**: PLANNING (plan mode active, plan file not yet written)
> **Next Step**: Write the plan to `C:\Users\jessa\.claude\plans\quiet-greeting-rose.md`, then exit plan mode for approval

---

## WHAT WE'RE BUILDING

A `components/` layer at `packages/coldlight/components/` that sits between primitives and semantics. Components FULFILL the taxonomy contracts by adding ARIA, behavior, keyboard handling, and focus management to the structural primitive shells.

**Big 3 to establish the pattern**: Button, Dialog, Tabs

---

## DECISIONS MADE (confirmed by user)

1. **Big 3**: Button (ColdLight-owned), Dialog (MeltUI compound+trap), Tabs (MeltUI compound+roving) — covers all 3 archetypes
2. **Location**: New `components/` directory
3. **MeltUI is CLOAKED** — absolute invariant, user was emphatic:
   - ZERO `@melt-ui/svelte` imports outside `api/adapters/meltui/_internal/`
   - ColdLight is the ONLY brand the consumer sees
   - Internal adapter references admin-gated for logging/debugging
   - Consumer-facing errors say "ColdLight" only

---

## ARCHITECTURE DESIGN (completed during exploration)

### Layer Diagram

```
taxonomy/contract.ts     → WHAT the component needs (SSOT spec)
primitives/*.svelte      → HTML skeleton (structure only, ZERO behavior/ARIA)
_internal/adapter        → WHO fulfills the ARIA (meltui, cloaked)
components/*.svelte      → primitive + adapter + ARIA (accessible component) ← NEW
semantics/*.svelte       → component + recipe (styled, consumer-facing)      [FUTURE]
blocks/*.svelte          → semantics composed (page-level)                   [FUTURE]
```

### Two Archetypes

**Archetype A: ColdLight-owned** (`ariaStateProvider: "coldlight"`)
- Component WRAPS the primitive
- Passes ARIA as props via rest spread (primitive's `{...rest}` carries them to DOM)
- No adapter needed — native HTML handles ARIA
- Examples: button, badge, skeleton, progress, alert, avatar, card, label, input, textarea, separator, spinner, visually-hidden

**Archetype B: Adapter-backed** (`ariaStateProvider: "meltui"`)
- Component renders its OWN DOM elements (because `use:melt` needs direct DOM access)
- Uses data-kind/data-slot from contract knowledge
- Imports adapter from `_internal/` only — adapter provides ColdLight-branded slot props
- The adapter re-exports a ColdLight-branded Svelte action that replaces `use:melt`
- Examples: dialog, tabs, select, popover, tooltip, sheet, alert-dialog, dropdown-menu, context-menu, menubar, combobox, accordion, collapsible, etc.

### Ark UI / Zag.js Parallel (researched)

| Ark/Zag Concept | ColdLight Equivalent |
|---|---|
| `createAnatomy("dialog").parts(...)` | `contract.slots.required` + `contract.slotSpec` |
| Zag machine (hidden state) | `_internal/` adapter wrapping MeltUI |
| `connect()` (state → DOM props) | Adapter returning per-slot prop objects |
| Component (public API) | `components/{kind}/` |
| `data-scope` + `data-part` | `data-kind` + `data-slot` + `data-state` |
| `anatomy.keys()` → Panda CSS `sva()` | Contract slots → recipe generation |

Key borrowing: **Ark's prop-getter pattern**. Instead of raw `use:melt`, the adapter returns per-slot prop objects. The component spreads them. Never knows WHO computed those props.

---

## CLOAKING MECHANISM (designed but not yet implemented)

### The Problem
MeltUI's `use:melt` action needs direct DOM access. Components can't wrap primitives for MeltUI-backed components because the primitive renders its own element.

### The Solution
The adapter in `_internal/` provides a ColdLight-branded Svelte action:

1. `api/adapters/meltui/_internal/_shared/action.ts` exports a `connectSlot` action
2. This action accepts a readable store of slot props (attributes + event handlers)
3. Applies them to the DOM element reactively
4. Internally delegates to MeltUI's `melt` action
5. Component files import `connectSlot`, never `use:melt`
6. The word "melt" never appears in component code

### Adapter Enhancement Pattern
Current adapter (thin wrapper):
```typescript
// _internal/dialog/factory.ts
export function createMeltDialog(config) { return createDialog(config); }
```

Enhanced adapter (ColdLight-branded API):
```typescript
// _internal/dialog/factory.ts — returns ColdLight-branded slot props
export function createDialogAdapter(config): ColdLightDialogApi {
  const melt = createDialog(config);
  return {
    // Per-slot prop stores (MeltUI element stores, but typed as ColdLight)
    slots: {
      trigger: melt.elements.trigger,
      content: melt.elements.content,
      overlay: melt.elements.overlay,
      // ... mapped via ELEMENT_TO_SLOT
    },
    states: {
      open: melt.states.open,
    },
  };
}
```

The component uses:
```svelte
<script>
  import { connectSlot } from "#coldlight/components/_shared/action.js";
  const adapter = getDialogAdapter(); // from component context
</script>
<div use:connectSlot={adapter.slots.content} data-kind="dialog" data-slot="content" class={cn(className)}>
  {@render children?.()}
</div>
```

---

## EXISTING INFRASTRUCTURE (verified during exploration)

### What Already Exists

| Layer | Status |
|---|---|
| Taxonomy contracts (40 primitives) | COMPLETE — all fields, all verified |
| Primitive structural shells (40 + 1) | COMPLETE — 169 .svelte files, zero violations |
| Adapter: dialog | EXISTS — factory.ts, types.ts (ELEMENT_TO_SLOT, STATE_TO_TOKEN), index.ts |
| Adapter: tabs | EXISTS — factory.ts, types.ts, index.ts |
| MeltUI adapter contract | EXISTS — BUILDER_INVENTORY (27 entries), MANAGED_ATTRS, REQUIRED_FILES |
| Config vocabularies | COMPLETE — all types derived from `vocabularies.cfg.ts` |
| Scanner + registry | EXISTS — can validate parity |

### Key Files Read

- `taxonomy/types.ts` — PrimitiveContract, SlotSpec, SlotAriaSpec, DismissBehavior (320 lines)
- `taxonomy/kinds/primitives/button/contract.ts` — ColdLight-owned reference
- `taxonomy/kinds/primitives/dialog/contract.ts` — MeltUI compound reference
- `api/adapters/meltui/_internal/dialog/factory.ts` — createMeltDialog() wrapper
- `api/adapters/meltui/_internal/dialog/types.ts` — ELEMENT_TO_SLOT, STATE_TO_TOKEN mappings
- `taxonomy/api/adapter/meltui/contract.ts` — BUILDER_INVENTORY, MANAGED_ATTRS
- `config/coldlight/vocabularies.cfg.ts` — all vocabulary arrays
- `primitives/dialog/Dialog.svelte` — renderless root with $bindable(open), context
- `primitives/dialog/DialogContent.svelte` — structural shell reading context for data-state
- `primitives/dialog/context.ts` — Symbol-keyed context with reactive getters
- `primitives/dialog/types.ts` — Props interfaces (OmitStyle + BaseProps pattern)
- `primitives/button/Button.svelte` — native button with data-kind/data-slot
- Architecture docs: ARCHITECTURE.md, DESIGN_BOOK.md, ADAPTER_ARCHITECTURE.md
- Sprint docs: SPRINT-CONTRACTS-FOUNDATION.md (mentions Ark UI placeholder)

### Key Contracts for Big 3

**Button**: kind="button", ariaStateProvider="coldlight", focusStrategy="none", compound=false
- Slots: root (required), icon/label (optional)
- ARIA: role="button", optional: aria-pressed, aria-disabled, aria-busy, aria-expanded, aria-haspopup, aria-controls, aria-label, aria-labelledby, aria-describedby
- Keyboard: Enter, Space (native button handles these)

**Dialog**: kind="dialog", ariaStateProvider="meltui", focusStrategy="trap", compound=true
- Slots: root/content (required), trigger/portal/overlay/title/description/close (optional)
- ARIA: role="dialog", required: aria-modal, aria-labelledby. Optional: aria-label, aria-describedby, etc.
- Keyboard: Escape, Tab
- dismissBehavior: { escape: true, outsideClick: true }

**Tabs**: kind="tabs", ariaStateProvider="meltui", focusStrategy="roving", compound=true
- Slots: root/list (required), trigger/content (optional)
- ARIA: role=tablist (list), role=tab (trigger), role=tabpanel (content)
- Keyboard: ArrowLeft, ArrowRight, Home, End, Tab
- orientation: "horizontal"

---

## PLAN STRUCTURE (designed, not yet written to plan file)

The plan should have these sections:

1. **HARD INVARIANTS** — MeltUI cloaking rules, enforcement criteria
2. **ARCHITECTURE OVERVIEW** — layer diagram, two archetypes, file structure
3. **INFRASTRUCTURE (Phase 1)** — shared types, ColdLight connect action, adapter enhancement
4. **COMPONENT 1: BUTTON (Phase 2a)** — ColdLight archetype, wraps primitive, adds ARIA
5. **COMPONENT 2: DIALOG (Phase 2b)** — MeltUI archetype, adapter enhancement + component
6. **COMPONENT 3: TABS (Phase 2c)** — MeltUI archetype, roving focus + orientation
7. **BARREL REGISTRATION** — components/index.ts
8. **SKILLS (Phase 3)** — cl-component-build + cl-component-verify definitions
9. **VERIFICATION & GATE** — svelte-check, cloaking audit, ARIA presence audit
10. **EXECUTION ORDER** — phased approach

---

## OPEN QUESTIONS TO RESOLVE DURING PLANNING

1. **Reactive bridge**: MeltUI uses Svelte stores. Components need reactivity. Options:
   - `fromStore()` from `svelte/store` (Svelte 5 bridge)
   - Direct store subscription in the ColdLight action
   - Re-implement attribute application without MeltUI's `melt` action

2. **Component types inheritance**: Should component types extend primitive types, or be independent?
   - For ColdLight-owned (button): extend primitive props, add behavioral props (pressed, loading)
   - For MeltUI-owned (dialog): may need independent types since component renders own DOM

3. **Icon/Label sub-components for button**: Thin wrappers or direct re-export from primitive?
   - Icon needs `aria-hidden="true"` added
   - Label is pure passthrough

4. **Testing infrastructure**: User said "tests are not minimal." Need to determine:
   - Test framework (Vitest + @testing-library/svelte?)
   - Test categories (ARIA presence, keyboard, state, focus, adapter isolation)
   - Whether tests exist yet or need setup from scratch

---

## RESUME INSTRUCTIONS

1. `/compact` this conversation
2. Read this file to restore full context
3. Enter plan mode
4. Write the complete plan to `C:\Users\jessa\.claude\plans\quiet-greeting-rose.md` (replace all content)
5. Exit plan mode for user approval
6. Execute the plan phase by phase
