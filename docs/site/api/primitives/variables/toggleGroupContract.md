# Variable: toggleGroupContract

> `const` **toggleGroupContract**: `object`

Defined in: [primitives/toggle-group/contract.ts:20](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/toggle-group/contract.ts#L20)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[`"aria-label"`, `"aria-orientation"`\]

#### aria.requiredAttrs

> `readonly` **requiredAttrs**: readonly \[\] = `[]`

#### aria.role

> `readonly` **role**: `"group"` = `"group"`

### ariaStateProvider

> `readonly` **ariaStateProvider**: `"coldlight"` = `"coldlight"`

### compound

> `readonly` **compound**: `true` = `true`

### focusStrategy

> `readonly` **focusStrategy**: `"roving"` = `"roving"`

### keyboard

> `readonly` **keyboard**: readonly \[`"ArrowLeft"`, `"ArrowRight"`, `"Enter"`, `"Space"`\]

### kind

> `readonly` **kind**: `"toggle-group"` = `"toggle-group"`

### orientation

> `readonly` **orientation**: `"horizontal"` = `"horizontal"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.item

> `readonly` **item**: readonly \[`"toggle"`\]

#### slotActions.root

> `readonly` **root**: readonly \[\] = `[]`

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slots.required

> `readonly` **required**: readonly \[`"root"`, `"item"`\]

### slotSpec

> `readonly` **slotSpec**: `object`

#### slotSpec.item

> `readonly` **item**: `object`

#### slotSpec.item.aria

> `readonly` **aria**: `object`

#### slotSpec.item.aria.optional

> `readonly` **optional**: readonly \[`"aria-disabled"`\]

#### slotSpec.item.aria.required

> `readonly` **required**: readonly \[`"aria-pressed"`\]

#### slotSpec.item.aria.role

> `readonly` **role**: `"button"` = `"button"`

#### slotSpec.item.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.item.element

> `readonly` **element**: `"button"` = `"button"`

#### slotSpec.root

> `readonly` **root**: `object`

#### slotSpec.root.aria

> `readonly` **aria**: `object`

#### slotSpec.root.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`, `"aria-orientation"`\]

#### slotSpec.root.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.root.aria.role

> `readonly` **role**: `"group"` = `"group"`

#### slotSpec.root.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.root.element

> `readonly` **element**: `"div"` = `"div"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.item

> `readonly` **item**: readonly \[`"pressed"`, `"focused"`, `"focus-visible"`, `"hover"`, `"disabled"`\]

#### slotStates.root

> `readonly` **root**: readonly \[\] = `[]`

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[`"focused"`, `"focus-visible"`, `"hover"`, `"disabled"`\]

#### states.specific

> `readonly` **specific**: readonly \[`"pressed"`\]
