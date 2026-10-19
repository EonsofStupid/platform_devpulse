# SPRINT: Adapter Foundation

## Current State Audit

### taxonomy/api/adapter/ (DECLARATION LAYER)

| Path | Status | Files Needed |
|------|--------|--------------|
| `taxonomy/api/adapter/meltui/` | EMPTY | types.ts, contract.ts, index.ts |
| `taxonomy/api/adapter/coldlight/` | EMPTY | types.ts, contract.ts, index.ts |

### taxonomy/kinds/primitives/ (PRIMITIVE CONTRACTS)

| Path | Status | Issue |
|------|--------|-------|
| `button/contract.ts` | BAD | Line 95: `provider: "custom"` - REMOVE |
| `dialog/contract.ts` | OK | Provider already removed |
| `tabs/contract.ts` | BAD | Line 108: `provider: "meltui"` - REMOVE |

### api/adapters/ (IMPLEMENTATION LAYER)

| Adapter | Primitive | Status | Files |
|---------|-----------|--------|-------|
| meltui | dialog | EXISTS | contract.ts, types.ts, dialog.ts, index.ts |
| meltui | button | MISSING | Need all 4 files |
| meltui | tabs | MISSING | Need all 4 files |
| coldlight | dialog | EXISTS | contract.ts, types.ts, dialog.ts, index.ts |
| coldlight | button | MISSING | Need all 4 files |
| coldlight | tabs | MISSING | Need all 4 files |

### primitives/ (SVELTE COMPONENTS)

| Primitive | Status | Issue |
|-----------|--------|-------|
| dialog/ | EXISTS | No tests, imports meltui directly |
| button/ | MISSING | |
| tabs/ | MISSING | |

---

## Phase 1: Taxonomy Adapter Declarations

### 1.1 Create taxonomy/api/adapter/meltui/

**types.ts**
```typescript
/**
 * MeltUI Adapter Type Declarations
 * Declares what MeltUI provides as a headless UI library.
 */

/** MeltUI builder function signature */
export type MeltBuilder<T> = () => T;

/** Standard attributes MeltUI manages */
export type MeltManagedAttrs =
  | "role"
  | "aria-modal"
  | "aria-labelledby"
  | "aria-describedby"
  | "aria-selected"
  | "aria-expanded"
  | "aria-disabled"
  | "aria-pressed"
  | "aria-checked"
  | "aria-orientation"
  | "tabindex"
  | "id";

/** MeltUI primitives with builders */
export type MeltPrimitive =
  | "accordion"
  | "alert-dialog"
  | "avatar"
  | "calendar"
  | "checkbox"
  | "collapsible"
  | "combobox"
  | "context-menu"
  | "date-field"
  | "date-picker"
  | "date-range-field"
  | "date-range-picker"
  | "dialog"
  | "dropdown-menu"
  | "label"
  | "link-preview"
  | "menubar"
  | "pagination"
  | "pin-input"
  | "popover"
  | "progress"
  | "radio-group"
  | "range-calendar"
  | "scroll-area"
  | "select"
  | "separator"
  | "slider"
  | "switch"
  | "table-of-contents"
  | "tabs"
  | "tags-input"
  | "toggle"
  | "toggle-group"
  | "toolbar"
  | "tooltip"
  | "tree";
```

**contract.ts**
```typescript
/**
 * MeltUI Adapter Contract
 * Declares the capabilities and constraints of the MeltUI adapter.
 */

import type { MeltManagedAttrs, MeltPrimitive } from "./types.js";

export const ADAPTER_ID = "meltui" as const;

/** Attributes MeltUI owns - never override */
export const MANAGED_ATTRS: readonly MeltManagedAttrs[] = [
  "role",
  "aria-modal",
  "aria-labelledby",
  "aria-describedby",
  "aria-selected",
  "aria-expanded",
  "aria-disabled",
  "aria-pressed",
  "aria-checked",
  "aria-orientation",
  "tabindex",
  "id",
];

/** Primitives backed by MeltUI builders */
export const SUPPORTED_PRIMITIVES: readonly MeltPrimitive[] = [
  "accordion",
  "alert-dialog",
  "calendar",
  "checkbox",
  "collapsible",
  "combobox",
  "context-menu",
  "date-field",
  "date-picker",
  "date-range-field",
  "date-range-picker",
  "dialog",
  "dropdown-menu",
  "label",
  "link-preview",
  "menubar",
  "pagination",
  "pin-input",
  "popover",
  "progress",
  "radio-group",
  "range-calendar",
  "scroll-area",
  "select",
  "separator",
  "slider",
  "switch",
  "table-of-contents",
  "tabs",
  "tags-input",
  "toggle",
  "toggle-group",
  "toolbar",
  "tooltip",
  "tree",
];

export const contract = {
  id: ADAPTER_ID,
  managedAttrs: MANAGED_ATTRS,
  supportedPrimitives: SUPPORTED_PRIMITIVES,
} as const;
```

**index.ts**
```typescript
export * from "./types.js";
export * from "./contract.js";
```

### 1.2 Create taxonomy/api/adapter/coldlight/

**types.ts**
```typescript
/**
 * ColdLight Adapter Type Declarations
 * Declares what ColdLight provides as the public agnostic API layer.
 */

/** Data attributes ColdLight adds to all primitives */
export type ColdLightDataAttr =
  | "data-kind"
  | "data-slot"
  | "data-state";

/** ColdLight primitive (all primitives go through ColdLight) */
export type ColdLightPrimitive =
  | "accordion"
  | "alert-dialog"
  | "avatar"
  | "button"
  | "calendar"
  | "checkbox"
  | "collapsible"
  | "combobox"
  | "context-menu"
  | "date-field"
  | "date-picker"
  | "date-range-field"
  | "date-range-picker"
  | "dialog"
  | "dropdown-menu"
  | "label"
  | "link-preview"
  | "menubar"
  | "pagination"
  | "pin-input"
  | "popover"
  | "progress"
  | "radio-group"
  | "range-calendar"
  | "scroll-area"
  | "select"
  | "separator"
  | "slider"
  | "switch"
  | "table-of-contents"
  | "tabs"
  | "tags-input"
  | "toggle"
  | "toggle-group"
  | "toolbar"
  | "tooltip"
  | "tree";
```

**contract.ts**
```typescript
/**
 * ColdLight Adapter Contract
 * Declares the capabilities of the ColdLight public API layer.
 */

import type { ColdLightDataAttr, ColdLightPrimitive } from "./types.js";

export const ADAPTER_ID = "coldlight" as const;

/** Data attributes ColdLight adds for CSS targeting */
export const DATA_ATTRS: readonly ColdLightDataAttr[] = [
  "data-kind",
  "data-slot",
  "data-state",
];

/** All primitives ColdLight exposes */
export const SUPPORTED_PRIMITIVES: readonly ColdLightPrimitive[] = [
  "accordion",
  "alert-dialog",
  "avatar",
  "button",
  "calendar",
  "checkbox",
  "collapsible",
  "combobox",
  "context-menu",
  "date-field",
  "date-picker",
  "date-range-field",
  "date-range-picker",
  "dialog",
  "dropdown-menu",
  "label",
  "link-preview",
  "menubar",
  "pagination",
  "pin-input",
  "popover",
  "progress",
  "radio-group",
  "range-calendar",
  "scroll-area",
  "select",
  "separator",
  "slider",
  "switch",
  "table-of-contents",
  "tabs",
  "tags-input",
  "toggle",
  "toggle-group",
  "toolbar",
  "tooltip",
  "tree",
];

export const contract = {
  id: ADAPTER_ID,
  dataAttrs: DATA_ATTRS,
  supportedPrimitives: SUPPORTED_PRIMITIVES,
} as const;
```

**index.ts**
```typescript
export * from "./types.js";
export * from "./contract.js";
```

---

## Phase 2: Fix Taxonomy Primitive Contracts

### 2.1 button/contract.ts
Remove line 95: `provider: "custom",`

### 2.2 tabs/contract.ts
Remove line 108: `provider: "meltui",`

---

## Phase 3: Create Missing api/adapters/ Implementations

### 3.1 api/adapters/meltui/button/
- contract.ts
- types.ts
- button.ts
- index.ts

### 3.2 api/adapters/meltui/tabs/
- contract.ts
- types.ts
- tabs.ts
- index.ts

### 3.3 api/adapters/coldlight/button/
- contract.ts
- types.ts
- button.ts
- index.ts

### 3.4 api/adapters/coldlight/tabs/
- contract.ts
- types.ts
- tabs.ts
- index.ts

---

## Phase 4: Create Missing primitives/

### 4.1 primitives/button/
- Button.svelte
- context.ts
- types.ts
- index.ts
- Button.test.ts

### 4.2 primitives/tabs/
- Tabs.svelte
- TabsList.svelte
- TabsTrigger.svelte
- TabsContent.svelte
- context.ts
- types.ts
- index.ts
- Tabs.test.ts

---

## Phase 5: Fix Existing primitives/dialog/

### 5.1 Add tests
- Dialog.test.ts

### 5.2 Use ColdLight adapter instead of direct meltui import

---

## Execution Order

1. Phase 1.1 - taxonomy/api/adapter/meltui/
2. Phase 1.2 - taxonomy/api/adapter/coldlight/
3. Phase 2.1 - Fix button contract
4. Phase 2.2 - Fix tabs contract
5. Phase 3.1-3.4 - Create adapter implementations
6. Phase 4.1-4.2 - Create Svelte components
7. Phase 5.1-5.2 - Fix dialog

---

## Verification

After each phase:
```bash
cd interfaces/desktop && pnpm svelte-check
```

After all phases:
```bash
cd interfaces/desktop && pnpm test
```
