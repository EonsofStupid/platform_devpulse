# Variable: accordionContract

> `const` **accordionContract**: `object`

Defined in: [primitives/accordion/contract.ts:30](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/accordion/contract.ts#L30)

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

> `readonly` **ariaStateProvider**: `"meltui"` = `"meltui"`

### compound

> `readonly` **compound**: `true` = `true`

### focusStrategy

> `readonly` **focusStrategy**: `"roving"` = `"roving"`

### keyboard

> `readonly` **keyboard**: readonly \[`"Enter"`, `"Space"`, `"ArrowDown"`, `"ArrowUp"`, `"Home"`, `"End"`\]

### kind

> `readonly` **kind**: `"accordion"` = `"accordion"`

### orientation

> `readonly` **orientation**: `"vertical"` = `"vertical"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.content

> `readonly` **content**: readonly \[\] = `[]`

#### slotActions.item

> `readonly` **item**: readonly \[`"expand"`, `"collapse"`, `"toggle"`\]

#### slotActions.root

> `readonly` **root**: readonly \[\] = `[]`

#### slotActions.trigger

> `readonly` **trigger**: readonly \[`"toggle"`\]

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slots.required

> `readonly` **required**: readonly \[`"root"`, `"item"`, `"trigger"`, `"content"`\]

### slotSpec

> `readonly` **slotSpec**: `object`

#### slotSpec.content

> `readonly` **content**: `object`

#### slotSpec.content.aria

> `readonly` **aria**: `object`

#### slotSpec.content.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.content.aria.required

> `readonly` **required**: readonly \[`"aria-labelledby"`\]

#### slotSpec.content.aria.role

> `readonly` **role**: `"region"` = `"region"`

#### slotSpec.content.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.content.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.item

> `readonly` **item**: `object`

#### slotSpec.item.aria

> `readonly` **aria**: `object`

#### slotSpec.item.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.item.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.item.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.item.element

> `readonly` **element**: `"div"` = `"div"`

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

#### slotSpec.trigger

> `readonly` **trigger**: `object`

#### slotSpec.trigger.aria

> `readonly` **aria**: `object`

#### slotSpec.trigger.aria.optional

> `readonly` **optional**: readonly \[`"aria-disabled"`\]

#### slotSpec.trigger.aria.required

> `readonly` **required**: readonly \[`"aria-expanded"`, `"aria-controls"`\]

#### slotSpec.trigger.aria.role

> `readonly` **role**: `"button"` = `"button"`

#### slotSpec.trigger.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.trigger.element

> `readonly` **element**: `"button"` = `"button"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.content

> `readonly` **content**: readonly \[`"expanded"`, `"collapsed"`\]

#### slotStates.item

> `readonly` **item**: readonly \[`"expanded"`, `"collapsed"`, `"disabled"`\]

#### slotStates.root

> `readonly` **root**: readonly \[\] = `[]`

#### slotStates.trigger

> `readonly` **trigger**: readonly \[`"expanded"`, `"focused"`, `"focus-visible"`, `"hover"`, `"disabled"`\]

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[`"focused"`, `"focus-visible"`, `"hover"`, `"disabled"`\]

#### states.specific

> `readonly` **specific**: readonly \[`"expanded"`, `"collapsed"`\]
