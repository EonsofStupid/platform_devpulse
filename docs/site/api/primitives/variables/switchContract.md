# Variable: switchContract

> `const` **switchContract**: `object`

Defined in: [primitives/switch/contract.ts:19](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/switch/contract.ts#L19)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[`"aria-label"`, `"aria-labelledby"`, `"aria-describedby"`, `"aria-disabled"`\]

#### aria.requiredAttrs

> `readonly` **requiredAttrs**: readonly \[`"aria-checked"`\]

#### aria.role

> `readonly` **role**: `"switch"` = `"switch"`

### ariaStateProvider

> `readonly` **ariaStateProvider**: `"coldlight"` = `"coldlight"`

### compound

> `readonly` **compound**: `false` = `false`

### focusStrategy

> `readonly` **focusStrategy**: `"none"` = `"none"`

### keyboard

> `readonly` **keyboard**: readonly \[`"Space"`, `"Enter"`\]

### kind

> `readonly` **kind**: `"switch"` = `"switch"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.label

> `readonly` **label**: readonly \[\] = `[]`

#### slotActions.root

> `readonly` **root**: readonly \[`"check"`, `"uncheck"`, `"toggle"`\]

#### slotActions.thumb

> `readonly` **thumb**: readonly \[\] = `[]`

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[`"thumb"`, `"label"`\]

#### slots.required

> `readonly` **required**: readonly \[`"root"`\]

### slotSpec

> `readonly` **slotSpec**: `object`

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

> `readonly` **optional**: readonly \[`"aria-label"`, `"aria-labelledby"`, `"aria-describedby"`, `"aria-disabled"`\]

#### slotSpec.root.aria.required

> `readonly` **required**: readonly \[`"aria-checked"`\]

#### slotSpec.root.aria.role

> `readonly` **role**: `"switch"` = `"switch"`

#### slotSpec.root.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.root.element

> `readonly` **element**: `"button"` = `"button"`

#### slotSpec.thumb

> `readonly` **thumb**: `object`

#### slotSpec.thumb.aria

> `readonly` **aria**: `object`

#### slotSpec.thumb.aria.optional

> `readonly` **optional**: readonly \[`"aria-hidden"`\]

#### slotSpec.thumb.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.thumb.children

> `readonly` **children**: `"self-closing"` = `"self-closing"`

#### slotSpec.thumb.element

> `readonly` **element**: `"span"` = `"span"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.label

> `readonly` **label**: readonly \[`"disabled"`\]

#### slotStates.root

> `readonly` **root**: readonly \[`"checked"`, `"focused"`, `"focus-visible"`, `"hover"`, `"disabled"`\]

#### slotStates.thumb

> `readonly` **thumb**: readonly \[`"checked"`\]

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[`"focused"`, `"focus-visible"`, `"hover"`, `"disabled"`\]

#### states.specific

> `readonly` **specific**: readonly \[`"checked"`\]
