# COLD LIGHT Preset System

> **Authoritative reference for presets, merge order, and UI mode configuration.**

---

## Overview

Presets are **safe starter configurations** for block kinds. They provide:

1. **Sensible defaults** for beginners
2. **Curated prop combinations** that work well together
3. **UI tier control** for basic vs advanced modes
4. **Type-safe partial overrides**

---

## Core Truth

**Presets are NOT components. Presets are DEFAULTS.**

```
Preset = kind + recipe + partial props + UI hints
```

When VPB renders a node, presets supply the starting configuration. Users can then override individual props.

---

## Preset Definition Interface

```typescript
interface PresetDefinition<K extends BlockKind> {
  id: `${K}.${string}`;          // panel.glass.clean, shell.devpulse.default
  kind: K;
  recipe: AllowedRecipe<K>;
  label: string;

  // Typed partial props (deep partial)
  props: Partial<KindProps<K>>;

  ui?: {
    tier: "basic" | "advanced";
    safeKnobs: (keyof KindProps<K>)[];
  };
}
```

---

## Preset Example

```typescript
// design/recipes/presets/panel/panel.glass.clean.preset.ts
export const panelGlassCleanPreset = {
  id: "panel.glass.clean",
  kind: "panel",
  recipeId: "panel.glass",
  label: "Glass Panel — Clean",
  props: {
    surface: {
      materialFamily: "glass",
      clarity: "clean",
      transmittance: 75,
      diffusionStrength: 45,
      backdropBlur: "md",
      bevelLevel: "md",
      edgeGlow: "soft",
      outerGlow: "subtle",
    },
  },
  ui: {
    tier: "basic",
    safeKnobs: [
      "surface.clarity",
      "surface.backdropBlur",
      "surface.transmittance",
      "surface.diffusionStrength",
      "surface.edgeGlow",
      "surface.outerGlow",
    ],
  },
} as const;
```

---

## Merge Order (Non-Negotiable)

When VPB renders a node, props merge in this exact order:

```
1. Kind contract defaults
2. Preset props
3. Node overrides (from VPB)
4. Validate with Zod schema
```

```typescript
finalProps = merge(defaultProps, preset.props, node.props)
schema.parse(finalProps) // strict validation
```

### What This Guarantees

- **Predictable defaults** — kind contract always provides base
- **Safe beginner UX** — presets override with curated values
- **Power-user expansion** — node props can override anything
- **Zero drift** — Zod validation catches invalid combinations

---

## UI Modes

### Basic Mode

- User picks a preset
- VPB shows only `ui.safeKnobs` (3–6 props)
- Full control without overwhelming options

### Advanced Mode

- Same preset as starting point
- VPB shows ALL props for the kind
- No schema change — just more knobs unlocked

**Critical:** No "new schema" per mode. That's drift fuel.

---

## Preset → VPB Flow

```
User selects kind "panel"
    ↓
VPB shows presets: ["panel.glass.clean", "panel.glass.glow", "panel.metal.brushed"]
    ↓
User picks "panel.glass.clean"
    ↓
VPB loads preset.props as starting values
    ↓
VPB shows only preset.ui.safeKnobs in Basic mode
    ↓
User tweaks clarity: "clean" → "frosted"
    ↓
Node stores override: { surface: { clarity: "frosted" } }
    ↓
Render: merge(kindDefaults, preset.props, { surface: { clarity: "frosted" } })
```

---

## Preset Registry

```typescript
// design/recipes/presets/index.ts
export const PresetRegistry = {
  "panel.glass.clean": panelGlassCleanPreset,
  "panel.glass.glow": panelGlassGlowPreset,
  "panel.glass.frosted": panelGlassFrostedPreset,
  "panel.metal.brushed": panelMetalBrushedPreset,
  "panel.solid.dark": panelSolidDarkPreset,
  "card.glass.clean": cardGlassCleanPreset,
  "card.glass.glow": cardGlassGlowPreset,
  "shell.devpulse.default": shellDevpulseDefaultPreset,
  "chatDock.glass.cyber": chatDockGlassCyberPreset,
  // ... etc
} as const;

export type PresetId = keyof typeof PresetRegistry;
```

---

## Preset Constraints

### Must Match Kind + Recipe

```typescript
// This is enforced at registration time
type ValidPreset<K extends BlockKind> = {
  kind: K;
  recipe: AllowedRecipe<K>;  // Only recipes legal for this kind
  props: Partial<KindProps<K>>;  // Only props legal for this kind
}
```

### Cannot Introduce New Props

Presets can only set values for props defined in the kind's contract. They cannot add new fields.

### Cannot Override Core Props

Core props (`intent`, `state`, `density`, `tone`) should NOT be preset — they're user-controlled semantic meaning.

---

## safeKnobs Guidelines

| Kind | Recommended safeKnobs |
|------|----------------------|
| panel | clarity, backdropBlur, transmittance, edgeGlow, outerGlow |
| card | clarity, radius, elevation, shadowStyle |
| button | size, variant, intent |
| input | size, placeholderTone, outlineMode |
| widget | density, gridlines, headerStyle |

### Rules for safeKnobs

1. **Max 6 knobs** — more overwhelms beginners
2. **Most impactful first** — clarity before noise
3. **No dangerous knobs** — opacity, visibility, pointerEvents are advanced
4. **Grouped logically** — material knobs together, frame knobs together

---

## Tone System Integration

Presets can be organized by tone (app/chat/maestro):

```typescript
// Tone-specific preset selection
const presetsByTone = {
  app: ["panel.glass.clean", "panel.metal.brushed", "panel.solid.dark"],
  chat: ["panel.glass.cyber", "panel.glass.retro"],
  maestro: ["panel.glass.glow", "panel.holo.particle"],
};
```

When context rune indicates `tone: "maestro"`, VPB can prioritize maestro presets.

---

## Preset File Structure

```
src/lib/design/recipes/presets/
├── index.ts                    # PresetRegistry export
├── panel/
│   ├── panel.glass.clean.preset.ts
│   ├── panel.glass.glow.preset.ts
│   ├── panel.glass.frosted.preset.ts
│   ├── panel.metal.brushed.preset.ts
│   └── panel.solid.dark.preset.ts
├── card/
│   ├── card.glass.clean.preset.ts
│   └── card.glass.glow.preset.ts
├── shell/
│   └── shell.devpulse.default.preset.ts
├── chatDock/
│   └── chatDock.glass.cyber.preset.ts
└── widget/
    ├── widget.chart.default.preset.ts
    └── widget.stat.default.preset.ts
```

---

## Validation at Load Time

When loading a preset:

```typescript
function loadPreset<K extends BlockKind>(presetId: PresetId): PresetDefinition<K> {
  const preset = PresetRegistry[presetId];

  // Verify kind exists
  if (!KindRegistry[preset.kind]) {
    throw new Error(`Preset ${presetId} references unknown kind: ${preset.kind}`);
  }

  // Verify recipe is allowed for kind
  const kindEntry = KindRegistry[preset.kind];
  if (!kindEntry.allowedRecipes.includes(preset.recipe)) {
    throw new Error(`Preset ${presetId} uses recipe ${preset.recipe} not allowed for ${preset.kind}`);
  }

  // Validate props against kind schema
  const result = kindEntry.schema.safeParse({
    ...getKindDefaults(preset.kind),
    ...preset.props,
  });

  if (!result.success) {
    throw new Error(`Preset ${presetId} has invalid props: ${result.error.message}`);
  }

  return preset;
}
```

---

## Preset vs Recipe Distinction

| Aspect | Preset | Recipe |
|--------|--------|--------|
| What it is | Default prop values | Visual assembly logic |
| What it stores | Partial props object | `classes()` function |
| When it's used | Node creation | Render time |
| Who uses it | VPB | Renderer |
| Can be changed | Yes, per node | No, recipe is fixed |

---

## Summary

| Guarantee | Mechanism |
|-----------|-----------|
| Safe defaults | Presets provide curated starting values |
| Type safety | `Partial<KindProps<K>>` ensures valid props |
| Merge predictability | Fixed order: kind → preset → node |
| UI simplicity | `safeKnobs` limits visible controls |
| No schema drift | Same schema for basic and advanced modes |
| Validation | Zod validates final merged props |

---

**This is the canonical preset system.**
