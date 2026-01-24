# ColdLight Design Book

> **The canonical specification for ColdLight design system.**
>
> If it's not in this book, it doesn't exist.

---

## Book Structure

| Hub | Location | Purpose |
|-----|----------|---------|
| [Laws](./LAWS.md) | `docs/LAWS.md` | Frozen non-negotiable rules |
| [Terminology](./TERMINOLOGY.md) | `docs/TERMINOLOGY.md` | Canonical vocabulary |
| [Taxonomy](../taxonomy/README.md) | `taxonomy/` | SSOT backbone |
| [Tokens](../tokens/README.md) | `tokens/` | Design token SSOT |
| [Primitives](../primitives/README.md) | `primitives/` | Behavior components |
| [Recipes](../recipes/README.md) | `recipes/` | Appearance system |
| [Semantics](../semantics/README.md) | `semantics/` | Styled components |
| [Blueprints](./BLUEPRINTS.md) | `docs/BLUEPRINTS.md` | Prebuilt assemblies |
| [Patterns](../patterns/README.md) | `patterns/` | Documentation guidance |
| [Blocks](../blocks/README.md) | `blocks/` | VPB runtime payloads |
| [Internals](../sys/api/_internals/README.md) | `sys/api/_internals/` | Provider mapping |
| [Generator](./GENERATOR.md) | `docs/GENERATOR.md` | Auto-doc pipeline |
| [Git Discipline](./GIT_DISCIPLINE.md) | `docs/GIT_DISCIPLINE.md` | Commit/tag/label rules |

---

## The One Rule

> **If it can't be derived from taxonomy + structure, it doesn't belong in SSOT.**

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         TAXONOMY (SSOT)                         │
│   primitiveKinds.ts │ primitiveRegistry.ts │ contracts.ts       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      TOKENS (Layer 0)                           │
│   tokens.ts (SSOT) → tokens.css, types.ts (GENERATED)           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      RECIPES (Layer 2)                          │
│   Appearance rules │ Variant payloads │ CSS variables           │
│   .btn-main │ .v-s1m2l3t1mo2 │ --surface, --material, etc.      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PRIMITIVES (Layer 3)                         │
│   Melt UI wrappers │ data-kind, data-slot, data-state ONLY      │
│   dialog.svelte │ button.svelte │ select.svelte                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SEMANTICS (Layer 4)                          │
│   Primitives + Recipes = Styled components                      │
│   MainButton.svelte │ GlassPanel.svelte │ NeonInput.svelte      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BLUEPRINTS (Composition)                     │
│   Prebuilt assemblies │ Slot wiring │ Default recipes           │
│   PrimaryButtonBlueprint │ DialogBlueprint │ FormBlueprint      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PATTERNS (Documentation)                     │
│   Human guidance │ Diagrams │ Best practices │ Examples         │
│   NOT code │ NOT imports │ Teaching only                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BLOCKS (VPB Runtime)                         │
│   Serializable payloads │ Kind refs │ Props │ Children          │
│   Runtime data format for Visual Page Builder                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Provider Model

```
┌─────────────────────────────────────────────────────────────────┐
│                         MELT UI                                 │
│   ARIA attributes │ Focus management │ Keyboard navigation      │
│   Interaction behavior │ State machines                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    _INTERNALS (Mapping)                         │
│   sys/api/_internals/ │ Provider abstraction boundary           │
│   Primitives NEVER import Melt UI directly                      │
│   Future provider swaps without rewriting ColdLight             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      COLDLIGHT API                              │
│   Stable surface │ Taxonomy enforced │ Contract validated       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Markup Contract

```html
<button class="btn-main v-s1z2l3t1m2" data-kind="button" data-slot="root" data-state="idle">
  Save
</button>
```

### Two Class Types

| Class | Purpose | Example |
|-------|---------|---------|
| **Semantic preset** | Structure + intent | `.btn-main`, `.panel-main` |
| **Variant payload** | Compressed appearance | `.v-s1z2l3t1m2` |

### Three Data Attributes

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `data-kind` | Primitive identity | `"button"`, `"dialog"` |
| `data-slot` | Slot within primitive | `"root"`, `"trigger"` |
| `data-state` | State machine output | `"idle"`, `"open"` |

---

## Variant Key Encoding (Frozen)

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

### Variant → CSS Variables

```css
.v-s1z2l3t1m2 {
  --surface: 1;
  --material: 2;
  --layers: 3;
  --transition: 1;
  --motion: 2;
}
```

### Future Expansion (Ready)

Multiple materials supported:
```
v-s1z2z5l3t1m2    /* materials 2 + 5 */
v-s1z2a5l3t1m2    /* z2 = primary, a5 = accent */
```

### Layer Variables

| Variable | Purpose |
|----------|---------|
| `--layers` | Number of pseudo-element layers |
| `--layer-depth` | Z-depth between layers |
| `--layer-softness` | Blur/shadow softness per layer |

---

## DaisyUI Integration

DaisyUI is **stolen and folded into ColdLight**.

| DaisyUI | ColdLight |
|---------|-----------|
| `.btn` | `.btn-main` |
| `.card` | `.panel-main` |
| `.input` | `.input-main` |

Users **never import DaisyUI directly**. They see ColdLight names only.

DaisyUI = starter kit / design reference.
ColdLight = the actual OS.

---

## Auto-Growing System

1. **Taxonomy is machine-readable** — Generates registries, docs, diagrams
2. **Registry is DERIVED** — Never hand-edited, always generated from taxonomy
3. **Docs generate from taxonomy + JSDoc** — Not manual edits
4. **Codegen only emits valid variant keys** — Taxonomy owns allowed values

---

## Compliance

| Standard | Status |
|----------|--------|
| DTCG (W3C Dec 2024) | Compliant |
| Style Dictionary v4 | Compliant |
| WCAG 2.1 AA | Target |
| ARIA 1.2 | Via Melt UI |

---

**This is the root of the ColdLight Design Book.**
