# ColdLight Terminology

> **Canonical vocabulary. One term per concept. No synonyms.**

---

## The Four Core Terms (Locked)

These terms have EXACT meanings. Do not use them interchangeably.

| Term | Definition | Contains Code? | Layer |
|------|------------|----------------|-------|
| **Recipe** | CSS appearance rules | Yes (CSS) | Style |
| **Blueprint** | Prebuilt assembly (slot wiring + defaults) | Yes (TypeScript) | Build |
| **Pattern** | Documentation guidance only | No | Docs |
| **Block** | Runtime payload for VPB | Yes (JSON/data) | Runtime |

---

## Recipe

**Definition:** CSS appearance rules.

**What it is:**
- Pure styling behavior
- Driven by data attributes (`data-surface`, etc.)
- Can leverage DaisyUI as accelerator
- ColdLight owns the rule set

**What it contains:**
- CSS selectors + token usage
- Variants via `data-*`
- NO structure, NO slot wiring

**Where it lives:**
- `recipes/css/` — Generated CSS
- Applied via class + data attributes

**It is NOT a component.**

```css
.btn-main {
  /* structure + pseudo-elements hooks */
  /* reads: --surface, --material, --layers, --transition, --motion */
}

.v-s1z2l3t1m2 {
  --surface: 1;
  --material: 2;
  --layers: 3;
  --transition: 1;
  --motion: 2;
}
```

---

## Blueprint

**Definition:** Composition defaults + slot wiring.

**What it is:**
- Pre-assembled canonical build
- Prevents devs from rebuilding the same assembly manually
- The "official prebuilt assembly"

**What it contains:**
- Which primitive(s) are used
- Which slots are used + how they connect
- Default recipe attachments
- Default semantic meaning configuration

**Where it lives:**
- Under ColdLight as typed composition module
- Real code, not just docs

**It is NOT just documentation.**

```typescript
// blueprints/PrimaryButton.ts
export const PrimaryButtonBlueprint = {
  primitive: "button",
  slots: ["root"],
  recipe: "btn-main",
  variant: "v-s1z2l3t1m2",
  defaults: {
    intent: "primary",
  },
};
```

---

## Pattern

**Definition:** Documentation guidance only.

**What it is:**
- Repeatable idea explained in docs
- Teaches "how to assemble X correctly"
- NOT enforceable code by default

**What it contains:**
- Diagrams
- Best practices / guardrails
- Examples
- "Use this + this slot + this arrangement"

**Where it lives:**
- Documentation layer (`patterns/README.md`)

**You cannot import a pattern.**

```markdown
# Form Pattern

## Structure
- Input semantic for each field
- Label above input
- Error message below input
- Submit button at bottom

## Validation
- Validate on blur
- Show error immediately
- Disable submit until valid
```

---

## Block

**Definition:** Runtime payload for VPB (Visual Page Builder).

**What it is:**
- Runtime-safe payload that VPB uses
- Serializable structure for rendering UI
- Can be saved in DB or local storage

**What it contains:**
- Kind/type reference (what blueprint/semantic it targets)
- Props
- Recipe references
- Children
- Layout meta

**Where it lives:**
- VPB system layer (runtime payload format)

**It is NOT a primitive/semantic module itself.**

```json
{
  "kind": "hero",
  "blueprint": "HeroWithGlassPanel",
  "props": {
    "headline": "Welcome",
    "variant": "v-s1z2l3t1m2"
  },
  "children": [
    { "kind": "button", "blueprint": "PrimaryButton", "props": { "label": "Get Started" } }
  ]
}
```

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

**Example:** `v-s1z2l3t1m2`

**Future expansion:**
- `v-s1z2z5l3t1m2` — Multiple materials
- `v-s1z2a5l3t1m2` — Primary + accent material

---

## Layer Hierarchy

```
Layer 0: TOKENS          → Atomic values (TypeScript SSOT)
Layer 1: CSS VARIABLES   → Generated from tokens (NEVER hand-written)
Layer 2: RECIPES         → Appearance rules (CSS + variants)
Layer 3: PRIMITIVES      → Behavior components (Melt UI wrappers)
Layer 4: SEMANTICS       → Primitives + Recipes = Styled components
Layer 5: BLUEPRINTS      → Prebuilt assemblies (slot wiring + defaults)
Layer 6: PATTERNS        → Documentation guidance only
Layer 7: BLOCKS          → VPB runtime payloads
```

---

## Primitive Contract (Three Attributes Only)

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `data-kind` | Primitive identity | `"button"`, `"dialog"` |
| `data-slot` | Slot within primitive | `"root"`, `"trigger"` |
| `data-state` | State machine output | `"idle"`, `"open"` |

---

## Markup Contract

```html
<button class="btn-main v-s1z2l3t1m2" data-kind="button" data-slot="root" data-state="idle">
  Save
</button>
```

**Two class types:**
- **Semantic preset** (`.btn-main`) — Structure + intent
- **Variant payload** (`.v-s1z2l3t1m2`) — Compressed appearance

---

## Provider Model

| Provider | Responsibility |
|----------|----------------|
| **Melt UI** | ARIA, focus, keyboard, interaction behavior |
| **ColdLight** | Taxonomy, data attributes, recipes, type system |

ColdLight primitives import from `_internal`, never from Melt UI directly.

---

## DaisyUI Role

DaisyUI is "stolen" and folded into ColdLight.

| DaisyUI | ColdLight |
|---------|-----------|
| `.btn` | `.btn-main` |
| `.card` | `.panel-main` |
| `.input` | `.input-main` |

Users never import DaisyUI directly. They see ColdLight names only.

---

## Deprecated Terms

| Term | Replace With | Reason |
|------|--------------|--------|
| `data-primitive` | `data-kind` | Taxonomy alignment |
| `data-name` | `data-slot` | Taxonomy alignment |
| `data-part` | `data-slot` | Taxonomy alignment |
| `block_library` | `semantics` | Industry standard |
| `components` | `semantics` or `blueprints` | Ambiguous |
| `compound` | `blueprint` | Clearer meaning |

---

## Summary

| Concept | Code? | Import? | Runtime? |
|---------|-------|---------|----------|
| Recipe | CSS | Class attr | No |
| Blueprint | TypeScript | Yes | Build |
| Pattern | Markdown | No | No |
| Block | JSON | No | Yes (VPB) |

---

**This is the canonical vocabulary. Violations cause drift.**
