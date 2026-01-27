# SPRINT: Taxonomy Adapter Registry (Scan-Based)

> **Status**: NOT STARTED
> **Goal**: Build scan-based taxonomy that detects folders and enforces parity dynamically

---

## CORE PRINCIPLE: FOLDERS ARE TRUTH

**NO hardcoded arrays. The file system IS the source of truth.**

```
taxonomy/primitives/*/     ← Scanner reads folder names = primitive kinds
api/adapters/*/            ← Scanner reads folder names = provider IDs
```

**Add a primitive = create a folder. Registry detects it automatically.**

---

## ARCHITECTURE

```
taxonomy/
├── primitives/                    ← SCAN THIS: folder names = primitive kinds
│   ├── tabs/
│   │   ├── index.ts              ← Barrel export
│   │   └── contract.ts           ← Slots, states, requirements
│   ├── dialog/
│   │   ├── index.ts
│   │   └── contract.ts
│   ├── button/
│   │   ├── index.ts
│   │   └── contract.ts
│   └── [new-kind]/               ← ADD FOLDER → system detects it
│
├── adapters/                      ← SCAN THIS: folder names = provider IDs
│   ├── coldlight/                ← Provider-agnostic surface declaration
│   │   └── index.ts
│   ├── meltui/                   ← MeltUI provider declaration
│   │   └── index.ts
│   └── registry.ts               ← THE SCANNER + ENFORCER
│
└── index.ts                       ← Barrel export

api/adapters/                      ← IMPLEMENTATION (must match taxonomy)
├── coldlight/
│   └── <kind>/                   ← Public API per primitive
│       └── index.ts
├── meltui/
│   └── _internal/                ← Hidden MeltUI mappings
│       └── <kind>.ts
└── resolve.ts                    ← Routes primitives to active adapter

primitives/                        ← SVELTE COMPONENTS (must match taxonomy)
└── <kind>/
    ├── index.ts
    └── <Kind>.svelte
```

---

## SCAN CHAIN (Enforcement Order)

```
1. Scan taxonomy/primitives/*/
   → Extract folder names as primitiveKinds[]

2. Scan taxonomy/adapters/*/
   → Extract folder names as adapterIds[]

3. For each primitiveKind:
   → Demand api/adapters/coldlight/<kind>/ exists
   → Demand api/adapters/meltui/_internal/<kind>.ts exists

4. Generate manifest.json from scan results
   → Lists all primitives, their slots, states, provider
   → NEVER manually edited
```

---

## PREREQUISITES

- [ ] Verify `pnpm svelte-check` passes
- [ ] Working directory: `interfaces/desktop`
- [ ] Git status clean or stashed

---

## PHASE 1: Scanner Infrastructure

### Task 1.1: Create taxonomy/primitives/ folder structure

```
taxonomy/primitives/
├── .gitkeep
└── index.ts
```

**Verification**: Folder exists

---

### Task 1.2: Create taxonomy/adapters/ folder structure

```
taxonomy/adapters/
├── coldlight/
│   └── index.ts
├── meltui/
│   └── index.ts
├── registry.ts
└── index.ts
```

**Verification**: Folders exist

---

### Task 1.3: Create taxonomy/adapters/types.ts

**File**: `src/lib/design/taxonomy/adapters/types.ts`

```typescript
/**
 * @file Adapter Type Definitions
 * @description Types for the scan-based adapter registry
 */

/** ColdLight aliases for flexibility */
export const coldlightAliases = ["cl", "coldlight", "cold-light"] as const;
export type ColdlightAlias = (typeof coldlightAliases)[number];

/** Normalize any coldlight alias to canonical form */
export function normalizeColdlightAlias(alias: string): "coldlight" | null {
  if ((coldlightAliases as readonly string[]).includes(alias.toLowerCase())) {
    return "coldlight";
  }
  return null;
}

/** State token categories - ordered by precedence */
export const stateCategories = [
  "presence",      // inert, hidden, visible
  "primary",       // selected, checked, pressed, expanded, open
  "focus",         // focused, focus-visible, focus-within
  "interaction",   // hover, active
  "availability",  // disabled, readonly, loading, busy
  "drag",          // dragging, drop-target
  "animation",     // entering, exiting, animating
  "system",        // error, success, warning, info
] as const;

export type StateCategory = (typeof stateCategories)[number];

/** Common state tokens per category */
export const commonStates = {
  presence: ["inert", "hidden", "visible"] as const,
  primary: ["selected", "checked", "pressed", "expanded", "open", "current"] as const,
  focus: ["focused", "focus-visible", "focus-within"] as const,
  interaction: ["hover", "active"] as const,
  availability: ["disabled", "readonly", "loading", "busy"] as const,
  drag: ["dragging", "drop-target", "drag-over"] as const,
  animation: ["entering", "exiting", "animating"] as const,
  system: ["error", "success", "warning", "info"] as const,
} as const satisfies Record<StateCategory, readonly string[]>;

export type StateToken = (typeof commonStates)[StateCategory][number];

/** Primitive contract - what each primitive folder must declare */
export interface PrimitiveContract {
  readonly kind: string;
  readonly slots: readonly string[];
  readonly requiredSlots: readonly string[];
  readonly states: readonly StateToken[];
  readonly aria: {
    readonly role: string;
    readonly requiredAttrs: readonly string[];
  };
  readonly keyboard: readonly string[];  // Required keyboard interactions
  readonly provider: "meltui" | "custom"; // Which adapter handles this
}

/** Adapter declaration - what each adapter folder must declare */
export interface AdapterDeclaration {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly aliases?: readonly string[];
}

/** Scan result for a primitive */
export interface PrimitiveScanResult {
  readonly kind: string;
  readonly taxonomyPath: string;
  readonly coldlightPath: string | null;
  readonly meltuiPath: string | null;
  readonly primitivePath: string | null;
  readonly contract: PrimitiveContract | null;
  readonly complete: boolean;
  readonly missing: readonly string[];
}

/** Full scan result */
export interface RegistryScanResult {
  readonly primitives: readonly PrimitiveScanResult[];
  readonly adapters: readonly string[];
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly manifest: object | null;
}
```

**Verification**: `pnpm svelte-check` passes

---

### Task 1.4: Create taxonomy/adapters/coldlight/index.ts

**File**: `src/lib/design/taxonomy/adapters/coldlight/index.ts`

```typescript
/**
 * @file ColdLight Adapter Declaration
 * @description Declares ColdLight as the provider-agnostic surface layer
 */

import type { AdapterDeclaration } from "../types.js";
import { coldlightAliases } from "../types.js";

export const coldlightDeclaration: AdapterDeclaration = {
  id: "coldlight",
  name: "ColdLight",
  version: "1.0.0",
  aliases: coldlightAliases,
} as const;

export { coldlightAliases };
```

**Verification**: `pnpm svelte-check` passes

---

### Task 1.5: Create taxonomy/adapters/meltui/index.ts

**File**: `src/lib/design/taxonomy/adapters/meltui/index.ts`

```typescript
/**
 * @file MeltUI Adapter Declaration
 * @description Declares MeltUI as an implementation provider
 */

import type { AdapterDeclaration } from "../types.js";

export const meltuiDeclaration: AdapterDeclaration = {
  id: "meltui",
  name: "Melt UI",
  version: "0.83.0",
} as const;

/** MeltUI builder function name mapping */
export const meltuiBuilderMap: Record<string, string> = {
  accordion: "createAccordion",
  avatar: "createAvatar",
  calendar: "createCalendar",
  checkbox: "createCheckbox",
  collapsible: "createCollapsible",
  combobox: "createCombobox",
  "context-menu": "createContextMenu",
  "date-field": "createDateField",
  "date-picker": "createDatePicker",
  "date-range-field": "createDateRangeField",
  "date-range-picker": "createDateRangePicker",
  dialog: "createDialog",
  "dropdown-menu": "createDropdownMenu",
  label: "createLabel",
  "link-preview": "createLinkPreview",
  menubar: "createMenubar",
  pagination: "createPagination",
  "pin-input": "createPinInput",
  popover: "createPopover",
  progress: "createProgress",
  "radio-group": "createRadioGroup",
  "scroll-area": "createScrollArea",
  select: "createSelect",
  separator: "createSeparator",
  slider: "createSlider",
  switch: "createSwitch",
  tabs: "createTabs",
  "tags-input": "createTagsInput",
  toggle: "createToggle",
  "toggle-group": "createToggleGroup",
  tooltip: "createTooltip",
  "tree-view": "createTreeView",
};

/** Check if a kind has a MeltUI builder */
export function hasMeltuiBuilder(kind: string): boolean {
  return kind in meltuiBuilderMap;
}

/** Get the MeltUI builder function name for a kind */
export function getBuilderName(kind: string): string | undefined {
  return meltuiBuilderMap[kind];
}
```

**Verification**: `pnpm svelte-check` passes

---

### Task 1.6: Create taxonomy/adapters/scanner.ts

**File**: `src/lib/design/taxonomy/adapters/scanner.ts`

```typescript
/**
 * @file Folder Scanner
 * @description Scans file system to derive primitive kinds and adapter IDs
 *
 * NOTE: This runs at BUILD TIME via Vite plugin, not runtime.
 * At runtime, we use the generated manifest.json.
 */

import type { PrimitiveContract, PrimitiveScanResult, RegistryScanResult } from "./types.js";

/** Base paths relative to src/lib/design/ */
const PATHS = {
  taxonomyPrimitives: "taxonomy/primitives",
  taxonomyAdapters: "taxonomy/adapters",
  apiColdlight: "api/adapters/coldlight",
  apiMeltuiInternal: "api/adapters/meltui/_internal",
  primitives: "primitives",
} as const;

/**
 * Scan taxonomy/primitives/ to get all declared primitive kinds
 * @param fs - File system interface (Node fs or virtual)
 * @param basePath - Base path to src/lib/design/
 */
export async function scanPrimitiveKinds(
  fs: { readdirSync: (path: string) => string[]; statSync: (path: string) => { isDirectory: () => boolean } },
  basePath: string
): Promise<string[]> {
  const primitivesPath = `${basePath}/${PATHS.taxonomyPrimitives}`;

  try {
    const entries = fs.readdirSync(primitivesPath);
    return entries.filter((entry) => {
      if (entry.startsWith(".") || entry === "index.ts") return false;
      try {
        return fs.statSync(`${primitivesPath}/${entry}`).isDirectory();
      } catch {
        return false;
      }
    });
  } catch {
    return [];
  }
}

/**
 * Scan taxonomy/adapters/ to get all declared adapter IDs
 */
export async function scanAdapterIds(
  fs: { readdirSync: (path: string) => string[]; statSync: (path: string) => { isDirectory: () => boolean } },
  basePath: string
): Promise<string[]> {
  const adaptersPath = `${basePath}/${PATHS.taxonomyAdapters}`;

  try {
    const entries = fs.readdirSync(adaptersPath);
    return entries.filter((entry) => {
      if (entry.startsWith(".") || entry.endsWith(".ts")) return false;
      try {
        return fs.statSync(`${adaptersPath}/${entry}`).isDirectory();
      } catch {
        return false;
      }
    });
  } catch {
    return [];
  }
}

/**
 * Check if a path exists
 */
function pathExists(
  fs: { statSync: (path: string) => unknown },
  path: string
): boolean {
  try {
    fs.statSync(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Load a primitive contract from its folder
 */
export async function loadPrimitiveContract(
  importFn: (path: string) => Promise<{ default?: PrimitiveContract; contract?: PrimitiveContract }>,
  basePath: string,
  kind: string
): Promise<PrimitiveContract | null> {
  try {
    const module = await importFn(`${basePath}/${PATHS.taxonomyPrimitives}/${kind}/contract.js`);
    return module.default ?? module.contract ?? null;
  } catch {
    return null;
  }
}

/**
 * Scan a single primitive for completeness
 */
export async function scanPrimitive(
  fs: { statSync: (path: string) => unknown },
  basePath: string,
  kind: string,
  contract: PrimitiveContract | null
): Promise<PrimitiveScanResult> {
  const taxonomyPath = `${basePath}/${PATHS.taxonomyPrimitives}/${kind}`;
  const coldlightPath = `${basePath}/${PATHS.apiColdlight}/${kind}`;
  const meltuiPath = `${basePath}/${PATHS.apiMeltuiInternal}/${kind}.ts`;
  const primitivePath = `${basePath}/${PATHS.primitives}/${kind}`;

  const missing: string[] = [];

  const hasColdlight = pathExists(fs, coldlightPath);
  const hasMeltui = pathExists(fs, meltuiPath);
  const hasPrimitive = pathExists(fs, primitivePath);

  if (!hasColdlight) missing.push(`api/adapters/coldlight/${kind}/`);
  if (!hasMeltui) missing.push(`api/adapters/meltui/_internal/${kind}.ts`);
  if (!hasPrimitive) missing.push(`primitives/${kind}/`);

  return {
    kind,
    taxonomyPath,
    coldlightPath: hasColdlight ? coldlightPath : null,
    meltuiPath: hasMeltui ? meltuiPath : null,
    primitivePath: hasPrimitive ? primitivePath : null,
    contract,
    complete: missing.length === 0,
    missing,
  };
}

/**
 * Full registry scan - returns complete status of all primitives
 */
export async function scanRegistry(
  fs: {
    readdirSync: (path: string) => string[];
    statSync: (path: string) => { isDirectory: () => boolean };
  },
  importFn: (path: string) => Promise<{ default?: PrimitiveContract; contract?: PrimitiveContract }>,
  basePath: string
): Promise<RegistryScanResult> {
  const kinds = await scanPrimitiveKinds(fs, basePath);
  const adapters = await scanAdapterIds(fs, basePath);
  const errors: string[] = [];

  const primitives: PrimitiveScanResult[] = [];

  for (const kind of kinds) {
    const contract = await loadPrimitiveContract(importFn, basePath, kind);
    if (!contract) {
      errors.push(`${kind}: Missing or invalid contract.ts`);
    }
    const result = await scanPrimitive(fs, basePath, kind, contract);
    primitives.push(result);

    if (!result.complete) {
      for (const m of result.missing) {
        errors.push(`${kind}: Missing ${m}`);
      }
    }
  }

  const valid = errors.length === 0;

  // Generate manifest only if valid
  const manifest = valid
    ? {
        version: "1.0.0",
        generated: new Date().toISOString(),
        primitives: primitives.map((p) => ({
          kind: p.kind,
          slots: p.contract?.slots ?? [],
          states: p.contract?.states ?? [],
          provider: p.contract?.provider ?? "unknown",
        })),
        adapters,
      }
    : null;

  return {
    primitives,
    adapters,
    valid,
    errors,
    manifest,
  };
}
```

**Verification**: `pnpm svelte-check` passes

---

### Task 1.7: Create taxonomy/adapters/registry.ts

**File**: `src/lib/design/taxonomy/adapters/registry.ts`

```typescript
/**
 * @file Adapter Registry - GATEKEEPER
 * @description Runtime registry that uses pre-scanned manifest
 *
 * At BUILD TIME: scanner.ts scans folders → generates manifest.json
 * At RUNTIME: registry.ts loads manifest.json → provides API
 */

import type { PrimitiveContract, RegistryScanResult } from "./types.js";
import { coldlightDeclaration } from "./coldlight/index.js";
import { meltuiDeclaration, hasMeltuiBuilder } from "./meltui/index.js";

/** Loaded manifest (populated at build time or app init) */
let manifest: RegistryScanResult["manifest"] | null = null;
let primitiveKinds: string[] = [];
let adapterIds: string[] = [];

/**
 * Initialize registry with scanned manifest
 * Called by Vite plugin or app initialization
 */
export function initRegistry(scannedManifest: NonNullable<RegistryScanResult["manifest"]>): void {
  manifest = scannedManifest;
  primitiveKinds = scannedManifest.primitives.map((p: { kind: string }) => p.kind);
  adapterIds = scannedManifest.adapters;
  console.log(`[Registry] Initialized with ${primitiveKinds.length} primitives, ${adapterIds.length} adapters`);
}

/**
 * Get all primitive kinds (derived from folder scan)
 */
export function getPrimitiveKinds(): readonly string[] {
  return primitiveKinds;
}

/**
 * Get all adapter IDs (derived from folder scan)
 */
export function getAdapterIds(): readonly string[] {
  return adapterIds;
}

/**
 * Check if a kind is a valid primitive
 */
export function isPrimitiveKind(kind: string): boolean {
  return primitiveKinds.includes(kind);
}

/**
 * Get which provider handles a primitive
 */
export function getPrimitiveProvider(kind: string): "meltui" | "custom" {
  return hasMeltuiBuilder(kind) ? "meltui" : "custom";
}

/**
 * Get adapter declaration
 */
export function getAdapterDeclaration(id: string): typeof coldlightDeclaration | typeof meltuiDeclaration | null {
  if (id === "coldlight") return coldlightDeclaration;
  if (id === "meltui") return meltuiDeclaration;
  return null;
}

/**
 * Get the loaded manifest
 */
export function getManifest(): RegistryScanResult["manifest"] {
  return manifest;
}

/**
 * Validate that the registry is properly initialized
 */
export function validateRegistry(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!manifest) {
    errors.push("Registry not initialized. Call initRegistry() with scanned manifest.");
    return { valid: false, errors };
  }

  if (primitiveKinds.length === 0) {
    errors.push("No primitives found. Add folders to taxonomy/primitives/");
  }

  if (!adapterIds.includes("coldlight")) {
    errors.push("ColdLight adapter not found in taxonomy/adapters/coldlight/");
  }

  if (!adapterIds.includes("meltui")) {
    errors.push("MeltUI adapter not found in taxonomy/adapters/meltui/");
  }

  return { valid: errors.length === 0, errors };
}

// Re-export types
export type { PrimitiveContract, RegistryScanResult };
```

**Verification**: `pnpm svelte-check` passes

---

### Task 1.8: Create taxonomy/adapters/index.ts barrel

**File**: `src/lib/design/taxonomy/adapters/index.ts`

```typescript
/**
 * @file Taxonomy Adapters Barrel Export
 */

// Types
export type {
  StateCategory,
  StateToken,
  PrimitiveContract,
  AdapterDeclaration,
  PrimitiveScanResult,
  RegistryScanResult,
} from "./types.js";

export {
  coldlightAliases,
  stateCategories,
  commonStates,
  normalizeColdlightAlias,
} from "./types.js";

// Adapter declarations
export { coldlightDeclaration } from "./coldlight/index.js";
export { meltuiDeclaration, meltuiBuilderMap, hasMeltuiBuilder, getBuilderName } from "./meltui/index.js";

// Scanner (build-time)
export {
  scanPrimitiveKinds,
  scanAdapterIds,
  scanPrimitive,
  scanRegistry,
  loadPrimitiveContract,
} from "./scanner.js";

// Registry (runtime)
export {
  initRegistry,
  getPrimitiveKinds,
  getAdapterIds,
  isPrimitiveKind,
  getPrimitiveProvider,
  getAdapterDeclaration,
  getManifest,
  validateRegistry,
} from "./registry.js";
```

**Verification**: `pnpm svelte-check` passes

---

## PHASE 2: First Primitive Contracts

### Task 2.1: Create taxonomy/primitives/tabs/

**Folder**: `src/lib/design/taxonomy/primitives/tabs/`

---

### Task 2.2: Create tabs/contract.ts

**File**: `src/lib/design/taxonomy/primitives/tabs/contract.ts`

```typescript
/**
 * @file Tabs Primitive Contract
 * @description Scanner reads this to know what tabs requires
 */

import type { PrimitiveContract, StateToken } from "../../adapters/types.js";

export const contract: PrimitiveContract = {
  kind: "tabs",
  slots: ["root", "list", "trigger", "content"],
  requiredSlots: ["root", "list", "trigger", "content"],
  states: [
    "hidden", "visible",           // presence
    "selected",                     // primary
    "focused", "focus-visible",     // focus
    "hover", "active",              // interaction
    "disabled",                     // availability
  ] as StateToken[],
  aria: {
    role: "tablist",
    requiredAttrs: ["aria-orientation"],
  },
  keyboard: ["ArrowLeft", "ArrowRight", "Home", "End", "Enter", "Space"],
  provider: "meltui",
} as const;

export default contract;
```

**Verification**: `pnpm svelte-check` passes

---

### Task 2.3: Create tabs/index.ts

**File**: `src/lib/design/taxonomy/primitives/tabs/index.ts`

```typescript
/**
 * @file Tabs Primitive Declaration
 */

export { contract, contract as default } from "./contract.js";
```

**Verification**: `pnpm svelte-check` passes

---

### Task 2.4: Create taxonomy/primitives/dialog/

**Folder**: `src/lib/design/taxonomy/primitives/dialog/`

---

### Task 2.5: Create dialog/contract.ts

**File**: `src/lib/design/taxonomy/primitives/dialog/contract.ts`

```typescript
/**
 * @file Dialog Primitive Contract
 */

import type { PrimitiveContract, StateToken } from "../../adapters/types.js";

export const contract: PrimitiveContract = {
  kind: "dialog",
  slots: ["root", "trigger", "portal", "overlay", "content", "title", "description", "close"],
  requiredSlots: ["root", "content"],
  states: [
    "hidden", "visible", "inert",   // presence
    "open",                          // primary
    "focused", "focus-visible", "focus-within", // focus
    "hover", "active",               // interaction
    "entering", "exiting",           // animation
  ] as StateToken[],
  aria: {
    role: "dialog",
    requiredAttrs: ["aria-modal", "aria-labelledby"],
  },
  keyboard: ["Escape", "Tab"],
  provider: "meltui",
} as const;

export default contract;
```

**Verification**: `pnpm svelte-check` passes

---

### Task 2.6: Create dialog/index.ts

**File**: `src/lib/design/taxonomy/primitives/dialog/index.ts`

```typescript
export { contract, contract as default } from "./contract.js";
```

**Verification**: `pnpm svelte-check` passes

---

### Task 2.7: Create taxonomy/primitives/button/ (custom ARIA)

**Folder**: `src/lib/design/taxonomy/primitives/button/`

---

### Task 2.8: Create button/contract.ts

**File**: `src/lib/design/taxonomy/primitives/button/contract.ts`

```typescript
/**
 * @file Button Primitive Contract
 * @description Custom ARIA - not backed by MeltUI
 */

import type { PrimitiveContract, StateToken } from "../../adapters/types.js";

export const contract: PrimitiveContract = {
  kind: "button",
  slots: ["root", "icon", "label"],
  requiredSlots: ["root"],
  states: [
    "pressed",                       // primary
    "focused", "focus-visible",      // focus
    "hover", "active",               // interaction
    "disabled", "loading", "busy",   // availability
  ] as StateToken[],
  aria: {
    role: "button",
    requiredAttrs: ["aria-pressed", "aria-disabled"],
  },
  keyboard: ["Enter", "Space"],
  provider: "custom",
} as const;

export default contract;
```

**Verification**: `pnpm svelte-check` passes

---

### Task 2.9: Create button/index.ts

**File**: `src/lib/design/taxonomy/primitives/button/index.ts`

```typescript
export { contract, contract as default } from "./contract.js";
```

**Verification**: `pnpm svelte-check` passes

---

### Task 2.10: Create taxonomy/primitives/index.ts barrel

**File**: `src/lib/design/taxonomy/primitives/index.ts`

```typescript
/**
 * @file Primitives Barrel
 * @description Exports all primitive contracts
 *
 * NOTE: This is for convenience only. The scanner reads folders directly.
 */

export { contract as tabsContract } from "./tabs/index.js";
export { contract as dialogContract } from "./dialog/index.js";
export { contract as buttonContract } from "./button/index.js";
```

**Verification**: `pnpm svelte-check` passes

---

## PHASE 3: Update taxonomy/index.ts

### Task 3.1: Create/update taxonomy/index.ts

**File**: `src/lib/design/taxonomy/index.ts`

```typescript
/**
 * @file Taxonomy Barrel Export
 * @description The declarative foundation layer
 */

// Adapter system (scan-based)
export * from "./adapters/index.js";

// Primitive contracts
export * from "./primitives/index.js";

// Legacy slots (if exists)
export * from "./slots.js";
```

**Verification**: `pnpm svelte-check` passes

---

## PHASE 4: Verification

### Task 4.1: Run svelte-check

```bash
cd interfaces/desktop && pnpm svelte-check
```

**Must pass with no errors.**

---

### Task 4.2: Run build

```bash
cd interfaces/desktop && pnpm build
```

**Must pass.**

---

## COMPLETION CHECKLIST

### Phase 1: Scanner Infrastructure
- [ ] 1.1 Create taxonomy/primitives/ folder
- [ ] 1.2 Create taxonomy/adapters/ folder structure
- [ ] 1.3 Create adapters/types.ts
- [ ] 1.4 Create adapters/coldlight/index.ts
- [ ] 1.5 Create adapters/meltui/index.ts
- [ ] 1.6 Create adapters/scanner.ts
- [ ] 1.7 Create adapters/registry.ts
- [ ] 1.8 Create adapters/index.ts barrel

### Phase 2: First Primitive Contracts
- [ ] 2.1 Create taxonomy/primitives/tabs/ folder
- [ ] 2.2 Create tabs/contract.ts
- [ ] 2.3 Create tabs/index.ts
- [ ] 2.4 Create taxonomy/primitives/dialog/ folder
- [ ] 2.5 Create dialog/contract.ts
- [ ] 2.6 Create dialog/index.ts
- [ ] 2.7 Create taxonomy/primitives/button/ folder
- [ ] 2.8 Create button/contract.ts
- [ ] 2.9 Create button/index.ts
- [ ] 2.10 Create taxonomy/primitives/index.ts barrel

### Phase 3: Update Root
- [ ] 3.1 Update taxonomy/index.ts

### Phase 4: Verification
- [ ] 4.1 pnpm svelte-check passes
- [ ] 4.2 pnpm build passes

---

## WHAT HAPPENS NEXT

After this sprint:

1. **Add a new primitive** = Create folder `taxonomy/primitives/<kind>/` with contract.ts
2. **Scanner detects it** = Build-time scan sees new folder
3. **Errors if incomplete** = Build fails listing what's missing:
   - `api/adapters/coldlight/<kind>/`
   - `api/adapters/meltui/_internal/<kind>.ts`
   - `primitives/<kind>/`
4. **Create those folders** = Build passes
5. **manifest.json updated** = New primitive listed automatically

**Next sprint will create:**
- `api/adapters/coldlight/tabs/` (public API)
- `api/adapters/meltui/_internal/tabs.ts` (hidden mapping)
- `primitives/tabs/` (Svelte component)

---

## ERROR LOG

| Error | Count | Resolution |
|-------|-------|------------|
| (none yet) | 0 | - |

---

## SIGN-OFF

- [ ] All tasks complete
- [ ] Scan-based architecture verified
- [ ] Sprint marked COMPLETE
