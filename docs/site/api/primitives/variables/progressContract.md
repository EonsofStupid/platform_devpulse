# Variable: progressContract

> `const` **progressContract**: `object`

Defined in: [primitives/progress/contract.ts:17](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/progress/contract.ts#L17)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[`"aria-label"`, `"aria-labelledby"`, `"aria-valuetext"`\]

#### aria.requiredAttrs

> `readonly` **requiredAttrs**: readonly \[`"aria-valuenow"`, `"aria-valuemin"`, `"aria-valuemax"`\]

#### aria.role

> `readonly` **role**: `"progressbar"` = `"progressbar"`

### ariaStateProvider

> `readonly` **ariaStateProvider**: `"meltui"` = `"meltui"`

### compound

> `readonly` **compound**: `false` = `false`

### focusStrategy

> `readonly` **focusStrategy**: `"none"` = `"none"`

### keyboard

> `readonly` **keyboard**: readonly \[\] = `[]`

### kind

> `readonly` **kind**: `"progress"` = `"progress"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.indicator

> `readonly` **indicator**: readonly \[\] = `[]`

#### slotActions.root

> `readonly` **root**: readonly \[\] = `[]`

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[`"indicator"`\]

#### slots.required

> `readonly` **required**: readonly \[`"root"`\]

### slotSpec

> `readonly` **slotSpec**: `object`

#### slotSpec.indicator

> `readonly` **indicator**: `object`

#### slotSpec.indicator.aria

> `readonly` **aria**: `object`

#### slotSpec.indicator.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.indicator.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.indicator.children

> `readonly` **children**: `"self-closing"` = `"self-closing"`

#### slotSpec.indicator.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.root

> `readonly` **root**: `object`

#### slotSpec.root.aria

> `readonly` **aria**: `object`

#### slotSpec.root.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`, `"aria-labelledby"`, `"aria-valuetext"`\]

#### slotSpec.root.aria.required

> `readonly` **required**: readonly \[`"aria-valuenow"`, `"aria-valuemin"`, `"aria-valuemax"`\]

#### slotSpec.root.aria.role

> `readonly` **role**: `"progressbar"` = `"progressbar"`

#### slotSpec.root.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.root.element

> `readonly` **element**: `"div"` = `"div"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.indicator

> `readonly` **indicator**: readonly \[\] = `[]`

#### slotStates.root

> `readonly` **root**: readonly \[\] = `[]`

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[\] = `[]`

#### states.specific

> `readonly` **specific**: readonly \[`"loading"`, `"pending"`\]
