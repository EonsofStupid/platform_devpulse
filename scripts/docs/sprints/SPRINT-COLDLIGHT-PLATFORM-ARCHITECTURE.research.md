# Research: ColdLight Platform Architecture — Full Schema & Pipeline Specification

**Date**: 2026-03-04
**Sprint**: SPRINT-COLDLIGHT-PLATFORM-ARCHITECTURE
**Status**: COMPLETE
**Depends On**: SPRINT-XTASK-FOUNDATION-V2 (Phase 0 complete — SurrealDB 3.0.2 builds)

## Goal

Define the foundational architecture for:
1. SD5 DTCG token pipeline (SD5 → Tailwind @theme)
2. Extensible effects registry
3. Zod schema enforcement for every entity
4. VPB as unified shell with multiple devtools
5. Database role separation
6. .userdata/ portable distribution
7. Toast + StatusBar HMR visibility

---

## Owner Decisions (Confirmed 2026-03-04)

| Decision | Answer |
|----------|--------|
| VPB scope | Multiple tools with clear boundaries, appear as one unified shell |
| Node editor | Graph view + property panel (dual perspective) |
| Primary user | Owner as power user — reduce cognitive load |
| Schema enforcement | Zod everywhere, real-world strict, fail fast |
| SurrealDB role | Kernel/cortex ONLY — AI orchestration, IP protection facade. NOT design system. |
| Design system storage | Files = SSOT. PostgreSQL (LibSQL) = user configs, devtool state. DuckDB = analytics + config queries. |
| Token pipeline | SD5 DTCG = authority. Tailwind consumes. Industry standard. |
| Effects | Extensible registry — more than 7, plugin-pattern for new categories |
| Distribution | AppData default + optional portable mode with .userdata/ |
| HMR visibility | Toast (transitions) + StatusBar (persistent state) |

---

## I. CURRENT STATE AUDIT

### What Exists (Verified from Codebase)

#### Token Pipeline ✅ OPERATIONAL
- **3-tier tokens**: `tokens.ts` (global) → `semantic.ts` (alias) → `components.ts` (scoped)
- **SD5 build**: `pnpm ds:tokens:build` → `tokens.json` (DTCG 1.0) → 3 platforms
- **Outputs**: `tokens.css` (CSS vars), `tailwind.css` (@theme block), `types.ts` (TS unions)
- **@theme mappings**: `tokens.cfg.ts` maps tiers to Tailwind namespaces (color, spacing, shadow, radius, etc.)
- **OKLCH color space**: 9-step palettes across 6 accent hues
- **variants.css**: 59 @utility rules for 8 encoding categories (s/z/d/b/g/f/m/t)

#### Encoding System ✅ OPERATIONAL
- **8 axes**: Surface(8), Material(10), Depth(5), Bevel(5), Glow(7), Frame(5), Motion(9), Transition(10) = 59 values
- **Sparse encoding**: `v-s1d2g1` (skips defaults)
- **Shadow composition**: 4-layer CSS custom properties (`--shadow-depth`, `--shadow-bevel`, `--shadow-glow`, `--shadow-frame`)
- **resolveVisual()**: Pipeline: kind defaults → preset → individual props → encoding override → ResolvedVisual

#### Contract System ✅ OPERATIONAL (92 primitives)
- **Colocated**: `primitives/{kind}/contract.ts`
- **Zod-validated**: `PrimitiveContractSchema` at build time
- **Parity enforcement**: coldlight=2-folder, meltui=3-folder
- **Deep validation**: slot relationships, keyboard map, ARIA requirements
- **Scanner**: 905 lines, reads all contracts → generates unified manifest

#### Effects System ✅ OPERATIONAL (7 categories, 35+ effects)
- **Categories**: glass, glow, depth, bevel, frame, motion, transition
- **Registry**: Map-based with category + conflict group indices
- **Zod schemas**: `EffectDefinitionSchema`, `ComposedEffectSchema`, `CompositorNodeSchema`
- **Bridge**: `recommendEffects()` heuristics per component kind
- **Actions**: `intersectionReveal`, `glowTrack` (JS-driven with `prefers-reduced-motion`)

#### dsAdapter System ✅ OPERATIONAL
- **Universal**: Schema → resolveAdapter() → AdapterResult (states/attrs/handlers)
- **Two engines**: ColdLight (60+ builders) and MeltUI (20 adapters)
- **Getter-based reactivity**: Svelte 5 fine-grained tracking

#### Recipe System ✅ OPERATIONAL
- **Pattern**: `RecipeDefinition` with `id`, `kind`, `defaults`, `classes()` function
- **Registry**: Map-based, Zod-validated in DEV
- **~50 system presets**: btn-primary, panel-glass, card-elevated, etc.

#### VPB ✅ SCAFFOLDED (devtools mode)
- **Modes**: Dev, Production, Customer
- **Manifest reader**: Loads unified manifest via Vite glob import
- **State**: Svelte 5 rune classes (vpbDocument, vpbPalette, vpbVisual, vpbConnection)
- **Panels**: Canvas, Palette, Properties, Toolbar, RecipeLegend, ContractInspector
- **Controls**: Per-category (SurfaceControl, DepthControl, GlowControl, etc.)
- **Graph**: VpbGraph, VpbBlockNode, VpbSlotEdge

#### Config System ✅ OPERATIONAL (8 fragments)
- identity, roots, adapters, generation, enforcement, attributes, testing, tokens, components

### What's Missing (Gaps Identified)

| # | Gap | Impact | Priority |
|---|-----|--------|----------|
| G1 | No formal entity schemas beyond primitives | Recipes, effects, presets, adapters, tokens lack unified Zod enforcement at ALL boundaries | CRITICAL |
| G2 | Effects not extensible — 7 hardcoded categories | Can't add new effect categories without modifying core | HIGH |
| G3 | VPB is debug-only, not unified devtools shell | No node editor, no token configurator, no component inspector mode | HIGH |
| G4 | No DB backing for devtools state | User config, devtool preferences, VPB documents not persisted to PostgreSQL | HIGH |
| G5 | No .userdata/ directory structure | No portable distribution, no organized user data storage | MEDIUM |
| G6 | No HMR/restart visibility | No toast or StatusBar indicator for dev server state changes | MEDIUM |
| G7 | Token pipeline not bidirectional | Can't configure tokens from UI, only from code files | MEDIUM |
| G8 | No stylelint enforcement | Raw values not caught at build time (industry standard: Carbon, Polaris, SLDS all use stylelint) | MEDIUM |
| G9 | SD5 @theme missing `inline` keyword | Tailwind @theme should use `@theme inline` for proper var() resolution (Tailwind v4 best practice) | LOW |

---

## II. INDUSTRY RESEARCH — HOW THE REALLY SMART PEOPLE DO IT

### Token Pipeline (SD5 → Tailwind @theme)

**Industry consensus** (Salesforce, Carbon, Polaris, Tokens Studio):
1. **DTCG JSON is the interchange format** — W3C stable spec (2025.10)
2. **SD5 transforms tokens per-platform** — CSS vars, Tailwind @theme, TypeScript types
3. **`@theme inline` is required** for Tailwind v4 when bridging from external CSS vars (Tokens Studio reference impl)
4. **Namespace mapping** drives utility generation (--color-* → bg-*, text-*, border-*)
5. **3-tier model is universal** — Global → Semantic → Component. Semantic layer is the theming pivot.

**ColdLight status**: ✅ Already follows this pattern. Needs `@theme inline` fix (G9).

### Schema Enforcement

**Industry consensus**:
- **Salesforce SLDS**: Stylelint linter + CSS custom property hooks with fallbacks
- **IBM Carbon**: `stylelint-plugin-carbon-tokens` enforces token-only styling at build time
- **Shopify Polaris**: `stylelint-polaris` + visual regression testing + accessibility CI
- **All three**: Static analysis (lint) catches raw values + wrong tokens. Schema validation at boundaries.

**ColdLight status**: Has Zod for primitives and effects. Missing Zod for recipes, presets, tokens, adapter mappings. Missing stylelint enforcement (G1, G8).

### Component Contract Architecture

**Industry consensus** (Radix, Ark UI, Zag.js):
- **Part-based composition**: Root, Trigger, Content as separate elements with `data-scope` / `data-part`
- **Controllable state**: Dual controlled/uncontrolled (Radix `useControllableState`, Zag `bindable`, MeltUI `Synced`)
- **Connect/adapter pattern**: State machine → prop-getter functions → attrs/handlers per slot
- **Data attributes as public API**: `data-state`, `data-disabled`, `data-orientation`

**ColdLight status**: ✅ Already implements all of these:
- `data-kind` + `data-slot` = part-based composition
- `Synced` pattern = controllable state
- `AdapterResult` = connect/adapter pattern
- `data-state` = CSS-targetable state

### Effects Architecture

**Industry consensus**:
- No single standard for composable visual effects at this level
- CSS Houdini (paint worklets) is the bleeding edge but browser support limited
- Animation libraries (Framer Motion, GSAP) use effect registries with plugin APIs
- **Best pattern**: Effect = data declaration + registration + composition rules + conflict resolution

**ColdLight status**: ✅ Already has this pattern. Needs extensibility (G2) — make categories a registry, not hardcoded.

### VPB / Design Tool Architecture

**Industry consensus**:
- **Figma**: Plugin API + widget API for extensible tooling within a unified shell
- **Storybook**: Addon system — core shell + pluggable panels (controls, docs, accessibility, design)
- **Plasmic**: Visual page builder with data-bound component library + token system

**ColdLight VPB should follow**: Storybook addon pattern — unified shell, pluggable tool panels, each tool is a registered module with clear boundaries.

---

## III. ENTITY SCHEMA DEFINITIONS — WHAT MUST BE ENFORCED

### The 8 Core Entities

Every entity below needs a Zod schema that validates at ALL boundaries (config load, IPC, DB write, scanner read, runtime construction).

#### 1. DesignToken (SD5 DTCG 1.0)

```typescript
// DTCG token format — W3C stable spec
const DesignTokenSchema = z.object({
  $value: z.unknown(),                    // Any valid token value
  $type: z.enum([                         // 13 DTCG types
    "color", "dimension", "number", "duration",
    "fontFamily", "fontWeight", "cubicBezier", "strokeStyle",
    "typography", "shadow", "gradient", "border", "transition",
  ]).optional(),
  $description: z.string().optional(),
  $extensions: z.record(z.unknown()).optional(),
});

// Token tiers
const TokenTierSchema = z.enum(["global", "semantic", "component"]);

// Token source entry (our internal format wrapping DTCG)
const TokenSourceEntrySchema = z.object({
  path: z.string(),                       // "color.teal.500"
  tier: TokenTierSchema,
  token: DesignTokenSchema,
  references: z.array(z.string()).optional(),  // Alias targets
});
```

#### 2. Recipe

```typescript
const RecipeSchema = z.object({
  id: z.string().regex(/^[a-z][\w-]*\.[a-z][\w-]*(\.[a-z][\w-]*)?$/),
  kind: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  defaults: DsSurfacePropsSchema.partial(),
  // classes is a function — validated at registration, not serializable
  slots: z.array(z.string()).optional(),    // Which slots this recipe styles
  tags: z.array(z.string()).optional(),     // Categorization for palette
});
```

#### 3. Component Contract (EXISTS — PrimitiveContractSchema)

Already complete. 92 primitives validated.

#### 4. Primitive (EXISTS — scanner validates structure)

Already complete via scanner parity checks.

#### 5. dsAdapter Mapping

```typescript
const AdapterMappingSchema = z.object({
  kind: z.string().min(1),
  engine: z.enum(["coldlight", "meltui"]),
  slots: z.array(z.string()).min(1),
  states: z.array(z.string()),
  aria: z.array(z.string()),
  interactions: z.array(z.string()),
});

// AdapterResult validation (runtime boundary check)
const AdapterResultSchema = z.object({
  states: z.record(z.string(), z.object({
    current: z.boolean(),
  })),
  attrs: z.record(z.string(), z.record(z.string(), z.string().optional())),
  handlers: z.record(z.string(), z.record(z.string(), z.function())),
  context: z.record(z.unknown()).optional(),
});
```

#### 6. Effect Definition (EXISTS — EffectDefinitionSchema)

Already complete. 35+ effects validated.

#### 7. Preset

```typescript
const PresetSchema = z.object({
  id: z.string().min(1),
  kind: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  isSystem: z.boolean(),
  values: z.object({
    surface: z.string().optional(),
    material: z.string().optional(),
    depth: z.string().optional(),
    bevel: z.string().optional(),
    glow: z.string().optional(),
    frame: z.string().optional(),
    motion: z.string().optional(),
    transition: z.string().optional(),
  }),
});
```

#### 8. Encoding Category

```typescript
const CategoryValueSchema = z.object({
  index: z.number().int().min(0),
  id: z.string().min(1),
  label: z.string().min(1),
  tokenRefs: z.record(z.string(), z.string()),   // CSS prop → CSS value
  requiredTokens: z.array(z.string()).optional(),
  svgFilters: z.array(z.string()).optional(),
});

const EncodingCategorySchema = z.object({
  code: z.string().length(1),
  name: z.string().min(1),
  description: z.string().min(1),
  encodingOrder: z.number().int().min(0),
  defaultIndex: z.number().int().min(0),
  vpbControl: z.enum(["slider", "select", "toggle", "color-picker", "curve-editor"]),
  values: z.array(CategoryValueSchema).min(1),
});
```

---

## IV. EFFECTS EXTENSIBILITY ARCHITECTURE

### Current: 7 Hardcoded Categories

```typescript
const EFFECT_CATEGORIES = ["glass", "glow", "depth", "bevel", "frame", "motion", "transition"] as const;
```

### Target: Plugin-Pattern Category Registry

```typescript
// Category registration (not hardcoded)
const categoryRegistry = new Map<string, EffectCategoryDefinition>();

interface EffectCategoryDefinition {
  id: string;                          // "glass", "glow", or any new category
  label: string;
  description: string;
  shadowLayer?: ShadowLayer;           // Which shadow layer (if applicable)
  conflictBehavior: "exclusive" | "stackable";  // Can effects in this category coexist?
  triggers: readonly EffectTrigger[];  // Default supported triggers
}

// Registration function
function registerEffectCategory(category: EffectCategoryDefinition): void {
  EffectCategoryDefinitionSchema.parse(category);  // Zod validate
  if (categoryRegistry.has(category.id)) throw new Error(`Category ${category.id} already registered`);
  categoryRegistry.set(category.id, category);
}

// Built-in categories register at import time (same as now)
// New categories register via plugin pattern
```

### How to Extend

```typescript
// In a plugin file:
import { registerEffectCategory, registerEffect } from "$lib/design/effects";

registerEffectCategory({
  id: "parallax",
  label: "Parallax",
  description: "Scroll-linked depth effects",
  conflictBehavior: "exclusive",
  triggers: ["intersection", "always"],
});

registerEffect({
  id: "parallax.subtle",
  category: "parallax",
  label: "Subtle Parallax",
  description: "Gentle scroll-linked movement",
  supportedTriggers: ["intersection"],
  classes: ["will-change-transform"],
  customJS: { module: "parallax-action", defaultParams: { intensity: 0.3 } },
});
```

---

## V. VPB UNIFIED SHELL — TOOL ARCHITECTURE

### Pattern: Storybook Addon Model

VPB becomes a **tool shell** that hosts registered tool panels. Each tool is a module with:
1. An ID and label
2. A Svelte component (the panel UI)
3. Required manifest sections
4. Optional toolbar actions

### Tool Registry

```typescript
interface VpbTool {
  id: string;                          // "page-builder", "node-editor", "token-config"
  label: string;                       // "Page Builder"
  icon: string;                        // Lucide icon name
  component: typeof SvelteComponent;   // Lazy-loaded panel
  requiresManifest: boolean;           // Needs coldlight.manifest.json?
  position: "main" | "sidebar" | "bottom";  // Shell layout zone
  order: number;                       // Sort priority
}

const toolRegistry = new Map<string, VpbTool>();
```

### Planned Tools

| Tool ID | Label | Position | Purpose |
|---------|-------|----------|---------|
| `page-builder` | Page Builder | main | Visual page composition (current VPB) |
| `node-editor` | Node Editor | main | Graph view of token→recipe→component relationships |
| `token-config` | Token Configurator | main | Visual token editing (DTCG values) |
| `component-inspector` | Component Inspector | sidebar | Contract + adapter introspection |
| `preset-palette` | Preset Palette | sidebar | Visual preset gallery with live preview |
| `effect-composer` | Effect Composer | sidebar | Drag effects onto component instances |
| `encoding-playground` | Encoding Playground | bottom | Live encoding string ↔ visual preview |

---

## VI. DATABASE ROLE SEPARATION

### Confirmed Architecture

| Database | Crate | Role | Examples |
|----------|-------|------|----------|
| **SurrealDB** | `surrealdb 3.0.2` | Kernel/cortex ONLY | AI reasoning graph, state transitions, knowledge relationships. IP protection facade. |
| **PostgreSQL (LibSQL)** | `libsql 0.9` | User configs, devtool state | VPB documents, user preferences, project settings, tool configurations, session state |
| **DuckDB** | `duckdb 1.4` | Analytics + config queries | Token usage analytics, component coverage metrics, build performance, config validation results |
| **Moka** | `moka` (in-memory) | Runtime cache | Hot path caching, resolved adapters, parsed manifests |

### Schema Definitions Needed

**LibSQL (PostgreSQL) — User Config Tables**:
```sql
-- VPB documents
CREATE TABLE vpb_documents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tree JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User preferences
CREATE TABLE user_preferences (
  key TEXT PRIMARY KEY,
  value JSON NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tool state (per-tool layout, selections, history)
CREATE TABLE tool_state (
  tool_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSON NOT NULL,
  PRIMARY KEY (tool_id, key)
);
```

**DuckDB — Analytics Tables**:
```sql
-- Token usage tracking
CREATE TABLE token_usage (
  token_path VARCHAR,
  file_path VARCHAR,
  line_number INTEGER,
  usage_type VARCHAR,  -- 'css-var', 'tailwind-class', 'direct-value'
  scanned_at TIMESTAMP
);

-- Component coverage
CREATE TABLE component_coverage (
  kind VARCHAR,
  has_primitive BOOLEAN,
  has_contract BOOLEAN,
  has_builder BOOLEAN,
  has_component BOOLEAN,
  has_recipe BOOLEAN,
  has_test BOOLEAN,
  scanned_at TIMESTAMP
);
```

---

## VII. .userdata/ DIRECTORY STRUCTURE

### Default Location (AppData)

```
{AppData}/devpulse/
├── .userdata/
│   ├── config/
│   │   ├── platform.toml          # User platform config override
│   │   ├── coldlight.user.json    # User token overrides
│   │   └── tools.json             # Tool preferences
│   ├── db/
│   │   ├── libsql/                # PostgreSQL data
│   │   ├── duckdb/                # Analytics data
│   │   └── surreal/               # Cortex data
│   ├── cache/
│   │   └── manifests/             # Cached parsed manifests
│   ├── projects/
│   │   └── {project-id}/          # Per-project VPB docs, exports
│   └── logs/
│       └── devpulse.log           # Rotated app logs
```

### Portable Mode

When `DEVPULSE_PORTABLE=1` or `.portable` file exists next to binary:
```
devpulse/
├── devpulse.exe
├── .portable                      # Sentinel file triggers portable mode
└── .userdata/                     # Same structure, colocated with binary
    └── ...
```

---

## VIII. HMR / RESTART VISIBILITY

### StatusBar States

| State | Indicator | Trigger |
|-------|-----------|---------|
| `connected` | Green dot | Health poll succeeds |
| `rebuilding` | Yellow dot + spinner | Vite HMR event or Tauri rebuild detected |
| `error` | Red dot | Health poll fails or build error |
| `offline` | Gray dot | No connection |

### Toast Events

| Event | Toast Content | Duration |
|-------|--------------|----------|
| HMR update | "Hot update applied" | 2s auto-dismiss |
| Full reload | "Dev server restarting..." → "Ready" | Until ready |
| Build error | "Build failed: {summary}" | Sticky until dismissed |
| Store boot | "Platform stores initialized (4/4)" | 3s auto-dismiss |

### Implementation

- **StatusBar**: Extend existing `PlatformHealth` rune with `rebuilding` state
- **Toast**: Use existing `svelte-sonner` dependency
- **IPC**: New `get_dev_state()` command returns `{ rebuilding: bool, last_error: Option<String> }`
- **Vite plugin**: Custom plugin emits HMR status events to the Svelte app

---

## IX. SD5 → TAILWIND @THEME — CORRECT PIPELINE

### Current Flow (95% correct)

```
tokens.ts → jiti → DTCG JSON → SD5 → tokens.css + tailwind.css + types.ts
```

### Fix Required: @theme inline

**Current** (`tailwind.css`):
```css
@theme {
  --color-teal-50: oklch(0.97 0.02 180);
}
```

**Correct** (per Tailwind v4 + Tokens Studio reference):
```css
@theme inline {
  --color-teal-50: var(--color-teal-50);
}
```

**Why**: `@theme inline` ensures the `var()` reference is preserved in generated utility CSS, so token values resolve at the point of use. This is critical for:
1. Runtime theming (swap `--color-teal-50` at :root, all utilities update)
2. Proper cascade behavior
3. DevTools inspectability

**However**: ColdLight currently emits resolved values directly (not var references). This works because tokens.css and tailwind.css are both generated from the same source. The `inline` optimization matters when we add runtime theming via the UI. **Defer to theming sprint.**

---

## X. RECOMMENDATIONS

### Priority Order

1. **Entity schemas** (G1) — Define Zod schemas for ALL 8 entities. Every boundary validated.
2. **Effects extensibility** (G2) — Category registry, not hardcoded array.
3. **VPB tool shell** (G3) — Unified shell with tool registration pattern.
4. **DB schema for devtools** (G4) — LibSQL tables for VPB docs, preferences, tool state.
5. **HMR visibility** (G6) — Toast + StatusBar for dev server state.
6. **.userdata/ structure** (G5) — Directory layout with portable mode.
7. **Stylelint plugin** (G8) — Token enforcement at build time.
8. **@theme inline** (G9) — Deferred to theming sprint.

### What NOT to Do

- Do NOT fork SurrealDB for design system storage — it's kernel/cortex only.
- Do NOT add design system entities to SurrealDB — use LibSQL for user config, files for SSOT.
- Do NOT make VPB a single monolithic tool — use the tool registry pattern.
- Do NOT hardcode new effect categories — use the registration pattern.

---

## Files Referenced

### Token Pipeline
- `interfaces/desktop/src/lib/design/tokens/tokens.ts` — Tier 1 global tokens
- `interfaces/desktop/src/lib/design/tokens/semantic.ts` — Tier 2 semantic tokens
- `interfaces/desktop/src/lib/design/tokens/components.ts` — Tier 3 component tokens
- `interfaces/desktop/src/lib/design/config/coldlight/tokens.cfg.ts` — SD5 + @theme config
- `interfaces/desktop/scripts/dev/design/sd/build.ts` — SD5 build entry
- `interfaces/desktop/src/lib/design/generated/variants.css` — @utility rules (59)

### Contracts & Scanner
- `interfaces/desktop/src/lib/design/primitives/_schema/contract.ts` — Zod enforcement (274 lines)
- `interfaces/desktop/src/lib/design/primitives/_schema/types.ts` — Type hierarchy (236 lines)
- `interfaces/desktop/src/lib/design/scanner.ts` — Contract scanner (905 lines)

### Effects
- `interfaces/desktop/src/lib/design/effects/registry.ts` — Effect registry (180+ lines)
- `interfaces/desktop/src/lib/design/effects/_schema/types.ts` — Effect types
- `interfaces/desktop/src/lib/design/effects/_schema/schema.ts` — Zod schemas (118 lines)
- `interfaces/desktop/src/lib/design/effects/bridge.ts` — Effect recommendations

### dsAdapter
- `interfaces/desktop/src/lib/design/api/dsadapters/_schema/engine.ts` — EngineType, AdapterResult
- `interfaces/desktop/src/lib/design/api/dsadapters/resolve.ts` — Dynamic resolver

### VPB
- `interfaces/desktop/src/lib/sys/debug/vpb/manifest/manifest-reader.ts` — Manifest loader
- `interfaces/desktop/src/lib/sys/debug/vpb/state/vpbDocument.svelte.ts` — Document state

### Config
- `interfaces/desktop/src/lib/design/coldlight.config.ts` — 8-fragment config
- `interfaces/desktop/src/lib/design/registry/token-categories.ts` — 8-axis encoding (853 lines)
- `interfaces/desktop/src/lib/design/registry/resolve-visual.ts` — Resolution pipeline

### Industry Sources
- [DTCG Specification 2025.10](https://www.designtokens.org/)
- [Style Dictionary v4](https://styledictionary.com/)
- [Tailwind v4 @theme](https://tailwindcss.com/docs/theme) — `@theme inline` for external vars
- [Tokens Studio sd-tailwindv4](https://github.com/tokens-studio/sd-tailwindv4/)
- [Salesforce SLDS 2 Styling Hooks](https://developer.salesforce.com/docs/platform/lwc/guide/create-components-css-custom-properties.html)
- [IBM Carbon stylelint-plugin](https://github.com/carbon-design-system/stylelint-plugin-carbon-tokens)
- [Shopify Polaris Tokens](https://github.com/Shopify/polaris-tokens)
- [Zag.js State Machines](https://zagjs.com/overview/whats-a-machine)
- [Ark UI Part-Based Composition](https://ark-ui.com/)
- [Radix UI Primitives](https://www.radix-ui.com/primitives/docs/overview/introduction)
