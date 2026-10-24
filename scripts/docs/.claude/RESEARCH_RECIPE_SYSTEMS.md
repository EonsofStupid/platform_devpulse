# Research: Recipe / Style Config Patterns in Modern Design Systems

> Fetched from live documentation on 2026-03-09. Sources linked per section.

---

## 1. Panda CSS Recipes

**Sources:**
- https://panda-css.com/docs/concepts/recipes
- https://panda-css.com/docs/concepts/slot-recipes

### Two Recipe Types

Panda CSS has **two distinct recipe mechanisms**:

| Aspect | Config Recipe (`defineRecipe`) | Atomic Recipe (`cva`) |
|--------|-------------------------------|----------------------|
| Defined in | `panda.config.ts` | Any source file |
| CSS output | Semantic classes: `.button--size-lg` | Atomic classes: `.d_flex .p_4` |
| JIT | Yes -- only used variants emit CSS | No -- all variants always emitted |
| Responsive variants | Supported: `{ base: 'sm', md: 'lg' }` | Not supported |
| Shareable via presets | Yes | No |

### Config Recipe Schema (`defineRecipe`)

```typescript
import { defineRecipe } from '@pandacss/dev'

export const buttonRecipe = defineRecipe({
  // REQUIRED: drives generated class name prefix
  className: 'button',

  // Optional: JSDoc description
  description?: string,

  // Optional: JSX component names to track usage
  jsx?: string[],

  // Base styles applied to all instances
  base: {
    display: 'flex',
    alignItems: 'center',
  },

  // Variant axes
  variants: {
    size: {
      sm: { padding: '4', fontSize: '12px' },
      lg: { padding: '8', fontSize: '24px' },
    },
    visual: {
      solid: { bg: 'red.200', color: 'white' },
      outline: { borderWidth: '1px', borderColor: 'red.200' },
    },
  },

  // Styles applied when multiple variants match simultaneously
  compoundVariants: [
    {
      size: 'sm',
      visual: 'solid',
      css: { fontWeight: 'bold' },
    },
    {
      // Can target multiple values with arrays
      size: ['sm', 'md'],
      visual: 'outline',
      css: { border: '2px solid' },
    },
  ],

  // Fallback values when variant not specified
  defaultVariants: {
    size: 'sm',
    visual: 'solid',
  },
})
```

### Atomic Recipe Schema (`cva`)

```typescript
import { cva } from '../styled-system/css'

const button = cva({
  base: { display: 'flex' },
  variants: {
    visual: {
      solid: { bg: 'red.200', color: 'white' },
      outline: { borderWidth: '1px', borderColor: 'red.200' },
    },
  },
  compoundVariants: [
    { visual: 'solid', css: { fontWeight: 'bold' } },
  ],
  defaultVariants: { visual: 'solid' },
})

// Usage: button({ visual: 'outline' }) => className string
```

### Slot Recipe Schema (`defineSlotRecipe` / `sva`)

For multi-part components. Two forms mirror the single-part split:

```typescript
// Config slot recipe (in panda.config.ts)
import { defineSlotRecipe } from '@pandacss/dev'

export const checkboxRecipe = defineSlotRecipe({
  className: 'checkbox',

  // Named parts of the component
  slots: ['root', 'control', 'label'],

  // Base styles PER SLOT
  base: {
    root: { display: 'flex', alignItems: 'center', gap: '2' },
    control: { borderWidth: '1px', borderRadius: 'sm' },
    label: { marginStart: '2' },
  },

  // Variants -- each value provides styles PER SLOT
  variants: {
    size: {
      sm: {
        control: { width: '8', height: '8' },
        label: { fontSize: 'sm' },
      },
      md: {
        control: { width: '10', height: '10' },
        label: { fontSize: 'md' },
      },
    },
  },

  compoundVariants: [
    {
      size: 'sm',
      css: {
        control: { borderColor: 'gray.300' },
        label: { color: 'gray.600' },
      },
    },
  ],

  defaultVariants: { size: 'md' },
})
```

**Slot recipe return value** is an object keyed by slot name:

```typescript
const classes = checkbox({ size: 'sm' })
// => { root: "checkbox__root ...", control: "checkbox__control ...", label: "checkbox__label ..." }
```

Generated CSS classes follow pattern: `<className>__<slot>--<variant>_<value>`

### Runtime Introspection API

Both recipe types expose:
- `recipe.variantKeys` -- array of variant names: `['size', 'visual']`
- `recipe.variantMap` -- map of variant names to possible values: `{ size: ['sm', 'lg'] }`
- `recipe.splitVariantProps(props)` -- separates variant props from other props: `[variantProps, restProps]`

### Validation

- **Config recipes**: JIT -- Panda tracks usage at build time, only emits CSS for variants actually used. Static analysis of code.
- **Atomic recipes**: All variants compiled upfront regardless of usage.
- **TypeScript**: `RecipeVariantProps<typeof recipe>` extracts variant prop types.

---

## 2. Chakra UI v3 (Ark UI) Style Configs

**Sources:**
- https://www.chakra-ui.com/docs/theming/recipes
- https://www.chakra-ui.com/docs/theming/slot-recipes
- https://www.chakra-ui.com/docs/theming/overview

### Architecture

Chakra UI v3 is built on **Panda CSS** internally. Its recipe system is Panda's recipe system exposed through Chakra's theming layer.

Recipes are registered in the theme via `defineConfig()` and compiled by `createSystem()`:

```typescript
import { defineConfig, createSystem } from '@chakra-ui/react'

const config = defineConfig({
  theme: {
    recipes: {
      button: buttonRecipe,
    },
    slotRecipes: {
      checkbox: checkboxSlotRecipe,
    },
  },
})

const system = createSystem(defaultConfig, config)

// Wrap app in <ChakraProvider value={system}>
```

### Single-Part Recipe (`defineRecipe`)

Identical to Panda CSS:

```typescript
import { defineRecipe } from '@chakra-ui/react'

const buttonRecipe = defineRecipe({
  base: { display: 'flex' },
  variants: {
    variant: {
      solid: { bg: 'red.200', color: 'white' },
      outline: { borderWidth: '1px', borderColor: 'red.200' },
    },
    size: {
      sm: { padding: '4', fontSize: '12px' },
      lg: { padding: '8', fontSize: '24px' },
    },
  },
  compoundVariants: [
    { variant: 'solid', size: 'lg', css: { fontWeight: 'bold' } },
  ],
  defaultVariants: {
    variant: 'solid',
    size: 'sm',
  },
})
```

### Slot Recipe (`defineSlotRecipe`)

```typescript
import { defineSlotRecipe } from '@chakra-ui/react'

const checkboxRecipe = defineSlotRecipe({
  slots: ['root', 'control', 'label'],
  base: {
    root: { display: 'flex', alignItems: 'center', gap: '2' },
    control: { borderWidth: '1px', borderRadius: 'sm' },
    label: { marginStart: '2' },
  },
  variants: {
    size: {
      sm: {
        control: { width: '8', height: '8' },
        label: { fontSize: 'sm' },
      },
      md: {
        control: { width: '10', height: '10' },
        label: { fontSize: 'md' },
      },
    },
  },
  defaultVariants: { size: 'md' },
})
```

### Consumption Patterns

1. **useRecipe hook** (single-part):
   ```typescript
   const styles = useRecipe({ key: 'button', recipe: buttonRecipe })
   const classes = styles({ variant: 'solid', size: 'lg' })
   ```

2. **createSlotRecipeContext** (multi-part, recommended):
   Creates compound components with context-based slot styling.

3. **chakra factory** (recommended for single-part):
   Better integration and type safety than raw hook usage.

### Validation

- Runtime type safety through variant key matching
- TypeScript inference via recipe definition types
- Invalid variant values cause type errors at compile time

---

## 3. Vanilla Extract Recipes

**Source:**
- https://vanilla-extract.style/documentation/packages/recipes/

### Core Principle

**ALL styles are generated at build time.** Zero runtime CSS generation. The recipe function at runtime only concatenates pre-generated class names.

### Recipe Schema

```typescript
import { recipe } from '@vanilla-extract/recipes'

export const button = recipe({
  // Base styles -- always applied
  base: {
    borderRadius: 6,
    // Can also be an array for composing with sprinkles:
    // base: [sprinkles({ padding: 'small' }), { borderRadius: 6 }]
  },

  // Variant axes
  variants: {
    color: {
      neutral: { background: 'whitesmoke' },
      brand: { background: 'blueviolet' },
      accent: { background: 'slateblue' },
    },
    size: {
      small: { padding: 12 },
      medium: { padding: 16 },
      large: { padding: 24 },
    },
  },

  // Compound variants -- note: uses `variants` and `style` keys (not `css`)
  compoundVariants: [
    {
      variants: { color: 'neutral', size: 'large' },
      style: { background: 'ghostwhite' },
    },
  ],

  // Fallback values
  defaultVariants: {
    color: 'accent',
    size: 'medium',
  },
})
```

**Key difference from Panda/CVA**: compound variants use `{ variants: {...}, style: {...} }` shape, not `{ variantKey: value, css: {...} }`.

### Usage

```typescript
// Returns concatenated class name string
button({ color: 'brand', size: 'large' })
// => "button_base__abc123 button_color_brand__def456 button_size_large__ghi789"
```

### Type Safety

```typescript
import type { RecipeVariants } from '@vanilla-extract/recipes'

export type ButtonVariants = RecipeVariants<typeof button>
// => { color?: 'neutral' | 'brand' | 'accent'; size?: 'small' | 'medium' | 'large' }
```

All variant props are **optional** (defaults fill in missing values).

### Introspection API

- `recipe.variants()` -- returns array of variant names: `['color', 'size']`
- `recipe.classNames.base` -- the base class name string
- `recipe.classNames.variants.color.brand` -- specific variant class name

### Multi-Part / Slot Components

Vanilla Extract does **NOT** have a built-in slot recipe API. Multi-part components are handled by defining **separate recipes per part** and composing them manually:

```typescript
export const checkboxRoot = recipe({ ... })
export const checkboxControl = recipe({ ... })
export const checkboxLabel = recipe({ ... })
```

There is no automatic slot grouping or compound component generation.

### Validation

- **Build-time only.** All class names are generated during the build step.
- TypeScript enforces valid variant names and values at compile time.
- No runtime validation -- the function just maps variant values to pre-built class names.

---

## 4. Stitches (Archived, but Influential)

**Source:**
- https://stitches.dev/docs/variants
- https://stitches.dev/docs/composing-components

### Historical Significance

Stitches was one of the first CSS-in-JS libraries to formalize the variants/compoundVariants/defaultVariants pattern. Many modern systems (CVA, Panda, Chakra v3) adopted this schema from Stitches.

### Recipe Schema (via `styled()` or `css()`)

```typescript
import { styled } from '@stitches/react'

const Button = styled('button', {
  // Base styles (top-level CSS properties)
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: '4px',

  // Variant axes
  variants: {
    color: {
      violet: { backgroundColor: 'blueviolet', color: 'white' },
      gray: { backgroundColor: 'gainsboro' },
    },
    size: {
      small: { fontSize: '13px', height: '25px', paddingLeft: '10px', paddingRight: '10px' },
      large: { fontSize: '15px', height: '35px', paddingLeft: '15px', paddingRight: '15px' },
    },
    // Boolean variants use `true` as key
    outlined: {
      true: { borderColor: 'lightgray', border: '2px solid' },
    },
  },

  // Compound variants
  compoundVariants: [
    {
      color: 'violet',
      outlined: true,
      css: {
        color: 'blueviolet',
        borderColor: 'darkviolet',
      },
    },
  ],

  // Default variants
  defaultVariants: {
    color: 'violet',
  },
})

// Usage: <Button color="gray" size="small" outlined>Click</Button>
```

### Boolean Variants

Unique to Stitches (later adopted by CVA): use `true` as a variant value key:

```typescript
variants: {
  outlined: {
    true: { border: '2px solid lightgray' }
  }
}
// Usage: <Button outlined />  (presence = true)
```

### Responsive Variants

Stitches supported responsive variant values via `@initial` and breakpoint keys:

```tsx
<Button color={{ '@initial': 'gray', '@bp1': 'violet' }}>Click</Button>
```

`@initial` sets the base value; breakpoint keys override at specific widths.

### Component Composition (Extending)

Pass an existing styled component to `styled()` to extend it:

```typescript
const BaseButton = styled('button', {
  variants: {
    size: { small: {...}, large: {...} },
  },
})

const CheckoutButton = styled(BaseButton, {
  borderRadius: 0,
  backgroundColor: 'hotpink',
})

// CheckoutButton inherits `size` variant from BaseButton
<CheckoutButton size="small" />
```

Variants are **automatically inherited** by composed components.

### Multi-Part / Slot Components

Stitches did **NOT** have a slot recipe concept. Multi-part components required defining separate styled components and composing them manually.

### Validation

- **Runtime CSS-in-JS** -- styles injected at runtime.
- TypeScript provided full type safety for variant props.
- No build-time CSS extraction (this was a key reason for its eventual archival -- performance concerns).

---

## 5. CVA (Class Variance Authority)

**Sources:**
- https://cva.style/docs
- https://cva.style/docs/api-reference
- https://cva.style/docs/getting-started/variants
- https://cva.style/docs/getting-started/typescript

### Core Principle

CVA is **framework-agnostic** and **CSS-engine-agnostic**. It does not generate CSS. It maps variant selections to **class name strings** (typically Tailwind CSS classes). All CSS generation is delegated to whatever CSS framework you use.

### Recipe Schema

```typescript
import { cva } from 'class-variance-authority'

const button = cva(
  // Base classes (string, string[], or clsx-compatible value)
  "font-semibold border rounded",

  // Options
  {
    variants: {
      intent: {
        primary: "bg-blue-500 text-white border-transparent hover:bg-blue-600",
        secondary: "bg-white text-gray-800 border-gray-400 hover:bg-gray-100",
        danger: "bg-red-500 text-white border-transparent hover:bg-red-600",
      },
      size: {
        small: "text-sm py-1 px-2",
        medium: "text-base py-2 px-4",
      },
      // Boolean variants
      disabled: {
        false: null,             // null = no classes for this value
        true: "opacity-50 cursor-not-allowed",
      },
    },

    compoundVariants: [
      {
        intent: "primary",
        size: "medium",
        class: "uppercase",       // note: `class` key (not `css`)
      },
      {
        // Array targeting: matches ANY of the listed values
        intent: ["primary", "secondary"],
        size: "medium",
        class: "font-bold",
      },
    ],

    defaultVariants: {
      intent: "primary",
      size: "medium",
      disabled: false,
    },
  }
)
```

### Usage

```typescript
button()
// => "font-semibold border rounded bg-blue-500 text-white border-transparent hover:bg-blue-600 text-base py-2 px-4 uppercase"

button({ intent: 'danger', size: 'small' })
// => "font-semibold border rounded bg-red-500 text-white border-transparent hover:bg-red-600 text-sm py-1 px-2"

// Override defaults with null to remove a variant entirely
button({ intent: null })
```

### Key Schema Differences from Others

| Feature | CVA | Panda/Chakra | Vanilla Extract | Stitches |
|---------|-----|-------------|-----------------|----------|
| Base | String/string[] (class names) | Style object | Style object | Style object (inline in top level) |
| Variant values | String/string[] (class names) | Style objects | Style objects | Style objects |
| Compound key | `class` (or `className`) | `css` | `style` | `css` |
| Extending | `class` prop appending | N/A | N/A | `styled(Base, {...})` |
| Null value | Supported (removes variant) | No | No | No |

### VariantProps Type Utility

```typescript
import type { VariantProps } from 'class-variance-authority'

type ButtonProps = VariantProps<typeof button>
// => { intent?: "primary" | "secondary" | "danger" | null; size?: "small" | "medium" | null; disabled?: boolean | null }
```

All variant props are **optional** by default. To make some required:

```typescript
type ButtonVariantProps = VariantProps<typeof button>

interface ButtonProps
  extends Omit<ButtonVariantProps, 'intent'>,
    Required<Pick<ButtonVariantProps, 'intent'>> {}
```

### cx() Helper

Alias for `clsx`, bundled with CVA:

```typescript
import { cx } from 'class-variance-authority'
cx("foo", "bar", false && "baz") // => "foo bar"
```

### Multi-Part / Slot Components

CVA does **NOT** have a slot recipe concept. Multi-part components require defining separate `cva()` calls per part:

```typescript
const checkboxRoot = cva("flex items-center gap-2")
const checkboxControl = cva("border rounded", { variants: { size: { sm: "w-4 h-4", md: "w-5 h-5" } } })
const checkboxLabel = cva("text-gray-700", { variants: { size: { sm: "text-sm", md: "text-base" } } })
```

### Validation

- **No build-time validation of CSS.** CVA operates on opaque strings.
- **TypeScript** provides compile-time validation of variant names and values.
- **No runtime validation** -- returns whatever class string the variant maps to.
- The `class` values are never parsed or validated -- they are just concatenated.

---

## Comparative Summary

### Universal Schema Shape

Every system converges on the same fundamental shape:

```
{
  base:             BaseStyles,
  variants:         Record<AxisName, Record<OptionName, Styles>>,
  compoundVariants: Array<{ ...variantConditions, styles }>,
  defaultVariants:  Record<AxisName, OptionName>,
}
```

The differences are:
1. **What "Styles" means** -- CSS objects (Panda, VE, Stitches) vs class name strings (CVA)
2. **What key holds compound styles** -- `css` (Panda, Stitches), `style` (VE), `class`/`className` (CVA)
3. **Where base styles live** -- nested in `base` key (Panda, VE, CVA) vs top-level alongside variants (Stitches)

### Slot/Multi-Part Support

| System | Built-in Slots | API |
|--------|---------------|-----|
| Panda CSS | Yes | `defineSlotRecipe()` / `sva()` -- `slots` array, styles keyed per slot |
| Chakra v3 | Yes | `defineSlotRecipe()` -- identical to Panda (built on Panda) |
| Vanilla Extract | No | Define separate `recipe()` per part manually |
| Stitches | No | Define separate `styled()` per part manually |
| CVA | No | Define separate `cva()` per part manually |

### Validation Approaches

| System | Build-time CSS | Runtime CSS | TypeScript Types | Introspection API |
|--------|---------------|-------------|-----------------|-------------------|
| Panda CSS | Yes (JIT for config) | No | `RecipeVariantProps` | `variantKeys`, `variantMap`, `splitVariantProps` |
| Chakra v3 | Yes (via Panda) | No | Yes | Via Panda |
| Vanilla Extract | Yes (all at build) | No | `RecipeVariants` | `variants()`, `classNames` |
| Stitches | No | Yes (CSS-in-JS) | Yes (inferred) | No |
| CVA | No (CSS is external) | No | `VariantProps` | No |

### Boolean Variants

| System | Supported | Syntax |
|--------|-----------|--------|
| Stitches | Yes | `{ true: styles }` |
| CVA | Yes | `{ true: classes, false: null }` |
| Panda CSS | Not documented as special case | Use string "true"/"false" |
| Vanilla Extract | Not documented as special case | Use string keys |

### Responsive Variants

| System | Supported | Syntax |
|--------|-----------|--------|
| Panda CSS (config) | Yes | `{ base: 'sm', md: 'lg' }` |
| Stitches | Yes | `{ '@initial': 'sm', '@bp1': 'lg' }` |
| CVA | No | N/A |
| Vanilla Extract | No | N/A |
| Panda CSS (atomic) | No | N/A |
