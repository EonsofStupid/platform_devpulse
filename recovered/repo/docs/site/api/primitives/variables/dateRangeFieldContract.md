# Variable: dateRangeFieldContract

> `const` **dateRangeFieldContract**: `object`

Defined in: [primitives/date-range-field/contract.ts:16](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/date-range-field/contract.ts#L16)

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

> `readonly` **kind**: `"date-range-field"` = `"date-range-field"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.end-segment

> `readonly` **end-segment**: readonly \[`"increment"`, `"decrement"`\]

#### slotActions.label

> `readonly` **label**: readonly \[\] = `[]`

#### slotActions.root

> `readonly` **root**: readonly \[\] = `[]`

#### slotActions.separator

> `readonly` **separator**: readonly \[\] = `[]`

#### slotActions.start-segment

> `readonly` **start-segment**: readonly \[`"increment"`, `"decrement"`\]

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[`"separator"`\]

#### slots.required

> `readonly` **required**: readonly \[`"root"`, `"start-segment"`, `"end-segment"`, `"label"`\]

### slotSpec

> `readonly` **slotSpec**: `object`

#### slotSpec.end-segment

> `readonly` **end-segment**: `object`

#### slotSpec.end-segment.aria

> `readonly` **aria**: `object`

#### slotSpec.end-segment.aria.optional

> `readonly` **optional**: readonly \[`"aria-valuetext"`, `"aria-label"`, `"aria-readonly"`\]

#### slotSpec.end-segment.aria.required

> `readonly` **required**: readonly \[`"aria-valuemin"`, `"aria-valuemax"`, `"aria-valuenow"`\]

#### slotSpec.end-segment.aria.role

> `readonly` **role**: `"spinbutton"` = `"spinbutton"`

#### slotSpec.end-segment.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.end-segment.element

> `readonly` **element**: `"span"` = `"span"`

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

#### slotSpec.separator

> `readonly` **separator**: `object`

#### slotSpec.separator.aria

> `readonly` **aria**: `object`

#### slotSpec.separator.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.separator.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.separator.aria.role

> `readonly` **role**: `"presentation"` = `"presentation"`

#### slotSpec.separator.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.separator.element

> `readonly` **element**: `"span"` = `"span"`

#### slotSpec.start-segment

> `readonly` **start-segment**: `object`

#### slotSpec.start-segment.aria

> `readonly` **aria**: `object`

#### slotSpec.start-segment.aria.optional

> `readonly` **optional**: readonly \[`"aria-valuetext"`, `"aria-label"`, `"aria-readonly"`\]

#### slotSpec.start-segment.aria.required

> `readonly` **required**: readonly \[`"aria-valuemin"`, `"aria-valuemax"`, `"aria-valuenow"`\]

#### slotSpec.start-segment.aria.role

> `readonly` **role**: `"spinbutton"` = `"spinbutton"`

#### slotSpec.start-segment.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.start-segment.element

> `readonly` **element**: `"span"` = `"span"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.end-segment

> `readonly` **end-segment**: readonly \[`"focused"`, `"focus-visible"`, `"disabled"`, `"readonly"`\]

#### slotStates.label

> `readonly` **label**: readonly \[\] = `[]`

#### slotStates.root

> `readonly` **root**: readonly \[`"focused"`, `"focus-visible"`, `"disabled"`, `"invalid"`, `"readonly"`\]

#### slotStates.separator

> `readonly` **separator**: readonly \[\] = `[]`

#### slotStates.start-segment

> `readonly` **start-segment**: readonly \[`"focused"`, `"focus-visible"`, `"disabled"`, `"readonly"`\]

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[`"focused"`, `"focus-visible"`, `"disabled"`, `"invalid"`, `"readonly"`\]

#### states.specific

> `readonly` **specific**: readonly \[\] = `[]`
