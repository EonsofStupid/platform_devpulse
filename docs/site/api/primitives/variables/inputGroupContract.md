# Variable: inputGroupContract

> `const` **inputGroupContract**: `object`

Defined in: [primitives/input-group/contract.ts:18](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/input-group/contract.ts#L18)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[`"aria-label"`\]

#### aria.requiredAttrs

> `readonly` **requiredAttrs**: readonly \[\] = `[]`

#### aria.role

> `readonly` **role**: `"group"` = `"group"`

### ariaStateProvider

> `readonly` **ariaStateProvider**: `"coldlight"` = `"coldlight"`

### compound

> `readonly` **compound**: `true` = `true`

### focusStrategy

> `readonly` **focusStrategy**: `"none"` = `"none"`

### keyboard

> `readonly` **keyboard**: readonly \[\] = `[]`

### kind

> `readonly` **kind**: `"input-group"` = `"input-group"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.input

> `readonly` **input**: readonly \[`"focus"`, `"blur"`\]

#### slotActions.prefix

> `readonly` **prefix**: readonly \[\] = `[]`

#### slotActions.root

> `readonly` **root**: readonly \[\] = `[]`

#### slotActions.suffix

> `readonly` **suffix**: readonly \[\] = `[]`

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[`"prefix"`, `"suffix"`\]

#### slots.required

> `readonly` **required**: readonly \[`"root"`, `"input"`\]

### slotSpec

> `readonly` **slotSpec**: `object`

#### slotSpec.input

> `readonly` **input**: `object`

#### slotSpec.input.aria

> `readonly` **aria**: `object`

#### slotSpec.input.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`, `"aria-describedby"`\]

#### slotSpec.input.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.input.children

> `readonly` **children**: `"self-closing"` = `"self-closing"`

#### slotSpec.input.element

> `readonly` **element**: `"input"` = `"input"`

#### slotSpec.prefix

> `readonly` **prefix**: `object`

#### slotSpec.prefix.aria

> `readonly` **aria**: `object`

#### slotSpec.prefix.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.prefix.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.prefix.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.prefix.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.root

> `readonly` **root**: `object`

#### slotSpec.root.aria

> `readonly` **aria**: `object`

#### slotSpec.root.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`\]

#### slotSpec.root.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.root.aria.role

> `readonly` **role**: `"group"` = `"group"`

#### slotSpec.root.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.root.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.suffix

> `readonly` **suffix**: `object`

#### slotSpec.suffix.aria

> `readonly` **aria**: `object`

#### slotSpec.suffix.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.suffix.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.suffix.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.suffix.element

> `readonly` **element**: `"div"` = `"div"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.input

> `readonly` **input**: readonly \[`"focused"`, `"focus-visible"`, `"disabled"`\]

#### slotStates.prefix

> `readonly` **prefix**: readonly \[\] = `[]`

#### slotStates.root

> `readonly` **root**: readonly \[`"focused"`, `"focus-visible"`, `"disabled"`\]

#### slotStates.suffix

> `readonly` **suffix**: readonly \[\] = `[]`

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[`"focused"`, `"focus-visible"`, `"disabled"`\]

#### states.specific

> `readonly` **specific**: readonly \[\] = `[]`
