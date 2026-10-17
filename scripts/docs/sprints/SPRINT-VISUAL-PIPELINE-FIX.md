# SPRINT: Visual Pipeline Fix

**Status**: PLANNED — awaiting owner approval
**Research**: [SPRINT-VISUAL-PIPELINE-FIX.research.md](SPRINT-VISUAL-PIPELINE-FIX.research.md)
**Goal**: Make every component, block, and widget render with ColdLight visual treatment per reference images
**References**: `interfaces/desktop/src/lib/design/REFERENCES/`

---

## Prerequisites
- [x] CSS audit complete (3968 vars mapped)
- [x] Root causes identified (5 found)
- [x] Reference images reviewed
- [x] StyleMacro mechanism understood

---

## Phase 1: Stop the Bleeding (delete broken code)

### STOP — Owner Decision Required
**Question**: Delete `generated/variants.css` entirely? This removes the v-* encoding system. 63 @utility rules, used by 7 files (26+ lines). StyleMacro replaces it.
**Options**:
  A. Delete variants.css + all v-* usage in markup
  B. Keep variants.css as internal StyleMacro infrastructure only (remove from markup)
  C. Keep v-* system alongside StyleMacro (NOT recommended — competing systems)
**Impact**: Every file using v-* classes will need its styling migrated to StyleMacro + intent props.

- [ ] 1.1 Remove glow composite lines from aliases.css (lines 25-31 overwrite SD5 output)
- [ ] 1.2 Remove bevel composite lines from aliases.css (if present — SD5 may emit shorthands)
- [ ] 1.3 Delete or isolate variants.css (per owner decision above)
- [ ] 1.4 Remove all v-* class usage from these files:
  - `src/lib/layouts/app/BootOverlay.svelte` (2 instances)
  - `src/lib/layouts/app/Sidebar.svelte` (1 instance)
  - `src/lib/layouts/app/TopBar.svelte` (1 instance)
  - `src/routes/(app)/devpulse/+page.svelte` (10 instances)
  - `src/stories/shards/Button.stories.svelte` (12 instances)
- [ ] 1.5 Remove hardcoded inline style colors from devpulse dashboard (3 instances)
- [ ] 1.6 Compile check: `pnpm svelte-check`

**Checkpoint**: Owner reviews. Phase 2 does not start without go-ahead.

---

## Phase 2: Build Intent Resolver (ONE file)

- [ ] 2.1 Create intent resolver in `styles/intent-map.ts`:
  ```ts
  /** Intent→visual preset mapping. ONE file. ONE map. Per-project configurable. */
  export const INTENT_MAP: Record<string, string> = {
    primary: "glass",
    secondary: "matte",
    ghost: "flat",
    danger: "stark",
    default: "default",
  };

  export function resolveStyleId(kind: string, intent: string): string {
    const visual = INTENT_MAP[intent] ?? INTENT_MAP.default;
    return `${kind}-${visual}`;
  }
  ```

### STOP — Owner Decision Required
**Question**: Where does the resolver live?
**Options**:
  A. New file `styles/intent-map.ts` — imported by each component (explicit)
  B. Inside `StyleMacro.svelte` — accepts `intent` prop, resolves internally (implicit)
  C. In `styles/index.ts` barrel — exported alongside StyleMacro (colocated)
**Impact**: Option A = each component calls `resolveStyleId()`. Option B = components pass `intent` to StyleMacro instead of `style`. Option C = same as A but less import noise.

- [ ] 2.2 Wire resolver into StyleMacro (or components, per decision above)
- [ ] 2.3 Update Button.svelte to use resolver:
  ```svelte
  const styleId = $derived(resolveStyleId("button", intent));
  ```
- [ ] 2.4 Verify Button renders with glass preset when intent="primary"
- [ ] 2.5 Compile check

**Checkpoint**: Owner reviews Button rendering. Confirms visual matches reference.

---

## Phase 3: Wire StyleMacro Into Blocks + Widgets

### Dashboard blocks (devpulse/+page.svelte):
- [ ] 3.1 Widget.svelte — wrap in StyleMacro, remove v-* class prop pattern
  - kind="widget", intent from prop (default="default")
  - Replaces: `class="v-s3 v-d2 v-b2 v-g1 v-f2"`
- [ ] 3.2 Verify Widget renders with glass depth, bevel, glow per DASHBOARD-REFERENCE-01

### Chat blocks (chat/+page.svelte):
- [ ] 3.3 ThreadList.svelte — wrap in StyleMacro
  - kind="sidebar", intent="default"
  - Replace hardcoded `bg-[var(--glass-deep)]` etc. with preset
- [ ] 3.4 ChatPanel.svelte — verify Card delegation works via StyleMacro
- [ ] 3.5 Verify chat renders with glass panels per CHAT-REFERENCE-01/02

### Layout components:
- [ ] 3.6 Frame.svelte — verify border vars resolve (--border-soft, --border-subtle via aliases)
- [ ] 3.7 Sidebar.svelte — remove v-* classes, use StyleMacro or direct preset
- [ ] 3.8 TopBar.svelte — remove v-* classes
- [ ] 3.9 BootOverlay.svelte — remove v-* classes

- [ ] 3.10 Compile check
- [ ] 3.11 Visual verification against reference images

**Checkpoint**: Owner reviews dashboard + chat rendering.

---

## Phase 4: Complete Presets (if needed)

### STOP — Owner Decision Required
**Question**: Should presets include ALL 15 properties, or is it correct for animation/transition/font-* to be unset (inherit)?
**Options**:
  A. Add animation, transition, font-* to ALL presets in DTCG source — every element gets explicit values
  B. Keep current 8 properties — animation/transition/font inherit from parent — components add typography via Tailwind classes
  C. Add transition + font-family only (the most visually impactful missing ones) — leave animation/gradient for explicit use
**Impact**: Option A = larger CSS output but fully explicit. Option B = smaller but relies on inheritance. Option C = pragmatic middle ground.

- [ ] 4.1 Author missing preset properties in style-presets.json (per decision)
- [ ] 4.2 Run `pnpm ds:tokens:build`
- [ ] 4.3 Verify no new empty vars in debug overlay
- [ ] 4.4 Final compile check

---

## Phase 5: Store Learnings

- [ ] 5.1 Store decisions made during this sprint to SurrealDB
- [ ] 5.2 Store rejections to SurrealDB
- [ ] 5.3 Update memory files
- [ ] 5.4 Run `/gate`

---

## Files Modified (Expected)

| File | Change |
|------|--------|
| `generated/aliases.css` | Remove broken glow/bevel overrides |
| `generated/variants.css` | Delete or isolate (per Phase 1 decision) |
| `styles/intent-map.ts` | NEW — intent resolver |
| `styles/StyleMacro.svelte` | Maybe — if resolver lives here |
| `styles/index.ts` | Export resolver |
| `components/button/Button.svelte` | Use resolver |
| `blocks/widgets/Widget.svelte` | Wire StyleMacro |
| `blocks/chat/ThreadList.svelte` | Wire StyleMacro |
| `layouts/app/Sidebar.svelte` | Remove v-* |
| `layouts/app/TopBar.svelte` | Remove v-* |
| `layouts/app/BootOverlay.svelte` | Remove v-* |
| `routes/(app)/devpulse/+page.svelte` | Remove v-*, use component intents |

## Files NOT Modified
- `sd.config.mjs` — no changes
- `styles/primitives/*.css` — SD5 output, untouched
- `styles/semantic/*.css` — SD5 output, untouched
- `theme/*.css` — SD5 output, untouched
- DTCG source files — only if Phase 4 is approved
