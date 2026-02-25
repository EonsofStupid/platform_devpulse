# Variable: sliderContract

> `const` **sliderContract**: `object`

Defined in: [primitives/slider/contract.ts:19](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/slider/contract.ts#L19)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[`"aria-label"`, `"aria-valuetext"`, `"aria-orientation"`, `"aria-disabled"`\]

#### aria.requiredAttrs

> `readonly` **requiredAttrs**: readonly \[`"aria-valuenow"`, `"aria-valuemin"`, `"aria-valuemax"`\]

#### aria.role

> `readonly` **role**: `"slider"` = `"slider"`

### ariaStateProvider

> `readonly` **ariaStateProvider**: `"meltui"` = `"meltui"`

### compound

> `readonly` **compound**: `true` = `true`

### focusStrategy

> `readonly` **focusStrategy**: `"none"` = `"none"`

### keyboard

> `readonly` **keyboard**: readonly \[`"ArrowUp"`, `"ArrowDown"`, `"ArrowLeft"`, `"ArrowRight"`, `"Home"`, `"End"`, `"PageUp"`, `"PageDown"`\]

### kind

> `readonly` **kind**: `"slider"` = `"slider"`

### orientation

> `readonly` **orientation**: `"horizontal"` = `"horizontal"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.range

> `readonly` **range**: readonly \[\] = `[]`

#### slotActions.root

> `readonly` **root**: readonly \[\] = `[]`

#### slotActions.thumb

> `readonly` **thumb**: readonly \[`"increment"`, `"decrement"`\]

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[`"range"`\]

#### slots.required

> `readonly` **required**: readonly \[`"root"`, `"thumb"`\]

### slotSpec

> `readonly` **slotSpec**: `object`

#### slotSpec.range

> `readonly` **range**: `object`

#### slotSpec.range.aria

> `readonly` **aria**: `object`

#### slotSpec.range.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.range.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.range.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.range.element

> `readonly` **element**: `"span"` = `"span"`

#### slotSpec.root

> `readonly` **root**: `object`

#### slotSpec.root.aria

> `readonly` **aria**: `object`

#### slotSpec.root.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`, `"aria-labelledby"`\]

#### slotSpec.root.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.root.aria.role

> `readonly` **role**: `"none"` = `"none"`

#### slotSpec.root.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.root.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.thumb

> `readonly` **thumb**: `object`

#### slotSpec.thumb.aria

> `readonly` **aria**: `object`

#### slotSpec.thumb.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`, `"aria-valuetext"`, `"aria-orientation"`, `"aria-disabled"`\]

#### slotSpec.thumb.aria.required

> `readonly` **required**: readonly \[`"aria-valuenow"`, `"aria-valuemin"`, `"aria-valuemax"`\]

#### slotSpec.thumb.aria.role

> `readonly` **role**: `"slider"` = `"slider"`

#### slotSpec.thumb.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.thumb.element

> `readonly` **element**: `"span"` = `"span"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.range

> `readonly` **range**: readonly \[\] = `[]`

#### slotStates.root

> `readonly` **root**: readonly \[`"disabled"`\]

#### slotStates.thumb

> `readonly` **thumb**: readonly \[`"focused"`, `"focus-visible"`, `"hover"`, `"disabled"`\]

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[`"focused"`, `"focus-visible"`, `"hover"`, `"disabled"`\]

#### states.specific

> `readonly` **specific**: readonly \[\] = `[]`
