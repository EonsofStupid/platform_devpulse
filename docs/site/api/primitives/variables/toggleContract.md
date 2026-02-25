# Variable: toggleContract

> `const` **toggleContract**: `object`

Defined in: [primitives/toggle/contract.ts:17](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/toggle/contract.ts#L17)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[`"aria-label"`, `"aria-disabled"`\]

#### aria.requiredAttrs

> `readonly` **requiredAttrs**: readonly \[`"aria-pressed"`\]

#### aria.role

> `readonly` **role**: `"button"` = `"button"`

### ariaStateProvider

> `readonly` **ariaStateProvider**: `"meltui"` = `"meltui"`

### compound

> `readonly` **compound**: `false` = `false`

### focusStrategy

> `readonly` **focusStrategy**: `"none"` = `"none"`

### keyboard

> `readonly` **keyboard**: readonly \[`"Enter"`, `"Space"`\]

### kind

> `readonly` **kind**: `"toggle"` = `"toggle"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.trigger

> `readonly` **trigger**: readonly \[`"toggle"`\]

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slots.required

> `readonly` **required**: readonly \[`"trigger"`\]

### slotSpec

> `readonly` **slotSpec**: `object`

#### slotSpec.trigger

> `readonly` **trigger**: `object`

#### slotSpec.trigger.aria

> `readonly` **aria**: `object`

#### slotSpec.trigger.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`, `"aria-disabled"`\]

#### slotSpec.trigger.aria.required

> `readonly` **required**: readonly \[`"aria-pressed"`\]

#### slotSpec.trigger.aria.role

> `readonly` **role**: `"button"` = `"button"`

#### slotSpec.trigger.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.trigger.element

> `readonly` **element**: `"button"` = `"button"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.trigger

> `readonly` **trigger**: readonly \[`"pressed"`, `"focused"`, `"focus-visible"`, `"hover"`, `"disabled"`\]

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[`"focused"`, `"focus-visible"`, `"hover"`, `"disabled"`\]

#### states.specific

> `readonly` **specific**: readonly \[`"pressed"`\]
