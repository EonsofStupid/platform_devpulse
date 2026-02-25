# Variable: inlineMessageContract

> `const` **inlineMessageContract**: `object`

Defined in: [primitives/inline-message/contract.ts:16](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/inline-message/contract.ts#L16)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[`"aria-live"`\]

#### aria.requiredAttrs

> `readonly` **requiredAttrs**: readonly \[\] = `[]`

#### aria.role

> `readonly` **role**: `"status"` = `"status"`

### ariaStateProvider

> `readonly` **ariaStateProvider**: `"coldlight"` = `"coldlight"`

### compound

> `readonly` **compound**: `false` = `false`

### focusStrategy

> `readonly` **focusStrategy**: `"none"` = `"none"`

### keyboard

> `readonly` **keyboard**: readonly \[\] = `[]`

### kind

> `readonly` **kind**: `"inline-message"` = `"inline-message"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.icon

> `readonly` **icon**: readonly \[\] = `[]`

#### slotActions.root

> `readonly` **root**: readonly \[\] = `[]`

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[`"icon"`\]

#### slots.required

> `readonly` **required**: readonly \[`"root"`\]

### slotSpec

> `readonly` **slotSpec**: `object`

#### slotSpec.icon

> `readonly` **icon**: `object`

#### slotSpec.icon.aria

> `readonly` **aria**: `object`

#### slotSpec.icon.aria.optional

> `readonly` **optional**: readonly \[`"aria-hidden"`\]

#### slotSpec.icon.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.icon.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.icon.element

> `readonly` **element**: `"span"` = `"span"`

#### slotSpec.root

> `readonly` **root**: `object`

#### slotSpec.root.aria

> `readonly` **aria**: `object`

#### slotSpec.root.aria.optional

> `readonly` **optional**: readonly \[`"aria-live"`\]

#### slotSpec.root.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.root.aria.role

> `readonly` **role**: `"status"` = `"status"`

#### slotSpec.root.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.root.element

> `readonly` **element**: `"div"` = `"div"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.icon

> `readonly` **icon**: readonly \[\] = `[]`

#### slotStates.root

> `readonly` **root**: readonly \[\] = `[]`

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[\] = `[]`

#### states.specific

> `readonly` **specific**: readonly \[\] = `[]`
