# Variable: numberInputContract

> `const` **numberInputContract**: `object`

Defined in: [primitives/number-input/contract.ts:18](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/number-input/contract.ts#L18)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[`"aria-label"`\]

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

> `readonly` **keyboard**: readonly \[`"ArrowUp"`, `"ArrowDown"`, `"Home"`, `"End"`\]

### kind

> `readonly` **kind**: `"number-input"` = `"number-input"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.decrement

> `readonly` **decrement**: readonly \[`"decrement"`\]

#### slotActions.increment

> `readonly` **increment**: readonly \[`"increment"`\]

#### slotActions.input

> `readonly` **input**: readonly \[`"focus"`, `"blur"`\]

#### slotActions.root

> `readonly` **root**: readonly \[\] = `[]`

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[`"increment"`, `"decrement"`\]

#### slots.required

> `readonly` **required**: readonly \[`"root"`, `"input"`\]

### slotSpec

> `readonly` **slotSpec**: `object`

#### slotSpec.decrement

> `readonly` **decrement**: `object`

#### slotSpec.decrement.aria

> `readonly` **aria**: `object`

#### slotSpec.decrement.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`, `"aria-disabled"`\]

#### slotSpec.decrement.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.decrement.aria.role

> `readonly` **role**: `"button"` = `"button"`

#### slotSpec.decrement.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.decrement.element

> `readonly` **element**: `"button"` = `"button"`

#### slotSpec.increment

> `readonly` **increment**: `object`

#### slotSpec.increment.aria

> `readonly` **aria**: `object`

#### slotSpec.increment.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`, `"aria-disabled"`\]

#### slotSpec.increment.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.increment.aria.role

> `readonly` **role**: `"button"` = `"button"`

#### slotSpec.increment.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.increment.element

> `readonly` **element**: `"button"` = `"button"`

#### slotSpec.input

> `readonly` **input**: `object`

#### slotSpec.input.aria

> `readonly` **aria**: `object`

#### slotSpec.input.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`, `"aria-valuetext"`, `"aria-disabled"`\]

#### slotSpec.input.aria.required

> `readonly` **required**: readonly \[`"aria-valuenow"`, `"aria-valuemin"`, `"aria-valuemax"`\]

#### slotSpec.input.aria.role

> `readonly` **role**: `"spinbutton"` = `"spinbutton"`

#### slotSpec.input.children

> `readonly` **children**: `"self-closing"` = `"self-closing"`

#### slotSpec.input.element

> `readonly` **element**: `"input"` = `"input"`

#### slotSpec.root

> `readonly` **root**: `object`

#### slotSpec.root.aria

> `readonly` **aria**: `object`

#### slotSpec.root.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`\]

#### slotSpec.root.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.root.aria.role

> `readonly` **role**: `"group"` = `"group"`

#### slotSpec.root.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.root.element

> `readonly` **element**: `"div"` = `"div"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.decrement

> `readonly` **decrement**: readonly \[`"hover"`, `"disabled"`\]

#### slotStates.increment

> `readonly` **increment**: readonly \[`"hover"`, `"disabled"`\]

#### slotStates.input

> `readonly` **input**: readonly \[`"focused"`, `"focus-visible"`, `"disabled"`\]

#### slotStates.root

> `readonly` **root**: readonly \[`"disabled"`\]

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[`"focused"`, `"focus-visible"`, `"hover"`, `"disabled"`\]

#### states.specific

> `readonly` **specific**: readonly \[\] = `[]`
