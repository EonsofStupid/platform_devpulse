# Variable: loadingOverlayContract

> `const` **loadingOverlayContract**: `object`

Defined in: [primitives/loading-overlay/contract.ts:15](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/loading-overlay/contract.ts#L15)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[`"aria-label"`\]

#### aria.requiredAttrs

> `readonly` **requiredAttrs**: readonly \[`"aria-busy"`\]

#### aria.role

> `readonly` **role**: `"status"` = `"status"`

### ariaStateProvider

> `readonly` **ariaStateProvider**: `"coldlight"` = `"coldlight"`

### compound

> `readonly` **compound**: `true` = `true`

### focusStrategy

> `readonly` **focusStrategy**: `"none"` = `"none"`

### keyboard

> `readonly` **keyboard**: readonly \[\] = `[]`

### kind

> `readonly` **kind**: `"loading-overlay"` = `"loading-overlay"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.label

> `readonly` **label**: readonly \[\] = `[]`

#### slotActions.root

> `readonly` **root**: readonly \[\] = `[]`

#### slotActions.spinner

> `readonly` **spinner**: readonly \[\] = `[]`

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[`"spinner"`, `"label"`\]

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

#### slotSpec.label.aria.role

> `readonly` **role**: `"none"` = `"none"`

#### slotSpec.label.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.label.element

> `readonly` **element**: `"span"` = `"span"`

#### slotSpec.root

> `readonly` **root**: `object`

#### slotSpec.root.aria

> `readonly` **aria**: `object`

#### slotSpec.root.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`\]

#### slotSpec.root.aria.required

> `readonly` **required**: readonly \[`"aria-busy"`\]

#### slotSpec.root.aria.role

> `readonly` **role**: `"status"` = `"status"`

#### slotSpec.root.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.root.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.spinner

> `readonly` **spinner**: `object`

#### slotSpec.spinner.aria

> `readonly` **aria**: `object`

#### slotSpec.spinner.aria.optional

> `readonly` **optional**: readonly \[`"aria-hidden"`\]

#### slotSpec.spinner.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.spinner.aria.role

> `readonly` **role**: `"none"` = `"none"`

#### slotSpec.spinner.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.spinner.element

> `readonly` **element**: `"div"` = `"div"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.label

> `readonly` **label**: readonly \[\] = `[]`

#### slotStates.root

> `readonly` **root**: readonly \[`"loading"`, `"visible"`, `"hidden"`\]

#### slotStates.spinner

> `readonly` **spinner**: readonly \[\] = `[]`

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[`"loading"`\]

#### states.specific

> `readonly` **specific**: readonly \[`"visible"`, `"hidden"`\]
