# Variable: stepsContract

> `const` **stepsContract**: `object`

Defined in: [primitives/steps/contract.ts:18](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/steps/contract.ts#L18)

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

> `readonly` **ariaStateProvider**: `"coldlight"` = `"coldlight"`

### compound

> `readonly` **compound**: `false` = `false`

### focusStrategy

> `readonly` **focusStrategy**: `"none"` = `"none"`

### keyboard

> `readonly` **keyboard**: readonly \[\] = `[]`

### kind

> `readonly` **kind**: `"steps"` = `"steps"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.root

> `readonly` **root**: readonly \[\] = `[]`

#### slotActions.step

> `readonly` **step**: readonly \[`"select"`\]

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[`"step"`\]

#### slots.required

> `readonly` **required**: readonly \[`"root"`\]

### slotSpec

> `readonly` **slotSpec**: `object`

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

#### slotSpec.step

> `readonly` **step**: `object`

#### slotSpec.step.aria

> `readonly` **aria**: `object`

#### slotSpec.step.aria.optional

> `readonly` **optional**: readonly \[`"aria-current"`\]

#### slotSpec.step.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.step.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.step.element

> `readonly` **element**: `"div"` = `"div"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.root

> `readonly` **root**: readonly \[\] = `[]`

#### slotStates.step

> `readonly` **step**: readonly \[`"active"`, `"disabled"`\]

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[`"disabled"`\]

#### states.specific

> `readonly` **specific**: readonly \[`"active"`\]
