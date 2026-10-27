# Variable: sheetContract

> `const` **sheetContract**: `object`

Defined in: [primitives/sheet/contract.ts:20](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/sheet/contract.ts#L20)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[`"aria-label"`, `"aria-labelledby"`\]

#### aria.requiredAttrs

> `readonly` **requiredAttrs**: readonly \[`"aria-modal"`\]

#### aria.role

> `readonly` **role**: `"dialog"` = `"dialog"`

### ariaStateProvider

> `readonly` **ariaStateProvider**: `"coldlight"` = `"coldlight"`

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

> `readonly` **kind**: `"sheet"` = `"sheet"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.close

> `readonly` **close**: readonly \[`"close"`\]

#### slotActions.content

> `readonly` **content**: readonly \[\] = `[]`

#### slotActions.overlay

> `readonly` **overlay**: readonly \[`"close"`\]

#### slotActions.trigger

> `readonly` **trigger**: readonly \[`"open"`\]

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[`"overlay"`, `"close"`\]

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

> `readonly` **optional**: readonly \[`"aria-label"`, `"aria-labelledby"`\]

#### slotSpec.content.aria.required

> `readonly` **required**: readonly \[`"aria-modal"`\]

#### slotSpec.content.aria.role

> `readonly` **role**: `"dialog"` = `"dialog"`

#### slotSpec.content.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.content.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.overlay

> `readonly` **overlay**: `object`

#### slotSpec.overlay.aria

> `readonly` **aria**: `object`

#### slotSpec.overlay.aria.optional

> `readonly` **optional**: readonly \[`"aria-hidden"`\]

#### slotSpec.overlay.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.overlay.aria.role

> `readonly` **role**: `"presentation"` = `"presentation"`

#### slotSpec.overlay.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.overlay.element

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

#### slotStates.close

> `readonly` **close**: readonly \[`"focused"`, `"focus-visible"`\]

#### slotStates.content

> `readonly` **content**: readonly \[`"open"`, `"closed"`\]

#### slotStates.overlay

> `readonly` **overlay**: readonly \[`"open"`, `"closed"`\]

#### slotStates.trigger

> `readonly` **trigger**: readonly \[`"focused"`, `"focus-visible"`\]

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[`"focused"`, `"focus-visible"`\]

#### states.specific

> `readonly` **specific**: readonly \[`"open"`, `"closed"`\]
