# Variable: colorInputContract

> `const` **colorInputContract**: `object`

Defined in: [primitives/color-input/contract.ts:16](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/color-input/contract.ts#L16)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[`"aria-labelledby"`, `"aria-label"`\]

#### aria.requiredAttrs

> `readonly` **requiredAttrs**: readonly \[\] = `[]`

#### aria.role

> `readonly` **role**: `"group"` = `"group"`

### ariaStateProvider

> `readonly` **ariaStateProvider**: `"coldlight"` = `"coldlight"`

### compound

> `readonly` **compound**: `true` = `true`

### focusStrategy

> `readonly` **focusStrategy**: `"none"` = `"none"`

### keyboard

> `readonly` **keyboard**: readonly \[`"Enter"`, `"Space"`\]

### kind

> `readonly` **kind**: `"color-input"` = `"color-input"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.input

> `readonly` **input**: readonly \[\] = `[]`

#### slotActions.label

> `readonly` **label**: readonly \[\] = `[]`

#### slotActions.root

> `readonly` **root**: readonly \[\] = `[]`

#### slotActions.swatch

> `readonly` **swatch**: readonly \[\] = `[]`

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[`"label"`\]

#### slots.required

> `readonly` **required**: readonly \[`"root"`, `"swatch"`, `"input"`\]

### slotSpec

> `readonly` **slotSpec**: `object`

#### slotSpec.input

> `readonly` **input**: `object`

#### slotSpec.input.aria

> `readonly` **aria**: `object`

#### slotSpec.input.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`, `"aria-describedby"`, `"aria-invalid"`, `"aria-required"`, `"aria-disabled"`\]

#### slotSpec.input.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.input.aria.role

> `readonly` **role**: `"none"` = `"none"`

#### slotSpec.input.children

> `readonly` **children**: `"self-closing"` = `"self-closing"`

#### slotSpec.input.element

> `readonly` **element**: `"input"` = `"input"`

#### slotSpec.label

> `readonly` **label**: `object`

#### slotSpec.label.aria

> `readonly` **aria**: `object`

#### slotSpec.label.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.label.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.label.aria.role

> `readonly` **role**: `"none"` = `"none"`

#### slotSpec.label.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.label.element

> `readonly` **element**: `"label"` = `"label"`

#### slotSpec.root

> `readonly` **root**: `object`

#### slotSpec.root.aria

> `readonly` **aria**: `object`

#### slotSpec.root.aria.optional

> `readonly` **optional**: readonly \[`"aria-labelledby"`\]

#### slotSpec.root.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.root.aria.role

> `readonly` **role**: `"group"` = `"group"`

#### slotSpec.root.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.root.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.swatch

> `readonly` **swatch**: `object`

#### slotSpec.swatch.aria

> `readonly` **aria**: `object`

#### slotSpec.swatch.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.swatch.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.swatch.aria.role

> `readonly` **role**: `"presentation"` = `"presentation"`

#### slotSpec.swatch.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.swatch.element

> `readonly` **element**: `"span"` = `"span"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.input

> `readonly` **input**: readonly \[`"focused"`, `"focus-visible"`, `"disabled"`, `"invalid"`\]

#### slotStates.label

> `readonly` **label**: readonly \[\] = `[]`

#### slotStates.root

> `readonly` **root**: readonly \[`"disabled"`, `"invalid"`\]

#### slotStates.swatch

> `readonly` **swatch**: readonly \[\] = `[]`

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[`"focused"`, `"focus-visible"`, `"disabled"`, `"invalid"`\]

#### states.specific

> `readonly` **specific**: readonly \[\] = `[]`
