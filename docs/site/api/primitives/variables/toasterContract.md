# Variable: toasterContract

> `const` **toasterContract**: `object`

Defined in: [primitives/toaster/contract.ts:20](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/toaster/contract.ts#L20)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[`"aria-live"`\]

#### aria.requiredAttrs

> `readonly` **requiredAttrs**: readonly \[`"aria-label"`\]

#### aria.role

> `readonly` **role**: `"region"` = `"region"`

### ariaStateProvider

> `readonly` **ariaStateProvider**: `"meltui"` = `"meltui"`

### compound

> `readonly` **compound**: `true` = `true`

### dismissBehavior

> `readonly` **dismissBehavior**: `object`

#### dismissBehavior.escape

> `readonly` **escape**: `true` = `true`

#### dismissBehavior.outsideClick

> `readonly` **outsideClick**: `false` = `false`

### focusStrategy

> `readonly` **focusStrategy**: `"none"` = `"none"`

### keyboard

> `readonly` **keyboard**: readonly \[`"Escape"`\]

### kind

> `readonly` **kind**: `"toaster"` = `"toaster"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.close

> `readonly` **close**: readonly \[`"dismiss"`\]

#### slotActions.content

> `readonly` **content**: readonly \[`"dismiss"`\]

#### slotActions.description

> `readonly` **description**: readonly \[\] = `[]`

#### slotActions.root

> `readonly` **root**: readonly \[\] = `[]`

#### slotActions.title

> `readonly` **title**: readonly \[\] = `[]`

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[`"title"`, `"description"`\]

#### slots.required

> `readonly` **required**: readonly \[`"root"`, `"content"`, `"close"`\]

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

> `readonly` **optional**: readonly \[`"aria-live"`, `"aria-atomic"`\]

#### slotSpec.content.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.content.aria.role

> `readonly` **role**: `"status"` = `"status"`

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

#### slotSpec.root

> `readonly` **root**: `object`

#### slotSpec.root.aria

> `readonly` **aria**: `object`

#### slotSpec.root.aria.optional

> `readonly` **optional**: readonly \[`"aria-live"`\]

#### slotSpec.root.aria.required

> `readonly` **required**: readonly \[`"aria-label"`\]

#### slotSpec.root.aria.role

> `readonly` **role**: `"region"` = `"region"`

#### slotSpec.root.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.root.element

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

> `readonly` **element**: `"div"` = `"div"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.close

> `readonly` **close**: readonly \[`"focused"`, `"focus-visible"`\]

#### slotStates.content

> `readonly` **content**: readonly \[`"open"`, `"closed"`\]

#### slotStates.description

> `readonly` **description**: readonly \[\] = `[]`

#### slotStates.root

> `readonly` **root**: readonly \[\] = `[]`

#### slotStates.title

> `readonly` **title**: readonly \[\] = `[]`

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[`"focused"`, `"focus-visible"`\]

#### states.specific

> `readonly` **specific**: readonly \[`"open"`, `"closed"`\]
