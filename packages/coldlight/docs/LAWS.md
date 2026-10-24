# ColdLight Laws

> **Frozen. Non-negotiable. Violate at your own peril.**

---

## Law 1: Taxonomy is SSOT

Everything derives from taxonomy. If taxonomy doesn't know about it, it doesn't exist.

- [ ] All primitive kinds defined in `taxonomy/primitiveKinds.ts`
- [ ] All slots defined in `taxonomy/primitiveRegistry.ts`
- [ ] All contracts defined in `taxonomy/contracts.ts`
- [ ] Registry is GENERATED, never hand-edited

**Violation:** Drift. Orphaned components. Broken codegen.

---

## Law 2: Three Data Attributes Only

Primitives emit exactly three data attributes. No more.

| Attribute | Required | Purpose |
|-----------|----------|---------|
| `data-kind` | ALWAYS | Primitive identity |
| `data-slot` | ALWAYS | Slot within primitive |
| `data-state` | If stateful | State machine output |

**Violation:** CSS targeting breaks. Taxonomy audit fails.

---

## Law 3: Melt UI Owns ARIA

ColdLight does NOT set:
- `role` attributes
- `aria-*` attributes
- `tabindex`
- Focus trap logic
- Keyboard handlers

Melt UI handles all accessibility via `_internals` mapping.

**Violation:** Accessibility regressions. Duplicate ARIA. Screen reader chaos.

---

## Law 4: Primitives Never Import Providers

Primitives import from `_internals` only. Never from Melt UI directly.

```typescript
// ✅ CORRECT
import { createDialog } from '#coldlight/sys/api/_internals/melt';

// ❌ FORBIDDEN
import { createDialog } from '@melt-ui/svelte';
```

**Violation:** Provider lock-in. Future swap impossible.

---

## Law 5: CSS is Generated

All CSS comes from `tokens.ts` via Vite plugin. Never hand-written.

- [ ] `tokens.css` — GENERATED
- [ ] `types.ts` — GENERATED
- [ ] `surfaces.gen.css` — GENERATED

**Violation:** Token drift. Broken theming. Manual maintenance hell.

---

## Law 6: One Encoding for Variants

Variant keys use ONE format forever:

```
v-s{#}z{#}l{#}t{#}m{#}
```

| Key | Variable | Meaning |
|-----|----------|---------|
| `s` | `--surface` | Surface type |
| `z` | `--material` | Material (z-material) |
| `l` | `--layers` | Layer count |
| `t` | `--transition` | Transition speed |
| `m` | `--motion` | Motion type |

Examples:
- ✅ `v-s1z2l3t1m2`
- ✅ `v-s1z2z5l3t1m2` (multiple materials)
- ❌ `v-smltm`
- ❌ `v-main-soft-fast`
- ❌ `v-surface1-material2`

**Violation:** Parsing breaks. Codegen fails. Class soup returns.

---

## Law 7: Semantic Presets Are Not Primitives

| Layer | What It Is | What It Contains |
|-------|------------|------------------|
| Primitive | Behavior | data-kind, data-slot, data-state |
| Semantic | Styled component | Primitive + Recipe |
| Blueprint | Prebuilt assembly | Slot wiring + defaults |

Semantic presets (`.btn-main`, `.panel-main`) are STYLING, not behavior.

**Violation:** Layer confusion. Primitives become styling dumping ground.

---

## Law 8: Patterns Are Documentation Only

Patterns are NOT code. You cannot import a pattern.

Patterns contain:
- Diagrams
- Best practices
- Assembly guidance
- Examples

**Violation:** SSOT pollution. Import graph chaos.

---

## Law 9: Blocks Are Runtime Payloads

Blocks are serializable data for VPB. They are NOT component modules.

Block contains:
- Kind/type reference
- Props
- Recipe references
- Children
- Layout meta

**Violation:** Build/runtime boundary confusion.

---

## Law 10: Layer Variables, Not Class Stacking

The neuromorphism layer system uses CSS variables:

```css
--layer-count
--layer-depth
--layer-softness
```

NOT class stacking like `.layer-1 .layer-2 .layer-3`.

**Violation:** Specificity wars. Performance death. Unmaintainable CSS.

---

## Law 11: Material Uses `z`, Motion Uses `m`

In variant keys:
- `z` = material (z-material)
- `m` = motion

Never use `m` for material.

**Violation:** Ambiguous parsing. Generator confusion.

---

## Law 12: Index Files Are Export-Only

`index.ts` files contain ONLY:
- Imports
- Exports
- JSDoc comments

No logic. No computed values. No side effects.

```typescript
// ✅ CORRECT
export { default as Dialog } from './dialog.svelte';
export type { DialogProps } from './types.js';

// ❌ FORBIDDEN
const computed = something();
export { computed };
```

**Violation:** Barrel pollution. Circular dependencies. Import order bugs.

---

## Enforcement

| Check | Tool | When |
|-------|------|------|
| Taxonomy audit | Vite plugin | Build |
| Data attribute validation | Vite plugin | Build |
| Provider import check | ESLint | Commit |
| Variant key format | Vite plugin | Build |
| CSS generation | Vite plugin | Build |

---

**These laws are frozen. Exceptions require team consensus and documentation.**
