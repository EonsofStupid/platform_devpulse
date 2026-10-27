# Variable: alertContract

> `const` **alertContract**: `object`

Defined in: [primitives/alert/contract.ts:16](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/alert/contract.ts#L16)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[`"aria-label"`, `"aria-labelledby"`, `"aria-live"`\]

#### aria.requiredAttrs

> `readonly` **requiredAttrs**: readonly \[\] = `[]`

#### aria.role

> `readonly` **role**: `"alert"` = `"alert"`

### ariaStateProvider

> `readonly` **ariaStateProvider**: `"coldlight"` = `"coldlight"`

### compound

> `readonly` **compound**: `false` = `false`

### focusStrategy

> `readonly` **focusStrategy**: `"none"` = `"none"`

### keyboard

> `readonly` **keyboard**: readonly \[\] = `[]`

### kind

> `readonly` **kind**: `"alert"` = `"alert"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.action

> `readonly` **action**: readonly \[\] = `[]`

#### slotActions.description

> `readonly` **description**: readonly \[\] = `[]`

#### slotActions.icon

> `readonly` **icon**: readonly \[\] = `[]`

#### slotActions.root

> `readonly` **root**: readonly \[`"dismiss"`\]

#### slotActions.title

> `readonly` **title**: readonly \[\] = `[]`

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[`"icon"`, `"title"`, `"description"`, `"action"`\]

#### slots.required

> `readonly` **required**: readonly \[`"root"`\]

### slotSpec

> `readonly` **slotSpec**: `object`

#### slotSpec.action

> `readonly` **action**: `object`

#### slotSpec.action.aria

> `readonly` **aria**: `object`

#### slotSpec.action.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.action.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.action.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.action.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.description

> `readonly` **description**: `object`

#### slotSpec.description.aria

> `readonly` **aria**: `object`

#### slotSpec.description.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.description.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.description.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.description.element

> `readonly` **element**: `"div"` = `"div"`

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

> `readonly` **optional**: readonly \[`"aria-label"`, `"aria-labelledby"`, `"aria-live"`\]

#### slotSpec.root.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.root.aria.role

> `readonly` **role**: `"alert"` = `"alert"`

#### slotSpec.root.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.root.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.title

> `readonly` **title**: `object`

#### slotSpec.title.aria

> `readonly` **aria**: `object`

#### slotSpec.title.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.title.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.title.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.title.element

> `readonly` **element**: `"div"` = `"div"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.action

> `readonly` **action**: readonly \[\] = `[]`

#### slotStates.description

> `readonly` **description**: readonly \[\] = `[]`

#### slotStates.icon

> `readonly` **icon**: readonly \[\] = `[]`

#### slotStates.root

> `readonly` **root**: readonly \[\] = `[]`

#### slotStates.title

> `readonly` **title**: readonly \[\] = `[]`

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[\] = `[]`

#### states.specific

> `readonly` **specific**: readonly \[\] = `[]`
