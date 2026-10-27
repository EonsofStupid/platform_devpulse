# Variable: linkPreviewContract

> `const` **linkPreviewContract**: `object`

Defined in: [primitives/link-preview/contract.ts:26](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/link-preview/contract.ts#L26)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[`"aria-label"`\]

#### aria.requiredAttrs

> `readonly` **requiredAttrs**: readonly \[\] = `[]`

#### aria.role

> `readonly` **role**: `"tooltip"` = `"tooltip"`

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

> `readonly` **focusStrategy**: `"none"` = `"none"`

### keyboard

> `readonly` **keyboard**: readonly \[`"Escape"`\]

### kind

> `readonly` **kind**: `"link-preview"` = `"link-preview"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.content

> `readonly` **content**: readonly \[`"close"`\]

#### slotActions.trigger

> `readonly` **trigger**: readonly \[`"open"`\]

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slots.required

> `readonly` **required**: readonly \[`"trigger"`, `"content"`\]

### slotSpec

> `readonly` **slotSpec**: `object`

#### slotSpec.content

> `readonly` **content**: `object`

#### slotSpec.content.aria

> `readonly` **aria**: `object`

#### slotSpec.content.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`\]

#### slotSpec.content.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.content.aria.role

> `readonly` **role**: `"tooltip"` = `"tooltip"`

#### slotSpec.content.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.content.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.trigger

> `readonly` **trigger**: `object`

#### slotSpec.trigger.aria

> `readonly` **aria**: `object`

#### slotSpec.trigger.aria.optional

> `readonly` **optional**: readonly \[`"aria-describedby"`\]

#### slotSpec.trigger.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.trigger.aria.role

> `readonly` **role**: `"link"` = `"link"`

#### slotSpec.trigger.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.trigger.element

> `readonly` **element**: `"a"` = `"a"`

### slotStates

> `readonly` **slotStates**: `object`

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
