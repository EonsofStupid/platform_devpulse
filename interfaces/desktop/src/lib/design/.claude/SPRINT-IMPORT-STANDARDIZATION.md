# SPRINT: Import Path Standardization (SvelteKit 2)

## Objective
Standardize ALL imports in `src/lib/design/` to SvelteKit 2 standard:
- `$lib/design/...` path aliases for CROSS-FOLDER imports
- NO `.js` or `.ts` extensions on ANY import
- Prisma-style enforcement via lefthook

---

## RULE

| Import Type | Pattern |
|-------------|---------|
| Cross-folder | `from "$lib/design/taxonomy/adapters/types"` |
| Same-folder | `from "./types"` |
| Child-folder | `from "./dialog"` |

**NEVER:** `.js` extension on ANY import

---

## FILES TO FIX

### CATEGORY A: Cross-Folder Imports (8 edits)

#### A1. taxonomy/primitives/dialog/contract.ts:14
```typescript
// BEFORE
import type { PrimitiveContract, StateToken } from "../../adapters/types.js";

// AFTER
import type { PrimitiveContract, StateToken } from "$lib/design/taxonomy/adapters/types";
```

#### A2. taxonomy/primitives/button/contract.ts:17
```typescript
// BEFORE
import type { PrimitiveContract, StateToken } from "../../adapters/types.js";

// AFTER
import type { PrimitiveContract, StateToken } from "$lib/design/taxonomy/adapters/types";
```

#### A3. taxonomy/primitives/tabs/contract.ts:16
```typescript
// BEFORE
import type { PrimitiveContract, StateToken } from "../../adapters/types.js";

// AFTER
import type { PrimitiveContract, StateToken } from "$lib/design/taxonomy/adapters/types";
```

#### A4. api/adapters/coldlight/_internal/dialog/contract.ts:20
```typescript
// BEFORE
} from "../../../../../taxonomy/primitives/dialog/index.js";

// AFTER
} from "$lib/design/taxonomy/primitives/dialog";
```

#### A5. api/adapters/coldlight/_internal/dialog/types.ts:9
```typescript
// BEFORE
import type { DialogSlot, DialogState } from "../../../../../taxonomy/primitives/dialog/contract.js";

// AFTER
import type { DialogSlot, DialogState } from "$lib/design/taxonomy/primitives/dialog/contract";
```

#### A6. api/adapters/meltui/_internal/dialog/contract.ts:9
```typescript
// BEFORE
import type { DialogSlot } from "../../../../../taxonomy/primitives/dialog/contract.js";

// AFTER
import type { DialogSlot } from "$lib/design/taxonomy/primitives/dialog/contract";
```

#### A7. api/adapters/meltui/_internal/dialog/types.ts:12
```typescript
// BEFORE
} from "../../../../../taxonomy/primitives/dialog/contract.js";

// AFTER
} from "$lib/design/taxonomy/primitives/dialog/contract";
```

#### A8. primitives/dialog/types.ts:14
```typescript
// BEFORE
} from "../../api/adapters/coldlight/_internal/dialog/index.js";

// AFTER
} from "$lib/design/api/dsadapters/coldlight/_internal/dialog";
```

---

### CATEGORY B: Same-Folder Imports - Remove .js (21 edits)

#### B1. taxonomy/adapters/index.ts
Lines 19, 29, 48:
```typescript
// BEFORE
} from "./types.js";
} from "./scanner.js";
} from "./registry.js";

// AFTER
} from "./types";
} from "./scanner";
} from "./registry";
```

#### B2. taxonomy/adapters/registry.ts:18
```typescript
// BEFORE
} from "./types.js";

// AFTER
} from "./types";
```

#### B3. taxonomy/adapters/scanner.ts:21
```typescript
// BEFORE
} from "./types.js";

// AFTER
} from "./types";
```

#### B4. taxonomy/primitives/index.ts
Lines 17, 27, 37:
```typescript
// BEFORE
} from "./dialog/index.js";
} from "./button/index.js";
} from "./tabs/index.js";

// AFTER
} from "./dialog";
} from "./button";
} from "./tabs";
```

#### B5. taxonomy/primitives/dialog/index.ts:13
```typescript
// BEFORE
} from "./contract.js";

// AFTER
} from "./contract";
```

#### B6. taxonomy/primitives/button/index.ts:13
```typescript
// BEFORE
} from "./contract.js";

// AFTER
} from "./contract";
```

#### B7. taxonomy/primitives/tabs/index.ts:13
```typescript
// BEFORE
} from "./contract.js";

// AFTER
} from "./contract";
```

#### B8. taxonomy/index.ts
Lines 12, 15:
```typescript
// BEFORE
export * from "./adapters/index.js";
export * from "./primitives/index.js";

// AFTER
export * from "./adapters";
export * from "./primitives";
```

#### B9. taxonomy/kind/index.ts:6
```typescript
// BEFORE
export * from "./kinds.js";

// AFTER
export * from "./kinds";
```

#### B10. api/adapters/coldlight/_internal/dialog/index.ts:6
```typescript
// BEFORE
export * from "./dialog.js";

// AFTER
export * from "./dialog";
```

#### B11. api/adapters/coldlight/_internal/dialog/dialog.ts
Lines 18, 32:
```typescript
// BEFORE
} from "./types.js";
} from "./contract.js";

// AFTER
} from "./types";
} from "./contract";
```

#### B12. api/adapters/meltui/_internal/dialog/index.ts:6
```typescript
// BEFORE
export * from "./dialog.js";

// AFTER
export * from "./dialog";
```

#### B13. api/adapters/meltui/_internal/dialog/dialog.ts
Lines 12, 19, 32:
```typescript
// BEFORE
export type { MeltDialogElement, MeltDialogState } from "./types.js";
} from "./types.js";
} from "./contract.js";

// AFTER
export type { MeltDialogElement, MeltDialogState } from "./types";
} from "./types";
} from "./contract";
```

#### B14. primitives/index.ts
Lines 26, 33, 62:
```typescript
// BEFORE
} from "./types.js";
} from "./route-metadata.js";
} from "./tanstack/index.js";

// AFTER
} from "./types";
} from "./route-metadata";
} from "./tanstack";
```

#### B15. primitives/dialog/index.ts:10
```typescript
// BEFORE
export * from "./dialog.js";

// AFTER
export * from "./dialog";
```

#### B16. primitives/dialog/dialog.ts
Lines 12, 13, 24, 35:
```typescript
// BEFORE
export type { DialogContext } from "./context.js";
export { setDialogContext, getDialogContext } from "./context.js";
} from "./types.js";
} from "./contract.js";

// AFTER
export type { DialogContext } from "./context";
export { setDialogContext, getDialogContext } from "./context";
} from "./types";
} from "./contract";
```

#### B17. primitives/tanstack/index.ts
Lines 26, 27:
```typescript
// BEFORE
export { renderComponent, renderSnippet } from "./render-component.js";
export { createSvelteTable } from "./table.svelte.js";

// AFTER
export { renderComponent, renderSnippet } from "./render-component";
export { createSvelteTable } from "./table.svelte";
```

#### B18. tokens/schema.ts:29
```typescript
// BEFORE
} from "./types.js";

// AFTER
} from "./types";
```

#### B19. blocks/index.ts
Lines 22-28:
```typescript
// BEFORE
export * as Heroes from "./heroes/index.js";
export * as Features from "./features/index.js";
export * as Dashboards from "./dashboards/index.js";
export * as Chat from "./chat/index.js";
export * as CTA from "./cta/index.js";
export * as Carousels from "./carousels/index.js";
export * as Navigation from "./navigation/index.js";

// AFTER
export * as Heroes from "./heroes";
export * as Features from "./features";
export * as Dashboards from "./dashboards";
export * as Chat from "./chat";
export * as CTA from "./cta";
export * as Carousels from "./carousels";
export * as Navigation from "./navigation";
```

#### B20. patterns/index.ts
Lines 18-20:
```typescript
// BEFORE
export * from "./forms/index.js";
export * from "./search/index.js";
export * from "./data/index.js";

// AFTER
export * from "./forms";
export * from "./search";
export * from "./data";
```

#### B21. semantics/index.ts
Lines 13-16:
```typescript
// BEFORE
export * from "./buttons/index.js";
export * from "./inputs/index.js";
export * from "./panels/index.js";
export * from "./cards/index.js";

// AFTER
export * from "./buttons";
export * from "./inputs";
export * from "./panels";
export * from "./cards";
```

---

## IGNORED

### _archive/
Dead code - user confirmed DELETE

### .md files
Documentation examples only

---

## LEFTHOOK ENFORCEMENT

Add to `lefthook.yml`:
```yaml
pre-commit:
  commands:
    no-js-imports:
      glob: "interfaces/desktop/src/lib/design/**/*.{ts,svelte}"
      run: |
        if grep -E "from ['\"].*\.js['\"]" {staged_files}; then
          echo "ERROR: .js extensions in imports are forbidden"
          echo "Use: from \"\$lib/design/...\" or from \"./module\""
          exit 1
        fi
```

---

## EXECUTION ORDER

1. Category A: Cross-folder imports (8 files)
2. Category B: Same-folder imports (21 file groups)
3. Run `pnpm svelte-check`
4. Add lefthook enforcement

---

## TOTAL

- **29 distinct edit operations**
- **~25 source files**
- **0 archive files touched**

---

## APPROVAL REQUIRED

Awaiting user approval before ANY implementation.
