# ColdLight Quick Refresh

> Read this after every compaction.

---

## Variant Key Encoding (FROZEN)

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

Example: `v-s1z2l3t1m2`

---

## Markup Contract

```html
<button class="btn-main v-s1z2l3t1m2" data-kind="button" data-slot="root" data-state="idle">
  Save
</button>
```

- `.btn-main` = semantic preset (structure + hooks)
- `.v-*` = variant payload (sets CSS variables only)
- `data-kind` / `data-slot` / `data-state` = THREE attributes only

---

## Layer Stack

| Layer | What | Code? |
|-------|------|-------|
| Tokens | Design tokens | JSON (DTCG) |
| Recipes | CSS appearance | CSS classes |
| Primitives | Behavior only | Svelte (Bits UI) |
| Semantics | Primitive + Recipe | Svelte |
| Blueprints | Prebuilt assembly | TypeScript |
| Patterns | Guidance | Docs only |
| Blocks | VPB payload | JSON runtime |

---

## Provider Model

```
Bits UI (ARIA + behavior) → _internal (mapping) → ColdLight Primitive
```

- **Bits UI owns**: `role`, `aria-*`, `tabindex`, focus, keyboard
- **ColdLight owns**: `data-kind`, `data-slot`, `data-state`, `class`

Primitives import from `_internal`, NEVER from bits-ui directly.

---

## Terminology (LOCKED)

| Term | Is Code? | Purpose |
|------|----------|---------|
| Recipe | Yes (CSS) | Appearance rules |
| Blueprint | Yes (TS) | Prebuilt assembly |
| Pattern | No (Docs) | Guidance only |
| Block | Yes (JSON) | VPB runtime |

---

## Current Sprint

**Sprint 7: Select Primitive**

Location: `primitives/select/`

Components: Root, Trigger, Portal, Content, Viewport, Item, ItemText, ItemGroup, GroupLabel, Separator, ScrollUp, ScrollDown, Arrow

---

## Commands

```bash
cd interfaces/desktop
pnpm dev          # Dev server
pnpm check        # TypeScript
pnpm test:browser # Browser tests
```

---

## Key Files

- `taxonomy/` — SSOT backbone
- `primitives/` — Behavior components
- `recipes/` — CSS appearance
- `semantics/` — Styled components
- `sys/api/_internal/` — Provider mapping
