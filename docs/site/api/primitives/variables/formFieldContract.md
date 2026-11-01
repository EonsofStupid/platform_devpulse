# Variable: formFieldContract

> `const` **formFieldContract**: `object`

Defined in: [primitives/form-field/contract.ts:16](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/form-field/contract.ts#L16)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[`"aria-labelledby"`\]

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

> `readonly` **kind**: `"form-field"` = `"form-field"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.control

> `readonly` **control**: readonly \[\] = `[]`

#### slotActions.description

> `readonly` **description**: readonly \[\] = `[]`

#### slotActions.error

> `readonly` **error**: readonly \[\] = `[]`

#### slotActions.label

> `readonly` **label**: readonly \[\] = `[]`

#### slotActions.root

> `readonly` **root**: readonly \[\] = `[]`

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[`"description"`, `"error"`\]

#### slots.required

> `readonly` **required**: readonly \[`"root"`, `"label"`, `"control"`\]

### slotSpec

> `readonly` **slotSpec**: `object`

#### slotSpec.control

> `readonly` **control**: `object`

#### slotSpec.control.aria

> `readonly` **aria**: `object`

#### slotSpec.control.aria.optional

> `readonly` **optional**: readonly \[`"aria-describedby"`, `"aria-errormessage"`, `"aria-invalid"`, `"aria-required"`\]

#### slotSpec.control.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.control.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.control.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.description

> `readonly` **description**: `object`

#### slotSpec.description.aria

> `readonly` **aria**: `object`

#### slotSpec.description.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.description.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.description.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.description.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.error

> `readonly` **error**: `object`

#### slotSpec.error.aria

> `readonly` **aria**: `object`

#### slotSpec.error.aria.optional

> `readonly` **optional**: readonly \[`"aria-live"`\]

#### slotSpec.error.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.error.aria.role

> `readonly` **role**: `"alert"` = `"alert"`

#### slotSpec.error.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.error.element

> `readonly` **element**: `"div"` = `"div"`

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

> `readonly` **element**: `"label"` = `"label"`

#### slotSpec.root

> `readonly` **root**: `object`

#### slotSpec.root.aria

> `readonly` **aria**: `object`

#### slotSpec.root.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.root.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.root.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.root.element

> `readonly` **element**: `"div"` = `"div"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.control

> `readonly` **control**: readonly \[`"invalid"`, `"valid"`, `"required"`, `"disabled"`\]

#### slotStates.description

> `readonly` **description**: readonly \[\] = `[]`

#### slotStates.error

> `readonly` **error**: readonly \[`"invalid"`\]

#### slotStates.label

> `readonly` **label**: readonly \[`"required"`, `"disabled"`\]

#### slotStates.root

> `readonly` **root**: readonly \[`"invalid"`, `"valid"`, `"required"`, `"disabled"`\]

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[`"disabled"`\]

#### states.specific

> `readonly` **specific**: readonly \[`"invalid"`, `"valid"`, `"required"`\]
