# SPRINT: 4-Folder Parity Implementation (Dialog)

> **Status**: NOT STARTED
> **Goal**: Implement complete 4-folder parity for dialog primitive

---

## ARCHITECTURE UNDERSTANDING

### Parallel Structure: taxonomy ↔ api

```
taxonomy/                       ← SSOT: declarations, contracts, types, registries
├── primitives/                 ← Primary SSOT for primitive kinds
│   ├── <kind>/                 ← Primitive contract
│   └── scanner.ts              ← Scans primitives, enforces parity
│
└── api/adapters/               ← Declaration layer for adapters
    ├── registry.ts             ← Adapter registry (unified)
    ├── coldlight/              ← ColdLight adapter declaration
    └── meltui/                 ← MeltUI adapter declaration

api/adapters/                   ← Implementations (contracts link to taxonomy)
├── coldlight/_internal/<kind>/ ← ColdLight internal implementation
└── meltui/_internal/<kind>/    ← MeltUI internal implementation

primitives/                     ← Svelte components
└── <kind>/                     ← Must have .svelte file
```

### Consistent `_internal/` for BOTH Adapters

```
api/adapters/coldlight/_internal/dialog/   ← CORRECT
api/adapters/meltui/_internal/dialog/      ← CORRECT
```

### Required Files in Every `<kind>/` Folder

```
dialog/
├── dialog.ts       ← Named file (main implementation)
├── index.ts        ← Barrel (imports/exports dialog.ts)
├── types.ts        ← Types
└── contract.ts     ← Links to primitives/dialog/
```

### Two Registries (Unified via Scanner)

1. **Primitives Registry** (`taxonomy/primitives/scanner.ts`)
   - Scans `taxonomy/primitives/` → finds primitive kinds
   - Enforces: `primitives/<kind>/` must have `.svelte` file

2. **Adapter Registry** (`taxonomy/api/adapters/registry.ts`)
   - Scans `api/adapters/` → finds adapters (coldlight, meltui)
   - Enforces: each primitive must have `_internal/<kind>/` in each adapter
   - ColdLight = SSOT for public API surface
   - MeltUI = provider for ARIA/behavior

### 4 Folders for Primitive Parity (dialog)

| # | Location | Purpose |
|---|----------|---------|
| 1 | `taxonomy/primitives/dialog/` | Contract (SSOT) |
| 2 | `api/adapters/coldlight/_internal/dialog/` | ColdLight implementation |
| 3 | `api/adapters/meltui/_internal/dialog/` | MeltUI implementation |
| 4 | `primitives/dialog/` | Svelte component |

---

## CURRENT STATE AUDIT

### EXISTS (verify)

- [ ] `taxonomy/primitives/dialog/contract.ts`
- [ ] `taxonomy/primitives/button/contract.ts`
- [ ] `taxonomy/primitives/tabs/contract.ts`

### NEEDS CREATION

- [ ] `taxonomy/primitives/scanner.ts`
- [ ] `taxonomy/api/adapters/` (folder structure)
- [ ] `taxonomy/api/adapters/registry.ts`
- [ ] `taxonomy/api/adapters/coldlight/`
- [ ] `taxonomy/api/adapters/meltui/`
- [ ] `api/adapters/coldlight/_internal/dialog/`
- [ ] `api/adapters/meltui/_internal/dialog/`
- [ ] `primitives/dialog/`

---

## PHASE 1: Create taxonomy/api/adapters/ Structure

### Task 1.1: Create folder structure

**Create**: `src/lib/design/taxonomy/api/adapters/`

```
taxonomy/api/adapters/
├── index.ts
├── registry.ts
├── types.ts
├── coldlight/
│   ├── coldlight.ts
│   ├── index.ts
│   ├── types.ts
│   └── contract.ts
└── meltui/
    ├── meltui.ts
    ├── index.ts
    ├── types.ts
    └── contract.ts
```

- [ ] Task 1.1 complete

### Task 1.2: Implement taxonomy/api/adapters/types.ts

Defines:
- AdapterId type
- AdapterDeclaration interface
- Common adapter types

**Verification**: `pnpm svelte-check` passes

- [ ] Task 1.2 complete

### Task 1.3: Implement taxonomy/api/adapters/coldlight/

Files:
- `coldlight.ts` - ColdLight adapter declaration
- `types.ts` - ColdLight-specific types
- `contract.ts` - Links to taxonomy primitives
- `index.ts` - Barrel

**Verification**: `pnpm svelte-check` passes

- [ ] Task 1.3 complete

### Task 1.4: Implement taxonomy/api/adapters/meltui/

Files:
- `meltui.ts` - MeltUI adapter declaration + builder mapping
- `types.ts` - MeltUI-specific types
- `contract.ts` - Links to taxonomy primitives
- `index.ts` - Barrel

**Verification**: `pnpm svelte-check` passes

- [ ] Task 1.4 complete

### Task 1.5: Implement taxonomy/api/adapters/registry.ts

Defines:
- Scans `api/adapters/` for adapter folders
- For each primitive (from primitives scanner), checks:
  - `api/adapters/coldlight/_internal/<kind>/` exists
  - `api/adapters/meltui/_internal/<kind>/` exists
- Reports missing implementations

**Verification**: `pnpm svelte-check` passes

- [ ] Task 1.5 complete

### Task 1.6: Implement taxonomy/api/adapters/index.ts

Barrel exports all adapter types, declarations, registry.

**Verification**: `pnpm svelte-check` passes

- [ ] Task 1.6 complete

---

## PHASE 2: Create Primitives Scanner

### Task 2.1: Implement taxonomy/primitives/scanner.ts

Defines:
- Scans `taxonomy/primitives/` → finds primitive kinds (folder names)
- For each kind, checks `primitives/<kind>/` has `.svelte` file
- Reports missing Svelte components
- Exports list of primitive kinds for adapter registry

**Verification**: `pnpm svelte-check` passes

- [ ] Task 2.1 complete

---

## PHASE 3: Create api/adapters/coldlight/_internal/dialog/

### Task 3.1: Create folder structure

**Create**: `src/lib/design/api/dsadapters/coldlight/_internal/dialog/`

```
api/adapters/coldlight/_internal/dialog/
├── dialog.ts
├── index.ts
├── types.ts
└── contract.ts
```

- [ ] Task 3.1 complete

### Task 3.2: Implement dialog.ts

Main ColdLight dialog implementation.

**Verification**: `pnpm svelte-check` passes

- [ ] Task 3.2 complete

### Task 3.3: Implement types.ts

Defines:
- DialogProps (public props)
- DialogSlotProps (slot spreading)

**Verification**: `pnpm svelte-check` passes

- [ ] Task 3.3 complete

### Task 3.4: Implement contract.ts

Links to `primitives/dialog/` and taxonomy contract.

**Verification**: `pnpm svelte-check` passes

- [ ] Task 3.4 complete

### Task 3.5: Implement index.ts

Barrel imports/exports dialog.ts and other exports.

**Verification**: `pnpm svelte-check` passes

- [ ] Task 3.5 complete

---

## PHASE 4: Create api/adapters/meltui/_internal/dialog/

### Task 4.1: Create folder structure

**Create**: `src/lib/design/api/dsadapters/meltui/_internal/dialog/`

```
api/adapters/meltui/_internal/dialog/
├── dialog.ts
├── index.ts
├── types.ts
└── contract.ts
```

- [ ] Task 4.1 complete

### Task 4.2: Implement dialog.ts

Main MeltUI dialog mapping (createDialog builder).

**Verification**: `pnpm svelte-check` passes

- [ ] Task 4.2 complete

### Task 4.3: Implement types.ts

Defines:
- MeltUI element → ColdLight slot mapping
- MeltUI state → ColdLight state token mapping

**Verification**: `pnpm svelte-check` passes

- [ ] Task 4.3 complete

### Task 4.4: Implement contract.ts

Links to taxonomy contract, defines what MeltUI handles vs ColdLight adds.

**Verification**: `pnpm svelte-check` passes

- [ ] Task 4.4 complete

### Task 4.5: Implement index.ts

Barrel imports/exports dialog.ts and other exports.

**Verification**: `pnpm svelte-check` passes

- [ ] Task 4.5 complete

---

## PHASE 5: Create primitives/dialog/

### Task 5.1: Create folder structure

**Create**: `src/lib/design/primitives/dialog/`

```
primitives/dialog/
├── dialog.ts
├── index.ts
├── types.ts
├── contract.ts
├── context.ts
└── Dialog.svelte
```

- [ ] Task 5.1 complete

### Task 5.2: Implement dialog.ts

Main dialog primitive logic.

**Verification**: `pnpm svelte-check` passes

- [ ] Task 5.2 complete

### Task 5.3: Implement types.ts

Dialog component types.

**Verification**: `pnpm svelte-check` passes

- [ ] Task 5.3 complete

### Task 5.4: Implement contract.ts

Links to taxonomy/primitives/dialog/ contract.

**Verification**: `pnpm svelte-check` passes

- [ ] Task 5.4 complete

### Task 5.5: Implement context.ts

Svelte context for dialog state.

**Verification**: `pnpm svelte-check` passes

- [ ] Task 5.5 complete

### Task 5.6: Implement Dialog.svelte

Dialog root component:
- Uses MeltUI createDialog
- Applies data-kind="dialog", data-slot="root", data-state="..."

**Verification**: `pnpm svelte-check` passes

- [ ] Task 5.6 complete

### Task 5.7: Implement index.ts

Barrel imports/exports dialog.ts, Dialog.svelte, context, types.

**Verification**: `pnpm svelte-check` passes

- [ ] Task 5.7 complete

---

## PHASE 6: Verify taxonomy/primitives/dialog/

### Task 6.1: Verify dialog contract exports

**File**: `src/lib/design/taxonomy/primitives/dialog/contract.ts`

Confirm exports:
- contract
- dialogSlots
- dialogStates
- dialogSlotStates
- DialogSlot type
- DialogState type

- [ ] Task 6.1 complete

### Task 6.2: Update dialog taxonomy barrel

**File**: `src/lib/design/taxonomy/primitives/dialog/index.ts`

Ensure all exports needed by adapters and primitives.

**Verification**: `pnpm svelte-check` passes

- [ ] Task 6.2 complete

---

## PHASE 7: Verification

### Task 7.1: Run scanner test

```bash
cd interfaces/desktop && npx tsx src/lib/design/taxonomy/test-scanner.ts
```

Expected:
- Primitives scanner finds: button, dialog, tabs
- Adapter registry reports missing for button, tabs
- Dialog shows all 4 folders exist

- [ ] Task 7.1 complete

### Task 7.2: Run svelte-check

```bash
cd interfaces/desktop && pnpm svelte-check
```

- [ ] Task 7.2 complete

---

## COMPLETION CHECKLIST

### Phase 1: taxonomy/api/adapters/
- [ ] 1.1 Folder structure created
- [ ] 1.2 types.ts implemented
- [ ] 1.3 coldlight/ implemented
- [ ] 1.4 meltui/ implemented
- [ ] 1.5 registry.ts implemented
- [ ] 1.6 index.ts implemented

### Phase 2: Primitives Scanner
- [ ] 2.1 scanner.ts implemented

### Phase 3: api/adapters/coldlight/_internal/dialog/
- [ ] 3.1 Folder created
- [ ] 3.2 dialog.ts implemented
- [ ] 3.3 types.ts implemented
- [ ] 3.4 contract.ts implemented
- [ ] 3.5 index.ts implemented

### Phase 4: api/adapters/meltui/_internal/dialog/
- [ ] 4.1 Folder created
- [ ] 4.2 dialog.ts implemented
- [ ] 4.3 types.ts implemented
- [ ] 4.4 contract.ts implemented
- [ ] 4.5 index.ts implemented

### Phase 5: primitives/dialog/
- [ ] 5.1 Folder created
- [ ] 5.2 dialog.ts implemented
- [ ] 5.3 types.ts implemented
- [ ] 5.4 contract.ts implemented
- [ ] 5.5 context.ts implemented
- [ ] 5.6 Dialog.svelte implemented
- [ ] 5.7 index.ts implemented

### Phase 6: taxonomy/primitives/dialog/
- [ ] 6.1 Contract exports verified
- [ ] 6.2 Barrel updated

### Phase 7: Verification
- [ ] 7.1 Scanner test passes
- [ ] 7.2 svelte-check passes

---

## SIGN-OFF

- [ ] All tasks complete
- [ ] 4-folder parity verified for dialog
- [ ] Sprint marked COMPLETE
