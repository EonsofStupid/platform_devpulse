# Variable: calendarContract

> `const` **calendarContract**: `object`

Defined in: [primitives/calendar/contract.ts:16](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/calendar/contract.ts#L16)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[`"aria-labelledby"`, `"aria-label"`\]

#### aria.requiredAttrs

> `readonly` **requiredAttrs**: readonly \[\] = `[]`

#### aria.role

> `readonly` **role**: `"grid"` = `"grid"`

### ariaStateProvider

> `readonly` **ariaStateProvider**: `"meltui"` = `"meltui"`

### compound

> `readonly` **compound**: `true` = `true`

### focusStrategy

> `readonly` **focusStrategy**: `"roving"` = `"roving"`

### keyboard

> `readonly` **keyboard**: readonly \[`"ArrowUp"`, `"ArrowDown"`, `"ArrowLeft"`, `"ArrowRight"`, `"Home"`, `"End"`, `"PageUp"`, `"PageDown"`, `"Enter"`, `"Space"`\]

### kind

> `readonly` **kind**: `"calendar"` = `"calendar"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.cell

> `readonly` **cell**: readonly \[`"select"`\]

#### slotActions.grid

> `readonly` **grid**: readonly \[\] = `[]`

#### slotActions.header

> `readonly` **header**: readonly \[\] = `[]`

#### slotActions.heading

> `readonly` **heading**: readonly \[\] = `[]`

#### slotActions.next-button

> `readonly` **next-button**: readonly \[`"select"`\]

#### slotActions.prev-button

> `readonly` **prev-button**: readonly \[`"select"`\]

#### slotActions.root

> `readonly` **root**: readonly \[\] = `[]`

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slots.required

> `readonly` **required**: readonly \[`"root"`, `"header"`, `"grid"`, `"heading"`, `"cell"`, `"prev-button"`, `"next-button"`\]

### slotSpec

> `readonly` **slotSpec**: `object`

#### slotSpec.cell

> `readonly` **cell**: `object`

#### slotSpec.cell.aria

> `readonly` **aria**: `object`

#### slotSpec.cell.aria.optional

> `readonly` **optional**: readonly \[`"aria-selected"`, `"aria-disabled"`, `"aria-current"`\]

#### slotSpec.cell.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.cell.aria.role

> `readonly` **role**: `"gridcell"` = `"gridcell"`

#### slotSpec.cell.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.cell.element

> `readonly` **element**: `"button"` = `"button"`

#### slotSpec.grid

> `readonly` **grid**: `object`

#### slotSpec.grid.aria

> `readonly` **aria**: `object`

#### slotSpec.grid.aria.optional

> `readonly` **optional**: readonly \[`"aria-readonly"`, `"aria-multiselectable"`\]

#### slotSpec.grid.aria.required

> `readonly` **required**: readonly \[`"aria-labelledby"`\]

#### slotSpec.grid.aria.role

> `readonly` **role**: `"grid"` = `"grid"`

#### slotSpec.grid.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.grid.element

> `readonly` **element**: `"table"` = `"table"`

#### slotSpec.header

> `readonly` **header**: `object`

#### slotSpec.header.aria

> `readonly` **aria**: `object`

#### slotSpec.header.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.header.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.header.aria.role

> `readonly` **role**: `"none"` = `"none"`

#### slotSpec.header.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.header.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.heading

> `readonly` **heading**: `object`

#### slotSpec.heading.aria

> `readonly` **aria**: `object`

#### slotSpec.heading.aria.optional

> `readonly` **optional**: readonly \[`"aria-live"`\]

#### slotSpec.heading.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.heading.aria.role

> `readonly` **role**: `"none"` = `"none"`

#### slotSpec.heading.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.heading.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.next-button

> `readonly` **next-button**: `object`

#### slotSpec.next-button.aria

> `readonly` **aria**: `object`

#### slotSpec.next-button.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`, `"aria-disabled"`\]

#### slotSpec.next-button.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.next-button.aria.role

> `readonly` **role**: `"button"` = `"button"`

#### slotSpec.next-button.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.next-button.element

> `readonly` **element**: `"button"` = `"button"`

#### slotSpec.prev-button

> `readonly` **prev-button**: `object`

#### slotSpec.prev-button.aria

> `readonly` **aria**: `object`

#### slotSpec.prev-button.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`, `"aria-disabled"`\]

#### slotSpec.prev-button.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.prev-button.aria.role

> `readonly` **role**: `"button"` = `"button"`

#### slotSpec.prev-button.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.prev-button.element

> `readonly` **element**: `"button"` = `"button"`

#### slotSpec.root

> `readonly` **root**: `object`

#### slotSpec.root.aria

> `readonly` **aria**: `object`

#### slotSpec.root.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`, `"aria-labelledby"`\]

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

#### slotStates.cell

> `readonly` **cell**: readonly \[`"selected"`, `"focused"`, `"focus-visible"`, `"hover"`, `"disabled"`\]

#### slotStates.grid

> `readonly` **grid**: readonly \[\] = `[]`

#### slotStates.header

> `readonly` **header**: readonly \[\] = `[]`

#### slotStates.heading

> `readonly` **heading**: readonly \[\] = `[]`

#### slotStates.next-button

> `readonly` **next-button**: readonly \[`"focused"`, `"focus-visible"`, `"disabled"`\]

#### slotStates.prev-button

> `readonly` **prev-button**: readonly \[`"focused"`, `"focus-visible"`, `"disabled"`\]

#### slotStates.root

> `readonly` **root**: readonly \[\] = `[]`

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[`"focused"`, `"focus-visible"`, `"hover"`, `"disabled"`, `"selected"`\]

#### states.specific

> `readonly` **specific**: readonly \[\] = `[]`
