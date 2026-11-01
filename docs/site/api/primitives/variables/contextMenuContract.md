# Variable: contextMenuContract

> `const` **contextMenuContract**: `object`

Defined in: [primitives/context-menu/contract.ts:37](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/context-menu/contract.ts#L37)

## Type Declaration

### aria

> `readonly` **aria**: `object`

#### aria.optionalAttrs

> `readonly` **optionalAttrs**: readonly \[`"aria-labelledby"`, `"aria-orientation"`\]

#### aria.requiredAttrs

> `readonly` **requiredAttrs**: readonly \[\] = `[]`

#### aria.role

> `readonly` **role**: `"menu"` = `"menu"`

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

> `readonly` **focusStrategy**: `"roving"` = `"roving"`

### keyboard

> `readonly` **keyboard**: readonly \[`"Enter"`, `"Space"`, `"ArrowDown"`, `"ArrowUp"`, `"ArrowRight"`, `"ArrowLeft"`, `"Home"`, `"End"`, `"Escape"`\]

### kind

> `readonly` **kind**: `"context-menu"` = `"context-menu"`

### slotActions

> `readonly` **slotActions**: `object`

#### slotActions.checkbox-item

> `readonly` **checkbox-item**: readonly \[`"check"`, `"uncheck"`, `"toggle"`\]

#### slotActions.content

> `readonly` **content**: readonly \[\] = `[]`

#### slotActions.group

> `readonly` **group**: readonly \[\] = `[]`

#### slotActions.item

> `readonly` **item**: readonly \[`"select"`\]

#### slotActions.label

> `readonly` **label**: readonly \[\] = `[]`

#### slotActions.radio-item

> `readonly` **radio-item**: readonly \[`"select"`\]

#### slotActions.separator

> `readonly` **separator**: readonly \[\] = `[]`

#### slotActions.sub-content

> `readonly` **sub-content**: readonly \[`"close"`\]

#### slotActions.sub-trigger

> `readonly` **sub-trigger**: readonly \[`"open"`, `"toggle"`\]

#### slotActions.trigger

> `readonly` **trigger**: readonly \[`"open"`\]

### slots

> `readonly` **slots**: `object`

#### slots.forbidden

> `readonly` **forbidden**: readonly \[\] = `[]`

#### slots.optional

> `readonly` **optional**: readonly \[`"separator"`, `"group"`, `"label"`, `"checkbox-item"`, `"radio-item"`, `"sub-trigger"`, `"sub-content"`\]

#### slots.required

> `readonly` **required**: readonly \[`"trigger"`, `"content"`, `"item"`\]

### slotSpec

> `readonly` **slotSpec**: `object`

#### slotSpec.checkbox-item

> `readonly` **checkbox-item**: `object`

#### slotSpec.checkbox-item.aria

> `readonly` **aria**: `object`

#### slotSpec.checkbox-item.aria.optional

> `readonly` **optional**: readonly \[`"aria-disabled"`\]

#### slotSpec.checkbox-item.aria.required

> `readonly` **required**: readonly \[`"aria-checked"`\]

#### slotSpec.checkbox-item.aria.role

> `readonly` **role**: `"menuitemcheckbox"` = `"menuitemcheckbox"`

#### slotSpec.checkbox-item.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.checkbox-item.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.content

> `readonly` **content**: `object`

#### slotSpec.content.aria

> `readonly` **aria**: `object`

#### slotSpec.content.aria.optional

> `readonly` **optional**: readonly \[`"aria-orientation"`\]

#### slotSpec.content.aria.required

> `readonly` **required**: readonly \[`"aria-labelledby"`\]

#### slotSpec.content.aria.role

> `readonly` **role**: `"menu"` = `"menu"`

#### slotSpec.content.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.content.element

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

#### slotSpec.item

> `readonly` **item**: `object`

#### slotSpec.item.aria

> `readonly` **aria**: `object`

#### slotSpec.item.aria.optional

> `readonly` **optional**: readonly \[`"aria-disabled"`\]

#### slotSpec.item.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.item.aria.role

> `readonly` **role**: `"menuitem"` = `"menuitem"`

#### slotSpec.item.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.item.element

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

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.radio-item

> `readonly` **radio-item**: `object`

#### slotSpec.radio-item.aria

> `readonly` **aria**: `object`

#### slotSpec.radio-item.aria.optional

> `readonly` **optional**: readonly \[`"aria-disabled"`\]

#### slotSpec.radio-item.aria.required

> `readonly` **required**: readonly \[`"aria-checked"`\]

#### slotSpec.radio-item.aria.role

> `readonly` **role**: `"menuitemradio"` = `"menuitemradio"`

#### slotSpec.radio-item.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.radio-item.element

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

#### slotSpec.sub-content

> `readonly` **sub-content**: `object`

#### slotSpec.sub-content.aria

> `readonly` **aria**: `object`

#### slotSpec.sub-content.aria.optional

> `readonly` **optional**: readonly \[`"aria-labelledby"`\]

#### slotSpec.sub-content.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.sub-content.aria.role

> `readonly` **role**: `"menu"` = `"menu"`

#### slotSpec.sub-content.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.sub-content.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.sub-trigger

> `readonly` **sub-trigger**: `object`

#### slotSpec.sub-trigger.aria

> `readonly` **aria**: `object`

#### slotSpec.sub-trigger.aria.optional

> `readonly` **optional**: readonly \[`"aria-controls"`\]

#### slotSpec.sub-trigger.aria.required

> `readonly` **required**: readonly \[`"aria-haspopup"`, `"aria-expanded"`\]

#### slotSpec.sub-trigger.aria.role

> `readonly` **role**: `"menuitem"` = `"menuitem"`

#### slotSpec.sub-trigger.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.sub-trigger.element

> `readonly` **element**: `"div"` = `"div"`

#### slotSpec.trigger

> `readonly` **trigger**: `object`

#### slotSpec.trigger.aria

> `readonly` **aria**: `object`

#### slotSpec.trigger.aria.optional

> `readonly` **optional**: readonly \[\] = `[]`

#### slotSpec.trigger.aria.required

> `readonly` **required**: readonly \[\] = `[]`

#### slotSpec.trigger.children

> `readonly` **children**: `"snippet"` = `"snippet"`

#### slotSpec.trigger.element

> `readonly` **element**: `"div"` = `"div"`

### slotStates

> `readonly` **slotStates**: `object`

#### slotStates.checkbox-item

> `readonly` **checkbox-item**: readonly \[`"checked"`, `"focused"`, `"hover"`, `"disabled"`\]

#### slotStates.content

> `readonly` **content**: readonly \[`"open"`, `"closed"`\]

#### slotStates.group

> `readonly` **group**: readonly \[\] = `[]`

#### slotStates.item

> `readonly` **item**: readonly \[`"focused"`, `"hover"`, `"disabled"`\]

#### slotStates.label

> `readonly` **label**: readonly \[\] = `[]`

#### slotStates.radio-item

> `readonly` **radio-item**: readonly \[`"checked"`, `"focused"`, `"hover"`, `"disabled"`\]

#### slotStates.separator

> `readonly` **separator**: readonly \[\] = `[]`

#### slotStates.sub-content

> `readonly` **sub-content**: readonly \[`"open"`, `"closed"`\]

#### slotStates.sub-trigger

> `readonly` **sub-trigger**: readonly \[`"focused"`, `"hover"`, `"open"`, `"closed"`\]

#### slotStates.trigger

> `readonly` **trigger**: readonly \[`"open"`, `"closed"`\]

### states

> `readonly` **states**: `object`

#### states.shared

> `readonly` **shared**: readonly \[`"focused"`, `"focus-visible"`, `"hover"`, `"disabled"`\]

#### states.specific

> `readonly` **specific**: readonly \[`"open"`, `"closed"`, `"checked"`\]
