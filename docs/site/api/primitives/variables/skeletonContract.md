# Variable: skeletonContract

> `const` **skeletonContract**: `object`

Defined in: [primitives/skeleton/contract.ts:18](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/skeleton/contract.ts#L18)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[`"aria-busy"`, `"aria-label"`\]

#### aria.requiredAttrs

> `readonly` **requiredAttrs**: readonly \[\] = `[]`

#### aria.role

> `readonly` **role**: `"status"` = `"status"`

### ariaStateProvider

> `readonly` **ariaStateProvider**: `"coldlight"` = `"coldlight"`

### compound

> `readonly` **compound**: `false` = `false`

### focusStrategy

> `readonly` **focusStrategy**: `"none"` = `"none"`

### keyboard

> `readonly` **keyboard**: readonly \[\] = `[]`

### kind

> `readonly` **kind**: `"skeleton"` = `"skeleton"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.root

> `readonly` **root**: readonly \[\] = `[]`

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

> `readonly` **optional**: readonly \[`"aria-busy"`, `"aria-label"`\]

#### slotSpec.root.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.root.aria.role

> `readonly` **role**: `"status"` = `"status"`

#### slotSpec.root.children

> `readonly` **children**: `"self-closing"` = `"self-closing"`

#### slotSpec.root.element

> `readonly` **element**: `"div"` = `"div"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.root

> `readonly` **root**: readonly \[`"loading"`\]

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[`"loading"`\]

#### states.specific

> `readonly` **specific**: readonly \[\] = `[]`
