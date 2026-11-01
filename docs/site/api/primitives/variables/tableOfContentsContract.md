# Variable: tableOfContentsContract

> `const` **tableOfContentsContract**: `object`

Defined in: [primitives/table-of-contents/contract.ts:15](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/table-of-contents/contract.ts#L15)

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

> `readonly` **keyboard**: readonly \[`"Enter"`\]

### kind

> `readonly` **kind**: `"table-of-contents"` = `"table-of-contents"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.item

> `readonly` **item**: readonly \[\] = `[]`

#### slotActions.link

> `readonly` **link**: readonly \[`"select"`\]

#### slotActions.root

> `readonly` **root**: readonly \[\] = `[]`

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slots.required

> `readonly` **required**: readonly \[`"root"`, `"item"`, `"link"`\]

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

#### slotSpec.item.aria.role

> `readonly` **role**: `"none"` = `"none"`

#### slotSpec.item.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.item.element

> `readonly` **element**: `"li"` = `"li"`

#### slotSpec.link

> `readonly` **link**: `object`

#### slotSpec.link.aria

> `readonly` **aria**: `object`

#### slotSpec.link.aria.optional

> `readonly` **optional**: readonly \[`"aria-current"`\]

#### slotSpec.link.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.link.aria.role

> `readonly` **role**: `"link"` = `"link"`

#### slotSpec.link.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.link.element

> `readonly` **element**: `"a"` = `"a"`

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

> `readonly` **element**: `"nav"` = `"nav"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.item

> `readonly` **item**: readonly \[`"active"`\]

#### slotStates.link

> `readonly` **link**: readonly \[`"focused"`, `"focus-visible"`, `"active"`\]

#### slotStates.root

> `readonly` **root**: readonly \[\] = `[]`

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[`"focused"`, `"focus-visible"`\]

#### states.specific

> `readonly` **specific**: readonly \[`"active"`\]
