# Variable: checkboxContract

> `const` **checkboxContract**: `object`

Defined in: [primitives/checkbox/contract.ts:24](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/checkbox/contract.ts#L24)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[`"aria-label"`, `"aria-labelledby"`, `"aria-describedby"`, `"aria-disabled"`\]

#### aria.requiredAttrs

> `readonly` **requiredAttrs**: readonly \[`"aria-checked"`\]

#### aria.role

> `readonly` **role**: `"checkbox"` = `"checkbox"`

### ariaStateProvider

> `readonly` **ariaStateProvider**: `"coldlight"` = `"coldlight"`

### compound

> `readonly` **compound**: `false` = `false`

### focusStrategy

> `readonly` **focusStrategy**: `"none"` = `"none"`

### keyboard

> `readonly` **keyboard**: readonly \[`"Space"`\]

### kind

> `readonly` **kind**: `"checkbox"` = `"checkbox"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.indicator

> `readonly` **indicator**: readonly \[\] = `[]`

#### slotActions.label

> `readonly` **label**: readonly \[\] = `[]`

#### slotActions.root

> `readonly` **root**: readonly \[`"check"`, `"uncheck"`, `"toggle"`\]

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[`"indicator"`, `"label"`\]

#### slots.required

> `readonly` **required**: readonly \[`"root"`\]

### slotSpec

> `readonly` **slotSpec**: `object`

#### slotSpec.indicator

> `readonly` **indicator**: `object`

#### slotSpec.indicator.aria

> `readonly` **aria**: `object`

#### slotSpec.indicator.aria.optional

> `readonly` **optional**: readonly \[`"aria-hidden"`\]

#### slotSpec.indicator.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.indicator.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.indicator.element

> `readonly` **element**: `"span"` = `"span"`

#### slotSpec.label

> `readonly` **label**: `object`

#### slotSpec.label.aria

> `readonly` **aria**: `object`

#### slotSpec.label.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.label.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.label.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.label.element

> `readonly` **element**: `"span"` = `"span"`

#### slotSpec.root

> `readonly` **root**: `object`

#### slotSpec.root.aria

> `readonly` **aria**: `object`

#### slotSpec.root.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`, `"aria-labelledby"`, `"aria-describedby"`, `"aria-disabled"`\]

#### slotSpec.root.aria.required

> `readonly` **required**: readonly \[`"aria-checked"`\]

#### slotSpec.root.aria.role

> `readonly` **role**: `"checkbox"` = `"checkbox"`

#### slotSpec.root.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.root.element

> `readonly` **element**: `"button"` = `"button"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.indicator

> `readonly` **indicator**: readonly \[`"checked"`, `"indeterminate"`\]

#### slotStates.label

> `readonly` **label**: readonly \[`"disabled"`\]

#### slotStates.root

> `readonly` **root**: readonly \[`"checked"`, `"indeterminate"`, `"focused"`, `"focus-visible"`, `"hover"`, `"disabled"`\]

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[`"focused"`, `"focus-visible"`, `"hover"`, `"disabled"`\]

#### states.specific

> `readonly` **specific**: readonly \[`"checked"`, `"indeterminate"`\]
