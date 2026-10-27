# Variable: breadcrumbContract

> `const` **breadcrumbContract**: `object`

Defined in: [primitives/breadcrumb/contract.ts:18](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/breadcrumb/contract.ts#L18)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[`"aria-label"`\]

#### aria.requiredAttrs

> `readonly` **requiredAttrs**: readonly \[\] = `[]`

#### aria.role

> `readonly` **role**: `"navigation"` = `"navigation"`

### ariaStateProvider

> `readonly` **ariaStateProvider**: `"coldlight"` = `"coldlight"`

### compound

> `readonly` **compound**: `false` = `false`

### focusStrategy

> `readonly` **focusStrategy**: `"none"` = `"none"`

### keyboard

> `readonly` **keyboard**: readonly \[\] = `[]`

### kind

> `readonly` **kind**: `"breadcrumb"` = `"breadcrumb"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.item

> `readonly` **item**: readonly \[\] = `[]`

#### slotActions.root

> `readonly` **root**: readonly \[\] = `[]`

#### slotActions.separator

> `readonly` **separator**: readonly \[\] = `[]`

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[`"item"`, `"separator"`\]

#### slots.required

> `readonly` **required**: readonly \[`"root"`\]

### slotSpec

> `readonly` **slotSpec**: `object`

#### slotSpec.item

> `readonly` **item**: `object`

#### slotSpec.item.aria

> `readonly` **aria**: `object`

#### slotSpec.item.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.item.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.item.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.item.element

> `readonly` **element**: `"li"` = `"li"`

#### slotSpec.root

> `readonly` **root**: `object`

#### slotSpec.root.aria

> `readonly` **aria**: `object`

#### slotSpec.root.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`\]

#### slotSpec.root.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.root.aria.role

> `readonly` **role**: `"navigation"` = `"navigation"`

#### slotSpec.root.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.root.element

> `readonly` **element**: `"nav"` = `"nav"`

#### slotSpec.separator

> `readonly` **separator**: `object`

#### slotSpec.separator.aria

> `readonly` **aria**: `object`

#### slotSpec.separator.aria.optional

> `readonly` **optional**: readonly \[`"aria-hidden"`\]

#### slotSpec.separator.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.separator.aria.role

> `readonly` **role**: `"presentation"` = `"presentation"`

#### slotSpec.separator.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.separator.element

> `readonly` **element**: `"span"` = `"span"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.item

> `readonly` **item**: readonly \[\] = `[]`

#### slotStates.root

> `readonly` **root**: readonly \[\] = `[]`

#### slotStates.separator

> `readonly` **separator**: readonly \[\] = `[]`

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[\] = `[]`

#### states.specific

> `readonly` **specific**: readonly \[\] = `[]`
