# Variable: dateRangePickerContract

> `const` **dateRangePickerContract**: `object`

Defined in: [primitives/date-range-picker/contract.ts:16](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/date-range-picker/contract.ts#L16)

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

> `readonly` **ariaStateProvider**: `"meltui"` = `"meltui"`

### compound

> `readonly` **compound**: `true` = `true`

### dismissBehavior

> `readonly` **dismissBehavior**: `object`

#### dismissBehavior.escape

> `readonly` **escape**: `true` = `true`

#### dismissBehavior.outsideClick

> `readonly` **outsideClick**: `true` = `true`

### focusStrategy

> `readonly` **focusStrategy**: `"trap"` = `"trap"`

### keyboard

> `readonly` **keyboard**: readonly \[`"Escape"`, `"Enter"`, `"Space"`, `"ArrowUp"`, `"ArrowDown"`, `"ArrowLeft"`, `"ArrowRight"`, `"Tab"`\]

### kind

> `readonly` **kind**: `"date-range-picker"` = `"date-range-picker"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.calendar

> `readonly` **calendar**: readonly \[\] = `[]`

#### slotActions.content

> `readonly` **content**: readonly \[\] = `[]`

#### slotActions.end-field

> `readonly` **end-field**: readonly \[\] = `[]`

#### slotActions.label

> `readonly` **label**: readonly \[\] = `[]`

#### slotActions.root

> `readonly` **root**: readonly \[\] = `[]`

#### slotActions.start-field

> `readonly` **start-field**: readonly \[\] = `[]`

#### slotActions.trigger

> `readonly` **trigger**: readonly \[`"open"`, `"toggle"`\]

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[`"label"`\]

#### slots.required

> `readonly` **required**: readonly \[`"root"`, `"start-field"`, `"end-field"`, `"trigger"`, `"content"`, `"calendar"`\]

### slotSpec

> `readonly` **slotSpec**: `object`

#### slotSpec.calendar

> `readonly` **calendar**: `object`

#### slotSpec.calendar.aria

> `readonly` **aria**: `object`

#### slotSpec.calendar.aria.optional

> `readonly` **optional**: readonly \[`"aria-labelledby"`\]

#### slotSpec.calendar.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.calendar.aria.role

> `readonly` **role**: `"grid"` = `"grid"`

#### slotSpec.calendar.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.calendar.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.content

> `readonly` **content**: `object`

#### slotSpec.content.aria

> `readonly` **aria**: `object`

#### slotSpec.content.aria.optional

> `readonly` **optional**: readonly \[`"aria-labelledby"`, `"aria-label"`\]

#### slotSpec.content.aria.required

> `readonly` **required**: readonly \[`"aria-modal"`\]

#### slotSpec.content.aria.role

> `readonly` **role**: `"dialog"` = `"dialog"`

#### slotSpec.content.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.content.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.end-field

> `readonly` **end-field**: `object`

#### slotSpec.end-field.aria

> `readonly` **aria**: `object`

#### slotSpec.end-field.aria.optional

> `readonly` **optional**: readonly \[`"aria-labelledby"`, `"aria-describedby"`\]

#### slotSpec.end-field.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.end-field.aria.role

> `readonly` **role**: `"group"` = `"group"`

#### slotSpec.end-field.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.end-field.element

> `readonly` **element**: `"div"` = `"div"`

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

#### slotSpec.start-field

> `readonly` **start-field**: `object`

#### slotSpec.start-field.aria

> `readonly` **aria**: `object`

#### slotSpec.start-field.aria.optional

> `readonly` **optional**: readonly \[`"aria-labelledby"`, `"aria-describedby"`\]

#### slotSpec.start-field.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.start-field.aria.role

> `readonly` **role**: `"group"` = `"group"`

#### slotSpec.start-field.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.start-field.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.trigger

> `readonly` **trigger**: `object`

#### slotSpec.trigger.aria

> `readonly` **aria**: `object`

#### slotSpec.trigger.aria.optional

> `readonly` **optional**: readonly \[`"aria-expanded"`, `"aria-controls"`, `"aria-label"`\]

#### slotSpec.trigger.aria.required

> `readonly` **required**: readonly \[`"aria-haspopup"`\]

#### slotSpec.trigger.aria.role

> `readonly` **role**: `"button"` = `"button"`

#### slotSpec.trigger.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.trigger.element

> `readonly` **element**: `"button"` = `"button"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.calendar

> `readonly` **calendar**: readonly \[\] = `[]`

#### slotStates.content

> `readonly` **content**: readonly \[`"open"`, `"closed"`\]

#### slotStates.end-field

> `readonly` **end-field**: readonly \[`"focused"`, `"focus-visible"`, `"disabled"`, `"invalid"`\]

#### slotStates.label

> `readonly` **label**: readonly \[\] = `[]`

#### slotStates.root

> `readonly` **root**: readonly \[`"disabled"`, `"invalid"`\]

#### slotStates.start-field

> `readonly` **start-field**: readonly \[`"focused"`, `"focus-visible"`, `"disabled"`, `"invalid"`\]

#### slotStates.trigger

> `readonly` **trigger**: readonly \[`"focused"`, `"focus-visible"`, `"open"`, `"closed"`\]

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[`"focused"`, `"focus-visible"`, `"disabled"`, `"invalid"`\]

#### states.specific

> `readonly` **specific**: readonly \[`"open"`, `"closed"`\]
