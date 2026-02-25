# Variable: dataTableContract

> `const` **dataTableContract**: `object`

Defined in: [primitives/data-table/contract.ts:15](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/data-table/contract.ts#L15)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[`"aria-label"`, `"aria-labelledby"`, `"aria-rowcount"`, `"aria-colcount"`\]

#### aria.requiredAttrs

> `readonly` **requiredAttrs**: readonly \[\] = `[]`

#### aria.role

> `readonly` **role**: `"grid"` = `"grid"`

### ariaStateProvider

> `readonly` **ariaStateProvider**: `"coldlight"` = `"coldlight"`

### compound

> `readonly` **compound**: `true` = `true`

### focusStrategy

> `readonly` **focusStrategy**: `"none"` = `"none"`

### keyboard

> `readonly` **keyboard**: readonly \[\] = `[]`

### kind

> `readonly` **kind**: `"data-table"` = `"data-table"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.body

> `readonly` **body**: readonly \[\] = `[]`

#### slotActions.caption

> `readonly` **caption**: readonly \[\] = `[]`

#### slotActions.cell

> `readonly` **cell**: readonly \[\] = `[]`

#### slotActions.empty

> `readonly` **empty**: readonly \[\] = `[]`

#### slotActions.footer

> `readonly` **footer**: readonly \[\] = `[]`

#### slotActions.head-cell

> `readonly` **head-cell**: readonly \[\] = `[]`

#### slotActions.header

> `readonly` **header**: readonly \[\] = `[]`

#### slotActions.pagination

> `readonly` **pagination**: readonly \[\] = `[]`

#### slotActions.root

> `readonly` **root**: readonly \[\] = `[]`

#### slotActions.row

> `readonly` **row**: readonly \[`"select"`\]

#### slotActions.table

> `readonly` **table**: readonly \[\] = `[]`

#### slotActions.toolbar

> `readonly` **toolbar**: readonly \[\] = `[]`

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[`"toolbar"`, `"footer"`, `"head-cell"`, `"caption"`, `"pagination"`, `"empty"`\]

#### slots.required

> `readonly` **required**: readonly \[`"root"`, `"table"`, `"header"`, `"body"`, `"row"`, `"cell"`\]

### slotSpec

> `readonly` **slotSpec**: `object`

#### slotSpec.body

> `readonly` **body**: `object`

#### slotSpec.body.aria

> `readonly` **aria**: `object`

#### slotSpec.body.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.body.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.body.aria.role

> `readonly` **role**: `"none"` = `"none"`

#### slotSpec.body.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.body.element

> `readonly` **element**: `"tbody"` = `"tbody"`

#### slotSpec.caption

> `readonly` **caption**: `object`

#### slotSpec.caption.aria

> `readonly` **aria**: `object`

#### slotSpec.caption.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.caption.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.caption.aria.role

> `readonly` **role**: `"none"` = `"none"`

#### slotSpec.caption.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.caption.element

> `readonly` **element**: `"figcaption"` = `"figcaption"`

#### slotSpec.cell

> `readonly` **cell**: `object`

#### slotSpec.cell.aria

> `readonly` **aria**: `object`

#### slotSpec.cell.aria.optional

> `readonly` **optional**: readonly \[`"aria-colindex"`\]

#### slotSpec.cell.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.cell.aria.role

> `readonly` **role**: `"none"` = `"none"`

#### slotSpec.cell.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.cell.element

> `readonly` **element**: `"td"` = `"td"`

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

#### slotSpec.footer

> `readonly` **footer**: `object`

#### slotSpec.footer.aria

> `readonly` **aria**: `object`

#### slotSpec.footer.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.footer.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.footer.aria.role

> `readonly` **role**: `"none"` = `"none"`

#### slotSpec.footer.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.footer.element

> `readonly` **element**: `"tfoot"` = `"tfoot"`

#### slotSpec.head-cell

> `readonly` **head-cell**: `object`

#### slotSpec.head-cell.aria

> `readonly` **aria**: `object`

#### slotSpec.head-cell.aria.optional

> `readonly` **optional**: readonly \[`"aria-sort"`, `"aria-colindex"`\]

#### slotSpec.head-cell.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.head-cell.aria.role

> `readonly` **role**: `"none"` = `"none"`

#### slotSpec.head-cell.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.head-cell.element

> `readonly` **element**: `"th"` = `"th"`

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

> `readonly` **element**: `"thead"` = `"thead"`

#### slotSpec.pagination

> `readonly` **pagination**: `object`

#### slotSpec.pagination.aria

> `readonly` **aria**: `object`

#### slotSpec.pagination.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`\]

#### slotSpec.pagination.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.pagination.aria.role

> `readonly` **role**: `"navigation"` = `"navigation"`

#### slotSpec.pagination.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.pagination.element

> `readonly` **element**: `"nav"` = `"nav"`

#### slotSpec.root

> `readonly` **root**: `object`

#### slotSpec.root.aria

> `readonly` **aria**: `object`

#### slotSpec.root.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.root.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.root.aria.role

> `readonly` **role**: `"none"` = `"none"`

#### slotSpec.root.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.root.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.row

> `readonly` **row**: `object`

#### slotSpec.row.aria

> `readonly` **aria**: `object`

#### slotSpec.row.aria.optional

> `readonly` **optional**: readonly \[`"aria-selected"`, `"aria-rowindex"`\]

#### slotSpec.row.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.row.aria.role

> `readonly` **role**: `"none"` = `"none"`

#### slotSpec.row.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.row.element

> `readonly` **element**: `"tr"` = `"tr"`

#### slotSpec.table

> `readonly` **table**: `object`

#### slotSpec.table.aria

> `readonly` **aria**: `object`

#### slotSpec.table.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`, `"aria-labelledby"`, `"aria-rowcount"`, `"aria-colcount"`\]

#### slotSpec.table.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.table.aria.role

> `readonly` **role**: `"grid"` = `"grid"`

#### slotSpec.table.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.table.element

> `readonly` **element**: `"table"` = `"table"`

#### slotSpec.toolbar

> `readonly` **toolbar**: `object`

#### slotSpec.toolbar.aria

> `readonly` **aria**: `object`

#### slotSpec.toolbar.aria.optional

> `readonly` **optional**: readonly \[`"aria-label"`\]

#### slotSpec.toolbar.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.toolbar.aria.role

> `readonly` **role**: `"toolbar"` = `"toolbar"`

#### slotSpec.toolbar.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.toolbar.element

> `readonly` **element**: `"div"` = `"div"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.body

> `readonly` **body**: readonly \[\] = `[]`

#### slotStates.caption

> `readonly` **caption**: readonly \[\] = `[]`

#### slotStates.cell

> `readonly` **cell**: readonly \[\] = `[]`

#### slotStates.empty

> `readonly` **empty**: readonly \[\] = `[]`

#### slotStates.footer

> `readonly` **footer**: readonly \[\] = `[]`

#### slotStates.head-cell

> `readonly` **head-cell**: readonly \[\] = `[]`

#### slotStates.header

> `readonly` **header**: readonly \[\] = `[]`

#### slotStates.pagination

> `readonly` **pagination**: readonly \[\] = `[]`

#### slotStates.root

> `readonly` **root**: readonly \[`"loading"`\]

#### slotStates.row

> `readonly` **row**: readonly \[`"selected"`, `"hover"`\]

#### slotStates.table

> `readonly` **table**: readonly \[\] = `[]`

#### slotStates.toolbar

> `readonly` **toolbar**: readonly \[\] = `[]`

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[`"selected"`, `"hover"`, `"loading"`\]

#### states.specific

> `readonly` **specific**: readonly \[\] = `[]`
