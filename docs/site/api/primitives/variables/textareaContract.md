# Variable: textareaContract

> `const` **textareaContract**: `object`

Defined in: [primitives/textarea/contract.ts:16](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/textarea/contract.ts#L16)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[`"aria-label"`, `"aria-labelledby"`, `"aria-describedby"`, `"aria-errormessage"`, `"aria-invalid"`, `"aria-required"`, `"aria-disabled"`, `"aria-readonly"`, `"aria-multiline"`\]

#### aria.requiredAttrs

> `readonly` **requiredAttrs**: readonly \[\] = `[]`

#### aria.role

> `readonly` **role**: `"textbox"` = `"textbox"`

### ariaStateProvider

> `readonly` **ariaStateProvider**: `"coldlight"` = `"coldlight"`

### compound

> `readonly` **compound**: `false` = `false`

### focusStrategy

> `readonly` **focusStrategy**: `"none"` = `"none"`

### keyboard

> `readonly` **keyboard**: readonly \[\] = `[]`

### kind

> `readonly` **kind**: `"textarea"` = `"textarea"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.root

> `readonly` **root**: readonly \[`"focus"`, `"blur"`, `"clear"`\]

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

> `readonly` **optional**: readonly \[`"aria-label"`, `"aria-labelledby"`, `"aria-describedby"`, `"aria-errormessage"`, `"aria-invalid"`, `"aria-required"`, `"aria-disabled"`, `"aria-readonly"`, `"aria-multiline"`\]

#### slotSpec.root.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.root.aria.role

> `readonly` **role**: `"textbox"` = `"textbox"`

#### slotSpec.root.children

> `readonly` **children**: `"self-closing"` = `"self-closing"`

#### slotSpec.root.element

> `readonly` **element**: `"textarea"` = `"textarea"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.root

> `readonly` **root**: readonly \[`"focused"`, `"focus-visible"`, `"hover"`, `"disabled"`, `"readonly"`, `"required"`, `"invalid"`, `"valid"`\]

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[`"focused"`, `"focus-visible"`, `"hover"`, `"disabled"`\]

#### states.specific

> `readonly` **specific**: readonly \[`"readonly"`, `"required"`, `"invalid"`, `"valid"`\]
