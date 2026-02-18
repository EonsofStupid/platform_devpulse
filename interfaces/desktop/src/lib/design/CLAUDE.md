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
| Tokens | Design tokens (SD5, DTCG 1.0, 3-tier) | JSON / CSS |
| Recipes | CSS appearance rules | CSS classes |
| Primitives | ColdLight-owned ARIA + behavior | Svelte 5 |
| Semantics | Primitive + Recipe = Styled | Svelte 5 |
| Blueprints | Prebuilt assembly | TypeScript |
| Patterns | Guidance | Docs only |
| Blocks | VPB payload | JSON runtime |

---

## Provider Model

```
SD5 Tokens → CSS Custom Properties → Tailwind v4 @theme → ColdLight Primitive (owns ARIA)
```

- **ColdLight owns**: `role`, `aria-*`, `tabindex`, focus, keyboard, `data-kind`, `data-slot`, `data-state`, `class`
- **dsAdapter (Melt UI)**: EXCEPTION ONLY — for complex widgets where native ARIA is impractical
- **Primitives use**: Native HTML + Svelte 5 runes + WAI-ARIA APG patterns

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

**Token Pipeline + Primitives (SD5-driven, ColdLight-owned)**

See: `primitives/WORKFLOW.md` for development process
See: `.claude/MASTER_SPRINT_PLAN.md` for sprint order

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

- `catalog/` — SSOT backbone
- `primitives/` — Behavior components
- `recipes/` — CSS appearance
- `semantics/` — Styled components
- `sys/api/_internal/` — Provider mapping
