# Variable: notificationCenterContract

> `const` **notificationCenterContract**: `object`

Defined in: [primitives/notification-center/contract.ts:16](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/notification-center/contract.ts#L16)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[`"aria-label"`, `"aria-labelledby"`, `"aria-relevant"`, `"aria-atomic"`\]

#### aria.requiredAttrs

> `readonly` **requiredAttrs**: readonly \[`"aria-live"`\]

#### aria.role

> `readonly` **role**: `"log"` = `"log"`

### ariaStateProvider

> `readonly` **ariaStateProvider**: `"coldlight"` = `"coldlight"`

### compound

> `readonly` **compound**: `true` = `true`

### focusStrategy

> `readonly` **focusStrategy**: `"none"` = `"none"`

### keyboard

> `readonly` **keyboard**: readonly \[`"Escape"`\]

### kind

> `readonly` **kind**: `"notification-center"` = `"notification-center"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.action

> `readonly` **action**: readonly \[\] = `[]`

#### slotActions.empty

> `readonly` **empty**: readonly \[\] = `[]`

#### slotActions.header

> `readonly` **header**: readonly \[\] = `[]`

#### slotActions.item

> `readonly` **item**: readonly \[`"dismiss"`\]

#### slotActions.list

> `readonly` **list**: readonly \[\] = `[]`

#### slotActions.root

> `readonly` **root**: readonly \[`"open"`, `"close"`, `"toggle"`\]

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[`"header"`, `"list"`, `"item"`, `"action"`, `"empty"`\]

#### slots.required

> `readonly` **required**: readonly \[`"root"`\]

### slotSpec

> `readonly` **slotSpec**: `object`

#### slotSpec.action

> `readonly` **action**: `object`

#### slotSpec.action.aria

> `readonly` **aria**: `object`

#### slotSpec.action.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`\]

#### slotSpec.action.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.action.aria.role

> `readonly` **role**: `"button"` = `"button"`

#### slotSpec.action.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.action.element

> `readonly` **element**: `"button"` = `"button"`

#### slotSpec.empty

> `readonly` **empty**: `object`

#### slotSpec.empty.aria

> `readonly` **aria**: `object`

#### slotSpec.empty.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.empty.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.empty.aria.role

> `readonly` **role**: `"status"` = `"status"`

#### slotSpec.empty.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.empty.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.header

> `readonly` **header**: `object`

#### slotSpec.header.aria

> `readonly` **aria**: `object`

#### slotSpec.header.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.header.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.header.aria.role

> `readonly` **role**: `"none"` = `"none"`

#### slotSpec.header.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.header.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.item

> `readonly` **item**: `object`

#### slotSpec.item.aria

> `readonly` **aria**: `object`

#### slotSpec.item.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`\]

#### slotSpec.item.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.item.aria.role

> `readonly` **role**: `"none"` = `"none"`

#### slotSpec.item.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.item.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.list

> `readonly` **list**: `object`

#### slotSpec.list.aria

> `readonly` **aria**: `object`

#### slotSpec.list.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.list.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.list.aria.role

> `readonly` **role**: `"none"` = `"none"`

#### slotSpec.list.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.list.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.root

> `readonly` **root**: `object`

#### slotSpec.root.aria

> `readonly` **aria**: `object`

#### slotSpec.root.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`, `"aria-labelledby"`, `"aria-relevant"`, `"aria-atomic"`\]

#### slotSpec.root.aria.required

> `readonly` **required**: readonly \[`"aria-live"`\]

#### slotSpec.root.aria.role

> `readonly` **role**: `"log"` = `"log"`

#### slotSpec.root.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.root.element

> `readonly` **element**: `"div"` = `"div"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.action

> `readonly` **action**: readonly \[\] = `[]`

#### slotStates.empty

> `readonly` **empty**: readonly \[\] = `[]`

#### slotStates.header

> `readonly` **header**: readonly \[\] = `[]`

#### slotStates.item

> `readonly` **item**: readonly \[\] = `[]`

#### slotStates.list

> `readonly` **list**: readonly \[\] = `[]`

#### slotStates.root

> `readonly` **root**: readonly \[`"open"`, `"closed"`\]

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[\] = `[]`

#### states.specific

> `readonly` **specific**: readonly \[`"open"`, `"closed"`\]
