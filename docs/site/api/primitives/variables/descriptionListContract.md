# Variable: descriptionListContract

> `const` **descriptionListContract**: `object`

Defined in: [primitives/description-list/contract.ts:18](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/description-list/contract.ts#L18)

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

> `readonly` **ariaStateProvider**: `"coldlight"` = `"coldlight"`

### compound

> `readonly` **compound**: `false` = `false`

### focusStrategy

> `readonly` **focusStrategy**: `"none"` = `"none"`

### keyboard

> `readonly` **keyboard**: readonly \[\] = `[]`

### kind

> `readonly` **kind**: `"description-list"` = `"description-list"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.detail

> `readonly` **detail**: readonly \[\] = `[]`

#### slotActions.root

> `readonly` **root**: readonly \[\] = `[]`

#### slotActions.term

> `readonly` **term**: readonly \[\] = `[]`

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[`"term"`, `"detail"`\]

#### slots.required

> `readonly` **required**: readonly \[`"root"`\]

### slotSpec

> `readonly` **slotSpec**: `object`

#### slotSpec.detail

> `readonly` **detail**: `object`

#### slotSpec.detail.aria

> `readonly` **aria**: `object`

#### slotSpec.detail.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.detail.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.detail.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.detail.element

> `readonly` **element**: `"dd"` = `"dd"`

#### slotSpec.root

> `readonly` **root**: `object`

#### slotSpec.root.aria

> `readonly` **aria**: `object`

#### slotSpec.root.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.root.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.root.aria.role

> `readonly` **role**: `"none"` = `"none"`

#### slotSpec.root.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.root.element

> `readonly` **element**: `"dl"` = `"dl"`

#### slotSpec.term

> `readonly` **term**: `object`

#### slotSpec.term.aria

> `readonly` **aria**: `object`

#### slotSpec.term.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.term.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.term.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.term.element

> `readonly` **element**: `"dt"` = `"dt"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.detail

> `readonly` **detail**: readonly \[\] = `[]`

#### slotStates.root

> `readonly` **root**: readonly \[\] = `[]`

#### slotStates.term

> `readonly` **term**: readonly \[\] = `[]`

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[\] = `[]`

#### states.specific

> `readonly` **specific**: readonly \[\] = `[]`
