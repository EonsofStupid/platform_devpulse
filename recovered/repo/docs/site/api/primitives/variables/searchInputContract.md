# Variable: searchInputContract

> `const` **searchInputContract**: `object`

Defined in: [primitives/search-input/contract.ts:18](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/search-input/contract.ts#L18)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[`"aria-label"`\]

#### aria.requiredAttrs

> `readonly` **requiredAttrs**: readonly \[\] = `[]`

#### aria.role

> `readonly` **role**: `"search"` = `"search"`

### ariaStateProvider

> `readonly` **ariaStateProvider**: `"coldlight"` = `"coldlight"`

### compound

> `readonly` **compound**: `true` = `true`

### focusStrategy

> `readonly` **focusStrategy**: `"none"` = `"none"`

### keyboard

> `readonly` **keyboard**: readonly \[`"Escape"`\]

### kind

> `readonly` **kind**: `"search-input"` = `"search-input"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.clear

> `readonly` **clear**: readonly \[`"dismiss"`\]

#### slotActions.icon

> `readonly` **icon**: readonly \[\] = `[]`

#### slotActions.input

> `readonly` **input**: readonly \[`"focus"`, `"blur"`, `"filter"`\]

#### slotActions.root

> `readonly` **root**: readonly \[\] = `[]`

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[`"icon"`, `"clear"`\]

#### slots.required

> `readonly` **required**: readonly \[`"root"`, `"input"`\]

### slotSpec

> `readonly` **slotSpec**: `object`

#### slotSpec.clear

> `readonly` **clear**: `object`

#### slotSpec.clear.aria

> `readonly` **aria**: `object`

#### slotSpec.clear.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`\]

#### slotSpec.clear.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.clear.aria.role

> `readonly` **role**: `"button"` = `"button"`

#### slotSpec.clear.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.clear.element

> `readonly` **element**: `"button"` = `"button"`

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

#### slotSpec.input

> `readonly` **input**: `object`

#### slotSpec.input.aria

> `readonly` **aria**: `object`

#### slotSpec.input.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`, `"aria-describedby"`\]

#### slotSpec.input.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.input.aria.role

> `readonly` **role**: `"searchbox"` = `"searchbox"`

#### slotSpec.input.children

> `readonly` **children**: `"self-closing"` = `"self-closing"`

#### slotSpec.input.element

> `readonly` **element**: `"input"` = `"input"`

#### slotSpec.root

> `readonly` **root**: `object`

#### slotSpec.root.aria

> `readonly` **aria**: `object`

#### slotSpec.root.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`\]

#### slotSpec.root.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.root.aria.role

> `readonly` **role**: `"search"` = `"search"`

#### slotSpec.root.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.root.element

> `readonly` **element**: `"div"` = `"div"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.clear

> `readonly` **clear**: readonly \[`"hover"`, `"focused"`, `"focus-visible"`\]

#### slotStates.icon

> `readonly` **icon**: readonly \[\] = `[]`

#### slotStates.input

> `readonly` **input**: readonly \[`"focused"`, `"focus-visible"`, `"disabled"`\]

#### slotStates.root

> `readonly` **root**: readonly \[`"focused"`, `"focus-visible"`, `"hover"`, `"disabled"`\]

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[`"focused"`, `"focus-visible"`, `"hover"`, `"disabled"`\]

#### states.specific

> `readonly` **specific**: readonly \[\] = `[]`
