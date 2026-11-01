# Variable: commandPaletteContract

> `const` **commandPaletteContract**: `object`

Defined in: [primitives/command-palette/contract.ts:16](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/command-palette/contract.ts#L16)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[`"aria-label"`, `"aria-labelledby"`\]

#### aria.requiredAttrs

> `readonly` **requiredAttrs**: readonly \[`"aria-modal"`\]

#### aria.role

> `readonly` **role**: `"dialog"` = `"dialog"`

### ariaStateProvider

> `readonly` **ariaStateProvider**: `"meltui"` = `"meltui"`

### compound

> `readonly` **compound**: `true` = `true`

### dismissBehavior

> `readonly` **dismissBehavior**: `object`

#### dismissBehavior.escape

> `readonly` **escape**: `true` = `true`

#### dismissBehavior.outsideClick

> `readonly` **outsideClick**: `true` = `true`

### focusStrategy

> `readonly` **focusStrategy**: `"trap"` = `"trap"`

### keyboard

> `readonly` **keyboard**: readonly \[`"Escape"`, `"ArrowDown"`, `"ArrowUp"`, `"Enter"`\]

### kind

> `readonly` **kind**: `"command-palette"` = `"command-palette"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.empty

> `readonly` **empty**: readonly \[\] = `[]`

#### slotActions.group

> `readonly` **group**: readonly \[\] = `[]`

#### slotActions.input

> `readonly` **input**: readonly \[`"filter"`\]

#### slotActions.item

> `readonly` **item**: readonly \[`"select"`\]

#### slotActions.list

> `readonly` **list**: readonly \[\] = `[]`

#### slotActions.root

> `readonly` **root**: readonly \[`"open"`, `"close"`, `"dismiss"`\]

#### slotActions.separator

> `readonly` **separator**: readonly \[\] = `[]`

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[`"group"`, `"separator"`, `"empty"`\]

#### slots.required

> `readonly` **required**: readonly \[`"root"`, `"input"`, `"list"`, `"item"`\]

### slotSpec

> `readonly` **slotSpec**: `object`

#### slotSpec.empty

> `readonly` **empty**: `object`

#### slotSpec.empty.aria

> `readonly` **aria**: `object`

#### slotSpec.empty.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.empty.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.empty.aria.role

> `readonly` **role**: `"status"` = `"status"`

#### slotSpec.empty.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.empty.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.group

> `readonly` **group**: `object`

#### slotSpec.group.aria

> `readonly` **aria**: `object`

#### slotSpec.group.aria.optional

> `readonly` **optional**: readonly \[`"aria-labelledby"`\]

#### slotSpec.group.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.group.aria.role

> `readonly` **role**: `"group"` = `"group"`

#### slotSpec.group.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.group.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.input

> `readonly` **input**: `object`

#### slotSpec.input.aria

> `readonly` **aria**: `object`

#### slotSpec.input.aria.optional

> `readonly` **optional**: readonly \[`"aria-activedescendant"`, `"aria-label"`, `"aria-autocomplete"`\]

#### slotSpec.input.aria.required

> `readonly` **required**: readonly \[`"aria-expanded"`, `"aria-controls"`\]

#### slotSpec.input.aria.role

> `readonly` **role**: `"combobox"` = `"combobox"`

#### slotSpec.input.children

> `readonly` **children**: `"self-closing"` = `"self-closing"`

#### slotSpec.input.element

> `readonly` **element**: `"input"` = `"input"`

#### slotSpec.item

> `readonly` **item**: `object`

#### slotSpec.item.aria

> `readonly` **aria**: `object`

#### slotSpec.item.aria.optional

> `readonly` **optional**: readonly \[`"aria-selected"`, `"aria-disabled"`\]

#### slotSpec.item.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.item.aria.role

> `readonly` **role**: `"option"` = `"option"`

#### slotSpec.item.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.item.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.list

> `readonly` **list**: `object`

#### slotSpec.list.aria

> `readonly` **aria**: `object`

#### slotSpec.list.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`, `"aria-labelledby"`\]

#### slotSpec.list.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.list.aria.role

> `readonly` **role**: `"listbox"` = `"listbox"`

#### slotSpec.list.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.list.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.root

> `readonly` **root**: `object`

#### slotSpec.root.aria

> `readonly` **aria**: `object`

#### slotSpec.root.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`, `"aria-labelledby"`\]

#### slotSpec.root.aria.required

> `readonly` **required**: readonly \[`"aria-modal"`\]

#### slotSpec.root.aria.role

> `readonly` **role**: `"dialog"` = `"dialog"`

#### slotSpec.root.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.root.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.separator

> `readonly` **separator**: `object`

#### slotSpec.separator.aria

> `readonly` **aria**: `object`

#### slotSpec.separator.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.separator.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.separator.aria.role

> `readonly` **role**: `"separator"` = `"separator"`

#### slotSpec.separator.children

> `readonly` **children**: `"self-closing"` = `"self-closing"`

#### slotSpec.separator.element

> `readonly` **element**: `"hr"` = `"hr"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.empty

> `readonly` **empty**: readonly \[\] = `[]`

#### slotStates.group

> `readonly` **group**: readonly \[\] = `[]`

#### slotStates.input

> `readonly` **input**: readonly \[`"focused"`, `"focus-visible"`\]

#### slotStates.item

> `readonly` **item**: readonly \[`"selected"`, `"focused"`, `"disabled"`\]

#### slotStates.list

> `readonly` **list**: readonly \[\] = `[]`

#### slotStates.root

> `readonly` **root**: readonly \[`"open"`, `"closed"`\]

#### slotStates.separator

> `readonly` **separator**: readonly \[\] = `[]`

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[`"focused"`, `"focus-visible"`, `"disabled"`\]

#### states.specific

> `readonly` **specific**: readonly \[`"open"`, `"closed"`, `"selected"`\]
