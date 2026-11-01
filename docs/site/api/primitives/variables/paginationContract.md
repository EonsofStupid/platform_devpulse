# Variable: paginationContract

> `const` **paginationContract**: `object`

Defined in: [primitives/pagination/contract.ts:29](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/pagination/contract.ts#L29)

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

> `readonly` **ariaStateProvider**: `"meltui"` = `"meltui"`

### compound

> `readonly` **compound**: `true` = `true`

### focusStrategy

> `readonly` **focusStrategy**: `"roving"` = `"roving"`

### keyboard

> `readonly` **keyboard**: readonly \[`"Enter"`, `"Space"`\]

### kind

> `readonly` **kind**: `"pagination"` = `"pagination"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.ellipsis

> `readonly` **ellipsis**: readonly \[\] = `[]`

#### slotActions.next

> `readonly` **next**: readonly \[`"select"`\]

#### slotActions.page

> `readonly` **page**: readonly \[`"select"`\]

#### slotActions.previous

> `readonly` **previous**: readonly \[`"select"`\]

#### slotActions.root

> `readonly` **root**: readonly \[\] = `[]`

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[`"ellipsis"`\]

#### slots.required

> `readonly` **required**: readonly \[`"root"`, `"previous"`, `"next"`, `"page"`\]

### slotSpec

> `readonly` **slotSpec**: `object`

#### slotSpec.ellipsis

> `readonly` **ellipsis**: `object`

#### slotSpec.ellipsis.aria

> `readonly` **aria**: `object`

#### slotSpec.ellipsis.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.ellipsis.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.ellipsis.aria.role

> `readonly` **role**: `"presentation"` = `"presentation"`

#### slotSpec.ellipsis.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.ellipsis.element

> `readonly` **element**: `"span"` = `"span"`

#### slotSpec.next

> `readonly` **next**: `object`

#### slotSpec.next.aria

> `readonly` **aria**: `object`

#### slotSpec.next.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`, `"aria-disabled"`\]

#### slotSpec.next.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.next.aria.role

> `readonly` **role**: `"button"` = `"button"`

#### slotSpec.next.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.next.element

> `readonly` **element**: `"button"` = `"button"`

#### slotSpec.page

> `readonly` **page**: `object`

#### slotSpec.page.aria

> `readonly` **aria**: `object`

#### slotSpec.page.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`, `"aria-current"`, `"aria-disabled"`\]

#### slotSpec.page.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.page.aria.role

> `readonly` **role**: `"button"` = `"button"`

#### slotSpec.page.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.page.element

> `readonly` **element**: `"button"` = `"button"`

#### slotSpec.previous

> `readonly` **previous**: `object`

#### slotSpec.previous.aria

> `readonly` **aria**: `object`

#### slotSpec.previous.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`, `"aria-disabled"`\]

#### slotSpec.previous.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.previous.aria.role

> `readonly` **role**: `"button"` = `"button"`

#### slotSpec.previous.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.previous.element

> `readonly` **element**: `"button"` = `"button"`

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

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.ellipsis

> `readonly` **ellipsis**: readonly \[\] = `[]`

#### slotStates.next

> `readonly` **next**: readonly \[`"focused"`, `"focus-visible"`, `"disabled"`\]

#### slotStates.page

> `readonly` **page**: readonly \[`"selected"`, `"focused"`, `"focus-visible"`, `"disabled"`\]

#### slotStates.previous

> `readonly` **previous**: readonly \[`"focused"`, `"focus-visible"`, `"disabled"`\]

#### slotStates.root

> `readonly` **root**: readonly \[\] = `[]`

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[`"focused"`, `"focus-visible"`, `"disabled"`\]

#### states.specific

> `readonly` **specific**: readonly \[`"selected"`\]
