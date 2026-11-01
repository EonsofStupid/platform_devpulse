# Variable: DATA\_ATTRS

> `const` **DATA\_ATTRS**: `object`

Defined in: [primitives/types.ts:40](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/types.ts#L40)

ColdLight Data Attribute Vocabulary — SINGLE SOURCE OF TRUTH

PRIMITIVES (behavior/accessibility):
- kind: identifies the primitive type (e.g., "button", "dialog", "select")
- slot: identifies the part within a primitive (e.g., "trigger", "content", "item")
- state: tracks interactive state (e.g., "open", "closed", "active", "inactive")
- id: user-defined stable ID for testing/tooling

RECIPES (visual styling):
- surface: background treatment (glass, matte, solid)
- material: texture/depth (void, deep, smoke, frost)
- motion: animation behavior (subtle, smooth, energetic)
- transition: state change animation (fade, slide, scale)
- focus: attention/emphasis level (low, medium, high, critical)
- layers: z-index layer (base, overlay, modal, toast)

See README.md and PRIMITIVE_CONTRACT.md for usage patterns.

## Type Declaration

### focus

> `readonly` **focus**: `"data-focus"`

### id

> `readonly` **id**: `"data-id"`

### kind

> `readonly` **kind**: `"data-kind"`

### layers

> `readonly` **layers**: `"data-layers"`

### material

> `readonly` **material**: `"data-material"`

### motion

> `readonly` **motion**: `"data-motion"`

### slot

> `readonly` **slot**: `"data-slot"`

### state

> `readonly` **state**: `"data-state"`

### surface

> `readonly` **surface**: `"data-surface"`

### transition

> `readonly` **transition**: `"data-transition"`
