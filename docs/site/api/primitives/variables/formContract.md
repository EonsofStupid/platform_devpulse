# Variable: formContract

> `const` **formContract**: `object`

Defined in: [primitives/form/contract.ts:15](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/form/contract.ts#L15)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[`"aria-label"`, `"aria-labelledby"`, `"aria-describedby"`\]

#### aria.requiredAttrs

> `readonly` **requiredAttrs**: readonly \[\] = `[]`

#### aria.role

> `readonly` **role**: `"form"` = `"form"`

### ariaStateProvider

> `readonly` **ariaStateProvider**: `"coldlight"` = `"coldlight"`

### compound

> `readonly` **compound**: `false` = `false`

### focusStrategy

> `readonly` **focusStrategy**: `"none"` = `"none"`

### keyboard

> `readonly` **keyboard**: readonly \[\] = `[]`

### kind

> `readonly` **kind**: `"form"` = `"form"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.root

> `readonly` **root**: readonly \[`"submit"`, `"reset"`\]

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slots.required

> `readonly` **required**: readonly \[`"root"`\]

### slotSpec

> `readonly` **slotSpec**: `object`

#### slotSpec.root

> `readonly` **root**: `object`

#### slotSpec.root.aria

> `readonly` **aria**: `object`

#### slotSpec.root.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`, `"aria-labelledby"`, `"aria-describedby"`\]

#### slotSpec.root.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.root.aria.role

> `readonly` **role**: `"form"` = `"form"`

#### slotSpec.root.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.root.element

> `readonly` **element**: `"form"` = `"form"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.root

> `readonly` **root**: readonly \[`"pending"`, `"disabled"`\]

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[`"disabled"`\]

#### states.specific

> `readonly` **specific**: readonly \[`"pending"`\]
