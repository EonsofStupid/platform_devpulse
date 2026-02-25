# Variable: avatarContract

> `const` **avatarContract**: `object`

Defined in: [primitives/avatar/contract.ts:17](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/avatar/contract.ts#L17)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[`"aria-label"`\]

#### aria.requiredAttrs

> `readonly` **requiredAttrs**: readonly \[\] = `[]`

#### aria.role

> `readonly` **role**: `"img"` = `"img"`

### ariaStateProvider

> `readonly` **ariaStateProvider**: `"meltui"` = `"meltui"`

### compound

> `readonly` **compound**: `false` = `false`

### focusStrategy

> `readonly` **focusStrategy**: `"none"` = `"none"`

### keyboard

> `readonly` **keyboard**: readonly \[\] = `[]`

### kind

> `readonly` **kind**: `"avatar"` = `"avatar"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.fallback

> `readonly` **fallback**: readonly \[\] = `[]`

#### slotActions.image

> `readonly` **image**: readonly \[\] = `[]`

#### slotActions.root

> `readonly` **root**: readonly \[\] = `[]`

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[`"image"`, `"fallback"`\]

#### slots.required

> `readonly` **required**: readonly \[`"root"`\]

### slotSpec

> `readonly` **slotSpec**: `object`

#### slotSpec.fallback

> `readonly` **fallback**: `object`

#### slotSpec.fallback.aria

> `readonly` **aria**: `object`

#### slotSpec.fallback.aria.optional

> `readonly` **optional**: readonly \[`"aria-hidden"`\]

#### slotSpec.fallback.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.fallback.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.fallback.element

> `readonly` **element**: `"span"` = `"span"`

#### slotSpec.image

> `readonly` **image**: `object`

#### slotSpec.image.aria

> `readonly` **aria**: `object`

#### slotSpec.image.aria.optional

> `readonly` **optional**: readonly \[`"aria-hidden"`\]

#### slotSpec.image.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.image.children

> `readonly` **children**: `"self-closing"` = `"self-closing"`

#### slotSpec.image.element

> `readonly` **element**: `"img"` = `"img"`

#### slotSpec.root

> `readonly` **root**: `object`

#### slotSpec.root.aria

> `readonly` **aria**: `object`

#### slotSpec.root.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`\]

#### slotSpec.root.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.root.aria.role

> `readonly` **role**: `"img"` = `"img"`

#### slotSpec.root.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.root.element

> `readonly` **element**: `"span"` = `"span"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.fallback

> `readonly` **fallback**: readonly \[\] = `[]`

#### slotStates.image

> `readonly` **image**: readonly \[`"loading"`\]

#### slotStates.root

> `readonly` **root**: readonly \[\] = `[]`

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[\] = `[]`

#### states.specific

> `readonly` **specific**: readonly \[`"loading"`, `"pending"`\]
