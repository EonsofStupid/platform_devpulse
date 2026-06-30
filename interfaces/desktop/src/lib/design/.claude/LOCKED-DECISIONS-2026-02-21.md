# ColdLight — Locked Decisions 2026-02-21

> These decisions supersede any contradicting text in previous docs.
> Update all docs to match this. Never revert.

---

## 1. Contract Location (LOCKED)

**Contracts live WITH the implementation. They declare themselves into taxonomy at build time.**

```
primitives/{name}/
  {Name}.svelte      ← structureless Svelte
  contract.ts        ← primitive contract — scanner reads this, registers into manifest
  types.ts
  index.ts

components/{name}/
  {Name}.svelte      ← ARIA + state Svelte
  contract.ts        ← component contract — scanner reads this, registers into manifest
  types.ts
  index.ts
```

**NOT** a separate `taxonomy/kinds/{name}/primitive/contract.ts` file.
The contract travels WITH the code it describes.
Taxonomy is the REGISTRY (scanner + manifest + runtime registry). NOT a mirror of primitives.

---

## 2. Taxonomy Role (LOCKED)

Taxonomy = the registration system. It does NOT house contracts.

```
taxonomy/
  schema/
    primitive.ts     ← PrimitiveContractSchema (Zod) — validates all primitive contracts
    component.ts     ← ComponentContractSchema (Zod) — validates all component contracts
    index.ts
  scanner.ts         ← BUILD TIME: globs primitives/*/contract.ts + components/*/contract.ts,
                        validates against schema, flags dupes, writes manifest
  registry.ts        ← RUNTIME: reads manifest.json, O(1) Map lookups
  types.ts           ← ColdLightManifest, ManifestKind, ScanResult
  index.ts
  .generated/
    manifest.json    ← VPB source of truth
    imports.gen.ts   ← import cloak for adapter abstraction
```

Scanner reads: `primitives/*/contract.ts` + `components/*/contract.ts`
Scanner writes: `taxonomy/.generated/manifest.json`
Scanner fails build on: Zod failure, duplicate kind, meltui kind without adapter impl

---

## 3. Three Implementation Layers (LOCKED)

```
primitives/{name}/     ← STRUCTURELESS. Zero ARIA applied. Zero style.
                         HTML element + data-kind + data-slot + full prop spread.
                         types.ts extends HTML element (aria-* passthrough only).
                         contract.ts declares primitive to scanner.

components/{name}/     ← ARIA + STATE. Zero visual style.
                         Wraps primitive. Computes ARIA from state props. Sets data-state.
                         contract.ts declares component to scanner.

ui/{name}/             ← STYLED. Project-specific.
                         Wraps component. Applies recipe class strings.
                         What THIS project imports. Not ColdLight core.
```

**Old "semantics/" layer is replaced by this two-layer split.**
- Old: `semantics/` = primitive + recipe (ARIA + style combined)
- New: `components/` = ARIA only, `ui/` = style only

---

## 4. ARIA Ownership (LOCKED)

- **Primitives**: ARIA props pass through via `...rest` spread. NOT applied. NOT computed.
  `types.ts` extends full HTML element interface so `aria-*` props are available.
- **Components**: ARIA computed from state props, applied to primitive.
  Example: `pressed: boolean` → `aria-pressed={pressed}` applied in component layer.
- **Adapter (meltui)**: Exception only. Justified in contract.ts with comment.

---

## 5. SD5 Token Pipeline (LOCKED — DONE)

Script location: `scripts/dev/design/sd/build.ts`
Command: `pnpm ds:tokens:build`
Status: WORKING — clean build, zero warnings.

Old `ds-tokens-build.ts` → DELETED.
New pipeline: `scripts/dev/design/sd/` (hypermodular: preprocessors/, formats/, config.ts, build.ts)

Phase 4 in MASTER-PLAN.md is DONE for the build script.
Remaining in Phase 4: verify recipe class names actually resolve in browser (token→Tailwind gap still needs verification).

---

## 6. Folder Terminology (LOCKED)

| Was | Is Now | Why |
|-----|--------|-----|
| `catalog/` | DELETED | Duplicate of taxonomy — remove |
| `semantics/` | Split into `components/` + `ui/` | Separation of concerns |
| `taxonomy/kinds/{name}/primitive/` | `primitives/{name}/contract.ts` | Contracts with implementation |
| `taxonomy/kinds/{name}/component/` | `components/{name}/contract.ts` | Contracts with implementation |

---

## 7. What Taxonomy/Catalog References in Old Docs Mean

When old docs say "catalog" → they mean the registration/declaration system → now called "taxonomy".
When old docs say `catalog/kinds/primitives/{kind}/contract.ts` → that contract now lives at `primitives/{kind}/contract.ts`.
When old docs say "semantics" → that is now split into `components/` (ARIA) and `ui/` (styled).

Update all docs accordingly. Do not revert.
