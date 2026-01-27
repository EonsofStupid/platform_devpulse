SPRINT: 4-Folder Parity Implementation (Dialog)

Status: NOT STARTED
Goal: Implement complete 4-folder parity for dialog primitive.

CORE PRINCIPLE: FOLDERS ARE TRUTH

Scanner scans FOLDERS.

For every primitive kind, these 4 folders must exist:

src/lib/design/taxonomy/primitives/<kind>/

src/lib/design/api/adapters/coldlight/<kind>/

src/lib/design/api/adapters/meltui/_internal/<kind>/

src/lib/design/primitives/<kind>/

Dialog parity = 4 folders named dialog in those 4 locations.

CURRENT STATE AUDIT
Exists

src/lib/design/taxonomy/primitives/dialog/contract.ts

src/lib/design/taxonomy/primitives/button/contract.ts

src/lib/design/taxonomy/primitives/tabs/contract.ts

src/lib/design/taxonomy/adapters/scanner.ts

src/lib/design/taxonomy/adapters/registry.ts

Missing for dialog parity

src/lib/design/api/adapters/coldlight/dialog/

src/lib/design/api/adapters/meltui/_internal/dialog/

src/lib/design/primitives/dialog/

PHASE 1: Fix Scanner
Task 1.1: Update scanner.ts to check folders (not files)

File: src/lib/design/taxonomy/adapters/scanner.ts

Update all parity checks so each location checks:

${.../<kind>} as a directory path

missing output prints folder paths ending with /

Verification

pnpm svelte-check passes

scanner output reports missing folders (not missing ${kind}.ts)

 Task 1.1 complete

PHASE 2: Create ColdLight Adapter Folder (Dialog)
Task 2.1: Create folder structure

Create: src/lib/design/api/adapters/coldlight/dialog/

Required files:

index.ts

types.ts

 Task 2.1 complete

Task 2.2: Implement dialog/types.ts

File: src/lib/design/api/adapters/coldlight/dialog/types.ts

Defines:

public dialog props/types

re-exports dialog slot/state types from taxonomy

slot-props shape used by primitives

collections obtained with get(key)

actions allowing multiple Svelte actions per slot

Verification

pnpm svelte-check passes

 Task 2.2 complete

Task 2.3: Implement dialog/index.ts

File: src/lib/design/api/adapters/coldlight/dialog/index.ts

Exports:

types.ts

dialog taxonomy contract exports via the taxonomy barrel (taxonomy/primitives/dialog)

Verification

pnpm svelte-check passes

 Task 2.3 complete

PHASE 3: Create MeltUI Internal Folder (Dialog)
Task 3.1: Create folder structure

Create: src/lib/design/api/adapters/meltui/_internal/dialog/

Required files:

index.ts

types.ts

mapping.ts

 Task 3.1 complete

Task 3.2: Implement dialog/types.ts

File: src/lib/design/api/adapters/meltui/_internal/dialog/types.ts

Defines:

Melt element/state keys observed

explicit mapping tables:

element → slot

adapterStateKeys → ColdLightStateTokens (mapsToTokens)

Verification

pnpm svelte-check passes

 Task 3.2 complete

Task 3.3: Implement dialog/mapping.ts

File: src/lib/design/api/adapters/meltui/_internal/dialog/mapping.ts

Defines:

builder identity for dialog mapping

slot inventory with required vs optional slots

state inventory used by dialog mapping

Verification

pnpm svelte-check passes

 Task 3.3 complete

Task 3.4: Implement dialog/index.ts

File: src/lib/design/api/adapters/meltui/_internal/dialog/index.ts

Barrel exports:

types.ts

mapping.ts

Verification

pnpm svelte-check passes

 Task 3.4 complete

PHASE 4: Create Primitives Folder (Dialog)
Task 4.1: Create folder structure

Create: src/lib/design/primitives/dialog/

Required files:

index.ts

context.ts

Dialog.svelte

 Task 4.1 complete

Task 4.2: Implement dialog/context.ts

File: src/lib/design/primitives/dialog/context.ts

Defines:

Svelte context types derived from the ColdLight dialog adapter surface

helpers to set/get context

Verification

pnpm svelte-check passes

 Task 4.2 complete

Task 4.3: Implement dialog/Dialog.svelte

File: src/lib/design/primitives/dialog/Dialog.svelte

Implements:

dialog root component using adapter surface

applies data-kind="dialog", data-slot="root", data-state="..."

Verification

pnpm svelte-check passes

 Task 4.3 complete

Task 4.4: Implement dialog/index.ts

File: src/lib/design/primitives/dialog/index.ts

Barrel exports:

Dialog.svelte

context helpers

dialog types

Verification

pnpm svelte-check passes

 Task 4.4 complete

PHASE 5: Taxonomy Exports (Dialog)
Task 5.1: Verify dialog contract exports

File: src/lib/design/taxonomy/primitives/dialog/contract.ts

Confirm it exports:

contract

slots inventory

states inventory

slot→states mapping inventory (if used)

slot/state types

 Task 5.1 complete

Task 5.2: Update dialog taxonomy barrel

File: src/lib/design/taxonomy/primitives/dialog/index.ts

Exports:

all contract exports required by adapter + primitives

Verification

pnpm svelte-check passes

 Task 5.2 complete

PHASE 6: Verification
Task 6.1: Run registry/scanner test

Run:

npx tsx src/lib/design/taxonomy/test-registry.ts (or the repo’s canonical test entry)

Expected:

dialog reports parity success

missing parity for other primitives reports missing folder paths

 Task 6.1 complete

Task 6.2: Run svelte-check

Run:

pnpm svelte-check

 Task 6.2 complete

COMPLETION CHECKLIST
Phase 1

 1.1 scanner checks folders

Phase 2

 2.1 coldlight/dialog folder created

 2.2 coldlight/dialog/types.ts implemented

 2.3 coldlight/dialog/index.ts implemented

Phase 3

 3.1 meltui/_internal/dialog folder created

 3.2 meltui/_internal/dialog/types.ts implemented

 3.3 meltui/_internal/dialog/mapping.ts implemented

 3.4 meltui/_internal/dialog/index.ts implemented

Phase 4

 4.1 primitives/dialog folder created

 4.2 primitives/dialog/context.ts implemented

 4.3 primitives/dialog/Dialog.svelte implemented

 4.4 primitives/dialog/index.ts implemented

Phase 5

 5.1 taxonomy dialog contract exports verified

 5.2 taxonomy dialog index barrel updated

Phase 6

 6.1 registry/scanner test confirms dialog parity

 6.2 pnpm svelte-check passes

4-FOLDER SUMMARY FOR DIALOG
Location	Purpose	Folder
src/lib/design/taxonomy/primitives/dialog/	Declaration	dialog/
src/lib/design/api/adapters/coldlight/dialog/	ColdLight adapter surface	dialog/
src/lib/design/api/adapters/meltui/_internal/dialog/	MeltUI internal mapping	dialog/
src/lib/design/primitives/dialog/	Svelte primitive	dialog/