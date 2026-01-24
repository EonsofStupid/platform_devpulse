# ColdLight Primitives — Master Sprint Plan

> **Senior Dev Protocol**: No code without a plan. No plan without requirements.
> **Source**: docs/notes.md, PRIMITIVE_CONTRACT.md, bits-ui source (tech_refs/bits-ui)
> **Created**: 2026-01-22
> **Status**: ACTIVE

---

## FOUNDATIONAL REQUIREMENTS

### Core Principle: ColdLight Owns ARIA

bits-ui is a **behavior engine only**. It provides:
- Positioning (Floating UI)
- Focus trapping
- Keyboard navigation
- Click outside detection
- Escape key handling
- Portal rendering

**ColdLight explicitly owns**:
- ALL ARIA attributes
- ALL data attributes
- Props interface definition
- Rendered markup structure

### The _internal Abstraction

All bits-ui imports MUST go through `_internal/index.ts`:

```typescript
// CORRECT
import { FloatingLayerArrow } from "./_internal/index.js";

// WRONG
import FloatingLayerArrow from "bits-ui/dist/bits/utilities/...";
```

### Data Attribute Contract

Every component MUST have:
| Attribute | Required | Values |
|-----------|----------|--------|
| `data-kind` | ALWAYS | Primitive name |
| `data-slot` | ALWAYS | Slot name |
| `data-state` | When stateful | `"open"`, `"closed"`, etc. |
| `data-id` | When provided | User value passthrough |

---

## SPRINT PRIORITY ORDER

### Tier 1: Core Interactions (COMPLETE - Audit Required)

| Sprint | Primitive | Status | bits-ui Mapping | ARIA Owner |
|--------|-----------|--------|-----------------|------------|
| 1 | Button | EXISTS | Button | ColdLight |
| 2 | Dialog | EXISTS | Dialog | ColdLight |
| 3 | Sheet | EXISTS | Dialog (side variant) | ColdLight |
| 4 | AlertDialog | EXISTS | AlertDialog | ColdLight |
| 5 | Tabs | EXISTS | Tabs | ColdLight |
| 6 | Popover | EXISTS | Popover | ColdLight |
| 7 | Tooltip | EXISTS | Tooltip | ColdLight |
| 8 | Select | EXISTS | Select | ColdLight |

### Tier 2: Form Controls (TODO)

| Sprint | Primitive | Status | bits-ui Mapping | ARIA Owner |
|--------|-----------|--------|-----------------|------------|
| 9 | Checkbox | TODO | Checkbox | ColdLight |
| 10 | Switch | TODO | Switch | ColdLight |
| 11 | RadioGroup | TODO | RadioGroup | ColdLight |
| 12 | Slider | TODO | Slider | ColdLight |
| 13 | Toggle | TODO | Toggle | ColdLight |
| 14 | ToggleGroup | TODO | ToggleGroup | ColdLight |

### Tier 3: Navigation (TODO)

| Sprint | Primitive | Status | bits-ui Mapping | ARIA Owner |
|--------|-----------|--------|-----------------|------------|
| 15 | DropdownMenu | TODO | DropdownMenu | ColdLight |
| 16 | ContextMenu | TODO | ContextMenu | ColdLight |
| 17 | Menubar | TODO | Menubar | ColdLight |
| 18 | NavigationMenu | TODO | NavigationMenu | ColdLight |
| 19 | Accordion | TODO | Accordion | ColdLight |
| 20 | Collapsible | TODO | Collapsible | ColdLight |

### Tier 4: Data Display (TODO)

| Sprint | Primitive | Status | bits-ui Mapping | ARIA Owner |
|--------|-----------|--------|-----------------|------------|
| 21 | Progress | TODO | Progress | ColdLight |
| 22 | Meter | TODO | Meter | ColdLight |
| 23 | Avatar | TODO | Avatar | ColdLight |
| 24 | ScrollArea | TODO | ScrollArea | ColdLight |
| 25 | Separator | TODO | Separator | ColdLight |

### Tier 5: Date/Time (TODO)

| Sprint | Primitive | Status | bits-ui Mapping | ARIA Owner |
|--------|-----------|--------|-----------------|------------|
| 26 | Calendar | TODO | Calendar | ColdLight |
| 27 | DatePicker | TODO | DatePicker | ColdLight |
| 28 | DateField | TODO | DateField | ColdLight |
| 29 | TimeField | TODO | TimeField | ColdLight |

### Tier 6: Complex (TODO)

| Sprint | Primitive | Status | bits-ui Mapping | ARIA Owner |
|--------|-----------|--------|-----------------|------------|
| 30 | Combobox | TODO | Combobox | ColdLight |
| 31 | Command | TODO | Command | ColdLight |
| 32 | PinInput | TODO | PinInput | ColdLight |
| 33 | Pagination | TODO | Pagination | ColdLight |

---

## bits-ui → ColdLight COMPONENT MAPPING

### Select

| bits-ui Export | ColdLight Name | Notes |
|----------------|----------------|-------|
| `Select.Root` | `Select.Root` | Direct |
| `Select.Trigger` | `Select.Trigger` | Direct |
| `Select.Content` | `Select.Content` | Child snippet for ARIA |
| `Select.ContentStatic` | N/A | Not used |
| `Select.Item` | `Select.Item` | Child snippet for state |
| `Select.Group` | `Select.ItemGroup` | Renamed for clarity |
| `Select.GroupHeading` | `Select.GroupLabel` | Renamed for clarity |
| `Select.Portal` | `Select.Portal` | Direct |
| `Select.Viewport` | `Select.Viewport` | Direct |
| `Select.ScrollUpButton` | `Select.ScrollUp` | Shortened |
| `Select.ScrollDownButton` | `Select.ScrollDown` | Shortened |
| N/A | `Select.ItemText` | ColdLight owns |
| N/A | `Select.Separator` | ColdLight owns |
| N/A | `Select.Arrow` | Uses FloatingLayerArrow |

### Tooltip

| bits-ui Export | ColdLight Name | Notes |
|----------------|----------------|-------|
| `Tooltip.Provider` | Implicit in Root | ColdLight wraps |
| `Tooltip.Root` | `Tooltip.Root` | Includes Provider |
| `Tooltip.Trigger` | `Tooltip.Trigger` | Direct |
| `Tooltip.Content` | `Tooltip.Content` | **ADDS role="tooltip"** |
| `Tooltip.Arrow` | `Tooltip.Arrow` | Direct |
| `Tooltip.Portal` | `Tooltip.Portal` | Direct |

### Dialog

| bits-ui Export | ColdLight Name | Notes |
|----------------|----------------|-------|
| `Dialog.Root` | `Dialog.Root` | Direct |
| `Dialog.Trigger` | `Dialog.Trigger` | Direct |
| `Dialog.Portal` | `Dialog.Portal` | Direct |
| `Dialog.Overlay` | `Dialog.Overlay` | Child snippet |
| `Dialog.Content` | `Dialog.Content` | **ADDS role="dialog", aria-modal** |
| `Dialog.Title` | `Dialog.Title` | Direct |
| `Dialog.Description` | `Dialog.Description` | Direct |
| `Dialog.Close` | `Dialog.Close` | Direct |

### Popover

| bits-ui Export | ColdLight Name | Notes |
|----------------|----------------|-------|
| `Popover.Root` | `Popover.Root` | Direct |
| `Popover.Trigger` | `Popover.Trigger` | Direct |
| `Popover.Content` | `Popover.Content` | Child snippet |
| `Popover.Close` | `Popover.Close` | Direct |
| `Popover.Arrow` | `Popover.Arrow` | Direct |
| `Popover.Portal` | `Popover.Portal` | Direct |
| `Popover.Overlay` | `Popover.Overlay` | Optional |

### Tabs

| bits-ui Export | ColdLight Name | Notes |
|----------------|----------------|-------|
| `Tabs.Root` | `Tabs.Root` | Direct |
| `Tabs.List` | `Tabs.List` | **ADDS role="tablist"** |
| `Tabs.Trigger` | `Tabs.Trigger` | Extract state from props |
| `Tabs.Content` | `Tabs.Content` | Extract state from props |

---

## SPRINT TEMPLATE

### Sprint N: {Primitive}

**Pre-Flight Checklist**:
- [ ] Read bits-ui source: `tech_refs/bits-ui/packages/bits-ui/src/lib/bits/{name}/`
- [ ] Identify all exports from `exports.ts`
- [ ] Check if child snippet provides state (grep for `snippetProps`)
- [ ] Document ARIA attributes bits-ui provides vs ColdLight must add
- [ ] Map bits-ui names to ColdLight names

**Files to Create**:
```
primitives/{name}/
├── index.ts
├── types.ts
├── Root.svelte
├── [Slot].svelte (per slot)
├── a11y.md
├── {Name}.test.svelte
└── {Name}.test.ts
```

**Mandatory Requirements**:
1. Every component has `data-kind="{name}"` and `data-slot="{slot}"`
2. Child snippets spread `{...props}` FIRST
3. ColdLight sets ALL ARIA attributes explicitly
4. `stripStyleProp(rest, "{Name}.{Slot}")` called
5. Props use explicit fields (no HTMLAttributes extension)

**Verification**:
```bash
cd interfaces/desktop/src
pnpm check                                    # Types pass
pnpm test:run lib/design/primitives/{name}/   # Tests pass
pnpm audit:primitives                         # Shows complete
```

---

## ARIA OWNERSHIP TABLE

| Primitive | Slot | ARIA Attribute | Owner | Notes |
|-----------|------|----------------|-------|-------|
| Dialog | Content | `role="dialog"` | ColdLight | Manual |
| Dialog | Content | `aria-modal="true"` | ColdLight | Manual |
| Dialog | Content | `aria-labelledby` | bits-ui | From props |
| Dialog | Content | `aria-describedby` | bits-ui | From props |
| AlertDialog | Content | `role="alertdialog"` | ColdLight | Manual |
| AlertDialog | Content | `aria-modal="true"` | ColdLight | Manual |
| Tooltip | Content | `role="tooltip"` | ColdLight | **bits-ui doesn't add** |
| Select | Trigger | `role="combobox"` | bits-ui | From props |
| Select | Trigger | `aria-haspopup="listbox"` | bits-ui | From props |
| Select | Content | `role="listbox"` | bits-ui | From props |
| Select | Item | `role="option"` | bits-ui | From props |
| Select | Item | `aria-selected` | bits-ui | From props |
| Tabs | List | `role="tablist"` | ColdLight | Manual |
| Tabs | Trigger | `role="tab"` | bits-ui | From props |
| Tabs | Trigger | `aria-selected` | bits-ui | From props |
| Tabs | Content | `role="tabpanel"` | bits-ui | From props |
| Popover | Content | No role | N/A | Non-modal disclosure |
| Separator | - | `role="separator"` | ColdLight | Manual |

---

## CURRENT SPRINT: Tier 1 Audit

### Objective
Audit all 8 existing primitives against PRIMITIVE_CONTRACT.md.

### Audit Checklist per Primitive

1. **Structure**
   - [ ] Folder structure correct
   - [ ] All required files exist

2. **Types**
   - [ ] `{Name}Slots` array exported
   - [ ] Props interfaces explicit (no HTMLAttributes)
   - [ ] No `style` prop
   - [ ] `"data-id"` on all props

3. **Components**
   - [ ] `data-kind` on every component
   - [ ] `data-slot` on every component
   - [ ] `data-state` where applicable
   - [ ] `stripStyleProp` called
   - [ ] Child snippets spread `{...props}` first

4. **ARIA**
   - [ ] All required ARIA attributes present
   - [ ] ColdLight-owned ARIA set explicitly
   - [ ] bits-ui ARIA spread via `{...props}`

5. **Tests**
   - [ ] Test file exists
   - [ ] ARIA tests present
   - [ ] Data attribute tests present
   - [ ] Keyboard tests present
   - [ ] All tests pass

6. **Documentation**
   - [ ] `a11y.md` complete
   - [ ] `index.ts` has JSDoc

7. **Export**
   - [ ] `primitives/index.ts` exports namespace
   - [ ] All types re-exported

---

## SIGN-OFF PROTOCOL

### Before ANY Code

1. Read this document
2. Read PRIMITIVE_CONTRACT.md
3. Read .claude/WORKFLOW.md
4. Run `pnpm audit:primitives`

### After EVERY Primitive

```bash
# Run in interfaces/desktop/src
pnpm check                                    # Must pass
pnpm test:run lib/design/primitives/{name}/   # Must pass
pnpm audit:primitives                         # Must show complete
```

### Senior Dev Sign-Off

```
Primitive: {Name}
Sprint: {N}
Date: YYYY-MM-DD
Auditor: {Name}

Checklist:
- [ ] Structure complete
- [ ] Types correct
- [ ] Components follow template
- [ ] Data attributes correct
- [ ] ARIA complete
- [ ] Tests pass (N/N)
- [ ] Documentation complete
- [ ] Export correct

Status: APPROVED / REJECTED

Notes:
```

---

## REFERENCE

### bits-ui Source Location
```
tech_refs/bits-ui/packages/bits-ui/src/lib/bits/{primitive}/
├── index.ts           # Re-exports exports.ts
├── exports.ts         # Public component exports
├── types.ts           # Type definitions
├── {primitive}.svelte.ts  # State management
└── components/        # Svelte components
```

### Key Files to Check
1. `exports.ts` - What components are available
2. `types.ts` - Props interfaces
3. `{primitive}.svelte.ts` - Check for `snippetProps` definition
4. `components/{component}.svelte` - Actual implementation

### Quick API Check
```bash
# Check if component exposes state in child snippet
grep -A10 "snippetProps" tech_refs/bits-ui/packages/bits-ui/src/lib/bits/{name}/{name}.svelte.ts
```

---

**This document is the authoritative sprint plan for ColdLight primitives.**
