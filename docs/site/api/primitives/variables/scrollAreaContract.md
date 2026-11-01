# Variable: scrollAreaContract

> `const` **scrollAreaContract**: `object`

Defined in: [primitives/scroll-area/contract.ts:15](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/scroll-area/contract.ts#L15)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[\] = `[]`

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

> `readonly` **kind**: `"scroll-area"` = `"scroll-area"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.root

> `readonly` **root**: readonly \[\] = `[]`

#### slotActions.scrollbar

> `readonly` **scrollbar**: readonly \[\] = `[]`

#### slotActions.thumb

> `readonly` **thumb**: readonly \[\] = `[]`

#### slotActions.viewport

> `readonly` **viewport**: readonly \[\] = `[]`

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slots.required

> `readonly` **required**: readonly \[`"root"`, `"viewport"`, `"scrollbar"`, `"thumb"`\]

### slotSpec

> `readonly` **slotSpec**: `object`

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

#### slotSpec.scrollbar

> `readonly` **scrollbar**: `object`

#### slotSpec.scrollbar.aria

> `readonly` **aria**: `object`

#### slotSpec.scrollbar.aria.optional

> `readonly` **optional**: readonly \[`"aria-valuemin"`, `"aria-valuemax"`, `"aria-valuenow"`\]

#### slotSpec.scrollbar.aria.required

> `readonly` **required**: readonly \[`"aria-controls"`, `"aria-orientation"`\]

#### slotSpec.scrollbar.aria.role

> `readonly` **role**: `"scrollbar"` = `"scrollbar"`

#### slotSpec.scrollbar.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.scrollbar.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.thumb

> `readonly` **thumb**: `object`

#### slotSpec.thumb.aria

> `readonly` **aria**: `object`

#### slotSpec.thumb.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.thumb.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.thumb.aria.role

> `readonly` **role**: `"none"` = `"none"`

#### slotSpec.thumb.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.thumb.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.viewport

> `readonly` **viewport**: `object`

#### slotSpec.viewport.aria

> `readonly` **aria**: `object`

#### slotSpec.viewport.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.viewport.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.viewport.aria.role

> `readonly` **role**: `"none"` = `"none"`

#### slotSpec.viewport.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.viewport.element

> `readonly` **element**: `"div"` = `"div"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.root

> `readonly` **root**: readonly \[\] = `[]`

#### slotStates.scrollbar

> `readonly` **scrollbar**: readonly \[`"hover"`, `"active"`\]

#### slotStates.thumb

> `readonly` **thumb**: readonly \[`"hover"`, `"active"`\]

#### slotStates.viewport

> `readonly` **viewport**: readonly \[\] = `[]`

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[`"hover"`, `"active"`\]

#### states.specific

> `readonly` **specific**: readonly \[\] = `[]`
