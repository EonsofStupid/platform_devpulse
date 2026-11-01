# Variable: dialogContract

> `const` **dialogContract**: `object`

Defined in: [primitives/dialog/contract.ts:21](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/dialog/contract.ts#L21)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[`"aria-labelledby"`, `"aria-describedby"`, `"aria-label"`\]

#### aria.requiredAttrs

> `readonly` **requiredAttrs**: readonly \[`"aria-modal"`\]

#### aria.role

> `readonly` **role**: `"dialog"` = `"dialog"`

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

> `readonly` **keyboard**: readonly \[`"Escape"`, `"Tab"`\]

### kind

> `readonly` **kind**: `"dialog"` = `"dialog"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.close

> `readonly` **close**: readonly \[`"close"`\]

#### slotActions.content

> `readonly` **content**: readonly \[\] = `[]`

#### slotActions.description

> `readonly` **description**: readonly \[\] = `[]`

#### slotActions.overlay

> `readonly` **overlay**: readonly \[\] = `[]`

#### slotActions.title

> `readonly` **title**: readonly \[\] = `[]`

#### slotActions.trigger

> `readonly` **trigger**: readonly \[`"open"`\]

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[`"overlay"`, `"title"`, `"description"`, `"close"`\]

#### slots.required

> `readonly` **required**: readonly \[`"trigger"`, `"content"`\]

### slotSpec

> `readonly` **slotSpec**: `object`

#### slotSpec.close

> `readonly` **close**: `object`

#### slotSpec.close.aria

> `readonly` **aria**: `object`

#### slotSpec.close.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`\]

#### slotSpec.close.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.close.aria.role

> `readonly` **role**: `"button"` = `"button"`

#### slotSpec.close.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.close.element

> `readonly` **element**: `"button"` = `"button"`

#### slotSpec.content

> `readonly` **content**: `object`

#### slotSpec.content.aria

> `readonly` **aria**: `object`

#### slotSpec.content.aria.optional

> `readonly` **optional**: readonly \[`"aria-labelledby"`, `"aria-describedby"`, `"aria-label"`\]

#### slotSpec.content.aria.required

> `readonly` **required**: readonly \[`"aria-modal"`\]

#### slotSpec.content.aria.role

> `readonly` **role**: `"dialog"` = `"dialog"`

#### slotSpec.content.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.content.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.description

> `readonly` **description**: `object`

#### slotSpec.description.aria

> `readonly` **aria**: `object`

#### slotSpec.description.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.description.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.description.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.description.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.overlay

> `readonly` **overlay**: `object`

#### slotSpec.overlay.aria

> `readonly` **aria**: `object`

#### slotSpec.overlay.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.overlay.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.overlay.children

> `readonly` **children**: `"self-closing"` = `"self-closing"`

#### slotSpec.overlay.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.title

> `readonly` **title**: `object`

#### slotSpec.title.aria

> `readonly` **aria**: `object`

#### slotSpec.title.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.title.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.title.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.title.element

> `readonly` **element**: `"h2"` = `"h2"`

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

#### slotStates.close

> `readonly` **close**: readonly \[`"focused"`, `"focus-visible"`\]

#### slotStates.content

> `readonly` **content**: readonly \[`"open"`, `"closed"`\]

#### slotStates.description

> `readonly` **description**: readonly \[\] = `[]`

#### slotStates.overlay

> `readonly` **overlay**: readonly \[`"open"`, `"closed"`\]

#### slotStates.title

> `readonly` **title**: readonly \[\] = `[]`

#### slotStates.trigger

> `readonly` **trigger**: readonly \[`"focused"`, `"focus-visible"`\]

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[`"focused"`, `"focus-visible"`\]

#### states.specific

> `readonly` **specific**: readonly \[`"open"`, `"closed"`\]
