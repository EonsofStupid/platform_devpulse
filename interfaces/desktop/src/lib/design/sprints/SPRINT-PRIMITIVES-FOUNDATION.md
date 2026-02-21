# Sprint: Primitives Foundation

**Created**: 2026-02-20
**Research**: [SPRINT-PRIMITIVES-FOUNDATION.research.md](./SPRINT-PRIMITIVES-FOUNDATION.research.md)
**Priority**: CRITICAL — Nothing renders without this
**Status**: READY TO EXECUTE

---

## Goal

Three things broken. Fix them in order. Nothing else.

1. SD5 is not the default token pipeline — fix it
2. No primitive `.svelte` files exist — build button as gold standard
3. MASTER-PLAN does not reflect real state or real purpose — reauthor it

---

## Prerequisites

- [x] `style-dictionary@5.3.1` installed
- [x] `ds-tokens-sd5.ts` exists and runs correctly
- [x] `taxonomy/kinds/primitives/contract.ts` — PrimitiveContractSchema solid
- [x] `config/coldlight/vocabularies.cfg.ts` — all vocabulary constants solid
- [x] `taxonomy/button/` — files exist but in wrong location

---

## Phase A: Wire SD5 as Default Pipeline

### A1. Switch `ds:tokens:build` to SD5 script

**File**: `interfaces/desktop/package.json`

Change:
```json
"ds:tokens:build": "node scripts/dev/design/ds-tokens-build.ts",
"ds:tokens:build:sd5": "node scripts/dev/design/ds-tokens-sd5.ts",
"ds:tokens:watch": "node --watch scripts/dev/design/ds-tokens-build.ts",
```

To:
```json
"ds:tokens:build": "node scripts/dev/design/ds-tokens-sd5.ts",
"ds:tokens:watch": "node --watch scripts/dev/design/ds-tokens-sd5.ts",
```

Remove `ds:tokens:build:sd5` — it IS now `ds:tokens:build`.

### A2. Delete old hand-rolled script

Delete: `scripts/dev/design/ds-tokens-build.ts`

### A3. Run and verify

```bash
pnpm ds:tokens:build
```

Must output:
```
[SD5] Generated CSS:  src/lib/design/tokens/tokens.css
[SD5] Generated TS:   src/lib/design/tokens/types.ts
[SD5] Generated TW:   src/lib/design/tokens/tailwind.preset.ts
[SD5] Generated DTCG: src/lib/design/tokens/tokens.json
```

---

## Phase B: Fix Taxonomy Folder Location

### B1. Move button files to correct location

`taxonomy/button/` → `taxonomy/kinds/button/`

Files to move:
- `contract.ts`
- `Button.svelte`
- `types.ts`
- `index.ts`

### B2. Delete old `taxonomy/kinds/component/button/`

This split folder is replaced by the unified `taxonomy/kinds/button/`.

### B3. Verify `taxonomy/kinds/button/` structure

```
taxonomy/kinds/button/
  contract.ts       ✓
  Button.svelte     ✓
  types.ts          ✓
  index.ts          ✓
```

---

## Phase C: Button as Gold Standard

### C1. Verify Button.svelte is correct

```svelte
<script lang="ts">
  import type { ButtonProps } from "./types.js";
  let { disabled, loading, pressed, type = "button", ... }: ButtonProps = $props();
  const state = $derived(disabled ? "disabled" : loading ? "loading" : pressed === true ? "pressed" : undefined);
</script>

<button
  {type} {disabled}
  aria-pressed={pressed}
  aria-busy={loading || undefined}
  aria-disabled={disabled || undefined}
  data-kind="button"
  data-slot="root"
  data-state={state}
  class={className}
  {onclick}
  {...rest}
>
  {@render children?.()}
</button>
```

### C2. Verify contract.ts satisfies PrimitiveContractSchema

Run scanner or manually verify contract passes `parseContract()`.

### C3. Run svelte-check

```bash
pnpm check
```

Zero errors on button files.

---

## Phase D: Reauthor MASTER-PLAN.md

### D1. Update purpose statement

Add to opening block:

> ColdLight is a **portable, multi-project, UI-driven design system** owned by the architect.
> Deployed across the architect's own projects and customer engagements.
> Config-first: `coldlight.config.ts` is project-specific. VPB reads config + manifest to present configuration UI.

### D2. Fix architecture diagram

Replace `catalog/` with `taxonomy/` throughout.

Update primitive folder from:
```
catalog/kinds/primitives/{kind}/
```
To:
```
taxonomy/kinds/{name}/
```

### D3. Fix Implementation Phases

Mark accurate current state:
- Phase 0 (Tokens): PARTIAL — SD5 script exists but not wired as default
- Phase 2 (Catalog/Taxonomy): PARTIAL — schemas exist, zero .svelte files
- All other phases: NOT STARTED

### D4. Add Primitive Pattern section

Document the gold standard:
- `taxonomy/kinds/{name}/` is home
- `contract.ts` = PrimitiveContract data
- `{Name}.svelte` = HTML + ARIA + data attributes + empty class prop
- `types.ts` = Props interface
- `index.ts` = barrel

---

## Verification

After each phase:

```bash
pnpm ds:tokens:build    # Phase A — must use SD5
pnpm check              # Phase C — zero errors
```

---

## Acceptance Criteria

| Criteria | Verified By |
|----------|-------------|
| `pnpm ds:tokens:build` runs SD5 | Output shows `[SD5]` prefix |
| Old `ds-tokens-build.ts` deleted | File does not exist |
| `taxonomy/kinds/button/` has all 4 files | `ls taxonomy/kinds/button/` |
| `pnpm check` passes on button files | Zero errors |
| MASTER-PLAN states portable/multi-project | First paragraph updated |
| MASTER-PLAN folder names match codebase | `taxonomy/` not `catalog/` |

---

## Out of Scope

- All other primitives (after button is gold standard, repeat the pattern)
- VPB implementation
- Component (styled) layer
- Recipe system changes
- Test files (after pattern proven)
