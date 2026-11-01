# Variable: comboboxContract

> `const` **comboboxContract**: `object`

Defined in: [primitives/combobox/contract.ts:21](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/combobox/contract.ts#L21)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[`"aria-autocomplete"`, `"aria-activedescendant"`, `"aria-label"`, `"aria-labelledby"`\]

#### aria.requiredAttrs

> `readonly` **requiredAttrs**: readonly \[`"aria-expanded"`\]

#### aria.role

> `readonly` **role**: `"combobox"` = `"combobox"`

### ariaStateProvider

> `readonly` **ariaStateProvider**: `"meltui"` = `"meltui"`

### compound

> `readonly` **compound**: `true` = `true`

### focusStrategy

> `readonly` **focusStrategy**: `"activedescendant"` = `"activedescendant"`

### keyboard

> `readonly` **keyboard**: readonly \[`"ArrowDown"`, `"ArrowUp"`, `"Home"`, `"End"`, `"Enter"`, `"Escape"`, `"Tab"`\]

### kind

> `readonly` **kind**: `"combobox"` = `"combobox"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.content

> `readonly` **content**: readonly \[\] = `[]`

#### slotActions.input

> `readonly` **input**: readonly \[`"open"`, `"close"`, `"filter"`\]

#### slotActions.label

> `readonly` **label**: readonly \[\] = `[]`

#### slotActions.option

> `readonly` **option**: readonly \[`"select"`\]

#### slotActions.trigger

> `readonly` **trigger**: readonly \[`"toggle"`\]

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[`"label"`\]

#### slots.required

> `readonly` **required**: readonly \[`"input"`, `"trigger"`, `"content"`, `"option"`\]

### slotSpec

> `readonly` **slotSpec**: `object`

#### slotSpec.content

> `readonly` **content**: `object`

#### slotSpec.content.aria

> `readonly` **aria**: `object`

#### slotSpec.content.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`\]

#### slotSpec.content.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.content.aria.role

> `readonly` **role**: `"listbox"` = `"listbox"`

#### slotSpec.content.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.content.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.input

> `readonly` **input**: `object`

#### slotSpec.input.aria

> `readonly` **aria**: `object`

#### slotSpec.input.aria.optional

> `readonly` **optional**: readonly \[`"aria-activedescendant"`, `"aria-label"`, `"aria-labelledby"`, `"aria-describedby"`, `"aria-invalid"`, `"aria-required"`\]

#### slotSpec.input.aria.required

> `readonly` **required**: readonly \[`"aria-expanded"`, `"aria-controls"`, `"aria-autocomplete"`\]

#### slotSpec.input.aria.role

> `readonly` **role**: `"combobox"` = `"combobox"`

#### slotSpec.input.children

> `readonly` **children**: `"self-closing"` = `"self-closing"`

#### slotSpec.input.element

> `readonly` **element**: `"input"` = `"input"`

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

#### slotSpec.option

> `readonly` **option**: `object`

#### slotSpec.option.aria

> `readonly` **aria**: `object`

#### slotSpec.option.aria.optional

> `readonly` **optional**: readonly \[`"aria-disabled"`\]

#### slotSpec.option.aria.required

> `readonly` **required**: readonly \[`"aria-selected"`\]

#### slotSpec.option.aria.role

> `readonly` **role**: `"option"` = `"option"`

#### slotSpec.option.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.option.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.trigger

> `readonly` **trigger**: `object`

#### slotSpec.trigger.aria

> `readonly` **aria**: `object`

#### slotSpec.trigger.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`\]

#### slotSpec.trigger.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.trigger.aria.role

> `readonly` **role**: `"button"` = `"button"`

#### slotSpec.trigger.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.trigger.element

> `readonly` **element**: `"button"` = `"button"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.content

> `readonly` **content**: readonly \[`"open"`, `"closed"`\]

#### slotStates.input

> `readonly` **input**: readonly \[`"focused"`, `"focus-visible"`, `"disabled"`\]

#### slotStates.label

> `readonly` **label**: readonly \[`"disabled"`\]

#### slotStates.option

> `readonly` **option**: readonly \[`"selected"`, `"focused"`, `"hover"`, `"disabled"`\]

#### slotStates.trigger

> `readonly` **trigger**: readonly \[`"open"`, `"focused"`, `"hover"`\]

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[`"focused"`, `"focus-visible"`, `"hover"`, `"disabled"`, `"selected"`\]

#### states.specific

> `readonly` **specific**: readonly \[`"open"`, `"closed"`\]
