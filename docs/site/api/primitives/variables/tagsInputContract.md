# Variable: tagsInputContract

> `const` **tagsInputContract**: `object`

Defined in: [primitives/tags-input/contract.ts:31](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/tags-input/contract.ts#L31)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[`"aria-labelledby"`, `"aria-label"`\]

#### aria.requiredAttrs

> `readonly` **requiredAttrs**: readonly \[\] = `[]`

#### aria.role

> `readonly` **role**: `"none"` = `"none"`

### ariaStateProvider

> `readonly` **ariaStateProvider**: `"meltui"` = `"meltui"`

### compound

> `readonly` **compound**: `true` = `true`

### focusStrategy

> `readonly` **focusStrategy**: `"roving"` = `"roving"`

### keyboard

> `readonly` **keyboard**: readonly \[`"Enter"`, `"Backspace"`, `"Delete"`, `"ArrowLeft"`, `"ArrowRight"`\]

### kind

> `readonly` **kind**: `"tags-input"` = `"tags-input"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.input

> `readonly` **input**: readonly \[\] = `[]`

#### slotActions.root

> `readonly` **root**: readonly \[\] = `[]`

#### slotActions.tag

> `readonly` **tag**: readonly \[`"select"`, `"deselect"`\]

#### slotActions.tag-delete

> `readonly` **tag-delete**: readonly \[`"dismiss"`\]

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slots.required

> `readonly` **required**: readonly \[`"root"`, `"tag"`, `"tag-delete"`, `"input"`\]

### slotSpec

> `readonly` **slotSpec**: `object`

#### slotSpec.input

> `readonly` **input**: `object`

#### slotSpec.input.aria

> `readonly` **aria**: `object`

#### slotSpec.input.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`, `"aria-describedby"`, `"aria-invalid"`, `"aria-required"`\]

#### slotSpec.input.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.input.aria.role

> `readonly` **role**: `"textbox"` = `"textbox"`

#### slotSpec.input.children

> `readonly` **children**: `"self-closing"` = `"self-closing"`

#### slotSpec.input.element

> `readonly` **element**: `"input"` = `"input"`

#### slotSpec.root

> `readonly` **root**: `object`

#### slotSpec.root.aria

> `readonly` **aria**: `object`

#### slotSpec.root.aria.optional

> `readonly` **optional**: readonly \[`"aria-labelledby"`\]

#### slotSpec.root.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.root.aria.role

> `readonly` **role**: `"none"` = `"none"`

#### slotSpec.root.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.root.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.tag

> `readonly` **tag**: `object`

#### slotSpec.tag.aria

> `readonly` **aria**: `object`

#### slotSpec.tag.aria.optional

> `readonly` **optional**: readonly \[`"aria-selected"`, `"aria-disabled"`\]

#### slotSpec.tag.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.tag.aria.role

> `readonly` **role**: `"option"` = `"option"`

#### slotSpec.tag.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.tag.element

> `readonly` **element**: `"span"` = `"span"`

#### slotSpec.tag-delete

> `readonly` **tag-delete**: `object`

#### slotSpec.tag-delete.aria

> `readonly` **aria**: `object`

#### slotSpec.tag-delete.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`\]

#### slotSpec.tag-delete.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.tag-delete.aria.role

> `readonly` **role**: `"button"` = `"button"`

#### slotSpec.tag-delete.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.tag-delete.element

> `readonly` **element**: `"button"` = `"button"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.input

> `readonly` **input**: readonly \[`"focused"`, `"focus-visible"`, `"disabled"`, `"invalid"`\]

#### slotStates.root

> `readonly` **root**: readonly \[`"focused"`, `"focus-visible"`, `"disabled"`, `"invalid"`\]

#### slotStates.tag

> `readonly` **tag**: readonly \[`"selected"`, `"focused"`, `"disabled"`\]

#### slotStates.tag-delete

> `readonly` **tag-delete**: readonly \[`"focused"`, `"focus-visible"`\]

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[`"focused"`, `"focus-visible"`, `"disabled"`, `"invalid"`\]

#### states.specific

> `readonly` **specific**: readonly \[`"selected"`\]
