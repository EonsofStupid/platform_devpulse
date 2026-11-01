# Variable: tabsContract

> `const` **tabsContract**: `object`

Defined in: [primitives/tabs/contract.ts:21](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/tabs/contract.ts#L21)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[`"aria-label"`, `"aria-orientation"`\]

#### aria.requiredAttrs

> `readonly` **requiredAttrs**: readonly \[\] = `[]`

#### aria.role

> `readonly` **role**: `"tablist"` = `"tablist"`

### ariaStateProvider

> `readonly` **ariaStateProvider**: `"meltui"` = `"meltui"`

### compound

> `readonly` **compound**: `true` = `true`

### focusStrategy

> `readonly` **focusStrategy**: `"roving"` = `"roving"`

### keyboard

> `readonly` **keyboard**: readonly \[`"ArrowLeft"`, `"ArrowRight"`, `"Home"`, `"End"`, `"Enter"`, `"Space"`\]

### kind

> `readonly` **kind**: `"tabs"` = `"tabs"`

### orientation

> `readonly` **orientation**: `"horizontal"` = `"horizontal"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.content

> `readonly` **content**: readonly \[\] = `[]`

#### slotActions.trigger

> `readonly` **trigger**: readonly \[`"select"`\]

#### slotActions.triggerList

> `readonly` **triggerList**: readonly \[\] = `[]`

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slots.required

> `readonly` **required**: readonly \[`"triggerList"`, `"trigger"`, `"content"`\]

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

> `readonly` **role**: `"tabpanel"` = `"tabpanel"`

#### slotSpec.content.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.content.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.trigger

> `readonly` **trigger**: `object`

#### slotSpec.trigger.aria

> `readonly` **aria**: `object`

#### slotSpec.trigger.aria.optional

> `readonly` **optional**: readonly \[`"aria-disabled"`\]

#### slotSpec.trigger.aria.required

> `readonly` **required**: readonly \[`"aria-selected"`, `"aria-controls"`\]

#### slotSpec.trigger.aria.role

> `readonly` **role**: `"tab"` = `"tab"`

#### slotSpec.trigger.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.trigger.element

> `readonly` **element**: `"button"` = `"button"`

#### slotSpec.triggerList

> `readonly` **triggerList**: `object`

#### slotSpec.triggerList.aria

> `readonly` **aria**: `object`

#### slotSpec.triggerList.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.triggerList.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.triggerList.aria.role

> `readonly` **role**: `"tablist"` = `"tablist"`

#### slotSpec.triggerList.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.triggerList.element

> `readonly` **element**: `"div"` = `"div"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.content

> `readonly` **content**: readonly \[`"selected"`\]

#### slotStates.trigger

> `readonly` **trigger**: readonly \[`"selected"`, `"focused"`, `"focus-visible"`, `"hover"`, `"disabled"`\]

#### slotStates.triggerList

> `readonly` **triggerList**: readonly \[\] = `[]`

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[`"selected"`, `"focused"`, `"focus-visible"`, `"hover"`, `"disabled"`\]

#### states.specific

> `readonly` **specific**: readonly \[\] = `[]`
