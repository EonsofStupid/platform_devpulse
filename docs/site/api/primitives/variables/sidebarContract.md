# Variable: sidebarContract

> `const` **sidebarContract**: `object`

Defined in: [primitives/sidebar/contract.ts:16](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/sidebar/contract.ts#L16)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[`"aria-label"`, `"aria-labelledby"`\]

#### aria.requiredAttrs

> `readonly` **requiredAttrs**: readonly \[\] = `[]`

#### aria.role

> `readonly` **role**: `"navigation"` = `"navigation"`

### ariaStateProvider

> `readonly` **ariaStateProvider**: `"coldlight"` = `"coldlight"`

### compound

> `readonly` **compound**: `true` = `true`

### focusStrategy

> `readonly` **focusStrategy**: `"none"` = `"none"`

### keyboard

> `readonly` **keyboard**: readonly \[\] = `[]`

### kind

> `readonly` **kind**: `"sidebar"` = `"sidebar"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.content

> `readonly` **content**: readonly \[\] = `[]`

#### slotActions.footer

> `readonly` **footer**: readonly \[\] = `[]`

#### slotActions.header

> `readonly` **header**: readonly \[\] = `[]`

#### slotActions.root

> `readonly` **root**: readonly \[`"expand"`, `"collapse"`, `"toggle"`\]

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[`"header"`, `"content"`, `"footer"`\]

#### slots.required

> `readonly` **required**: readonly \[`"root"`\]

### slotSpec

> `readonly` **slotSpec**: `object`

#### slotSpec.content

> `readonly` **content**: `object`

#### slotSpec.content.aria

> `readonly` **aria**: `object`

#### slotSpec.content.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.content.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.content.aria.role

> `readonly` **role**: `"none"` = `"none"`

#### slotSpec.content.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.content.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.footer

> `readonly` **footer**: `object`

#### slotSpec.footer.aria

> `readonly` **aria**: `object`

#### slotSpec.footer.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.footer.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.footer.aria.role

> `readonly` **role**: `"none"` = `"none"`

#### slotSpec.footer.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.footer.element

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

#### slotSpec.root

> `readonly` **root**: `object`

#### slotSpec.root.aria

> `readonly` **aria**: `object`

#### slotSpec.root.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`, `"aria-labelledby"`\]

#### slotSpec.root.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.root.aria.role

> `readonly` **role**: `"navigation"` = `"navigation"`

#### slotSpec.root.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.root.element

> `readonly` **element**: `"aside"` = `"aside"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.content

> `readonly` **content**: readonly \[\] = `[]`

#### slotStates.footer

> `readonly` **footer**: readonly \[\] = `[]`

#### slotStates.header

> `readonly` **header**: readonly \[\] = `[]`

#### slotStates.root

> `readonly` **root**: readonly \[`"expanded"`, `"collapsed"`\]

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[\] = `[]`

#### states.specific

> `readonly` **specific**: readonly \[`"expanded"`, `"collapsed"`\]
