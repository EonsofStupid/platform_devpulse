# Variable: treeContract

> `const` **treeContract**: `object`

Defined in: [primitives/tree/contract.ts:21](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/tree/contract.ts#L21)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[`"aria-label"`, `"aria-labelledby"`, `"aria-multiselectable"`\]

#### aria.requiredAttrs

> `readonly` **requiredAttrs**: readonly \[\] = `[]`

#### aria.role

> `readonly` **role**: `"tree"` = `"tree"`

### ariaStateProvider

> `readonly` **ariaStateProvider**: `"meltui"` = `"meltui"`

### compound

> `readonly` **compound**: `true` = `true`

### focusStrategy

> `readonly` **focusStrategy**: `"roving"` = `"roving"`

### keyboard

> `readonly` **keyboard**: readonly \[`"ArrowDown"`, `"ArrowUp"`, `"ArrowLeft"`, `"ArrowRight"`, `"Home"`, `"End"`, `"Enter"`, `"Space"`\]

### kind

> `readonly` **kind**: `"tree"` = `"tree"`

### orientation

> `readonly` **orientation**: `"vertical"` = `"vertical"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.item

> `readonly` **item**: readonly \[`"expand"`, `"collapse"`, `"toggle"`, `"select"`\]

#### slotActions.root

> `readonly` **root**: readonly \[\] = `[]`

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slots.required

> `readonly` **required**: readonly \[`"root"`, `"item"`\]

### slotSpec

> `readonly` **slotSpec**: `object`

#### slotSpec.item

> `readonly` **item**: `object`

#### slotSpec.item.aria

> `readonly` **aria**: `object`

#### slotSpec.item.aria.optional

> `readonly` **optional**: readonly \[`"aria-level"`, `"aria-setsize"`, `"aria-posinset"`, `"aria-disabled"`\]

#### slotSpec.item.aria.required

> `readonly` **required**: readonly \[`"aria-expanded"`, `"aria-selected"`\]

#### slotSpec.item.aria.role

> `readonly` **role**: `"treeitem"` = `"treeitem"`

#### slotSpec.item.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.item.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.root

> `readonly` **root**: `object`

#### slotSpec.root.aria

> `readonly` **aria**: `object`

#### slotSpec.root.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`, `"aria-labelledby"`, `"aria-multiselectable"`\]

#### slotSpec.root.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.root.aria.role

> `readonly` **role**: `"tree"` = `"tree"`

#### slotSpec.root.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.root.element

> `readonly` **element**: `"div"` = `"div"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.item

> `readonly` **item**: readonly \[`"expanded"`, `"collapsed"`, `"selected"`, `"focused"`, `"focus-visible"`, `"hover"`, `"disabled"`\]

#### slotStates.root

> `readonly` **root**: readonly \[\] = `[]`

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[`"selected"`, `"focused"`, `"focus-visible"`, `"hover"`, `"disabled"`\]

#### states.specific

> `readonly` **specific**: readonly \[`"expanded"`, `"collapsed"`\]
