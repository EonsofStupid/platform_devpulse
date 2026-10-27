# ColdLight Primitives — Master Sprint Plan

> **Senior Dev Protocol**: No code without a plan. No plan without requirements.
> **Source**: PRIMITIVE_CONTRACT.md, CHECKLIST.md, taxonomy contracts, coldlight.config.ts
> **Created**: 2026-01-22
> **Updated**: 2026-01-30
> **Status**: ACTIVE — REBUILD FROM CONTRACTS

---

## FOUNDATIONAL REQUIREMENTS

### Core Principle: Contract Declares → Primitive Structures → Block Applies

The **dsAdapter** (currently MeltUI, declared in `config/coldlight/adapters.cfg.ts`) is a behavior engine. It provides:
- Positioning (Floating UI)
- Focus trapping
- Keyboard navigation
- Click outside detection
- Escape key handling
- Portal rendering

The dsAdapter does NOT own ARIA. The **taxonomy contract** DECLARES ARIA requirements (`collections.aria`, `collections.keyboard`). ARIA is APPLIED at **block render time** where usage context is known.

**ColdLight (the system) owns**:
- Taxonomy contracts — SSOT for slots, states, ARIA collections
- Data attribute protocol
- Props interface definition
- Rendered markup structure
- Token-driven styling (recipes)

**Primitives provide ONLY**:
- `data-kind`, `data-slot`, `data-state`, `data-id`
- Props interfaces (explicit fields, no HTMLAttributes)
- Semantic HTML structure
- **NO ARIA attributes** — declared in contract, applied at blocks

### ariaStateProvider Model

Each taxonomy contract at `taxonomy/kinds/primitives/{kind}/contract.ts` declares an `ariaStateProvider`:

| Value | Meaning | Parity Requirement |
|-------|---------|-------------------|
| `"meltui"` | dsAdapter provides state + ARIA machinery. Applied at blocks. | 3-folder: taxonomy + adapter + primitive |
| `"coldlight"` | Kind handles ARIA natively (e.g., `<button>` element). No adapter needed. | 2-folder: taxonomy + primitive |

This is a **per-contract property**, not a primitive category.

### Import Cloak

All dsAdapter imports go through the import cloak at `taxonomy/.generated/imports.gen.ts`:

```typescript
// CORRECT — import cloak (generic names)
import { createDialog, createTabs, melt } from "$lib/design/taxonomy/.generated/imports.gen.js";

// WRONG — direct adapter import
import { createDialog } from "@melt-ui/svelte";

// WRONG — direct _internal import
import { createMeltDialog } from "$lib/design/api/adapters/meltui/_internal/dialog/factory.js";
```

The import cloak maps adapter-specific factories to generic names. Adapter swap (e.g., React Aria) changes the cloak, not consumer code.

### Data Attribute Contract

Every primitive component MUST have:

| Attribute | Required | Values |
|-----------|----------|--------|
| `data-kind` | ALWAYS | Primitive kind name |
| `data-slot` | ALWAYS | Slot name from contract |
| `data-state` | When stateful | State token from contract |
| `data-id` | When provided | User value passthrough |

---

## CURRENT STATE (2026-01-30)

### What Exists

| Layer | Path | Status |
|-------|------|--------|
| **Taxonomy Contracts** | `taxonomy/kinds/primitives/button/contract.ts` | ✅ `ariaStateProvider: "coldlight"` |
| | `taxonomy/kinds/primitives/dialog/contract.ts` | ✅ `ariaStateProvider: "meltui"` |
| | `taxonomy/kinds/primitives/tabs/contract.ts` | ✅ `ariaStateProvider: "meltui"` |
| **dsAdapter Factories** | `api/adapters/meltui/_internal/dialog/` | ✅ factory + types + contract |
| | `api/adapters/meltui/_internal/tabs/` | ✅ factory + types + contract |
| **Import Cloak** | `taxonomy/.generated/imports.gen.ts` | ✅ createDialog, createTabs, melt |
| **Scanner** | `taxonomy/scanner.ts` | ✅ Build-time parity validation |
| **Registry** | `taxonomy/registry.ts` | ✅ Runtime manifest lookup |
| **Configuration** | `coldlight.config.ts` + `config/coldlight/*.cfg.ts` | ✅ |
| **Foundation** | `primitives/types.ts` (DATA_ATTRS, cn, stripStyleProp) | ✅ |

### What Does NOT Exist

All primitive component folders were **deleted**. No `Button.svelte`, no `Dialog.svelte`, no `Tabs.svelte`. Rebuilding from contracts.

---

## SPRINT PRIORITY ORDER

> `ariaStateProvider` values for TODO items are planned — confirmed only when taxonomy contract is created.

### Tier 1: Core Interactions

| Sprint | Primitive | ariaStateProvider | dsAdapter Mapping | Status |
|--------|-----------|-------------------|-------------------|--------|
| 1 | Button | `coldlight` | Native `<button>` | CONTRACT ONLY |
| 2 | Dialog | `meltui` | Dialog | CONTRACT + ADAPTER |
| 3 | Sheet | `meltui` | Dialog (side variant) | TODO |
| 4 | AlertDialog | `meltui` | AlertDialog | TODO |
| 5 | Tabs | `meltui` | Tabs | CONTRACT + ADAPTER |
| 6 | Popover | `meltui` | Popover | TODO |
| 7 | Tooltip | `meltui` | Tooltip | TODO |
| 8 | Select | `meltui` | Select | TODO |

### Tier 2: Form Controls

| Sprint | Primitive | ariaStateProvider | dsAdapter Mapping | Status |
|--------|-----------|-------------------|-------------------|--------|
| 9 | Checkbox | `meltui` | Checkbox | TODO |
| 10 | Switch | `meltui` | Switch | TODO |
| 11 | RadioGroup | `meltui` | RadioGroup | TODO |
| 12 | Slider | `meltui` | Slider | TODO |
| 13 | Toggle | `meltui` | Toggle | TODO |
| 14 | ToggleGroup | `meltui` | ToggleGroup | TODO |

### Tier 3: Navigation

| Sprint | Primitive | ariaStateProvider | dsAdapter Mapping | Status |
|--------|-----------|-------------------|-------------------|--------|
| 15 | DropdownMenu | `meltui` | DropdownMenu | TODO |
| 16 | ContextMenu | `meltui` | ContextMenu | TODO |
| 17 | Menubar | `meltui` | Menubar | TODO |
| 18 | NavigationMenu | `meltui` | NavigationMenu | TODO |
| 19 | Accordion | `meltui` | Accordion | TODO |
| 20 | Collapsible | `meltui` | Collapsible | TODO |

### Tier 4: Data Display

| Sprint | Primitive | ariaStateProvider | dsAdapter Mapping | Status |
|--------|-----------|-------------------|-------------------|--------|
| 21 | Progress | `coldlight` | Native `<progress>` | TODO |
| 22 | Meter | `coldlight` | Native `<meter>` | TODO |
| 23 | Avatar | `coldlight` | Native `<img>` | TODO |
| 24 | ScrollArea | `meltui` | ScrollArea | TODO |
| 25 | Separator | `coldlight` | Native `<hr>` | TODO |

### Tier 5: Date/Time

| Sprint | Primitive | ariaStateProvider | dsAdapter Mapping | Status |
|--------|-----------|-------------------|-------------------|--------|
| 26 | Calendar | `meltui` | Calendar | TODO |
| 27 | DatePicker | `meltui` | DatePicker | TODO |
| 28 | DateField | `meltui` | DateField | TODO |
| 29 | TimeField | `meltui` | TimeField | TODO |

### Tier 6: Complex

| Sprint | Primitive | ariaStateProvider | dsAdapter Mapping | Status |
|--------|-----------|-------------------|-------------------|--------|
| 30 | Combobox | `meltui` | Combobox | TODO |
| 31 | Command | `meltui` | Command | TODO |
| 32 | PinInput | `meltui` | PinInput | TODO |
| 33 | Pagination | `meltui` | Pagination | TODO |

---

## dsAdapter (MeltUI) → ColdLight SLOT MAPPING

> ARIA notes below indicate **contract-declared requirements** applied at **block level**, not in primitives.

### Select

| MeltUI Export | ColdLight Name | Notes |
|---------------|----------------|-------|
| `Select.Root` | `Select.Root` | Direct |
| `Select.Trigger` | `Select.Trigger` | Direct |
| `Select.Content` | `Select.Content` | Contract: ARIA collections (block-applied) |
| `Select.ContentStatic` | N/A | Not used |
| `Select.Item` | `Select.Item` | State: selected |
| `Select.Group` | `Select.ItemGroup` | Renamed for clarity |
| `Select.GroupHeading` | `Select.GroupLabel` | Renamed for clarity |
| `Select.Portal` | `Select.Portal` | Direct |
| `Select.Viewport` | `Select.Viewport` | Direct |
| `Select.ScrollUpButton` | `Select.ScrollUp` | Shortened |
| `Select.ScrollDownButton` | `Select.ScrollDown` | Shortened |
| N/A | `Select.ItemText` | ColdLight-only slot |
| N/A | `Select.Separator` | ColdLight-only slot |
| N/A | `Select.Arrow` | Uses FloatingLayerArrow |

### Tooltip

| MeltUI Export | ColdLight Name | Notes |
|---------------|----------------|-------|
| `Tooltip.Provider` | Implicit in Root | ColdLight wraps |
| `Tooltip.Root` | `Tooltip.Root` | Includes Provider |
| `Tooltip.Trigger` | `Tooltip.Trigger` | Direct |
| `Tooltip.Content` | `Tooltip.Content` | Contract: role="tooltip" (block-applied) |
| `Tooltip.Arrow` | `Tooltip.Arrow` | Direct |
| `Tooltip.Portal` | `Tooltip.Portal` | Direct |

### Dialog

| MeltUI Export | ColdLight Name | Notes |
|---------------|----------------|-------|
| `Dialog.Root` | `Dialog.Root` | Direct |
| `Dialog.Trigger` | `Dialog.Trigger` | Direct |
| `Dialog.Portal` | `Dialog.Portal` | Direct |
| `Dialog.Overlay` | `Dialog.Overlay` | State: open/closed |
| `Dialog.Content` | `Dialog.Content` | Contract: role="dialog", aria-modal (block-applied) |
| `Dialog.Title` | `Dialog.Title` | Direct |
| `Dialog.Description` | `Dialog.Description` | Direct |
| `Dialog.Close` | `Dialog.Close` | Direct |

### Popover

| MeltUI Export | ColdLight Name | Notes |
|---------------|----------------|-------|
| `Popover.Root` | `Popover.Root` | Direct |
| `Popover.Trigger` | `Popover.Trigger` | Direct |
| `Popover.Content` | `Popover.Content` | Non-modal disclosure |
| `Popover.Close` | `Popover.Close` | Direct |
| `Popover.Arrow` | `Popover.Arrow` | Direct |
| `Popover.Portal` | `Popover.Portal` | Direct |
| `Popover.Overlay` | `Popover.Overlay` | Optional |

### Tabs

| MeltUI Export | ColdLight Name | Notes |
|---------------|----------------|-------|
| `Tabs.Root` | `Tabs.Root` | Direct |
| `Tabs.List` | `Tabs.List` | Contract: role="tablist" (block-applied) |
| `Tabs.Trigger` | `Tabs.Trigger` | State: selected |
| `Tabs.Content` | `Tabs.Content` | State: hidden/visible |

---

## SPRINT TEMPLATE

### Sprint N: {Kind}

**Step 0 — Taxonomy Contract** (if not exists):

Create `taxonomy/kinds/primitives/{kind}/contract.ts`:

```typescript
import type { PrimitiveContract } from "../../types.js";

export const contract = {
  kind: "{kind}",
  ariaStateProvider: "meltui", // or "coldlight" for native HTML
  slots: { required: [...], optional: [...], forbidden: [...] },
  states: { shared: [...], kindSpecific: [...] },
  slotStates: { ... },
  collections: { aria: { ... }, keyboard: { ... } },
} as const satisfies PrimitiveContract;
```

**Step 1 — dsAdapter Factory** (ariaStateProvider: "meltui" only):

Create `api/adapters/meltui/_internal/{kind}/`:

```
{kind}/
├── index.ts      # Barrel
├── factory.ts    # Wraps @melt-ui/svelte builder
├── types.ts      # Slot mapping (MeltUI names → ColdLight slots)
├── {kind}.ts     # Builder config
└── contract.ts   # Adapter-level contract
```

Update import cloak at `taxonomy/.generated/imports.gen.ts`.

**Step 2 — Pre-Flight Checklist**:

- [ ] Verify taxonomy contract exists (or create per Step 0)
- [ ] Read MeltUI source: `tech_refs/meltui/packages/meltui/src/lib/bits/{name}/`
- [ ] Identify all exports from `exports.ts`
- [ ] Check if child snippet provides state (grep for `snippetProps`)
- [ ] Map MeltUI elements to ColdLight slots
- [ ] Review contract's `collections.aria` and `collections.keyboard`

**Step 3 — Primitive Files**:

```
primitives/{kind}/
├── index.ts                    # Barrel export
├── contract.ts                 # Re-exports taxonomy contract
├── types.ts                    # Props interfaces
├── {Kind}.svelte               # Root component (or single for simple)
├── {Kind}{Slot}.svelte         # Per slot (compound primitives)
├── {Kind}.test.svelte          # Test wrapper
└── {Kind}.test.ts              # vitest-browser-svelte tests
```

**File Naming**: PascalCase always.
- Root: `{Kind}.svelte` (e.g., `Dialog.svelte`, `Button.svelte`)
- Slots: `{Kind}{Slot}.svelte` (e.g., `DialogTrigger.svelte`, `TabsList.svelte`)

**Mandatory Requirements**:

1. Every component has `data-kind="{kind}"` and `data-slot="{slot}"`
2. `data-state` reflects contract-declared state tokens
3. **NO ARIA attributes in primitives** — declared in contract, applied at blocks
4. `stripStyleProp(rest, "{Kind}.{Slot}")` called
5. Props use explicit fields (no HTMLAttributes extension, no `style` prop)
6. dsAdapter imports via import cloak only

**Verification**:

```bash
cd interfaces/desktop
pnpm svelte-check                                    # Types pass
pnpm test:run src/lib/design/primitives/{kind}/      # Tests pass
```

---

## ARIA REQUIREMENTS TABLE

> These requirements are **declared in taxonomy contracts** and **applied at block render time**.
> Primitives emit data attributes only. Blocks apply ARIA per contract.

| Kind | Slot | ARIA Requirement | Source | Notes |
|------|------|-----------------|--------|-------|
| Dialog | content | `role="dialog"` | Contract | Block sets manually |
| Dialog | content | `aria-modal="true"` | Contract | Block sets manually |
| Dialog | content | `aria-labelledby` | dsAdapter | Auto-generated ID |
| Dialog | content | `aria-describedby` | dsAdapter | Auto-generated ID |
| AlertDialog | content | `role="alertdialog"` | Contract | Block sets manually |
| AlertDialog | content | `aria-modal="true"` | Contract | Block sets manually |
| Tooltip | content | `role="tooltip"` | Contract | dsAdapter doesn't add — block must set |
| Select | trigger | `role="combobox"` | dsAdapter | Auto from builder |
| Select | trigger | `aria-haspopup="listbox"` | dsAdapter | Auto from builder |
| Select | content | `role="listbox"` | dsAdapter | Auto from builder |
| Select | item | `role="option"` | dsAdapter | Auto from builder |
| Select | item | `aria-selected` | dsAdapter | Auto from builder |
| Tabs | list | `role="tablist"` | Contract | Block sets manually |
| Tabs | trigger | `role="tab"` | dsAdapter | Auto from builder |
| Tabs | trigger | `aria-selected` | dsAdapter | Auto from builder |
| Tabs | content | `role="tabpanel"` | dsAdapter | Auto from builder |
| Popover | content | No role | N/A | Non-modal disclosure |
| Separator | root | `role="separator"` | Contract | Block sets manually |

---

## CURRENT SPRINT: Tier 1 Rebuild

### Objective

Rebuild Tier 1 primitives from taxonomy contracts. Three contracts exist (button, dialog, tabs). Remaining 5 need contracts first.

### Build Order

1. **Button** — `ariaStateProvider: "coldlight"`. Contract exists. No adapter needed. Simplest primitive.
2. **Dialog** — `ariaStateProvider: "meltui"`. Contract + adapter exist. First compound primitive.
3. **Tabs** — `ariaStateProvider: "meltui"`. Contract + adapter exist. Second compound primitive.
4. **Sheet** — Needs contract. Dialog variant (side).
5. **AlertDialog** — Needs contract. Dialog variant (alert role).
6. **Popover** — Needs contract + adapter.
7. **Tooltip** — Needs contract + adapter.
8. **Select** — Needs contract + adapter. Most complex Tier 1.

### Per-Primitive Checklist

1. **Contract**
   - [ ] Taxonomy contract at `taxonomy/kinds/primitives/{kind}/contract.ts`
   - [ ] `ariaStateProvider` set correctly
   - [ ] All slots declared (required/optional/forbidden)
   - [ ] State tokens declared
   - [ ] ARIA collections declared (`collections.aria`, `collections.keyboard`)

2. **dsAdapter** (ariaStateProvider: "meltui" only)
   - [ ] Factory at `api/adapters/meltui/_internal/{kind}/factory.ts`
   - [ ] Slot mapping at `api/adapters/meltui/_internal/{kind}/types.ts`
   - [ ] Import cloak updated at `taxonomy/.generated/imports.gen.ts`

3. **Primitive**
   - [ ] Folder structure per sprint template
   - [ ] PascalCase file naming (`{Kind}.svelte`, `{Kind}{Slot}.svelte`)
   - [ ] `data-kind`, `data-slot`, `data-state` on every component
   - [ ] **NO ARIA in components** — applied at blocks
   - [ ] `stripStyleProp` called
   - [ ] Props explicit (no HTMLAttributes, no `style`)

4. **Tests**
   - [ ] Test file exists (`{Kind}.test.ts`)
   - [ ] Data attribute tests
   - [ ] State transition tests
   - [ ] NO ARIA tests in primitive tests (ARIA tested at block level)

5. **Export**
   - [ ] `primitives/index.ts` exports kind
   - [ ] All types re-exported

---

## SIGN-OFF PROTOCOL

### Before ANY Code

1. Read this document
2. Read PRIMITIVE_CONTRACT.md
3. Read CHECKLIST.md
4. Verify taxonomy contract exists

### After EVERY Primitive

```bash
cd interfaces/desktop
pnpm svelte-check                                    # Must pass
pnpm test:run src/lib/design/primitives/{kind}/      # Must pass
```

### Senior Dev Sign-Off

```
Primitive: {Kind}
Sprint: {N}
Date: YYYY-MM-DD

Checklist:
- [ ] Taxonomy contract correct
- [ ] dsAdapter factory correct (if meltui)
- [ ] Primitive structure complete
- [ ] Data attributes correct
- [ ] NO ARIA in primitive components
- [ ] Tests pass (N/N)
- [ ] Export correct

Status: APPROVED / REJECTED

Notes:
```

---

## REFERENCE

### Architecture Path Map

```
design/
├── coldlight.config.ts                              # Master config
├── config/coldlight/
│   ├── adapters.cfg.ts                              # dsAdapter declaration (active: "meltui")
│   ├── enforcement.cfg.ts                           # Parity rules
│   ├── generation.cfg.ts                            # Build output config
│   ├── roots.cfg.ts                                 # Scan root paths
│   └── types.ts                                     # Config types
├── taxonomy/
│   ├── scanner.ts                                   # Build-time parity validation
│   ├── registry.ts                                  # Runtime manifest lookup
│   ├── types.ts                                     # PrimitiveContract, CategoryId
│   ├── kinds/primitives/{kind}/contract.ts           # Colocated contracts (SSOT)
│   └── .generated/
│       ├── imports.gen.ts                            # Import cloak
│       └── coldlight.manifest.json                   # Scanner output
├── api/adapters/meltui/_internal/{kind}/             # dsAdapter factories
└── primitives/
    ├── types.ts                                      # DATA_ATTRS, cn, stripStyleProp
    ├── index.ts                                      # Barrel exports
    └── {kind}/                                       # Primitive implementations
```

### MeltUI Source Location (Reference)

```
tech_refs/meltui/packages/meltui/src/lib/bits/{primitive}/
├── index.ts           # Re-exports exports.ts
├── exports.ts         # Public component exports
├── types.ts           # Type definitions
├── {primitive}.svelte.ts  # State management
└── components/        # Svelte components
```

### Key Files to Check

1. `exports.ts` — What components are available
2. `types.ts` — Props interfaces
3. `{primitive}.svelte.ts` — Check for `snippetProps` definition
4. `components/{component}.svelte` — Actual implementation

### Quick API Check

```bash
# Check if component exposes state in child snippet
grep -A10 "snippetProps" tech_refs/meltui/packages/meltui/src/lib/bits/{name}/{name}.svelte.ts
```

---

**This document is the authoritative sprint plan for ColdLight primitives.**
