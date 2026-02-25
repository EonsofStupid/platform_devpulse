# Variable: popoverContract

> `const` **popoverContract**: `object`

Defined in: [primitives/popover/contract.ts:19](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/popover/contract.ts#L19)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[\] = `[]`

#### aria.requiredAttrs

> `readonly` **requiredAttrs**: readonly \[\] = `[]`

#### aria.role

> `readonly` **role**: `"none"` = `"none"`

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

> `readonly` **focusStrategy**: `"redirect"` = `"redirect"`

### keyboard

> `readonly` **keyboard**: readonly \[`"Escape"`, `"Tab"`\]

### kind

> `readonly` **kind**: `"popover"` = `"popover"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.arrow

> `readonly` **arrow**: readonly \[\] = `[]`

#### slotActions.content

> `readonly` **content**: readonly \[\] = `[]`

#### slotActions.trigger

> `readonly` **trigger**: readonly \[`"toggle"`\]

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[`"arrow"`\]

#### slots.required

> `readonly` **required**: readonly \[`"trigger"`, `"content"`\]

### slotSpec

> `readonly` **slotSpec**: `object`

#### slotSpec.arrow

> `readonly` **arrow**: `object`

#### slotSpec.arrow.aria

> `readonly` **aria**: `object`

#### slotSpec.arrow.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.arrow.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.arrow.children

> `readonly` **children**: `"self-closing"` = `"self-closing"`

#### slotSpec.arrow.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.content

> `readonly` **content**: `object`

#### slotSpec.content.aria

> `readonly` **aria**: `object`

#### slotSpec.content.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`, `"aria-labelledby"`\]

#### slotSpec.content.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.content.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.content.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.trigger

> `readonly` **trigger**: `object`

#### slotSpec.trigger.aria

> `readonly` **aria**: `object`

#### slotSpec.trigger.aria.optional

> `readonly` **optional**: readonly \[`"aria-haspopup"`, `"aria-expanded"`, `"aria-controls"`\]

#### slotSpec.trigger.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.trigger.aria.role

> `readonly` **role**: `"button"` = `"button"`

#### slotSpec.trigger.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.trigger.element

> `readonly` **element**: `"button"` = `"button"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.arrow

> `readonly` **arrow**: readonly \[\] = `[]`

#### slotStates.content

> `readonly` **content**: readonly \[`"open"`, `"closed"`\]

#### slotStates.trigger

> `readonly` **trigger**: readonly \[`"focused"`, `"focus-visible"`\]

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[`"focused"`, `"focus-visible"`\]

#### states.specific

> `readonly` **specific**: readonly \[`"open"`, `"closed"`\]
