# Blocks

> Layer 6: Page-Level Compositions

---

## Definition

Blocks are complete page sections ready for visual page builder (VPB).

```svelte
<!-- Block = Full page section -->
<HeroGlass>
  <slot name="headline">Welcome to DevPulse</slot>
  <slot name="cta"><Button>Get Started</Button></slot>
  <slot name="visual"><ParticleBackground /></slot>
</HeroGlass>
```

---

## Categories

| Category | Description | Status |
|----------|-------------|--------|
| [heroes/](./heroes/) | Hero sections | Pending |
| [features/](./features/) | Feature grids | Pending |
| [dashboards/](./dashboards/) | Dashboard layouts | Pending |
| [chat/](./chat/) | Chat interfaces | Pending |
| [cta/](./cta/) | Call-to-action sections | Pending |
| [carousels/](./carousels/) | Carousel/slider sections | Pending |
| [navigation/](./navigation/) | Navigation sections | Pending |

---

## Checklist

### Before Adding a Block

- [ ] Verify block kind exists in `taxonomy/kinds.ts`
- [ ] Verify slots defined for kind
- [ ] Verify required patterns/semantics exist
- [ ] Determine correct category folder
- [ ] Create preset in `recipes/presets/`

### File Requirements

- [ ] `{Name}.svelte` — Block component (PascalCase)
- [ ] `{name}.preset.ts` — Default preset
- [ ] Category `index.ts` updated with export
- [ ] Root `index.ts` updated if new category
- [ ] Follows block kind contract from taxonomy
- [ ] VPB-editable props documented

### Auto-Documentation

When block is committed:
1. Vite plugin scans `blocks/**/*.svelte`
2. Extracts `@description`, `@kind`, `@slots`, `@vpb-editable`
3. Registers block in VPB block picker
4. Updates category README with block list
5. Updates root README with category stats

---

## SSOT

This folder's SSOT is `blocks/index.ts`.

All imports should go through:
```typescript
import { HeroGlass, FeatureGrid } from "$lib/design/blocks";
// Or by category:
import * as Heroes from "$lib/design/blocks/heroes";
```

---

## Block Kind Mapping

| Category | Block Kinds |
|----------|-------------|
| heroes | `panel`, `glassFrame` |
| features | `card`, `widget` |
| dashboards | `widget`, `statMeter`, `chart` |
| chat | `chatDock`, `chatThread`, `chatBubble` |
| cta | `panel`, `card` |
| carousels | `panel`, `card` |
| navigation | `topBar`, `sideNav` |

---

## Adding a New Block

1. Identify category (heroes, features, dashboards, etc.)
2. Verify block kind in `taxonomy/kinds.ts`
3. Create preset: `recipes/presets/{category}/{name}.preset.ts`
4. Create file: `{category}/{Name}.svelte`
5. Add file header with `@description`, `@kind`, `@slots`, `@vpb-editable`
6. Export from category `index.ts`
7. Export from root `index.ts`
8. Run `pnpm check` to verify types
9. Commit when passing

---

**This folder contains Layer 6 of ColdLight.**
