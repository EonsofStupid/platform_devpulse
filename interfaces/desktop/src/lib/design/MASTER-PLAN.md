# COLD LIGHT Design System - Registry-First Architecture

---

## ⚠️ TECHNOLOGY STACK (READ FIRST)

**SvelteKit 5 + Bits UI + Tailwind CSS. NOTHING ELSE.**

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | SvelteKit 5 | App framework, routing, SSR |
| **Behavior** | Bits UI | Headless primitives (accessibility, keyboard, focus) |
| **Styling** | Tailwind CSS | Utility classes, JIT compilation |
| **Values** | tokens.ts → CSS | SSOT for colors, spacing, shadows |
| **Composition** | VPB | Selects enums + recipes, outputs BlockNodes |

**BANNED:**
- ❌ Framework-agnostic abstractions
- ❌ Custom headless primitive implementations
- ❌ CSS-in-JS libraries
- ❌ Any other UI framework

**This is NOT a portable design system. This is DevPulse's design system built on SvelteKit 5.**

---

## CORE PRINCIPLES (Non-Violable)

1. **One Theme Identity** - ColdLight/Maestro is the brand. Variants (dark/light) swap values, not structure.
2. **Variants change VALUES only** - Never change token NAMES across variants.
3. **BlockNodes never store theme values** - No colors, no CSS vars, no classnames in BlockNode.props.
4. **Separation of Concerns** - Theme system (tokens) is independent of Layout system (blocks).

---

## MENTAL MODEL (Correct Understanding)

You are NOT building "components."

You are building:
- **Block System** - VPB composes blocks
- **Recipe System** - Variants mapped to tokens
- **Token System** - Root-scoped, semantic tokens only
- **Contract System** - Typed props + schema validation

```
VPB assembles: Block(kind + recipe + props + slots + children)
Renderer does: resolve recipe → Tailwind classes → render Svelte component
```

---

## HARD RULES (Non-Negotiable)

### Rule A — Tokens are global only
- Tokens live in `tokens.css` and theme maps only
- NO component-scoped CSS variables
- NO `--dp-panel--vpb-panel` chains ever

### Rule B — Props cannot contain colors or CSS
- Props use enums / token keys only
- NO `#fff`, NO `oklch()`, NO raw CSS strings

### Rule C — Recipes are the only place styling decisions happen
- Components do NOT "style themselves"
- Components only apply recipe class strings

### Rule D — No .svelte renderer without registry entries
- **Scope:** This rule applies ONLY to `src/lib/design/renderers/*.svelte`
- If a renderer isn't registered in taxonomy and VPB schema, it doesn't exist
- Contract + Recipe + Taxonomy + VPB Schema MUST exist first
- **Not affected:** Normal app components in `src/routes/`, `src/lib/sys/`, etc. are exempt

### Rule E — CSS Grid for Shell/Dashboard layout
- Shell kinds (`appShell`, `topBar`, `sideNav`, `statusBar`, `dock`) MUST use CSS Grid
- Dashboard/panel composition MUST use CSS Grid, not flexbox
- `layoutMode: "grid"` is a taxonomy constraint for shell kinds
- Flexbox allowed ONLY for inline content (buttons in a row, icon + text, etc.)

### Rule F — svelte-sonner is the only toast library
- All notifications go through `src/lib/domains/notify/` wrapper
- Root `+layout.svelte` includes `<Toaster />` from svelte-sonner
- Ban: toastify, svelte-toast, native alerts, console messages for user feedback
- **Tauri integration is OPTIONAL:**
  - Detect Tauri at runtime: `typeof window.__TAURI__ !== 'undefined'`
  - If Tauri available AND app is minimized → trigger OS notification
  - If web-only build → fall back to sonner only (no errors)
  - Notify wrapper MUST work in both environments

### Rule G — Single CSS Entry Point
- `app.css` imports ONE design system file: `./lib/design/index.css`
- `index.css` is the SSOT barrel that imports in correct order:
  1. `tokens/tokens.css`
  2. `recipes/css/keyframes.css`
  3. `recipes/css/surfaces.gen.css`
- NO direct imports of design system CSS files in `app.css`
- This ensures load order is controlled in one place

```css
/* app.css - CORRECT */
@import "./lib/design/index.css";

/* app.css - WRONG */
@import "./lib/design/tokens/tokens.css";
@import "./lib/design/recipes/css/keyframes.css";
@import "./lib/design/recipes/css/surfaces.gen.css";
```

### Rule H — Technology Stack (NON-NEGOTIABLE)
- **SvelteKit 5** = Framework (routing, SSR, stores)
- **Bits UI** = Behavior foundation (headless primitives)
- **Tailwind CSS** = Styling engine (JIT utilities)
- **tokens.ts** = Values SSOT (colors, spacing, shadows)
- **VPB** = Composition tool (selects enums + recipes)

**BANNED PATTERNS:**
- ❌ "Framework-agnostic" abstractions
- ❌ Custom accessibility implementations (use Bits UI)
- ❌ Reinventing headless primitives
- ❌ CSS-in-JS solutions
- ❌ Any UI framework other than Bits UI

---

## PRIMITIVES vs COMPONENTS (Critical Distinction)

### What goes in `primitives/`
- **Bits UI wrappers ONLY**
- Thin wrappers that expose Bits UI behavior with our API
- NO styling logic inside primitives
- Examples: `Button.svelte`, `Dialog.svelte`, `Tabs.svelte`, `Toggle.svelte`

### What goes in `components/`
- **Semantic styled compositions**
- Uses primitives + applies recipes
- Examples: `GlassButton` (uses `Button` primitive + `button.glass` recipe)

### What goes in `renderers/`
- **VPB block renderers**
- Receives `{ recipe, props, slots }` from VPB
- Subject to 6-stage gate

### Classification Table
| Name | Location | Why |
|------|----------|-----|
| `Button` | `primitives/` | Bits UI wrapper |
| `Dialog` | `primitives/` | Bits UI wrapper |
| `GlassButton` | `components/` | Styled composition |
| `GlassCard` | `components/` | Surface + recipe |
| `Panel.svelte` | `renderers/` | VPB block renderer |

### "Glass" is a RECIPE, not a primitive
- ❌ WRONG: `primitives/GlassButton.svelte`
- ✅ RIGHT: `components/GlassButton.svelte` using `button.glass` recipe
- ✅ RIGHT: Recipe CSS in `recipes/css/surfaces.gen.css`

---

## THE 4 REGISTRIES (SSOT)

### 1) TOKENS (values) — SSOT-First Generation
```
src/lib/design/tokens/
├── tokens.ts           # ✅ SSOT — canonical token definitions (NEW)
├── tokens.css          # ✅ GENERATED from tokens.ts
├── types.ts            # ✅ GENERATED types from tokens.ts
├── schema.ts           # Zod validators (EXISTS)
├── tailwind.preset.ts  # ✅ GENERATED Tailwind theme mapping (optional)
└── generate.ts         # Generator script (NEW)
```

**Token Pipeline Commands:**
```bash
pnpm ds:tokens:build    # One-shot generation
pnpm ds:tokens:watch    # Watch mode during dev
```

**Flow:** `tokens.ts` → generator → `tokens.css` + `types.ts` + `tailwind.preset.ts`
**Rule:** tokens.css is NEVER hand-edited. Generator is the only source.
**Migration:** Reverse-engineer existing tokens.css (~270 lines) into tokens.ts as SSOT.
Root-scoped variables. Theme swaps values only.

**Token Value Format (OKLCH):**
Store raw OKLCH channels for maximum composability:
```typescript
// In tokens.ts — store channels separately for alpha manipulation
export const tokens = {
  glass: {
    void: { l: 0.06, c: 0.02, h: 195 },      // Channels only
    deep: { l: 0.08, c: 0.025, h: 200 },
  },
  // Generator produces:
  // --dp-glass-void: oklch(6% 0.02 195);
  // --dp-glass-void-rgb: 6% 0.02 195;  // For alpha variants
} as const;

// Usage in CSS: oklch(var(--dp-glass-void-rgb) / 0.8)
```
This enables runtime alpha manipulation without regenerating tokens.

### 2) TAXONOMY (what exists + constraints)
```
src/lib/design/taxonomy/
├── index.ts            # DesignCategories (EXISTS, NEEDS EXPANSION)
├── kinds.ts            # Block kind definitions (NEW)
├── contracts.ts        # Prop schemas per kind (NEW)
└── slots.ts            # Allowed slots + child constraints (NEW)
```
Defines legal block kinds, allowed slots, allowed recipes, prop schemas.

### 3) RECIPES (how it looks + what actions it needs)
```
src/lib/design/recipes/
├── index.ts            # Recipe registry (NEW)
├── surface.recipe.ts   # DsSurfaceProps → Tailwind classes (NEW)
├── panel.recipe.ts     # Panel-specific variants (NEW)
├── shell.recipe.ts     # Shell 5-layer variants (NEW)
├── chat.recipe.ts      # Chat dock variants (NEW)
└── actions/            # Svelte actions for recipes (NEW)
    ├── index.ts        # Action registry
    ├── glowTrack.ts    # Mouse glow tracking action
    └── ripple.ts       # Ripple effect action
```
Variant matrix → Tailwind classes. Recipes consume tokens.

**Recipe Metadata (REQUIRED):**
```typescript
interface RecipeDefinition {
  id: RecipeId;
  classes: (props: Props) => Record<SlotName, string>;
  requires?: ActionId[];  // e.g., ["glowTrack", "ripple"]
}

// Example:
"panel.glass.glow": {
  classes: (props) => ({ root: "bg-dp-glass-deep backdrop-blur-md ..." }),
  requires: ["glowTrack"]  // Renderer auto-attaches this action
}
```

**Action Composition Mechanism:**
Renderers use `use:applyRecipeActions` to auto-attach required actions:
```typescript
// src/lib/design/recipes/actions/index.ts
import { glowTrack } from './glowTrack';
import { ripple } from './ripple';

const actionRegistry = {
  glowTrack,
  ripple,
} as const;

export type ActionId = keyof typeof actionRegistry;

// Svelte action that composes multiple actions from recipe.requires
export function applyRecipeActions(node: HTMLElement, recipe: RecipeDefinition) {
  const cleanups: (() => void)[] = [];

  for (const actionId of recipe.requires ?? []) {
    const action = actionRegistry[actionId];
    if (action) {
      const result = action(node);
      if (result?.destroy) cleanups.push(result.destroy);
    }
  }

  return {
    destroy() {
      cleanups.forEach(fn => fn());
    }
  };
}
```

**Renderer Usage:**
```svelte
<script>
  import { applyRecipeActions } from '$lib/design/recipes/actions';
  import { recipeRegistry } from '$lib/design/recipes';

  let { recipe: recipeId, props, slots } = $props();
  $: recipeDefinition = recipeRegistry[recipeId];
  $: classes = recipeDefinition.classes(props);
</script>

<div class={classes.root} use:applyRecipeActions={recipeDefinition}>
  <!-- slots -->
</div>
```

**Rule:** If a recipe declares `requires`, the renderer MUST attach those actions. No manual JS effects.

### 4) VPB BLOCKS (how it composes)
```
src/lib/sys/debug/vpb/
├── shell/                          # VPB chrome (EXISTS)
│   ├── frame.svelte
│   ├── tabs.svelte
│   ├── toolbar.svelte
│   └── topbar.svelte
├── components/
│   ├── builder/                    # Block definitions (EXISTS, NEEDS REFACTOR)
│   │   ├── palette.ts              # VPB palette items
│   │   ├── defaults.ts             # Default recipe + props per kind
│   │   └── schema.ts               # BlockNode type
│   └── inspector/                  # Property inspector (EXISTS)
│       └── inspector.ts
├── state/                          # VPB state management (EXISTS)
│   └── state.ts
└── types/                          # VPB types (EXISTS)
```
VPB uses taxonomy to offer only legal blocks/recipes/props.

---

## THE 6-STAGE GATE (Enforcement Checklist)

Before ANY .svelte file can be created:

### ✅ Stage 0 — Naming + Intent
- [ ] Kind name exists: `panel`, `widget`, `chatDock`, etc.
- [ ] Purpose is documented in one sentence
- [ ] Slots are defined (`root`, `header`, `body`, etc.)

### ✅ Stage 1 — Token Check
- [ ] Uses existing semantic tokens
- [ ] If new visuals required: add token keys to `tokens.ts` (SSOT), NEVER types.ts
- [ ] Run generator → updates `tokens.css` + `types.ts` + `tailwind.preset.ts`
- [ ] NO component-specific token names allowed

### ✅ Stage 2 — Taxonomy Contract
- [ ] Add kind to `taxonomy/kinds.ts`
- [ ] Define allowed recipes list
- [ ] Define props schema (`BaseSurfaceProps` + specifics)
- [ ] Define allowed child kinds per slot (composition constraints)

### ✅ Stage 3 — Recipe Authoring
- [ ] Add recipe id(s) to `recipes/index.ts`
- [ ] Map variants → Tailwind classes (token-backed only)
- [ ] Recipes reference only allowed tokens / utilities

### ✅ Stage 4 — VPB Registration
- [ ] Add block to VPB palette
- [ ] Add default recipe + default props
- [ ] Add property UI config (enums only)

### ✅ Stage 5 — Implementation Permission Granted
Only now:
- [ ] Create `.svelte` renderer component
- [ ] Component receives `{ recipe, props, slots }`
- [ ] Component does NOT implement theming. Ever.

### ✅ Stage 6 — CI Enforcement
- [ ] Build fails if a recipe id is referenced but not defined
- [ ] Build fails if `.svelte` contains `--*` custom vars
- [ ] Build fails if Tailwind arbitrary values appear (`bg-[#]`, `text-[`)

**If any checkbox fails: STOP. Fix registry first.**

---

## BASE SURFACE CONTRACT (DsSurfaceProps)

Every "surface" (shell frame, panel, chat window, widget container) implements this base:

```typescript
export interface DsSurfaceProps {
  color: {
    mode: "mono" | "duo";
    a: DsTokenColor;
    b?: DsTokenColor;
    blend?: {
      type: "none" | "dissipate";
      direction: DsBlendDirection;
      softness: DsBlendSoftness;
      bias: DsBlendBias;
      strength: DsStrength;
    };
  };
  surface: {
    finish: DsSurfaceFinish;
    texture?: DsTextureType;
    clarity?: DsGlassClarity;
  };
  frame: {
    mode: DsFrameMode;
    width: DsFrameWidth;
    treatment: DsFrameTreatment;
    glow: DsGlow;
  };
  depth: {
    intent: DsDepthIntent;
    bevel: {
      level: DsBevelLevel;
      style: DsBevelStyle;
    };
  };
  fx?: {
    rimLight?: DsRimLight;
    innerGlow?: DsStrength;
    sparkle?: DsSparkle;
    noiseOverlay?: DsNoiseOverlay;
  };
  motion?: {
    idle?: DsIdleMotion;
    hover?: DsHoverMotion;
    press?: DsPressMotion;
    focus?: DsFocusMotion;
  };
  slots?: Partial<Record<DsSlotName, DsSlotConfig>>;
}
```

---

## COMPONENT CONTRACTS (Base + Specifics)

Every real component's props are: `BaseSurfaceProps + ComponentSpecificProps`

### Chat Panel
```typescript
interface ChatPanelProps extends DsSurfaceProps {
  dock: {
    side: "left" | "right" | "floating";
    state: "open" | "minimized" | "closed";
  };
  header: {
    mode: "compact" | "full";
  };
  presence: "offline" | "active" | "busy";
}
```

### Dashboard Widget
```typescript
interface WidgetProps extends DsSurfaceProps {
  widget: {
    type: "chart" | "stat" | "list" | "meter";
    title: string;
    intent: "neutral" | "info" | "warn" | "critical";
  };
  data: {
    binding: "static" | "queryRef";
  };
}
```

### Shell / Chrome
```typescript
interface ShellProps extends DsSurfaceProps {
  chrome: {
    level: "appShell" | "panel" | "overlay";
    insetGrid: "on" | "off";
    safeArea: "on" | "off";
  };
}
```

---

## VPB BLOCK SCHEMA

What VPB stores. Period.

```typescript
// Strict per-kind typing (NOT unknown)
type BlockNode<K extends BlockKind = BlockKind> = {
  id: string;
  kind: K;
  recipe: AllowedRecipe<K>;      // Only recipes legal for this kind
  props: KindProps<K>;           // Typed per-kind, NOT unknown
  slots?: Record<SlotName<K>, BlockNode[]>;  // Only legal slots for kind
  binds?: Record<string, string>;
}

// Type helpers
type AllowedRecipe<K extends BlockKind> = KindRegistry[K]["recipes"][number];
type KindProps<K extends BlockKind> = KindRegistry[K]["props"];
type SlotName<K extends BlockKind> = KindRegistry[K]["slots"][number];

// Runtime validation
function validateBlock<K extends BlockKind>(node: BlockNode<K>): boolean {
  const contract = KindRegistry[node.kind];
  return contract.schema.safeParse(node.props).success;
}
```

**VPB never stores:**
- classNames
- CSS
- custom vars

Only contract-bound, schema-validated props.

---

## DATABASE SCHEMA (Theme + Layout Storage)

### Theme System (Token Value Maps)
```sql
-- Theme identity (one per brand)
CREATE TABLE ds_theme (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,  -- "ColdLight", "Maestro"
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Versioned theme (draft/published workflow)
CREATE TABLE ds_theme_version (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id UUID NOT NULL REFERENCES ds_theme(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_theme_version_theme ON ds_theme_version(theme_id);
CREATE INDEX idx_theme_version_status ON ds_theme_version(status);

-- Variants within a theme version
CREATE TABLE ds_theme_variant (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_version_id UUID NOT NULL REFERENCES ds_theme_version(id) ON DELETE CASCADE,
  key TEXT NOT NULL,  -- "dark" | "light" | "contrast"
  label TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  UNIQUE (theme_version_id, key)  -- One variant per key per version
);
CREATE INDEX idx_theme_variant_version ON ds_theme_variant(theme_version_id);

-- Token values per variant (JSONB)
CREATE TABLE ds_theme_tokens (
  variant_id UUID PRIMARY KEY REFERENCES ds_theme_variant(id) ON DELETE CASCADE,
  tokens_json JSONB NOT NULL
  -- Example: { "--dp-glass-void": "oklch(6% 0.02 195 / 0.92)", ... }
);
```

### Layout System (VPB Output)
```sql
-- Layout scope (module/route)
CREATE TABLE ds_layout (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL,  -- "dashboard", "chat", "settings"
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (scope, name)  -- One layout per scope+name combo
);
CREATE INDEX idx_layout_scope ON ds_layout(scope);

-- Versioned layout
CREATE TABLE ds_layout_version (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layout_id UUID NOT NULL REFERENCES ds_layout(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_layout_version_layout ON ds_layout_version(layout_id);
CREATE INDEX idx_layout_version_status ON ds_layout_version(status);

-- Block tree (JSONB for v1)
CREATE TABLE ds_block_tree (
  layout_version_id UUID PRIMARY KEY REFERENCES ds_layout_version(id) ON DELETE CASCADE,
  tree_json JSONB NOT NULL
  -- BlockNode[] structure, NO theme values
);
```

### Scope-Theme Binding
```sql
CREATE TABLE ds_scope_theme_binding (
  scope_key TEXT PRIMARY KEY,  -- route/module
  theme_version_id UUID NOT NULL REFERENCES ds_theme_version(id) ON DELETE RESTRICT,
  default_variant_key TEXT NOT NULL,  -- "dark"
  allow_preview_variants BOOLEAN DEFAULT true
);
CREATE INDEX idx_scope_binding_theme ON ds_scope_theme_binding(theme_version_id);
```

### Critical DB Rules
1. ✅ `ds_theme_tokens` stores VALUES mapped to token NAMES
2. ✅ `ds_block_tree` stores BlockNode structure with recipe refs
3. ❌ `ds_block_tree` NEVER contains color values, CSS vars, or classnames
4. ❌ Variants NEVER define new token names (only swap values)

### Runtime Validation on Load
```typescript
// When loading BlockNode trees from DB, ALWAYS validate:
async function loadLayoutTree(layoutVersionId: string): Promise<BlockNode[]> {
  const { tree_json } = await db.ds_block_tree.findUnique({ layout_version_id: layoutVersionId });

  // Runtime validation — reject or migrate invalid nodes
  const validated = validateBlockTree(tree_json);
  if (!validated.success) {
    console.error('Invalid block tree from DB:', validated.errors);
    // Option 1: Throw and show error UI
    // Option 2: Auto-migrate to valid schema
    throw new BlockTreeValidationError(validated.errors);
  }

  return validated.data;
}

function validateBlockTree(tree: unknown): ValidationResult<BlockNode[]> {
  // Use Zod schema from taxonomy/contracts
  return BlockNodeArraySchema.safeParse(tree);
}
```
DB returns untyped JSON — runtime validation catches drift before it breaks the UI.

---

## BLOCK KINDS (Required)

### Shell / OS Chrome
- `appShell`
- `topBar`
- `sideNav`
- `statusBar`
- `dock`

### Surfaces
- `panel`
- `card`
- `modal`
- `glassFrame`
- `inputFrame`

### Data Widgets
- `widget`
- `statMeter`
- `chart`
- `timeline`
- `graphNetwork`

### Chat
- `chatDock`
- `chatThread`
- `chatBubble`
- `chatAttachment`

---

## FILE STRUCTURE (Target)

### Architecture Pattern: Layouts vs Domains (Hypermodular)
- **Layouts** (`src/lib/layouts/`) = Dumb structure. Where things render. No logic.
- **Domains** (`src/lib/domains/`) = Hypermodular logic. Runes trickle downward.
- **Separation:** Layout files receive props from domains. Domains own state + behavior.
- **Services:** Feature-local first (`src/lib/sys/debug/vpb/services/`), shared only when clearly needed.
- **No premature abstractions:** Common/shared patterns emerge after building, not before.

```
src/lib/design/
├── index.css               # ✅ SSOT CSS entry point (imports in order)
├── index.ts                # TS barrel export
├── README.md               # Quick reference + links
├── CHECKLIST.md            # Pre/post-code checklists
├── tokens/
│   ├── tokens.ts           # ✅ SSOT — canonical definitions
│   ├── tokens.css          # ✅ GENERATED from tokens.ts
│   ├── types.ts            # ✅ GENERATED types from tokens.ts
│   ├── schema.ts           # Zod validators (EXISTS ✅)
│   └── tailwind.preset.ts  # ✅ GENERATED Tailwind mapping
├── taxonomy/
│   ├── index.ts            # DesignCategories (EXISTS ✅)
│   ├── kinds.ts            # Block kinds + constraints
│   ├── contracts.ts        # Prop schemas per kind
│   └── slots.ts            # Slot definitions
├── recipes/
│   ├── index.ts            # Recipe registry
│   ├── css/                # Generated recipe CSS
│   │   ├── keyframes.css   # Animation keyframes
│   │   └── surfaces.gen.css # Surface recipes (GENERATED)
│   └── actions/            # Svelte actions
│       ├── index.ts        # Action registry
│       ├── glowTrack.ts    # Mouse glow tracking
│       └── ripple.ts       # Ripple effect
├── primitives/             # Bits UI wrappers ONLY
│   ├── Button.svelte       # Bits UI Button wrapper
│   ├── Dialog.svelte       # Bits UI Dialog wrapper
│   ├── Tabs.svelte         # Bits UI Tabs wrapper
│   └── Toggle.svelte       # Bits UI Toggle wrapper
├── components/             # Styled compositions (use primitives + recipes)
│   ├── GlassButton.svelte  # Button primitive + button.glass recipe
│   ├── GlassCard.svelte    # Surface + card.glass recipe
│   └── GlassInput.svelte   # Input primitive + input.glass recipe
└── renderers/              # VPB block renderers (LAST, after registries)
    ├── Panel.svelte
    ├── Shell.svelte
    ├── Widget.svelte
    └── ChatDock.svelte

src/lib/sys/debug/vpb/          # VPB Dev Tool (EXISTS, NEEDS REFACTOR)
├── shell/                      # VPB chrome
│   ├── frame.svelte
│   ├── tabs.svelte
│   ├── toolbar.svelte
│   └── topbar.svelte
├── components/
│   ├── builder/                # Block definitions (REFACTOR to consume registries)
│   │   ├── palette.ts
│   │   ├── defaults.ts
│   │   └── schema.ts
│   └── inspector/
│       └── inspector.ts
├── state/
│   └── state.ts
└── types/

src/lib/layouts/                # Dumb layouts (structure only, no logic)
├── app/                        # App shell structure
└── chat/                       # Chat shell structure

src/lib/domains/                # Domain modules (hypermodular, runes trickle down)
├── app/                        # App domain logic
├── chat/                       # Chat domain logic
├── maestro/                    # AI control UI domain (layman UI for platform AI)
└── notify/                     # Notification domain (NEW)
    ├── index.ts                # Toast wrapper + Tauri OS notification
    └── types.ts                # Notification types

src/lib/sys/services/               # Feature-specific services only (hypermodular)
├── theme.service.ts                # Load/save theme variants (Phase 7)
├── layout.service.ts               # Load/save BlockNode trees (Phase 7)
└── types.ts                        # Service types
# NOTE: Services go feature-local when possible
# e.g., src/lib/sys/debug/vpb/services/ for VPB-specific services
# No premature "common/shared" abstractions - hypermodular first

src/scripts/dev/design/         # Design system scripts
├── ds-tokens-build.ts          # Token generator (pnpm ds:tokens:build)
├── ds-tokens-watch.ts          # Token watcher (pnpm ds:tokens:watch)
├── verify-kinds.ts             # CI: kinds have contracts
├── verify-recipes.ts           # CI: recipes are registered
├── verify-tokens-sync.ts       # CI: tokens.ts → generated match
└── scan-violations.ts          # CI: violation scanner (THE KILL SWITCH)

supabase/migrations/
├── YYYYMMDD_create_ds_theme.sql
├── YYYYMMDD_create_ds_layout.sql
└── YYYYMMDD_create_ds_scope_binding.sql
```

---

## CI ENFORCEMENT RULES

**Scope:** These rules apply ONLY to `src/lib/design/renderers/*.svelte` files.
Other app .svelte files are NOT subject to the 6-stage gate.

Build fails if:
1. Any renderer `.svelte` file contains `--dp-` or `--ds-` CSS vars
2. Any renderer `.svelte` file contains Tailwind arbitrary values — **ANY `[...]` pattern**
   - Ban: `class=".*\[.*\]"` (catches `bg-[#fff]`, `text-[12px]`, etc.)
   - Ban: `style=` inline on components (except allowlisted)
3. Any block JSON references a recipe that doesn't exist
4. Any block kind uses props not in its schema
5. Any raw color value appears in class strings (`#`, `oklch`, `rgb`, `hsl`)
6. Any renderer contains disallowed event handlers (see Event Handler Rules below)

**Event Handler Rules:**
- ✅ ALLOWED always: `onclick`, `onsubmit`, `onkeydown`, `onfocus`, `onblur`, `oninput`, `onchange`
- ❌ BANNED unless in recipe `requires`: `onmousemove`, `onmouseenter`, `onmouseleave`, `onpointerdown`, `ontouchmove`
- Rationale: Interactive effects (glow tracking, ripples) MUST be declared in recipe metadata

**Tailwind Content Config (REQUIRED):**
```javascript
// tailwind.config.js content array MUST include:
content: [
  "./src/**/*.{html,js,svelte,ts}",
  "./src/lib/design/recipes/**/*.ts",  // ← CRITICAL: JIT scans recipe files
]
```
Without recipe files in content, Tailwind JIT won't generate classes referenced by recipes.

**Tailwind Preset Enforcement:**
- `tailwind.preset.ts` maps tokens → Tailwind theme
- All color/radius/shadow/spacing classes MUST come from preset
- Preset is generated from `tokens.ts` — not hand-edited
- CI validates: preset exports match `tokens.ts` exports

**Preset Grid Utilities (Required for Shell):**
The preset MUST define shell-specific grid utilities:
```typescript
// In tailwind.preset.ts
extend: {
  gridTemplateColumns: {
    'shell': '1fr',
    'shell-nav': 'auto 1fr',
    'shell-nav-aside': 'auto 1fr auto',
  },
  gridTemplateRows: {
    'shell': 'auto 1fr auto',
    'shell-topbar': 'auto 1fr',
    'shell-statusbar': '1fr auto',
  }
}
```
These are NOT arbitrary values — they're preset-defined, so the bracket ban doesn't apply.

---

## IMPLEMENTATION ORDER

**Strategic Sequence:**
1. Build dark variant fully (tokens + recipes) — NO light mode yet
2. Lock taxonomy + VPB blocks + layout saving
3. Only then add light variant by swapping token values (NOT rewriting components)

---

### Phase 0: Token SSOT Foundation (DARK VARIANT)
1. [x] Reverse-engineer existing `tokens.css` → `tokens/tokens.ts` as SSOT
2. [x] Create `scripts/dev/design/ds-tokens-build.ts` - Generator script
3. [x] Add `pnpm ds:tokens:build` and `pnpm ds:tokens:watch` scripts
4. [x] Generate `tokens/tokens.css` from tokens.ts
5. [x] Generate `tokens/types.ts` from tokens.ts
6. [x] Generate `tokens/tailwind.preset.ts` from tokens.ts
7. [ ] Wire Tailwind config to use preset
8. [x] Generate `recipes/css/surfaces.gen.css` from generator
9. [ ] Create `src/lib/design/index.css` - Single CSS entry point
10. [ ] Update `app.css` to import only `./lib/design/index.css`
11. [ ] Create `src/lib/design/README.md` - Quick reference
12. [ ] Create `src/lib/design/CHECKLIST.md` - Pre/post-code checklists

### Phase 1: Taxonomy Foundation
- [ ] Create `taxonomy/kinds.ts` - Define all block kinds with `layoutMode: "grid"` constraint
- [ ] Create `taxonomy/contracts.ts` - DsSurfaceProps + kind-specific props
- [ ] Create `taxonomy/slots.ts` - Slot definitions with child constraints

### Phase 2: Recipe System + Actions
- [ ] Create `recipes/index.ts` - Recipe registry with `requires` metadata
- [ ] Create `recipes/surface.recipe.ts` - Base surface recipe
- [ ] Create `recipes/panel.recipe.ts` - Panel variants
- [ ] Create `recipes/shell.recipe.ts` - Shell variants (CSS Grid enforced)
- [ ] Create `recipes/chat.recipe.ts` - Chat variants
- [ ] Create `recipes/actions/index.ts` - Action registry
- [ ] Create `recipes/actions/glowTrack.ts` - Mouse glow tracking action
- [ ] Create `recipes/actions/ripple.ts` - Ripple effect action

### Phase 3: Components Setup
**Goal:** Author styled components in `src/lib/design/components/` using primitives + recipes.

> **PRIMITIVES: See `SPRINT-PRIMITIVES.md`** — 31 .ts files to convert to .svelte wrappers

**Components to Author (in `src/lib/design/components/`):**
- [ ] `GlassButton.svelte` - Button primitive + `button.glass` recipe
- [ ] `GlassCard.svelte` - Surface + `card.glass` recipe
- [ ] `GlassContainer.svelte` - Surface + `container.glass` recipe
- [ ] `GlassInput.svelte` - Input primitive + `input.glass` recipe

**Steps:**
- [ ] Author components using primitives + recipes pattern
- [ ] Demo (`src/lib/domains/app/ui-demo/`) imports from `$lib/design/components/`
- [ ] Each component uses primitives + recipes (no raw styling)

### Phase 4: VPB Refactor
**Note:** VPB exists at `src/lib/sys/debug/vpb/` and needs refactoring to consume new registries.
- [ ] Audit existing VPB code (`src/lib/sys/debug/vpb/`) for registry consumption points
- [ ] Refactor `components/builder/schema.ts` - Strictly typed BlockNode<K>
- [ ] Refactor `components/builder/palette.ts` - Consume taxonomy for block kinds
- [ ] Refactor `components/builder/defaults.ts` - Default props per kind
- [ ] Refactor `components/inspector/inspector.ts` - Use taxonomy/contracts for prop validation
- [ ] Refactor VPB state to use recipes for class generation
- [ ] Update VPB types in `types/` directory

### Phase 5: Notify System
**Note:** Notify is a domain module at `src/lib/domains/notify/` — triggers OS toasts when minimized.
- [ ] Create `src/lib/domains/notify/index.ts` - svelte-sonner wrapper + Tauri OS notification
- [ ] Create `src/lib/domains/notify/types.ts` - Notification types
- [ ] Update root `+layout.svelte` - Add `<Toaster />`

### Phase 6: Renderers (LAST)
- [ ] Create `renderers/Panel.svelte` - Only after stages 0-5 pass
- [ ] Create `renderers/Shell.svelte` - CSS Grid layout mandatory
- [ ] Create `renderers/Widget.svelte`
- [ ] Create `renderers/ChatDock.svelte`

### Phase 7: CI + Enforcement
**Note:** Scripts live at `scripts/dev/design/`
- [ ] Create `scripts/dev/design/verify-kinds.ts`
- [ ] Create `scripts/dev/design/verify-recipes.ts`
- [ ] Create `scripts/dev/design/verify-tokens-sync.ts`
- [ ] Create `scripts/dev/design/scan-violations.ts` - THE KILL SWITCH
- [ ] Run violation scanner on existing codebase
- [ ] Delete or rewrite all violating components
- [ ] Update imports across codebase

### Phase 8: DB Integration (After Dark Variant Locked)
- [ ] Create DB migrations for `ds_theme`, `ds_theme_version`, `ds_theme_variant`, `ds_theme_tokens`
- [ ] Create DB migrations for `ds_layout`, `ds_layout_version`, `ds_block_tree`
- [ ] Create DB migration for `ds_scope_theme_binding`
- [ ] Create theme service (load/save token variants)
- [ ] Create layout service (load/save BlockNode trees)
- [ ] Wire VPB to persist layouts via layout service

### Phase 9: Light Variant (LAST - Token Values Only)
- [ ] Add "light" variant to `ds_theme_variant`
- [ ] Author light token values (same names, different values)
- [ ] Add variant switcher UI
- [ ] Verify: switching variants changes look, NOT structure

---

## VERIFICATION

### Registry Verification
```bash
# All kinds must have contracts
pnpm tsx src/scripts/dev/design/verify-kinds.ts

# All recipes must be registered
pnpm tsx src/scripts/dev/design/verify-recipes.ts

# Tokens SSOT check (tokens.ts → generated files match)
pnpm tsx src/scripts/dev/design/verify-tokens-sync.ts
```

### Violation Scanner (THE KILL SWITCH)
```bash
# Run full violation scan — prints file:line for every violation
pnpm tsx src/scripts/dev/design/scan-violations.ts

# Output format:
# VIOLATION [css-var] src/lib/design/renderers/Panel.svelte:42
#   Found: var(--dp-panel-bg)
# VIOLATION [arbitrary] src/lib/design/renderers/Widget.svelte:18
#   Found: class="bg-[#00ff00]"
# VIOLATION [inline-style] src/lib/design/renderers/Card.svelte:55
#   Found: style="color: red"
# VIOLATION [raw-handler] src/lib/design/renderers/Shell.svelte:72
#   Found: on:mousemove without recipe requires declaration
# VIOLATION [flexbox-shell] src/lib/design/renderers/Shell.svelte:12
#   Found: flex layout on shell kind (must use grid)
```

**Kill List Rule:**
Any component in violation report gets:
1. Deleted, OR
2. Rewritten to comply

No exceptions. No "we'll fix it later."

### Manual Spot Checks
```bash
# No .svelte contains CSS vars
grep -rE "var\(--" src/lib/design/renderers/ --include="*.svelte"
# Should return NOTHING

# No Tailwind arbitrary values (ANY bracket pattern)
grep -rE 'class="[^"]*\[[^"]*\]' src/lib/design/ --include="*.svelte"
# Should return NOTHING

# No inline styles
grep -rE 'style="[^"]*"' src/lib/design/renderers/ --include="*.svelte"
# Should return NOTHING (or only allowlisted)
```

### VPB Verification
- [ ] All block kinds appear in palette
- [ ] All props show as dropdowns (not text inputs)
- [ ] Default props produce valid visual output
- [ ] Saved layouts round-trip correctly

---

## ACCEPTANCE CRITERIA

### Phase 0 Complete When:
- [ ] `tokens/tokens.ts` is reverse-engineered from existing tokens.css
- [ ] `pnpm ds:tokens:build` produces identical output to original tokens.css
- [ ] `pnpm ds:tokens:watch` works in dev mode
- [ ] Generator produces `tokens.css`, `types.ts`, optionally `tailwind.preset.ts`
- [ ] Tailwind config uses preset if generated (no raw colors in config)

### Phase 1 Complete When:
- [ ] `taxonomy/kinds.ts` exports all block kinds with `layoutMode` constraint
- [ ] `taxonomy/contracts.ts` exports DsSurfaceProps + specific contracts
- [ ] Shell kinds enforce `layoutMode: "grid"`
- [ ] TypeScript compiles with no errors

### Phase 2 Complete When:
- [ ] `recipes/index.ts` exports recipe registry
- [ ] Each recipe has `requires?: ActionId[]` metadata
- [ ] Each recipe maps variants → Tailwind classes (token-backed only)
- [ ] Actions are registered and importable
- [ ] Shell recipes output CSS Grid layout classes

### Phase 3 Complete When:
- [ ] All Glass* components authored in `src/lib/design/components/`
- [ ] Each component uses primitives + recipes pattern
- [ ] Demo (`src/lib/domains/app/ui-demo/`) imports from `$lib/design/components/`
> **Note:** Primitives tracked separately in `SPRINT-PRIMITIVES.md`

### Phase 4 Complete When:
- [ ] Existing VPB code at `src/lib/sys/debug/vpb/` audited for refactor points
- [ ] `components/builder/schema.ts` exports strictly typed `BlockNode<K>`
- [ ] `components/builder/palette.ts` consumes taxonomy for block kinds
- [ ] `components/inspector/inspector.ts` uses taxonomy/contracts for prop validation
- [ ] VPB state uses recipes for class generation

### Phase 5 Complete When:
- [ ] `src/lib/domains/notify/index.ts` wraps svelte-sonner + Tauri OS notification
- [ ] Root layout includes `<Toaster />`
- [ ] All user feedback goes through notify wrapper
- [ ] Notify works in web-only builds (no Tauri errors)
- [ ] OS-level toasts trigger when Tauri available AND app is minimized

### Phase 6 Complete When:
- [ ] Each renderer passes 6-stage gate
- [ ] Renderers receive `{ recipe, props, slots }` only
- [ ] Renderers auto-attach actions from `recipe.requires`
- [ ] Shell renderers use CSS Grid (no flexbox)
- [ ] Visual output matches design specs

### Phase 7 Complete When:
- [ ] `scan-violations.js` runs without output (all clean)
- [ ] No `.svelte` contains `--dp-` vars
- [ ] No Tailwind arbitrary values anywhere
- [ ] No inline `style=` attributes
- [ ] No raw mouse handlers without `requires` declaration
- [ ] All violating components deleted or rewritten

### Phase 8 Complete When:
- [ ] DB migrations applied successfully
- [ ] Theme service can load/save variants
- [ ] Layout service can load/save BlockNode trees
- [ ] VPB persists layouts to DB
- [ ] Scope-theme bindings work correctly

### Phase 9 Complete When:
- [ ] Light variant exists with same token NAMES, different VALUES
- [ ] Variant switcher toggles between dark/light
- [ ] Switching variant changes appearance, NOT structure
- [ ] All components render correctly in both variants
- [ ] No code changes required for new variants

### FINAL SYSTEM COMPLETE WHEN:
- [ ] One theme identity (ColdLight) with multiple variants (dark, light)
- [ ] VPB composes BlockNodes using registry-defined kinds
- [ ] All layouts persist to DB as structure, not style
- [ ] Adding new variants = authoring token values only
- [ ] CI catches any violation before merge

---

## DEMO PLAN

### Demo Location: `src/lib/domains/app/ui-demo/`

**This is the EXISTING scaffolded demo folder. Update in place.**

**Demo Sections:**
1. **Tokens Display** - Color swatches, spacing scale, shadows, radii
2. **Primitives Gallery** - Each Bits UI wrapper with keyboard/focus demo
3. **Components Gallery** - GlassButton, GlassCard, GlassInput, GlassContainer
4. **Surface Recipes** - All `data-surface` variants (glass, matte, solid)
5. **Recipe Modifiers** - `data-variant`, `data-tint`, `data-bevel`, `data-glow`
6. **Motion Showcase** - Hover/press/focus animations

**Demo Implementation Rules:**
- Demo uses ONLY `src/lib/design/components/*`
- Demo does NOT contain any styling logic
- All variants shown via `data-*` attributes + recipe CSS
- Interactive examples use primitives for behavior

**Demo Acceptance Criteria:**
- [ ] All tokens visually displayed with values
- [ ] Each primitive demonstrated with keyboard interaction
- [ ] Each component shown with all recipe variants
- [ ] No raw CSS values in demo code
- [ ] Demo uses exact same patterns as production code

---

## RECIPE COMPOSITION SYSTEM

### Recipes (the only place style decisions exist)
- Recipe presets (curated "known good" defaults)
- Effect stacks (combined visual patterns like glass + bevel + glow + noise + rimlight)
- Interaction packs (glowTrack + ripple + idle motion, etc.)
- Composed patterns (panel layouts, widget shells, chat dock variants)

### What you're building up over time

**1) Base recipes**
```
surface.*, panel.*, button.*, input.*, modal.*
```

**2) Presets (your "default packs")**
```
panel.glass.default
panel.glass.glow
button.glass.primary
input.glass.focused
```

**3) Combined effects**
These are not random CSS files. They are named, reusable stacks that recipes apply:
```
"GlassFrame + DualTint + Bevel + InnerGlow"
"MatteInset + NoiseOverlay + SoftShadow"
"HoloEdge + RimLight + MicroSparkle"
```

**4) Interactions + animation sets**
These are selected via recipe metadata:
```
requires: ["glowTrack", "ripple"]
motion presets like hoverLiftSm, pressInsetMd, focusPulseSoft
```

### The enforcement stays the same
- VPB stores only enums
- enums select preset recipe IDs
- recipe ID resolves → Tailwind class output + required actions
- renderers just apply it
