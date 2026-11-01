# Variable: dateFieldContract

> `const` **dateFieldContract**: `object`

Defined in: [primitives/date-field/contract.ts:16](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/date-field/contract.ts#L16)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[`"aria-labelledby"`, `"aria-describedby"`\]

#### aria.requiredAttrs

> `readonly` **requiredAttrs**: readonly \[\] = `[]`

#### aria.role

> `readonly` **role**: `"group"` = `"group"`

### ariaStateProvider

> `readonly` **ariaStateProvider**: `"meltui"` = `"meltui"`

### compound

> `readonly` **compound**: `true` = `true`

### focusStrategy

> `readonly` **focusStrategy**: `"roving"` = `"roving"`

### keyboard

> `readonly` **keyboard**: readonly \[`"ArrowUp"`, `"ArrowDown"`, `"ArrowLeft"`, `"ArrowRight"`, `"Tab"`, `"Enter"`\]

### kind

> `readonly` **kind**: `"date-field"` = `"date-field"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.label

> `readonly` **label**: readonly \[\] = `[]`

#### slotActions.root

> `readonly` **root**: readonly \[\] = `[]`

#### slotActions.segment

> `readonly` **segment**: readonly \[`"increment"`, `"decrement"`\]

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slots.required

> `readonly` **required**: readonly \[`"root"`, `"segment"`, `"label"`\]

### slotSpec

> `readonly` **slotSpec**: `object`

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

> `readonly` **optional**: readonly \[`"aria-labelledby"`, `"aria-describedby"`\]

#### slotSpec.root.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.root.aria.role

> `readonly` **role**: `"group"` = `"group"`

#### slotSpec.root.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.root.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.segment

> `readonly` **segment**: `object`

#### slotSpec.segment.aria

> `readonly` **aria**: `object`

#### slotSpec.segment.aria.optional

> `readonly` **optional**: readonly \[`"aria-valuetext"`, `"aria-label"`, `"aria-readonly"`\]

#### slotSpec.segment.aria.required

> `readonly` **required**: readonly \[`"aria-valuemin"`, `"aria-valuemax"`, `"aria-valuenow"`\]

#### slotSpec.segment.aria.role

> `readonly` **role**: `"spinbutton"` = `"spinbutton"`

#### slotSpec.segment.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.segment.element

> `readonly` **element**: `"span"` = `"span"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.label

> `readonly` **label**: readonly \[\] = `[]`

#### slotStates.root

> `readonly` **root**: readonly \[`"focused"`, `"focus-visible"`, `"disabled"`, `"invalid"`, `"readonly"`\]

#### slotStates.segment

> `readonly` **segment**: readonly \[`"focused"`, `"focus-visible"`, `"disabled"`, `"readonly"`\]

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[`"focused"`, `"focus-visible"`, `"disabled"`, `"invalid"`, `"readonly"`\]

#### states.specific

> `readonly` **specific**: readonly \[\] = `[]`
