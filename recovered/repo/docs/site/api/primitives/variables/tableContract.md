# Variable: tableContract

> `const` **tableContract**: `object`

Defined in: [primitives/table/contract.ts:15](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/table/contract.ts#L15)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[`"aria-label"`, `"aria-labelledby"`, `"aria-rowcount"`, `"aria-colcount"`\]

#### aria.requiredAttrs

> `readonly` **requiredAttrs**: readonly \[\] = `[]`

#### aria.role

> `readonly` **role**: `"none"` = `"none"`

### ariaStateProvider

> `readonly` **ariaStateProvider**: `"coldlight"` = `"coldlight"`

### compound

> `readonly` **compound**: `true` = `true`

### focusStrategy

> `readonly` **focusStrategy**: `"none"` = `"none"`

### keyboard

> `readonly` **keyboard**: readonly \[\] = `[]`

### kind

> `readonly` **kind**: `"table"` = `"table"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.body

> `readonly` **body**: readonly \[\] = `[]`

#### slotActions.caption

> `readonly` **caption**: readonly \[\] = `[]`

#### slotActions.cell

> `readonly` **cell**: readonly \[\] = `[]`

#### slotActions.footer

> `readonly` **footer**: readonly \[\] = `[]`

#### slotActions.head-cell

> `readonly` **head-cell**: readonly \[\] = `[]`

#### slotActions.header

> `readonly` **header**: readonly \[\] = `[]`

#### slotActions.root

> `readonly` **root**: readonly \[\] = `[]`

#### slotActions.row

> `readonly` **row**: readonly \[`"select"`\]

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[`"footer"`, `"head-cell"`, `"caption"`\]

#### slots.required

> `readonly` **required**: readonly \[`"root"`, `"header"`, `"body"`, `"row"`, `"cell"`\]

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

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.cell.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.cell.aria.role

> `readonly` **role**: `"none"` = `"none"`

#### slotSpec.cell.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.cell.element

> `readonly` **element**: `"td"` = `"td"`

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

> `readonly` **optional**: readonly \[`"aria-sort"`\]

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

> `readonly` **element**: `"table"` = `"table"`

#### slotSpec.row

> `readonly` **row**: `object`

#### slotSpec.row.aria

> `readonly` **aria**: `object`

#### slotSpec.row.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.row.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.row.aria.role

> `readonly` **role**: `"none"` = `"none"`

#### slotSpec.row.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.row.element

> `readonly` **element**: `"tr"` = `"tr"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.body

> `readonly` **body**: readonly \[\] = `[]`

#### slotStates.caption

> `readonly` **caption**: readonly \[\] = `[]`

#### slotStates.cell

> `readonly` **cell**: readonly \[\] = `[]`

#### slotStates.footer

> `readonly` **footer**: readonly \[\] = `[]`

#### slotStates.head-cell

> `readonly` **head-cell**: readonly \[\] = `[]`

#### slotStates.header

> `readonly` **header**: readonly \[\] = `[]`

#### slotStates.root

> `readonly` **root**: readonly \[\] = `[]`

#### slotStates.row

> `readonly` **row**: readonly \[`"selected"`, `"hover"`\]

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[`"selected"`, `"hover"`\]

#### states.specific

> `readonly` **specific**: readonly \[\] = `[]`
