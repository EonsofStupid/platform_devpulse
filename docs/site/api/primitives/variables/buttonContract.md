# Variable: buttonContract

> `const` **buttonContract**: `object`

Defined in: [primitives/button/contract.ts:20](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/button/contract.ts#L20)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[`"aria-label"`, `"aria-describedby"`, `"aria-pressed"`, `"aria-disabled"`, `"aria-busy"`\]

#### aria.requiredAttrs

> `readonly` **requiredAttrs**: readonly \[\] = `[]`

#### aria.role

> `readonly` **role**: `"button"` = `"button"`

### ariaStateProvider

> `readonly` **ariaStateProvider**: `"coldlight"` = `"coldlight"`

### compound

> `readonly` **compound**: `false` = `false`

### focusStrategy

> `readonly` **focusStrategy**: `"none"` = `"none"`

### keyboard

> `readonly` **keyboard**: readonly \[`"Enter"`, `"Space"`\]

### kind

> `readonly` **kind**: `"button"` = `"button"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.icon

> `readonly` **icon**: readonly \[\] = `[]`

#### slotActions.label

> `readonly` **label**: readonly \[\] = `[]`

#### slotActions.root

> `readonly` **root**: readonly \[`"submit"`\]

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[`"icon"`, `"label"`\]

#### slots.required

> `readonly` **required**: readonly \[`"root"`\]

### slotSpec

> `readonly` **slotSpec**: `object`

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

#### slotSpec.label

> `readonly` **label**: `object`

#### slotSpec.label.aria

> `readonly` **aria**: `object`

#### slotSpec.label.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.label.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.label.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.label.element

> `readonly` **element**: `"span"` = `"span"`

#### slotSpec.root

> `readonly` **root**: `object`

#### slotSpec.root.aria

> `readonly` **aria**: `object`

#### slotSpec.root.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`, `"aria-describedby"`, `"aria-pressed"`, `"aria-disabled"`, `"aria-busy"`\]

#### slotSpec.root.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.root.aria.role

> `readonly` **role**: `"button"` = `"button"`

#### slotSpec.root.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.root.element

> `readonly` **element**: `"button"` = `"button"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.icon

> `readonly` **icon**: readonly \[\] = `[]`

#### slotStates.label

> `readonly` **label**: readonly \[\] = `[]`

#### slotStates.root

> `readonly` **root**: readonly \[`"focused"`, `"focus-visible"`, `"hover"`, `"active"`, `"disabled"`, `"pressed"`, `"loading"`, `"busy"`\]

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[`"focused"`, `"focus-visible"`, `"hover"`, `"disabled"`\]

#### states.specific

> `readonly` **specific**: readonly \[`"pressed"`, `"loading"`, `"busy"`, `"active"`\]
