# Variable: fileUploadContract

> `const` **fileUploadContract**: `object`

Defined in: [primitives/file-upload/contract.ts:20](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/file-upload/contract.ts#L20)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[`"aria-label"`\]

#### aria.requiredAttrs

> `readonly` **requiredAttrs**: readonly \[\] = `[]`

#### aria.role

> `readonly` **role**: `"none"` = `"none"`

### ariaStateProvider

> `readonly` **ariaStateProvider**: `"meltui"` = `"meltui"`

### compound

> `readonly` **compound**: `true` = `true`

### focusStrategy

> `readonly` **focusStrategy**: `"none"` = `"none"`

### keyboard

> `readonly` **keyboard**: readonly \[`"Enter"`, `"Space"`\]

### kind

> `readonly` **kind**: `"file-upload"` = `"file-upload"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.hiddenInput

> `readonly` **hiddenInput**: readonly \[\] = `[]`

#### slotActions.root

> `readonly` **root**: readonly \[\] = `[]`

#### slotActions.trigger

> `readonly` **trigger**: readonly \[`"open"`\]

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slots.required

> `readonly` **required**: readonly \[`"root"`, `"trigger"`, `"hiddenInput"`\]

### slotSpec

> `readonly` **slotSpec**: `object`

#### slotSpec.hiddenInput

> `readonly` **hiddenInput**: `object`

#### slotSpec.hiddenInput.aria

> `readonly` **aria**: `object`

#### slotSpec.hiddenInput.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.hiddenInput.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.hiddenInput.children

> `readonly` **children**: `"self-closing"` = `"self-closing"`

#### slotSpec.hiddenInput.element

> `readonly` **element**: `"input"` = `"input"`

#### slotSpec.root

> `readonly` **root**: `object`

#### slotSpec.root.aria

> `readonly` **aria**: `object`

#### slotSpec.root.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`\]

#### slotSpec.root.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.root.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.root.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.trigger

> `readonly` **trigger**: `object`

#### slotSpec.trigger.aria

> `readonly` **aria**: `object`

#### slotSpec.trigger.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`, `"aria-disabled"`\]

#### slotSpec.trigger.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.trigger.aria.role

> `readonly` **role**: `"button"` = `"button"`

#### slotSpec.trigger.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.trigger.element

> `readonly` **element**: `"button"` = `"button"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.hiddenInput

> `readonly` **hiddenInput**: readonly \[\] = `[]`

#### slotStates.root

> `readonly` **root**: readonly \[`"hover"`, `"disabled"`\]

#### slotStates.trigger

> `readonly` **trigger**: readonly \[`"focused"`, `"focus-visible"`, `"hover"`\]

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[`"focused"`, `"focus-visible"`, `"hover"`, `"disabled"`\]

#### states.specific

> `readonly` **specific**: readonly \[\] = `[]`
