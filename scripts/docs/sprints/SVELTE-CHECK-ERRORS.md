# svelte-check Error Report — 2026-03-20

**Total: 536 errors across 246 files**

## Summary by Category


| Count | Error Pattern |
|-------|---------------|
| 122 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefin |
| 61 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| 8 | 'rect' is possibly 'undefined'. |
| 3 | Parameter 'v' implicitly has an 'any' type. |
| 3 | Cannot find module './primitives/_schema/types.js' or its corresponding type declarations. |
| 2 | Property 'default' does not exist on type '{}'. |
| 2 | Parameter 'r' implicitly has an 'any' type. |
| 2 | Parameter 'k' implicitly has an 'any' type. |
| 2 | Parameter 'attr' implicitly has an 'any' type. |
| 2 | Module '\"./types.js\"' has no exported member 'StyleProps'. |
| 2 | Module '\"./types.js\"' has no exported member 'StateCondition'. |
| 2 | Cannot find module '../../primitives/_schema/types.js' or its corresponding type declarations. |
| 2 | Cannot find module '../../primitives/_schema/schema.js' or its corresponding type declarations. |
| 2 | Cannot find module '$lib/design/api/dsadapters/meltui/_internal/tooltip/index.js' or its corresponding type declarations |
| 2 | Cannot find module '$lib/design/api/dsadapters/meltui/_internal/slider/index.js' or its corresponding type declarations. |
| 2 | Cannot find module '$lib/design/api/dsadapters/meltui/_internal/select/index.js' or its corresponding type declarations. |
| 2 | Cannot find module '$lib/design/api/dsadapters/meltui/_internal/radio-group/index.js' or its corresponding type declarat |
| 2 | Cannot find module '$lib/design/api/dsadapters/meltui/_internal/popover/index.js' or its corresponding type declarations |
| 2 | Cannot find module '$lib/design/api/dsadapters/meltui/_internal/combobox/index.js' or its corresponding type declaration |
| 2 | Cannot find module '$lib/design/api/dsadapters/meltui/_internal/collapsible/index.js' or its corresponding type declarat |
| 2 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/tabs/tabs.svelte.js' or its corresponding type declar |
| 2 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/dialog/dialog.svelte.js' or its corresponding type de |
| 2 | Argument of type 'Element | null' is not assignable to parameter of type 'HTMLElement'.\n Type 'null' is not assignable  |
| 1 | Type '{ type: \"button\"; tabindex: -1; \"aria-label\": \"Toggle options\"; \"data-state\": \"open\" | \"closed\"; oncli |
| 1 | Type '{ type: \"button\"; onclick: () => void; \"data-kind\": string; \"data-slot\": \"trigger\" | \"content\" | \"close |
| 1 | Type '{ type: \"button\"; onclick: () => void; \"data-kind\": string; \"data-slot\": \"overlay\" | \"title\" | \"trigger |
| 1 | Type '{ type: \"button\"; onclick: () => void; \"data-kind\": string; \"data-slot\": \"overlay\" | \"title\" | \"trigger |
| 1 | Type '{ type: \"button\"; onclick: () => void; \"data-kind\": string; \"data-slot\": \"overlay\" | \"action\" | \"title\ |
| 1 | Type '{ type: \"button\"; onclick: () => void; \"data-kind\": string; \"data-slot\": \"overlay\" | \"action\" | \"title\ |
| 1 | Type '{ type: \"button\"; \"aria-haspopup\": \"dialog\"; \"data-state\": \"open\" | \"closed\"; onclick: () => void; \"d |

## Every Error


| File | Line | Error |
|------|------|-------|
| `src\\lib\\design\\config\\coldlight\\types.ts` | 23:40 | Cannot find module '../../primitives/_schema/types.js' or its corresponding type declarations. |
| `src\\lib\\design\\primitives\\accordion\\use-accordion.svelte.ts` | 61:7 | Type '{ \"data-disabled\": \"\" | undefined; \"data-kind\": string; \"data-slot\": \"root\" | \"item\" | \"trigger\" | \"content\"; }' is not assignable to type 'AccordionRootAttrs'.\n  Type '{ \"data |
| `src\\lib\\design\\primitives\\accordion\\use-accordion.svelte.ts` | 65:3 | Type '(itemValue: string) => { \"data-state\": \"open\" | \"closed\"; \"data-value\": string; \"data-kind\": string; \"data-slot\": \"root\" | \"item\" | \"trigger\" | \"content\"; }' is not assignabl |
| `src\\lib\\design\\primitives\\accordion\\use-accordion.svelte.ts` | 74:3 | Type '(itemValue: string, disabled?: boolean | undefined) => { type: \"button\"; id: string; \"aria-expanded\": boolean; \"aria-controls\": string; \"aria-disabled\": true | undefined; \"data-state\": |
| `src\\lib\\design\\primitives\\accordion\\use-accordion.svelte.ts` | 99:3 | Type '(itemValue: string) => { role: \"region\"; id: string; \"aria-labelledby\": string; hidden: true | undefined; \"data-state\": \"open\" | \"closed\"; \"data-kind\": string; \"data-slot\": \"root\ |
| `src\\lib\\design\\primitives\\alert-dialog\\use-alert-dialog.svelte.ts` | 128:7 | Type '{ type: \"button\"; \"aria-haspopup\": \"dialog\"; \"data-state\": \"open\" | \"closed\"; onclick: () => void; \"data-kind\": string; \"data-slot\": \"overlay\" | \"action\" | \"title\" | \"trig |
| `src\\lib\\design\\primitives\\alert-dialog\\use-alert-dialog.svelte.ts` | 131:7 | Type '{ \"aria-hidden\": \"true\"; popover: \"manual\"; \"data-state\": \"open\" | \"closed\"; \"data-kind\": string; \"data-slot\": \"overlay\" | \"action\" | \"title\" | \"trigger\" | \"content\" |  |
| `src\\lib\\design\\primitives\\alert-dialog\\use-alert-dialog.svelte.ts` | 134:7 | Type '{ id: string; role: \"alertdialog\"; \"aria-modal\": \"true\"; \"aria-labelledby\": string; \"aria-describedby\": string; \"data-state\": \"open\" | \"closed\"; onclose: () => void; oncancel: (e |
| `src\\lib\\design\\primitives\\alert-dialog\\use-alert-dialog.svelte.ts` | 137:7 | Type '{ id: string; \"data-kind\": string; \"data-slot\": \"overlay\" | \"action\" | \"title\" | \"trigger\" | \"content\" | \"description\" | \"cancel\"; }' is not assignable to type 'AlertDialogTitl |
| `src\\lib\\design\\primitives\\alert-dialog\\use-alert-dialog.svelte.ts` | 140:7 | Type '{ id: string; \"data-kind\": string; \"data-slot\": \"overlay\" | \"action\" | \"title\" | \"trigger\" | \"content\" | \"description\" | \"cancel\"; }' is not assignable to type 'AlertDialogDesc |
| `src\\lib\\design\\primitives\\alert-dialog\\use-alert-dialog.svelte.ts` | 143:7 | Type '{ type: \"button\"; onclick: () => void; \"data-kind\": string; \"data-slot\": \"overlay\" | \"action\" | \"title\" | \"trigger\" | \"content\" | \"description\" | \"cancel\"; }' is not assignab |
| `src\\lib\\design\\primitives\\alert-dialog\\use-alert-dialog.svelte.ts` | 146:7 | Type '{ type: \"button\"; onclick: () => void; \"data-kind\": string; \"data-slot\": \"overlay\" | \"action\" | \"title\" | \"trigger\" | \"content\" | \"description\" | \"cancel\"; }' is not assignab |
| `src\\lib\\design\\primitives\\breadcrumbs\\use-breadcrumbs.svelte.ts` | 38:7 | Type '{ role: \"navigation\"; \"aria-label\": string; \"data-kind\": string; \"data-slot\": \"list\" | \"link\" | \"root\" | \"separator\" | \"item\"; }' is not assignable to type 'BreadcrumbsRootAttr |
| `src\\lib\\design\\primitives\\breadcrumbs\\use-breadcrumbs.svelte.ts` | 41:7 | Type '{ \"data-kind\": string; \"data-slot\": \"list\" | \"link\" | \"root\" | \"separator\" | \"item\"; }' is not assignable to type 'BreadcrumbsListAttrs'.\n  Type '{ \"data-kind\": string; \"data-s |
| `src\\lib\\design\\primitives\\breadcrumbs\\use-breadcrumbs.svelte.ts` | 44:7 | Type '{ \"data-kind\": string; \"data-slot\": \"list\" | \"link\" | \"root\" | \"separator\" | \"item\"; }' is not assignable to type 'BreadcrumbsItemAttrs'.\n  Type '{ \"data-kind\": string; \"data-s |
| `src\\lib\\design\\primitives\\breadcrumbs\\use-breadcrumbs.svelte.ts` | 47:7 | Type '{ \"aria-hidden\": \"true\"; role: \"presentation\"; \"data-kind\": string; \"data-slot\": \"list\" | \"link\" | \"root\" | \"separator\" | \"item\"; }' is not assignable to type 'BreadcrumbsSep |
| `src\\lib\\design\\primitives\\breadcrumbs\\use-breadcrumbs.svelte.ts` | 51:3 | Type '(isCurrent?: boolean | undefined) => { \"aria-current\": \"page\" | undefined; \"data-current\": \"\" | undefined; \"data-kind\": string; \"data-slot\": \"list\" | \"link\" | \"root\" | \"separa |
| `src\\lib\\design\\primitives\\button\\use-button.svelte.ts` | 77:7 | Type '{ type: ButtonType; role: \"button\"; \"aria-disabled\": true | undefined; \"aria-pressed\": boolean | undefined; \"aria-expanded\": boolean | undefined; \"aria-busy\": true | undefined; ... 7 m |
| `src\\lib\\design\\primitives\\checkbox\\use-checkbox.svelte.ts` | 116:7 | Type '{ id: string; role: \"checkbox\"; type: \"button\"; tabindex: 0; \"aria-checked\": \"true\" | \"false\" | \"mixed\"; \"aria-disabled\": true | undefined; \"aria-required\": true | undefined; \"a |
| `src\\lib\\design\\primitives\\checkbox\\use-checkbox.svelte.ts` | 119:7 | Type '{ id: string; \"aria-hidden\": \"true\"; \"data-state\": CheckboxState; \"data-kind\": string; \"data-slot\": \"root\" | \"label\" | \"indicator\"; }' is not assignable to type 'CheckboxIndicato |
| `src\\lib\\design\\primitives\\checkbox\\use-checkbox.svelte.ts` | 122:7 | Type '{ id: string; \"data-disabled\": \"\" | undefined; onclick: () => void; \"data-kind\": string; \"data-slot\": \"root\" | \"label\" | \"indicator\"; }' is not assignable to type 'CheckboxLabelAtt |
| `src\\lib\\design\\primitives\\color-field\\use-color-field.svelte.ts` | 92:7 | Type '{ id: string; \"data-disabled\": \"\" | undefined; \"data-invalid\": \"\" | undefined; \"data-kind\": string; \"data-slot\": \"root\" | \"label\" | \"input\" | \"swatch\"; }' is not assignable t |
| `src\\lib\\design\\primitives\\color-field\\use-color-field.svelte.ts` | 95:7 | Type '{ id: string; type: \"text\"; value: string; placeholder: string; disabled: true | undefined; readonly: true | undefined; \"aria-label\": string | undefined; \"aria-labelledby\": string | undefi |
| `src\\lib\\design\\primitives\\color-field\\use-color-field.svelte.ts` | 98:7 | Type '{ id: string; for: string; \"data-disabled\": \"\" | undefined; \"data-kind\": string; \"data-slot\": \"root\" | \"label\" | \"input\" | \"swatch\"; }' is not assignable to type 'ColorFieldLabel |
| `src\\lib\\design\\primitives\\color-field\\use-color-field.svelte.ts` | 101:7 | Type '{ id: string; \"aria-hidden\": \"true\"; \"data-valid\": \"\" | undefined; style: string | undefined; \"data-kind\": string; \"data-slot\": \"root\" | \"label\" | \"input\" | \"swatch\"; }' is n |
| `src\\lib\\design\\primitives\\color-slider\\use-color-slider.svelte.ts` | 102:41 | 'rect' is possibly 'undefined'. |
| `src\\lib\\design\\primitives\\color-slider\\use-color-slider.svelte.ts` | 102:53 | 'rect' is possibly 'undefined'. |
| `src\\lib\\design\\primitives\\color-slider\\use-color-slider.svelte.ts` | 103:32 | 'rect' is possibly 'undefined'. |
| `src\\lib\\design\\primitives\\color-slider\\use-color-slider.svelte.ts` | 103:45 | 'rect' is possibly 'undefined'. |
| `src\\lib\\design\\primitives\\color-slider\\use-color-slider.svelte.ts` | 174:7 | Type '{ id: string; \"data-channel\": ColorChannel; \"data-orientation\": Orientation; \"data-disabled\": \"\" | undefined; \"data-kind\": string; \"data-slot\": \"root\" | \"label\" | \"track\" | \"t |
| `src\\lib\\design\\primitives\\color-slider\\use-color-slider.svelte.ts` | 177:7 | Type '{ id: string; \"data-channel\": ColorChannel; \"data-orientation\": Orientation; \"data-disabled\": \"\" | undefined; \"data-kind\": string; \"data-slot\": \"root\" | \"label\" | \"track\" | \"t |
| `src\\lib\\design\\primitives\\color-slider\\use-color-slider.svelte.ts` | 180:7 | Type '{ id: string; role: \"slider\"; tabindex: number; \"aria-valuenow\": number; \"aria-valuemin\": number; \"aria-valuemax\": number; \"aria-orientation\": Orientation; \"aria-label\": string; \"ar |
| `src\\lib\\design\\primitives\\color-slider\\use-color-slider.svelte.ts` | 183:7 | Type '{ id: string; \"data-disabled\": \"\" | undefined; \"data-kind\": string; \"data-slot\": \"root\" | \"label\" | \"track\" | \"thumb\"; }' is not assignable to type 'ColorSliderLabelAttrs'.\n  Ty |
| `src\\lib\\design\\primitives\\combobox\\use-combobox.svelte.ts` | 166:7 | Type '{ \"data-kind\": string; \"data-slot\": \"root\" | \"label\" | \"input\" | \"listbox\" | \"option\" | \"trigger\"; }' is not assignable to type 'ComboboxRootAttrs'.\n  Type '{ \"data-kind\": str |
| `src\\lib\\design\\primitives\\combobox\\use-combobox.svelte.ts` | 169:7 | Type '{ id: string; role: \"combobox\"; type: \"text\"; value: string; placeholder: string | undefined; \"aria-expanded\": boolean; \"aria-haspopup\": \"listbox\"; \"aria-activedescendant\": string |  |
| `src\\lib\\design\\primitives\\combobox\\use-combobox.svelte.ts` | 172:7 | Type '{ type: \"button\"; tabindex: -1; \"aria-label\": \"Toggle options\"; \"data-state\": \"open\" | \"closed\"; onclick: () => void; \"data-kind\": string; \"data-slot\": \"root\" | \"label\" | \"i |
| `src\\lib\\design\\primitives\\combobox\\use-combobox.svelte.ts` | 175:7 | Type '{ id: string; role: \"listbox\"; \"data-kind\": string; \"data-slot\": \"root\" | \"label\" | \"input\" | \"listbox\" | \"option\" | \"trigger\"; }' is not assignable to type 'ComboboxListboxAtt |
| `src\\lib\\design\\primitives\\combobox\\use-combobox.svelte.ts` | 178:7 | Type '{ \"data-kind\": string; \"data-slot\": \"root\" | \"label\" | \"input\" | \"listbox\" | \"option\" | \"trigger\"; }' is not assignable to type 'ComboboxLabelAttrs'.\n  Type '{ \"data-kind\": st |
| `src\\lib\\design\\primitives\\combobox\\use-combobox.svelte.ts` | 181:3 | Type '(optionValue: string, options?: { disabled?: boolean | undefined; } | undefined) => { id: string; role: \"option\"; \"aria-selected\": boolean; \"aria-disabled\": true | undefined; \"data-value\ |
| `src\\lib\\design\\primitives\\dialog\\use-dialog.svelte.ts` | 177:7 | Type '{ type: \"button\"; \"aria-haspopup\": \"dialog\"; \"aria-expanded\": boolean; \"aria-controls\": string; \"data-state\": \"open\" | \"closed\"; onclick: () => void; \"data-kind\": string; \"dat |
| `src\\lib\\design\\primitives\\dialog\\use-dialog.svelte.ts` | 180:7 | Type '{ \"aria-hidden\": \"true\"; popover: \"manual\"; \"data-state\": \"open\" | \"closed\"; \"data-kind\": string; \"data-slot\": \"overlay\" | \"title\" | \"trigger\" | \"content\" | \"description |
| `src\\lib\\design\\primitives\\dialog\\use-dialog.svelte.ts` | 183:7 | Type '{ id: string; role: \"dialog\"; \"aria-modal\": \"true\"; \"aria-labelledby\": string; \"aria-describedby\": string; \"data-state\": \"open\" | \"closed\"; onclose: () => void; oncancel: (e: Eve |
| `src\\lib\\design\\primitives\\dialog\\use-dialog.svelte.ts` | 186:7 | Type '{ id: string; \"data-kind\": string; \"data-slot\": \"overlay\" | \"title\" | \"trigger\" | \"content\" | \"description\" | \"close\"; }' is not assignable to type 'DialogTitleAttrs'.\n  Type '{ |
| `src\\lib\\design\\primitives\\dialog\\use-dialog.svelte.ts` | 189:7 | Type '{ id: string; \"data-kind\": string; \"data-slot\": \"overlay\" | \"title\" | \"trigger\" | \"content\" | \"description\" | \"close\"; }' is not assignable to type 'DialogDescriptionAttrs'.\n  T |
| `src\\lib\\design\\primitives\\dialog\\use-dialog.svelte.ts` | 192:7 | Type '{ type: \"button\"; onclick: () => void; \"data-kind\": string; \"data-slot\": \"overlay\" | \"title\" | \"trigger\" | \"content\" | \"description\" | \"close\"; }' is not assignable to type 'Di |
| `src\\lib\\design\\primitives\\field\\use-field.svelte.ts` | 72:7 | Type '{ id: string; role: \"group\"; \"aria-labelledby\": string; \"data-invalid\": \"\" | undefined; \"data-required\": \"\" | undefined; \"data-disabled\": \"\" | undefined; \"data-kind\": string; \ |
| `src\\lib\\design\\primitives\\field\\use-field.svelte.ts` | 75:7 | Type '{ id: string; for: string; \"data-required\": \"\" | undefined; \"data-disabled\": \"\" | undefined; \"data-kind\": string; \"data-slot\": \"root\" | \"error\" | \"label\" | \"description\" | \" |
| `src\\lib\\design\\primitives\\field\\use-field.svelte.ts` | 78:7 | Type '{ id: string; \"aria-describedby\": string | undefined; \"aria-invalid\": \"true\" | undefined; \"aria-required\": \"true\" | undefined; \"aria-disabled\": true | undefined; \"data-invalid\": \" |
| `src\\lib\\design\\primitives\\field\\use-field.svelte.ts` | 81:7 | Type '{ id: string; \"data-kind\": string; \"data-slot\": \"root\" | \"error\" | \"label\" | \"description\" | \"control\"; }' is not assignable to type 'FieldDescriptionAttrs'.\n  Type '{ id: string; |
| `src\\lib\\design\\primitives\\field\\use-field.svelte.ts` | 84:7 | Type '{ id: string; role: \"alert\"; \"aria-live\": \"polite\"; \"data-invalid\": \"\" | undefined; \"data-kind\": string; \"data-slot\": \"root\" | \"error\" | \"label\" | \"description\" | \"control |
| `src\\lib\\design\\primitives\\grid-list\\use-grid-list.svelte.ts` | 73:7 | Type '{ id: string; role: \"grid\"; \"aria-label\": string | undefined; \"aria-multiselectable\": true | undefined; \"aria-disabled\": true | undefined; onkeydown: (e: KeyboardEvent) => void; \"data-k |
| `src\\lib\\design\\primitives\\grid-list\\use-grid-list.svelte.ts` | 77:3 | Type '(key: string, options?: { disabled?: boolean | undefined; } | undefined) => { role: \"row\"; tabindex: 0; \"aria-selected\": boolean; \"aria-disabled\": true | undefined; \"data-key\": string; \ |
| `src\\lib\\design\\primitives\\link\\use-link.svelte.ts` | 56:7 | Type '{ \"aria-disabled\": true | undefined; \"aria-label\": string | undefined; \"aria-current\": \"page\" | \"true\" | \"false\" | \"step\" | \"location\" | \"date\" | \"time\" | undefined; \"data-d |
| `src\\lib\\design\\primitives\\listbox\\use-listbox.svelte.ts` | 110:7 | Type '{ id: string; role: \"listbox\"; tabindex: 0; \"aria-multiselectable\": true | undefined; \"aria-activedescendant\": string | undefined; \"aria-label\": string | undefined; \"aria-labelledby\":  |
| `src\\lib\\design\\primitives\\listbox\\use-listbox.svelte.ts` | 114:3 | Type '(optionValue: string, options?: { disabled?: boolean | undefined; label?: string | undefined; } | undefined) => { id: string; role: \"option\"; \"aria-selected\": boolean; \"aria-disabled\": tru |
| `src\\lib\\design\\primitives\\listbox\\use-listbox.svelte.ts` | 137:3 | Type '(label: string) => { role: \"group\"; \"aria-label\": string; \"data-kind\": string; \"data-slot\": \"root\" | \"group\" | \"label\" | \"option\"; }' is not assignable to type '(label: string) = |
| `src\\lib\\design\\primitives\\menu\\use-menu.svelte.ts` | 122:7 | Type '{ type: \"button\"; \"aria-expanded\": boolean; \"aria-haspopup\": \"menu\"; \"aria-controls\": string; \"data-state\": \"open\" | \"closed\"; onclick: () => void; onkeydown: (e: KeyboardEvent)  |
| `src\\lib\\design\\primitives\\menu\\use-menu.svelte.ts` | 125:7 | Type '{ id: string; role: \"menu\"; \"aria-label\": string | undefined; \"data-state\": \"open\" | \"closed\"; onkeydown: (e: KeyboardEvent) => void; \"data-kind\": string; \"data-slot\": \"root\" | \ |
| `src\\lib\\design\\primitives\\menu\\use-menu.svelte.ts` | 128:7 | Type '{ role: \"separator\"; \"data-kind\": string; \"data-slot\": \"root\" | \"group\" | \"label\" | \"separator\" | \"item\" | \"trigger\" | \"content\"; }' is not assignable to type 'MenuSeparatorA |
| `src\\lib\\design\\primitives\\menu\\use-menu.svelte.ts` | 132:3 | Type '(value: string, options?: { disabled?: boolean | undefined; } | undefined) => { role: \"menuitem\"; tabindex: -1; \"data-value\": string; \"data-disabled\": \"\" | undefined; \"aria-disabled\":  |
| `src\\lib\\design\\primitives\\menu\\use-menu.svelte.ts` | 158:3 | Type '(label: string) => { role: \"group\"; \"aria-label\": string; \"data-kind\": string; \"data-slot\": \"root\" | \"group\" | \"label\" | \"separator\" | \"item\" | \"trigger\" | \"content\"; }' is |
| `src\\lib\\design\\primitives\\meter\\use-meter.svelte.ts` | 116:7 | Type '{ id: string; role: \"meter\"; \"aria-valuenow\": number; \"aria-valuemin\": number; \"aria-valuemax\": number; \"aria-valuetext\": string | undefined; \"aria-label\": string | undefined; \"aria |
| `src\\lib\\design\\primitives\\meter\\use-meter.svelte.ts` | 119:7 | Type '{ id: string; \"data-state\": MeterStatus; \"data-kind\": string; \"data-slot\": \"fill\" | \"root\" | \"label\" | \"track\"; }' is not assignable to type 'MeterTrackAttrs'.\n  Type '{ id: strin |
| `src\\lib\\design\\primitives\\meter\\use-meter.svelte.ts` | 122:7 | Type '{ id: string; \"data-state\": MeterStatus; style: string; \"data-kind\": string; \"data-slot\": \"fill\" | \"root\" | \"label\" | \"track\"; }' is not assignable to type 'MeterFillAttrs'.\n  Typ |
| `src\\lib\\design\\primitives\\meter\\use-meter.svelte.ts` | 125:7 | Type '{ id: string; \"data-kind\": string; \"data-slot\": \"fill\" | \"root\" | \"label\" | \"track\"; }' is not assignable to type 'MeterLabelAttrs'.\n  Type '{ id: string; \"data-kind\": string; \"d |
| `src\\lib\\design\\primitives\\number-field\\use-number-field.svelte.ts` | 132:7 | Type '{ id: string; role: \"group\"; \"aria-label\": string | undefined; \"data-disabled\": \"\" | undefined; \"data-kind\": string; \"data-slot\": \"root\" | \"input\" | \"increment\" | \"decrement\" |
| `src\\lib\\design\\primitives\\number-field\\use-number-field.svelte.ts` | 135:7 | Type '{ id: string; role: \"spinbutton\"; type: \"text\"; inputmode: \"numeric\"; value: number; \"aria-valuenow\": number; \"aria-valuemin\": number | undefined; \"aria-valuemax\": number | undefined |
| `src\\lib\\design\\primitives\\number-field\\use-number-field.svelte.ts` | 138:7 | Type '{ id: string; type: \"button\"; tabindex: -1; \"aria-label\": \"Increase value\"; \"aria-disabled\": true | undefined; \"data-disabled\": \"\" | undefined; onclick: () => void; \"data-kind\": st |
| `src\\lib\\design\\primitives\\number-field\\use-number-field.svelte.ts` | 141:7 | Type '{ id: string; type: \"button\"; tabindex: -1; \"aria-label\": \"Decrease value\"; \"aria-disabled\": true | undefined; \"data-disabled\": \"\" | undefined; onclick: () => void; \"data-kind\": st |
| `src\\lib\\design\\primitives\\popover\\use-popover.svelte.ts` | 94:7 | Type '{ type: \"button\"; \"aria-expanded\": boolean; \"aria-haspopup\": \"dialog\"; \"aria-controls\": string; \"data-state\": \"open\" | \"closed\"; onclick: () => void; \"data-kind\": string; \"dat |
| `src\\lib\\design\\primitives\\popover\\use-popover.svelte.ts` | 97:7 | Type '{ id: string; role: \"dialog\"; \"data-state\": \"open\" | \"closed\"; \"data-kind\": string; \"data-slot\": \"trigger\" | \"content\" | \"close\" | \"arrow\"; }' is not assignable to type 'Popo |
| `src\\lib\\design\\primitives\\popover\\use-popover.svelte.ts` | 100:7 | Type '{ \"aria-hidden\": \"true\"; \"data-kind\": string; \"data-slot\": \"trigger\" | \"content\" | \"close\" | \"arrow\"; }' is not assignable to type 'PopoverArrowAttrs'.\n  Type '{ \"aria-hidden\" |
| `src\\lib\\design\\primitives\\popover\\use-popover.svelte.ts` | 103:7 | Type '{ type: \"button\"; onclick: () => void; \"data-kind\": string; \"data-slot\": \"trigger\" | \"content\" | \"close\" | \"arrow\"; }' is not assignable to type 'PopoverCloseAttrs'.\n  Type '{ typ |
| `src\\lib\\design\\primitives\\progress\\use-progress.svelte.ts` | 110:7 | Type '{ id: string; role: \"progressbar\"; \"aria-valuenow\": number | undefined; \"aria-valuemin\": number; \"aria-valuemax\": number; \"aria-valuetext\": string | undefined; \"aria-label\": string | |
| `src\\lib\\design\\primitives\\progress\\use-progress.svelte.ts` | 113:7 | Type '{ id: string; \"data-state\": \"loading\" | \"indeterminate\" | \"complete\"; \"data-kind\": string; \"data-slot\": \"fill\" | \"root\" | \"label\" | \"track\"; }' is not assignable to type 'Pro |
| `src\\lib\\design\\primitives\\progress\\use-progress.svelte.ts` | 116:7 | Type '{ id: string; \"data-state\": \"loading\" | \"indeterminate\" | \"complete\"; style: string | undefined; \"data-kind\": string; \"data-slot\": \"fill\" | \"root\" | \"label\" | \"track\"; }' is  |
| `src\\lib\\design\\primitives\\progress\\use-progress.svelte.ts` | 119:7 | Type '{ id: string; \"data-kind\": string; \"data-slot\": \"fill\" | \"root\" | \"label\" | \"track\"; }' is not assignable to type 'ProgressLabelAttrs'.\n  Type '{ id: string; \"data-kind\": string;  |
| `src\\lib\\design\\primitives\\radio-group\\use-radio-group.svelte.ts` | 105:7 | Type '{ id: string; role: \"radiogroup\"; \"aria-orientation\": Orientation; \"aria-label\": string | undefined; \"aria-labelledby\": string | undefined; \"aria-required\": true | undefined; ... 4 mor |
| `src\\lib\\design\\primitives\\radio-group\\use-radio-group.svelte.ts` | 109:3 | Type '(radioValue: string, itemDisabled?: boolean | undefined) => { role: \"radio\"; id: string; tabindex: number; \"aria-checked\": boolean; \"aria-disabled\": true | undefined; \"aria-labelledby\":  |
| `src\\lib\\design\\primitives\\radio-group\\use-radio-group.svelte.ts` | 139:3 | Type '(radioValue: string) => { id: string; onclick: () => void; \"data-kind\": string; \"data-slot\": \"root\" | \"label\" | \"radio\" | \"description\"; }' is not assignable to type '(radioValue: st |
| `src\\lib\\design\\primitives\\radio-group\\use-radio-group.svelte.ts` | 152:3 | Type '(radioValue: string) => { id: string; \"data-kind\": string; \"data-slot\": \"root\" | \"label\" | \"radio\" | \"description\"; }' is not assignable to type '(radioValue: string) => RadioGroupDe |
| `src\\lib\\design\\primitives\\search-field\\use-search-field.svelte.ts` | 90:7 | Type '{ id: string; role: \"search\"; \"aria-label\": string; \"data-disabled\": \"\" | undefined; \"data-has-value\": \"\" | undefined; \"data-kind\": string; \"data-slot\": \"root\" | \"input\" | \" |
| `src\\lib\\design\\primitives\\search-field\\use-search-field.svelte.ts` | 93:7 | Type '{ id: string; role: \"searchbox\"; type: \"search\"; value: string; placeholder: string; disabled: true | undefined; \"aria-label\": string; \"aria-describedby\": string | undefined; \"aria-disa |
| `src\\lib\\design\\primitives\\search-field\\use-search-field.svelte.ts` | 96:7 | Type '{ id: string; \"aria-hidden\": \"true\"; \"data-kind\": string; \"data-slot\": \"root\" | \"input\" | \"icon\" | \"clear\"; }' is not assignable to type 'SearchFieldIconAttrs'.\n  Type '{ id: st |
| `src\\lib\\design\\primitives\\search-field\\use-search-field.svelte.ts` | 99:7 | Type '{ id: string; type: \"button\"; tabindex: 0 | -1; \"aria-label\": \"Clear search\"; \"aria-disabled\": true | undefined; \"data-disabled\": \"\" | undefined; \"data-visible\": \"\" | undefined;  |
| `src\\lib\\design\\primitives\\select\\use-select.svelte.ts` | 157:7 | Type '{ \"data-kind\": string; \"data-slot\": \"root\" | \"value\" | \"label\" | \"listbox\" | \"option\" | \"trigger\"; }' is not assignable to type 'SelectRootAttrs'.\n  Type '{ \"data-kind\": strin |
| `src\\lib\\design\\primitives\\select\\use-select.svelte.ts` | 160:7 | Type '{ id: string; role: \"combobox\"; type: \"button\"; tabindex: 0; \"aria-expanded\": boolean; \"aria-haspopup\": \"listbox\"; \"aria-activedescendant\": string | undefined; \"aria-controls\": str |
| `src\\lib\\design\\primitives\\select\\use-select.svelte.ts` | 163:7 | Type '{ \"data-kind\": string; \"data-slot\": \"root\" | \"value\" | \"label\" | \"listbox\" | \"option\" | \"trigger\"; }' is not assignable to type 'SelectValueAttrs'.\n  Type '{ \"data-kind\": stri |
| `src\\lib\\design\\primitives\\select\\use-select.svelte.ts` | 166:7 | Type '{ id: string; role: \"listbox\"; \"data-kind\": string; \"data-slot\": \"root\" | \"value\" | \"label\" | \"listbox\" | \"option\" | \"trigger\"; }' is not assignable to type 'SelectListboxAttrs |
| `src\\lib\\design\\primitives\\select\\use-select.svelte.ts` | 169:7 | Type '{ \"data-kind\": string; \"data-slot\": \"root\" | \"value\" | \"label\" | \"listbox\" | \"option\" | \"trigger\"; }' is not assignable to type 'SelectLabelAttrs'.\n  Type '{ \"data-kind\": stri |
| `src\\lib\\design\\primitives\\select\\use-select.svelte.ts` | 172:3 | Type '(optionValue: string, options?: { disabled?: boolean | undefined; } | undefined) => { id: string; role: \"option\"; \"aria-selected\": boolean; \"aria-disabled\": true | undefined; \"data-value\ |
| `src\\lib\\design\\primitives\\separator\\use-separator.svelte.ts` | 35:7 | Type '{ role: \"none\"; \"aria-hidden\": \"true\"; \"data-orientation\": Orientation; \"data-kind\": string; \"data-slot\": \"root\"; } | { role: \"separator\"; \"aria-orientation\": Orientation; \"da |
| `src\\lib\\design\\primitives\\sheet\\use-sheet.svelte.ts` | 138:7 | Type '{ type: \"button\"; \"aria-haspopup\": \"dialog\"; \"aria-expanded\": boolean; \"data-state\": \"open\" | \"closed\"; onclick: () => void; \"data-kind\": string; \"data-slot\": \"overlay\" | \"t |
| `src\\lib\\design\\primitives\\sheet\\use-sheet.svelte.ts` | 141:7 | Type '{ \"aria-hidden\": \"true\"; popover: \"manual\"; \"data-state\": \"open\" | \"closed\"; \"data-kind\": string; \"data-slot\": \"overlay\" | \"title\" | \"trigger\" | \"content\" | \"description |
| `src\\lib\\design\\primitives\\sheet\\use-sheet.svelte.ts` | 144:7 | Type '{ id: string; role: \"dialog\"; \"aria-modal\": \"true\"; \"aria-labelledby\": string; \"aria-describedby\": string; \"data-state\": \"open\" | \"closed\"; \"data-side\": SheetSide; onclose: ()  |
| `src\\lib\\design\\primitives\\sheet\\use-sheet.svelte.ts` | 147:7 | Type '{ id: string; \"data-kind\": string; \"data-slot\": \"overlay\" | \"title\" | \"trigger\" | \"content\" | \"description\" | \"close\"; }' is not assignable to type 'SheetTitleAttrs'.\n  Type '{  |
| `src\\lib\\design\\primitives\\sheet\\use-sheet.svelte.ts` | 150:7 | Type '{ id: string; \"data-kind\": string; \"data-slot\": \"overlay\" | \"title\" | \"trigger\" | \"content\" | \"description\" | \"close\"; }' is not assignable to type 'SheetDescriptionAttrs'.\n  Ty |
| `src\\lib\\design\\primitives\\sheet\\use-sheet.svelte.ts` | 153:7 | Type '{ type: \"button\"; onclick: () => void; \"data-kind\": string; \"data-slot\": \"overlay\" | \"title\" | \"trigger\" | \"content\" | \"description\" | \"close\"; }' is not assignable to type 'Sh |
| `src\\lib\\design\\primitives\\slider\\use-slider.svelte.ts` | 99:41 | 'rect' is possibly 'undefined'. |
| `src\\lib\\design\\primitives\\slider\\use-slider.svelte.ts` | 99:53 | 'rect' is possibly 'undefined'. |
| `src\\lib\\design\\primitives\\slider\\use-slider.svelte.ts` | 100:32 | 'rect' is possibly 'undefined'. |
| `src\\lib\\design\\primitives\\slider\\use-slider.svelte.ts` | 100:45 | 'rect' is possibly 'undefined'. |
| `src\\lib\\design\\primitives\\slider\\use-slider.svelte.ts` | 175:7 | Type '{ id: string; \"data-orientation\": Orientation; \"data-disabled\": \"\" | undefined; \"data-kind\": string; \"data-slot\": \"root\" | \"label\" | \"output\" | \"track\" | \"thumb\"; }' is not a |
| `src\\lib\\design\\primitives\\slider\\use-slider.svelte.ts` | 178:7 | Type '{ id: string; \"data-orientation\": Orientation; \"data-disabled\": \"\" | undefined; \"data-kind\": string; \"data-slot\": \"root\" | \"label\" | \"output\" | \"track\" | \"thumb\"; }' is not a |
| `src\\lib\\design\\primitives\\slider\\use-slider.svelte.ts` | 181:7 | Type '{ id: string; role: \"slider\"; tabindex: number; \"aria-valuenow\": number; \"aria-valuemin\": number; \"aria-valuemax\": number; \"aria-valuetext\": string | undefined; \"aria-orientation\": O |
| `src\\lib\\design\\primitives\\slider\\use-slider.svelte.ts` | 184:7 | Type '{ id: string; \"data-disabled\": \"\" | undefined; \"data-kind\": string; \"data-slot\": \"root\" | \"label\" | \"output\" | \"track\" | \"thumb\"; }' is not assignable to type 'SliderLabelAttrs |
| `src\\lib\\design\\primitives\\slider\\use-slider.svelte.ts` | 187:7 | Type '{ id: string; for: string; \"aria-live\": \"off\"; \"data-kind\": string; \"data-slot\": \"root\" | \"label\" | \"output\" | \"track\" | \"thumb\"; }' is not assignable to type 'SliderOutputAttr |
| `src\\lib\\design\\primitives\\switch\\use-switch.svelte.ts` | 72:7 | Type '{ id: string; role: \"switch\"; type: \"button\"; tabindex: 0; \"aria-checked\": boolean; \"aria-disabled\": true | undefined; \"aria-required\": true | undefined; \"aria-label\": string | undef |
| `src\\lib\\design\\primitives\\switch\\use-switch.svelte.ts` | 75:7 | Type '{ \"aria-hidden\": \"true\"; \"data-state\": \"checked\" | \"unchecked\"; \"data-kind\": string; \"data-slot\": \"root\" | \"label\" | \"thumb\"; }' is not assignable to type 'SwitchThumbAttrs'. |
| `src\\lib\\design\\primitives\\switch\\use-switch.svelte.ts` | 78:7 | Type '{ \"data-disabled\": \"\" | undefined; onclick: () => void; \"data-kind\": string; \"data-slot\": \"root\" | \"label\" | \"thumb\"; }' is not assignable to type 'SwitchLabelAttrs'.\n  Type '{ \" |
| `src\\lib\\design\\primitives\\table\\use-table.svelte.ts` | 33:7 | Type '{ id: string; role: \"grid\"; \"aria-label\": string | undefined; \"aria-rowcount\": number | undefined; \"aria-colcount\": number | undefined; \"aria-multiselectable\": true | undefined; \"data |
| `src\\lib\\design\\primitives\\table\\use-table.svelte.ts` | 36:7 | Type '{ role: \"rowgroup\"; \"data-kind\": string; \"data-slot\": \"root\" | \"body\" | \"cell\" | \"row\" | \"header\" | \"column-header\"; }' is not assignable to type 'TableHeaderAttrs'.\n  Type '{ |
| `src\\lib\\design\\primitives\\table\\use-table.svelte.ts` | 39:7 | Type '{ role: \"rowgroup\"; \"data-kind\": string; \"data-slot\": \"root\" | \"body\" | \"cell\" | \"row\" | \"header\" | \"column-header\"; }' is not assignable to type 'TableBodyAttrs'.\n  Type '{ r |
| `src\\lib\\design\\primitives\\table\\use-table.svelte.ts` | 43:3 | Type '(key: string, options?: { disabled?: boolean | undefined; } | undefined) => { role: \"row\"; \"aria-selected\": boolean | undefined; \"aria-disabled\": true | undefined; \"data-key\": string; \" |
| `src\\lib\\design\\primitives\\table\\use-table.svelte.ts` | 64:3 | Type '() => { role: \"gridcell\"; \"data-kind\": string; \"data-slot\": \"root\" | \"body\" | \"cell\" | \"row\" | \"header\" | \"column-header\"; }' is not assignable to type '() => TableCellAttrs'.\ |
| `src\\lib\\design\\primitives\\table\\use-table.svelte.ts` | 71:3 | Type '(options?: { sortDirection?: SortDirection | undefined; onSort?: (() => void) | undefined; } | undefined) => { role: \"columnheader\"; \"aria-sort\": \"ascending\" | \"descending\" | undefined;  |
| `src\\lib\\design\\primitives\\tabs\\use-tabs.svelte.ts` | 89:7 | Type '{ \"data-orientation\": Orientation; \"data-kind\": string; \"data-slot\": \"list\" | \"root\" | \"trigger\" | \"content\"; }' is not assignable to type 'TabsRootAttrs'.\n  Type '{ \"data-orient |
| `src\\lib\\design\\primitives\\tabs\\use-tabs.svelte.ts` | 92:7 | Type '{ role: \"tablist\"; \"aria-orientation\": Orientation; \"data-orientation\": Orientation; \"data-kind\": string; \"data-slot\": \"list\" | \"root\" | \"trigger\" | \"content\"; }' is not assign |
| `src\\lib\\design\\primitives\\tabs\\use-tabs.svelte.ts` | 96:3 | Type '(tabValue: string, disabled?: boolean | undefined) => { role: \"tab\"; type: \"button\"; id: string; \"aria-selected\": boolean; \"aria-controls\": string; tabindex: number; \"data-state\": \"ac |
| `src\\lib\\design\\primitives\\tabs\\use-tabs.svelte.ts` | 117:3 | Type '(tabValue: string) => { role: \"tabpanel\"; id: string; \"aria-labelledby\": string; tabindex: 0; hidden: true | undefined; \"data-state\": \"hidden\" | \"visible\"; \"data-kind\": string; \"dat |
| `src\\lib\\design\\primitives\\tag-group\\use-tag-group.svelte.ts` | 60:7 | Type '{ id: string; role: \"grid\"; \"aria-label\": string | undefined; \"data-disabled\": \"\" | undefined; \"data-kind\": string; \"data-slot\": \"root\" | \"label\" | \"description\" | \"tag\" | \" |
| `src\\lib\\design\\primitives\\tag-group\\use-tag-group.svelte.ts` | 63:7 | Type '{ \"data-kind\": string; \"data-slot\": \"root\" | \"label\" | \"description\" | \"tag\" | \"remove\"; }' is not assignable to type 'TagGroupLabelAttrs'.\n  Type '{ \"data-kind\": string; \"data |
| `src\\lib\\design\\primitives\\tag-group\\use-tag-group.svelte.ts` | 66:7 | Type '{ \"data-kind\": string; \"data-slot\": \"root\" | \"label\" | \"description\" | \"tag\" | \"remove\"; }' is not assignable to type 'TagGroupDescriptionAttrs'.\n  Type '{ \"data-kind\": string;  |
| `src\\lib\\design\\primitives\\tag-group\\use-tag-group.svelte.ts` | 70:3 | Type '(value: string, options?: { disabled?: boolean | undefined; } | undefined) => { role: \"row\"; tabindex: 0; \"data-value\": string; \"data-disabled\": \"\" | undefined; onkeydown: (e: KeyboardEv |
| `src\\lib\\design\\primitives\\tag-group\\use-tag-group.svelte.ts` | 82:3 | Type '(value: string, options?: { disabled?: boolean | undefined; } | undefined) => { type: \"button\"; tabindex: -1; \"aria-label\": `Remove ${string}`; \"aria-disabled\": true | undefined; \"data-di |
| `src\\lib\\design\\primitives\\text-field\\use-text-field.svelte.ts` | 87:7 | Type '{ id: string; \"data-disabled\": \"\" | undefined; \"data-invalid\": \"\" | undefined; \"data-kind\": string; \"data-slot\": \"root\" | \"error\" | \"label\" | \"input\" | \"description\"; }' is |
| `src\\lib\\design\\primitives\\text-field\\use-text-field.svelte.ts` | 90:7 | Type '{ id: string; type: TextFieldType; value: string; placeholder: string | undefined; disabled: true | undefined; readonly: true | undefined; required: true | undefined; ... 13 more ...; \"data-slo |
| `src\\lib\\design\\primitives\\text-field\\use-text-field.svelte.ts` | 93:7 | Type '{ id: string; for: string; \"data-disabled\": \"\" | undefined; \"data-kind\": string; \"data-slot\": \"root\" | \"error\" | \"label\" | \"input\" | \"description\"; }' is not assignable to type |
| `src\\lib\\design\\primitives\\text-field\\use-text-field.svelte.ts` | 96:7 | Type '{ id: string; \"data-kind\": string; \"data-slot\": \"root\" | \"error\" | \"label\" | \"input\" | \"description\"; }' is not assignable to type 'TextFieldDescriptionAttrs'.\n  Type '{ id: strin |
| `src\\lib\\design\\primitives\\text-field\\use-text-field.svelte.ts` | 99:7 | Type '{ id: string; role: \"alert\"; \"aria-live\": \"polite\"; \"data-invalid\": \"\" | undefined; \"data-kind\": string; \"data-slot\": \"root\" | \"error\" | \"label\" | \"input\" | \"description\" |
| `src\\lib\\design\\primitives\\toggle\\use-toggle.svelte.ts` | 58:7 | Type '{ id: string; type: \"button\"; role: \"button\"; \"aria-pressed\": boolean; \"aria-disabled\": true | undefined; \"aria-label\": string | undefined; \"data-state\": \"off\" | \"on\"; \"data-dis |
| `src\\lib\\design\\primitives\\toolbar\\use-toolbar.svelte.ts` | 72:7 | Type '{ id: string; role: \"toolbar\"; \"aria-orientation\": Orientation; \"aria-label\": string | undefined; \"data-orientation\": Orientation; \"data-disabled\": \"\" | undefined; \"data-kind\": str |
| `src\\lib\\design\\primitives\\toolbar\\use-toolbar.svelte.ts` | 76:3 | Type '(value: string, options?: { disabled?: boolean | undefined; active?: boolean | undefined; } | undefined) => { tabindex: number; \"data-value\": string; \"data-disabled\": \"\" | undefined; \"ari |
| `src\\lib\\design\\primitives\\tooltip\\use-tooltip.svelte.ts` | 86:7 | Type '{ \"aria-describedby\": string | undefined; onpointerenter: () => void; onpointerleave: () => void; onfocus: () => void; onblur: () => void; onkeydown: (e: KeyboardEvent) => void; \"data-kind\": |
| `src\\lib\\design\\primitives\\tooltip\\use-tooltip.svelte.ts` | 89:7 | Type '{ id: string; role: \"tooltip\"; \"data-state\": \"open\" | \"closed\"; \"data-kind\": string; \"data-slot\": \"trigger\" | \"content\"; }' is not assignable to type 'TooltipContentAttrs'.\n  Ty |
| `src\\lib\\design\\primitives\\tree\\use-tree.svelte.ts` | 114:7 | Type '{ id: string; role: \"tree\"; \"aria-label\": string | undefined; \"aria-disabled\": true | undefined; onkeydown: (e: KeyboardEvent) => void; \"data-kind\": string; \"data-slot\": \"root\" | \"g |
| `src\\lib\\design\\primitives\\tree\\use-tree.svelte.ts` | 118:3 | Type '(key: string, options?: { hasChildren?: boolean | undefined; level?: number | undefined; disabled?: boolean | undefined; } | undefined) => { role: \"treeitem\"; tabindex: 0; \"aria-expanded\": b |
| `src\\lib\\design\\primitives\\tree\\use-tree.svelte.ts` | 145:3 | Type '() => { role: \"group\"; \"data-kind\": string; \"data-slot\": \"root\" | \"group\" | \"item\"; }' is not assignable to type '() => TreeGroupAttrs'.\n  Type '{ role: \"group\"; \"data-kind\": st |
| `src\\lib\\design\\primitives\\label\\use-label.svelte.ts` | 25:7 | Type '{ id: string; for: string | undefined; \"data-disabled\": \"\" | undefined; \"data-kind\": string; \"data-slot\": \"root\"; }' is not assignable to type 'LabelRootAttrs'.\n  Type '{ id: string;  |
| `src\\lib\\design\\registry.ts` | 20:2 | Module '\"./primitives/index.js\"' has no exported member 'accordionContract'. |
| `src\\lib\\design\\registry.ts` | 21:2 | Module '\"./primitives/index.js\"' has no exported member 'alertContract'. |
| `src\\lib\\design\\registry.ts` | 23:2 | Module '\"./primitives/index.js\"' has no exported member 'alertDialogContract'. |
| `src\\lib\\design\\registry.ts` | 24:2 | Module '\"./primitives/index.js\"' has no exported member 'aspectRatioContract'. |
| `src\\lib\\design\\registry.ts` | 25:2 | Module '\"./primitives/index.js\"' has no exported member 'avatarContract'. |
| `src\\lib\\design\\registry.ts` | 26:2 | Module '\"./primitives/index.js\"' has no exported member 'badgeContract'. |
| `src\\lib\\design\\registry.ts` | 27:2 | Module '\"./primitives/index.js\"' has no exported member 'bannerContract'. |
| `src\\lib\\design\\registry.ts` | 28:2 | Module '\"./primitives/index.js\"' has no exported member 'boxContract'. |
| `src\\lib\\design\\registry.ts` | 29:2 | Module '\"./primitives/index.js\"' has no exported member 'breadcrumbContract'. |
| `src\\lib\\design\\registry.ts` | 30:2 | Module '\"./primitives/index.js\"' has no exported member 'buttonContract'. |
| `src\\lib\\design\\registry.ts` | 31:2 | Module '\"./primitives/index.js\"' has no exported member 'calendarContract'. |
| `src\\lib\\design\\registry.ts` | 32:2 | Module '\"./primitives/index.js\"' has no exported member 'calloutContract'. |
| `src\\lib\\design\\registry.ts` | 33:2 | Module '\"./primitives/index.js\"' has no exported member 'cardContract'. |
| `src\\lib\\design\\registry.ts` | 34:2 | Module '\"./primitives/index.js\"' has no exported member 'centerContract'. |
| `src\\lib\\design\\registry.ts` | 35:2 | Module '\"./primitives/index.js\"' has no exported member 'checkboxContract'. |
| `src\\lib\\design\\registry.ts` | 36:2 | Module '\"./primitives/index.js\"' has no exported member 'codeContract'. |
| `src\\lib\\design\\registry.ts` | 37:2 | Module '\"./primitives/index.js\"' has no exported member 'collapsibleContract'. |
| `src\\lib\\design\\registry.ts` | 38:2 | Module '\"./primitives/index.js\"' has no exported member 'colorInputContract'. |
| `src\\lib\\design\\registry.ts` | 39:2 | Module '\"./primitives/index.js\"' has no exported member 'comboboxContract'. |
| `src\\lib\\design\\registry.ts` | 40:2 | Module '\"./primitives/index.js\"' has no exported member 'commandPaletteContract'. |
| `src\\lib\\design\\registry.ts` | 41:2 | Module '\"./primitives/index.js\"' has no exported member 'containerContract'. |
| `src\\lib\\design\\registry.ts` | 42:2 | Module '\"./primitives/index.js\"' has no exported member 'contextMenuContract'. |
| `src\\lib\\design\\registry.ts` | 43:2 | Module '\"./primitives/index.js\"' has no exported member 'dataTableContract'. |
| `src\\lib\\design\\registry.ts` | 44:2 | Module '\"./primitives/index.js\"' has no exported member 'dateFieldContract'. |
| `src\\lib\\design\\registry.ts` | 45:2 | Module '\"./primitives/index.js\"' has no exported member 'datePickerContract'. |
| `src\\lib\\design\\registry.ts` | 46:2 | Module '\"./primitives/index.js\"' has no exported member 'dateRangeFieldContract'. |
| `src\\lib\\design\\registry.ts` | 47:2 | Module '\"./primitives/index.js\"' has no exported member 'dateRangePickerContract'. |
| `src\\lib\\design\\registry.ts` | 48:2 | Module '\"./primitives/index.js\"' has no exported member 'descriptionListContract'. |
| `src\\lib\\design\\registry.ts` | 49:2 | Module '\"./primitives/index.js\"' has no exported member 'dialogContract'. |
| `src\\lib\\design\\registry.ts` | 50:2 | Module '\"./primitives/index.js\"' has no exported member 'dividerContract'. |
| `src\\lib\\design\\registry.ts` | 51:2 | Module '\"./primitives/index.js\"' has no exported member 'dropdownMenuContract'. |
| `src\\lib\\design\\registry.ts` | 52:2 | Module '\"./primitives/index.js\"' has no exported member 'emptyStateContract'. |
| `src\\lib\\design\\registry.ts` | 53:2 | Module '\"./primitives/index.js\"' has no exported member 'fileUploadContract'. |
| `src\\lib\\design\\registry.ts` | 54:2 | Module '\"./primitives/index.js\"' has no exported member 'flexContract'. |
| `src\\lib\\design\\registry.ts` | 55:2 | Module '\"./primitives/index.js\"' has no exported member 'formContract'. |
| `src\\lib\\design\\registry.ts` | 56:2 | Module '\"./primitives/index.js\"' has no exported member 'formFieldContract'. |
| `src\\lib\\design\\registry.ts` | 57:2 | Module '\"./primitives/index.js\"' has no exported member 'gridContract'. |
| `src\\lib\\design\\registry.ts` | 58:2 | Module '\"./primitives/index.js\"' has no exported member 'headingContract'. |
| `src\\lib\\design\\registry.ts` | 59:2 | Module '\"./primitives/index.js\"' has no exported member 'hstackContract'. |
| `src\\lib\\design\\registry.ts` | 60:2 | Module '\"./primitives/index.js\"' has no exported member 'inlineMessageContract'. |
| `src\\lib\\design\\registry.ts` | 61:2 | Module '\"./primitives/index.js\"' has no exported member 'inputContract'. |
| `src\\lib\\design\\registry.ts` | 62:2 | Module '\"./primitives/index.js\"' has no exported member 'inputGroupContract'. |
| `src\\lib\\design\\registry.ts` | 63:2 | Module '\"./primitives/index.js\"' has no exported member 'kbdContract'. |
| `src\\lib\\design\\registry.ts` | 64:2 | Module '\"./primitives/index.js\"' has no exported member 'labelContract'. |
| `src\\lib\\design\\registry.ts` | 65:2 | Module '\"./primitives/index.js\"' has no exported member 'linkPreviewContract'. |
| `src\\lib\\design\\registry.ts` | 66:2 | Module '\"./primitives/index.js\"' has no exported member 'listContract'. |
| `src\\lib\\design\\registry.ts` | 67:2 | Module '\"./primitives/index.js\"' has no exported member 'loadingOverlayContract'. |
| `src\\lib\\design\\registry.ts` | 68:2 | Module '\"./primitives/index.js\"' has no exported member 'menubarContract'. |
| `src\\lib\\design\\registry.ts` | 69:2 | Module '\"./primitives/index.js\"' has no exported member 'navContract'. |
| `src\\lib\\design\\registry.ts` | 70:2 | Module '\"./primitives/index.js\"' has no exported member 'navItemContract'. |
| `src\\lib\\design\\registry.ts` | 71:2 | Module '\"./primitives/index.js\"' has no exported member 'notificationCenterContract'. |
| `src\\lib\\design\\registry.ts` | 72:2 | Module '\"./primitives/index.js\"' has no exported member 'numberInputContract'. |
| `src\\lib\\design\\registry.ts` | 73:2 | Module '\"./primitives/index.js\"' has no exported member 'paginationContract'. |
| `src\\lib\\design\\registry.ts` | 74:2 | Module '\"./primitives/index.js\"' has no exported member 'pinInputContract'. |
| `src\\lib\\design\\registry.ts` | 75:2 | Module '\"./primitives/index.js\"' has no exported member 'popoverContract'. |
| `src\\lib\\design\\registry.ts` | 76:2 | Module '\"./primitives/index.js\"' has no exported member 'progressContract'. |
| `src\\lib\\design\\registry.ts` | 77:2 | Module '\"./primitives/index.js\"' has no exported member 'proseContract'. |
| `src\\lib\\design\\registry.ts` | 78:2 | Module '\"./primitives/index.js\"' has no exported member 'radioGroupContract'. |
| `src\\lib\\design\\registry.ts` | 79:2 | Module '\"./primitives/index.js\"' has no exported member 'rangeCalendarContract'. |
| `src\\lib\\design\\registry.ts` | 81:2 | Module '\"./primitives/index.js\"' has no exported member 'scrollAreaContract'. |
| `src\\lib\\design\\registry.ts` | 82:2 | Module '\"./primitives/index.js\"' has no exported member 'searchInputContract'. |
| `src\\lib\\design\\registry.ts` | 83:2 | Module '\"./primitives/index.js\"' has no exported member 'selectContract'. |
| `src\\lib\\design\\registry.ts` | 85:2 | Module '\"./primitives/index.js\"' has no exported member 'separatorContract'. |
| `src\\lib\\design\\registry.ts` | 86:2 | Module '\"./primitives/index.js\"' has no exported member 'sheetContract'. |
| `src\\lib\\design\\registry.ts` | 87:2 | Module '\"./primitives/index.js\"' has no exported member 'sidebarContract'. |
| `src\\lib\\design\\registry.ts` | 88:2 | Module '\"./primitives/index.js\"' has no exported member 'skeletonContract'. |
| `src\\lib\\design\\registry.ts` | 89:2 | Module '\"./primitives/index.js\"' has no exported member 'skipLinkContract'. |
| `src\\lib\\design\\registry.ts` | 90:2 | Module '\"./primitives/index.js\"' has no exported member 'sliderContract'. |
| `src\\lib\\design\\registry.ts` | 91:2 | Module '\"./primitives/index.js\"' has no exported member 'spacerContract'. |
| `src\\lib\\design\\registry.ts` | 92:2 | Module '\"./primitives/index.js\"' has no exported member 'spinnerContract'. |
| `src\\lib\\design\\registry.ts` | 93:2 | Module '\"./primitives/index.js\"' has no exported member 'stackContract'. |
| `src\\lib\\design\\registry.ts` | 94:2 | Module '\"./primitives/index.js\"' has no exported member 'statContract'. |
| `src\\lib\\design\\registry.ts` | 95:2 | Module '\"./primitives/index.js\"' has no exported member 'stepsContract'. |
| `src\\lib\\design\\registry.ts` | 96:2 | Module '\"./primitives/index.js\"' has no exported member 'stickyContract'. |
| `src\\lib\\design\\registry.ts` | 97:2 | Module '\"./primitives/index.js\"' has no exported member 'switchContract'. |
| `src\\lib\\design\\registry.ts` | 98:2 | Module '\"./primitives/index.js\"' has no exported member 'tableContract'. |
| `src\\lib\\design\\registry.ts` | 99:2 | Module '\"./primitives/index.js\"' has no exported member 'tableOfContentsContract'. |
| `src\\lib\\design\\registry.ts` | 100:2 | Module '\"./primitives/index.js\"' has no exported member 'tabsContract'. |
| `src\\lib\\design\\registry.ts` | 101:2 | Module '\"./primitives/index.js\"' has no exported member 'tagsInputContract'. |
| `src\\lib\\design\\registry.ts` | 102:2 | Module '\"./primitives/index.js\"' has no exported member 'textareaContract'. |
| `src\\lib\\design\\registry.ts` | 103:2 | Module '\"./primitives/index.js\"' has no exported member 'textContract'. |
| `src\\lib\\design\\registry.ts` | 104:2 | Module '\"./primitives/index.js\"' has no exported member 'toasterContract'. |
| `src\\lib\\design\\registry.ts` | 105:2 | Module '\"./primitives/index.js\"' has no exported member 'toggleContract'. |
| `src\\lib\\design\\registry.ts` | 106:2 | Module '\"./primitives/index.js\"' has no exported member 'toggleGroupContract'. |
| `src\\lib\\design\\registry.ts` | 107:2 | Module '\"./primitives/index.js\"' has no exported member 'toolbarContract'. |
| `src\\lib\\design\\registry.ts` | 108:2 | Module '\"./primitives/index.js\"' has no exported member 'tooltipContract'. |
| `src\\lib\\design\\registry.ts` | 109:2 | Module '\"./primitives/index.js\"' has no exported member 'treeContract'. |
| `src\\lib\\design\\scanner.types.ts` | 15:8 | Cannot find module './primitives/_schema/types.js' or its corresponding type declarations. |
| `src\\lib\\design\\scanner.types.ts` | 29:8 | Cannot find module './primitives/_schema/types.js' or its corresponding type declarations. |
| `src\\lib\\design\\scanner.ts` | 27:40 | Cannot find module './primitives/_schema/types.js' or its corresponding type declarations. |
| `src\\lib\\design\\_internal\\a11y\\roving-focus\\roving-focus.svelte.ts` | 27:22 | No overload matches this call.\n  Overload 1 of 4, '(iterable: Iterable<HTMLElement> | ArrayLike<HTMLElement>): HTMLElement[]', gave the following error.\n    Argument of type 'NodeListOf<HTMLElement> |
| `src\\lib\\design\\_internal\\a11y\\roving-focus\\roving-focus.svelte.ts` | 44:39 | Argument of type 'Element | null' is not assignable to parameter of type 'HTMLElement'.\n  Type 'null' is not assignable to type 'HTMLElement'. |
| `src\\lib\\design\\_internal\\a11y\\typeahead\\typeahead.ts` | 38:38 | Argument of type 'Element | null' is not assignable to parameter of type 'HTMLElement'.\n  Type 'null' is not assignable to type 'HTMLElement'. |
| `src\\lib\\design\\components\\_schema\\schema.ts` | 20:8 | Cannot find module '../../primitives/_schema/schema.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\_schema\\contract.ts` | 21:64 | Cannot find module '../../primitives/_schema/contract.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\_schema\\contract.ts` | 26:8 | Cannot find module '../../primitives/_schema/schema.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\_schema\\contract.ts` | 27:70 | Cannot find module '../../primitives/_schema/types.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\_schema\\contract.ts` | 280:42 | Parameter 'attr' implicitly has an 'any' type. |
| `src\\lib\\design\\components\\_schema\\contract.ts` | 284:42 | Parameter 'attr' implicitly has an 'any' type. |
| `src\\lib\\design\\components\\_schema\\contract.ts` | 289:14 | Parameter 'r' implicitly has an 'any' type. |
| `src\\lib\\design\\components\\_schema\\contract.ts` | 290:11 | Parameter 'r' implicitly has an 'any' type. |
| `src\\lib\\design\\components\\_schema\\contract.ts` | 302:13 | Parameter 'k' implicitly has an 'any' type. |
| `src\\lib\\design\\components\\_schema\\contract.ts` | 303:10 | Parameter 'k' implicitly has an 'any' type. |
| `src\\lib\\design\\primitives\\heading\\use-heading.svelte.ts` | 21:7 | Type '{ \"data-level\": HeadingLevel; \"data-kind\": string; \"data-slot\": \"root\"; }' is not assignable to type 'HeadingRootAttrs'.\n  Type '{ \"data-level\": HeadingLevel; \"data-kind\": string; \ |
| `src\\lib\\design\\components\\heading\\types.ts` | 10:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\heading\\Heading.svelte` | 52:86 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\text\\types.ts` | 10:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\text\\Text.svelte` | 50:74 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\primitives\\badge\\use-badge.svelte.ts` | 30:7 | Type '{ role: \"presentation\"; \"aria-hidden\": \"true\" | undefined; \"data-variant\": BadgeVariant; \"data-fill\": BadgeFillStyle; \"data-size\": BadgeSize; \"data-kind\": string; \"data-slot\": \" |
| `src\\lib\\design\\components\\badge\\types.ts` | 10:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\badge\\Badge.svelte` | 68:2 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\card\\types.ts` | 10:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\card\\Card.svelte` | 9:28 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/card/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\card\\Card.svelte` | 11:22 | Cannot find module '$lib/design/primitives/card/Card.svelte' or its corresponding type declarations. |
| `src\\lib\\design\\components\\card\\Card.svelte` | 58:79 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\separator\\types.ts` | 9:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\separator\\Separator.svelte` | 9:33 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/separator/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\separator\\Separator.svelte` | 55:80 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\stat\\types.ts` | 10:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\stat\\Stat.svelte` | 9:28 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/stat/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\stat\\Stat.svelte` | 11:22 | Cannot find module '$lib/design/primitives/stat/Stat.svelte' or its corresponding type declarations. |
| `src\\lib\\design\\components\\stat\\Stat.svelte` | 51:83 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\index.ts` | 36:8 | Cannot find module './box/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\index.ts` | 42:8 | Cannot find module './container/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\index.ts` | 49:8 | Cannot find module './grid/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\index.ts` | 57:8 | Cannot find module './hstack/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\index.ts` | 64:8 | Cannot find module './stack/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\accordion\\context.ts` | 17:8 | Cannot find module '$lib/design/api/dsadapters/meltui/_internal/accordion/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\accordion\\types.ts` | 15:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\accordion\\Accordion.svelte` | 17:10 | Module '\"$lib/design/primitives/accordion/index.js\"' has no exported member 'createAccordionTransport'. |
| `src\\lib\\design\\components\\accordion\\Accordion.svelte` | 85:57 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\accordion\\AccordionContent.svelte` | 27:29 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\accordion\\AccordionItem.svelte` | 34:12 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\accordion\\AccordionTrigger.svelte` | 28:29 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\alert\\types.ts` | 10:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\alert\\Alert.svelte` | 9:29 | Cannot find module '$lib/design/primitives/alert/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\alert\\Alert.svelte` | 11:23 | Cannot find module '$lib/design/primitives/alert/Alert.svelte' or its corresponding type declarations. |
| `src\\lib\\design\\components\\alert\\Alert.svelte` | 58:76 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\alert-dialog\\AlertDialogAction.svelte` | 32:27 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\alert-dialog\\AlertDialogCancel.svelte` | 33:27 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\alert-dialog\\AlertDialogContent.svelte` | 38:29 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\alert-dialog\\AlertDialogDescription.svelte` | 23:32 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\alert-dialog\\AlertDialogOverlay.svelte` | 24:29 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\alert-dialog\\AlertDialogTitle.svelte` | 23:26 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\alert-dialog\\AlertDialogTrigger.svelte` | 30:12 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\avatar\\types.ts` | 10:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\avatar\\Avatar.svelte` | 59:65 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\banner\\types.ts` | 10:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\banner\\Banner.svelte` | 9:30 | Cannot find module '$lib/components/banner/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\banner\\Banner.svelte` | 11:24 | Cannot find module '$lib/design/primitives/banner/Banner.svelte' or its corresponding type declarations. |
| `src\\lib\\design\\components\\banner\\Banner.svelte` | 57:87 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\calendar\\types.ts` | 15:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\calendar\\Calendar.svelte` | 146:57 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\calendar\\CalendarCell.svelte` | 41:25 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\calendar\\CalendarGrid.svelte` | 59:25 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\calendar\\CalendarHeader.svelte` | 29:27 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\callout\\types.ts` | 10:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\callout\\Callout.svelte` | 9:31 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/callout/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\callout\\Callout.svelte` | 11:25 | Cannot find module '$lib/design/primitives/callout/Callout.svelte' or its corresponding type declarations. |
| `src\\lib\\design\\components\\callout\\Callout.svelte` | 51:89 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\checkbox\\types.ts` | 10:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\checkbox\\Checkbox.svelte` | 9:32 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/checkbox/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\checkbox\\Checkbox.svelte` | 62:71 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\code\\types.ts` | 10:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\code\\Code.svelte` | 9:28 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/code/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\code\\Code.svelte` | 11:22 | Cannot find module '$lib/design/primitives/code/Code.svelte' or its corresponding type declarations. |
| `src\\lib\\design\\components\\code\\Code.svelte` | 51:85 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\collapsible\\context.ts` | 11:43 | Cannot find module '$lib/design/api/dsadapters/meltui/_internal/collapsible/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\collapsible\\types.ts` | 15:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\collapsible\\Collapsible.svelte` | 17:44 | Cannot find module '$lib/design/api/dsadapters/meltui/_internal/collapsible/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\collapsible\\Collapsible.svelte` | 73:44 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\collapsible\\CollapsibleContent.svelte` | 26:29 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\collapsible\\CollapsibleTrigger.svelte` | 25:28 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\combobox\\context.ts` | 23:8 | Cannot find module '$lib/design/api/dsadapters/meltui/_internal/combobox/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\combobox\\Combobox.svelte` | 28:41 | Cannot find module '$lib/design/api/dsadapters/meltui/_internal/combobox/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\data-table\\types.ts` | 13:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\data-table\\DataTable.svelte` | 15:33 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/data-table/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\data-table\\DataTable.svelte` | 17:27 | Cannot find module '$lib/design/primitives/data-table/DataTable.svelte' or its corresponding type declarations. |
| `src\\lib\\design\\components\\data-table\\DataTable.svelte` | 77:73 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\date-field\\types.ts` | 15:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\date-field\\DateField.svelte` | 204:57 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\date-field\\DateFieldSegment.svelte` | 58:29 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\date-field\\DateFieldSegment.svelte` | 69:29 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\date-picker\\types.ts` | 15:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\date-picker\\DatePicker.svelte` | 129:57 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\date-picker\\DatePickerCalendar.svelte` | 22:29 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\date-picker\\DatePickerContent.svelte` | 34:29 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\date-picker\\DatePickerField.svelte` | 23:26 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\date-picker\\DatePickerTrigger.svelte` | 31:28 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\date-range-field\\types.ts` | 15:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\date-range-field\\DateRangeField.svelte` | 248:57 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\date-range-field\\DateRangeFieldEnd.svelte` | 24:26 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\date-range-field\\DateRangeFieldSegment.svelte` | 65:29 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\date-range-field\\DateRangeFieldSegment.svelte` | 76:29 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\date-range-field\\DateRangeFieldStart.svelte` | 24:26 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\date-range-picker\\types.ts` | 15:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\date-range-picker\\DateRangePicker.svelte` | 136:57 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\date-range-picker\\DateRangePickerCalendar.svelte` | 22:29 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\date-range-picker\\DateRangePickerContent.svelte` | 34:29 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\date-range-picker\\DateRangePickerField.svelte` | 23:26 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\date-range-picker\\DateRangePickerTrigger.svelte` | 31:28 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\description-list\\types.ts` | 13:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\description-list\\DescriptionList.svelte` | 14:39 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/description-list/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\description-list\\DescriptionList.svelte` | 16:33 | Cannot find module '$lib/design/primitives/description-list/DescriptionList.svelte' or its corresponding type declarations. |
| `src\\lib\\design\\components\\description-list\\DescriptionList.svelte` | 64:79 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\dialog\\context.ts` | 11:38 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/dialog/dialog.svelte.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\dialog\\Dialog.svelte` | 13:33 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/dialog/dialog.svelte.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\dialog\\Dialog.svelte` | 44:17 | Parameter 'v' implicitly has an 'any' type. |
| `src\\lib\\design\\components\\dialog\\DialogClose.svelte` | 25:24 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\dialog\\DialogContent.svelte` | 28:27 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\dialog\\DialogDescription.svelte` | 25:30 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\dialog\\DialogFooter.svelte` | 22:25 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\dialog\\DialogHeader.svelte` | 22:25 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\dialog\\DialogOverlay.svelte` | 27:27 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\dialog\\DialogTitle.svelte` | 25:24 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\dialog\\DialogTrigger.svelte` | 22:12 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\empty-state\\types.ts` | 10:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\empty-state\\EmptyState.svelte` | 9:34 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/empty-state/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\empty-state\\EmptyState.svelte` | 11:28 | Cannot find module '$lib/design/primitives/empty-state/EmptyState.svelte' or its corresponding type declarations. |
| `src\\lib\\design\\components\\empty-state\\EmptyState.svelte` | 50:89 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\file-upload\\types.ts` | 13:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\form\\types.ts` | 13:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\form\\Form.svelte` | 12:28 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/form/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\form\\Form.svelte` | 14:22 | Cannot find module '$lib/design/primitives/form/Form.svelte' or its corresponding type declarations. |
| `src\\lib\\design\\components\\form\\Form.svelte` | 69:83 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\form-field\\types.ts` | 13:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\form-field\\FormField.svelte` | 13:33 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/form-field/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\form-field\\FormField.svelte` | 15:27 | Cannot find module '$lib/design/primitives/form-field/FormField.svelte' or its corresponding type declarations. |
| `src\\lib\\design\\components\\form-field\\FormField.svelte` | 76:64 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\inline-message\\types.ts` | 10:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\inline-message\\InlineMessage.svelte` | 9:37 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/inline-message/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\inline-message\\InlineMessage.svelte` | 11:31 | Cannot find module '$lib/design/primitives/inline-message/InlineMessage.svelte' or its corresponding type declarations. |
| `src\\lib\\design\\components\\inline-message\\InlineMessage.svelte` | 51:68 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\input-group\\types.ts` | 13:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\input-group\\InputGroup.svelte` | 13:34 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/input-group/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\input-group\\InputGroup.svelte` | 15:28 | Cannot find module '$lib/design/primitives/input-group/InputGroup.svelte' or its corresponding type declarations. |
| `src\\lib\\design\\components\\input-group\\InputGroup.svelte` | 75:65 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\kbd\\types.ts` | 10:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\kbd\\Kbd.svelte` | 9:27 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/kbd/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\kbd\\Kbd.svelte` | 11:21 | Cannot find module '$lib/design/primitives/kbd/Kbd.svelte' or its corresponding type declarations. |
| `src\\lib\\design\\components\\kbd\\Kbd.svelte` | 50:82 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\label\\types.ts` | 10:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\label\\Label.svelte` | 9:29 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/label/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\label\\Label.svelte` | 56:84 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\link-preview\\types.ts` | 15:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\list\\types.ts` | 13:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\list\\List.svelte` | 14:28 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/list/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\list\\List.svelte` | 16:22 | Cannot find module '$lib/design/primitives/list/List.svelte' or its corresponding type declarations. |
| `src\\lib\\design\\components\\list\\List.svelte` | 65:77 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\loading-overlay\\types.ts` | 13:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\loading-overlay\\LoadingOverlay.svelte` | 14:38 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/loading-overlay/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\loading-overlay\\LoadingOverlay.svelte` | 16:32 | Cannot find module '$lib/design/primitives/loading-overlay/LoadingOverlay.svelte' or its corresponding type declarations. |
| `src\\lib\\design\\components\\loading-overlay\\LoadingOverlay.svelte` | 67:85 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\menubar\\types.ts` | 15:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\menubar\\Menubar.svelte` | 80:57 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\menubar\\MenubarContent.svelte` | 43:29 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\menubar\\MenubarItem.svelte` | 45:25 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\menubar\\MenubarSeparator.svelte` | 22:30 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\menubar\\MenubarTrigger.svelte` | 37:28 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\nav\\types.ts` | 13:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\nav\\Nav.svelte` | 10:27 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/nav/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\nav\\Nav.svelte` | 12:21 | Cannot find module '$lib/design/primitives/nav/Nav.svelte' or its corresponding type declarations. |
| `src\\lib\\design\\components\\nav\\Nav.svelte` | 58:71 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\navigation-menu\\types.ts` | 15:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\navigation-menu\\NavigationMenu.svelte` | 82:57 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\navigation-menu\\NavigationMenuContent.svelte` | 33:29 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\navigation-menu\\NavigationMenuItem.svelte` | 66:25 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\navigation-menu\\NavigationMenuLink.svelte` | 23:25 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\navigation-menu\\NavigationMenuTrigger.svelte` | 39:28 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\notification-center\\types.ts` | 13:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\notification-center\\NotificationCenter.svelte` | 15:42 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/notification-center/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\notification-center\\NotificationCenter.svelte` | 17:36 | Cannot find module '$lib/design/primitives/notification-center/NotificationCenter.svelte' or its corresponding type declarations. |
| `src\\lib\\design\\components\\notification-center\\NotificationCenter.svelte` | 68:89 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\pagination\\types.ts` | 13:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\pagination\\Pagination.svelte` | 118:89 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\pin-input\\types.ts` | 13:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\popover\\context.ts` | 11:39 | Cannot find module '$lib/design/api/dsadapters/meltui/_internal/popover/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\popover\\types.ts` | 15:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\progress\\types.ts` | 10:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\progress\\Progress.svelte` | 53:68 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\prose\\types.ts` | 13:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\prose\\Prose.svelte` | 10:29 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/prose/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\prose\\Prose.svelte` | 12:23 | Cannot find module '$lib/design/primitives/prose/Prose.svelte' or its corresponding type declarations. |
| `src\\lib\\design\\components\\prose\\Prose.svelte` | 52:84 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\radio-group\\context.ts` | 10:42 | Cannot find module '$lib/design/api/dsadapters/meltui/_internal/radio-group/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\radio-group\\types.ts` | 15:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\radio-group\\RadioGroup.svelte` | 12:43 | Cannot find module '$lib/design/api/dsadapters/meltui/_internal/radio-group/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\radio-group\\RadioGroup.svelte` | 87:113 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\radio-group\\RadioGroupItem.svelte` | 23:25 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\radio-group\\RadioGroupLabel.svelte` | 22:26 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\range-calendar\\types.ts` | 15:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\range-calendar\\RangeCalendar.svelte` | 184:57 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\range-calendar\\RangeCalendarCell.svelte` | 50:25 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\range-calendar\\RangeCalendarGrid.svelte` | 56:25 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\range-calendar\\RangeCalendarHeader.svelte` | 29:27 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\scroll-area\\types.ts` | 13:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\scroll-area\\ScrollArea.svelte` | 9:34 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/scroll-area/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\scroll-area\\ScrollArea.svelte` | 11:28 | Cannot find module '$lib/design/primitives/scroll-area/ScrollArea.svelte' or its corresponding type declarations. |
| `src\\lib\\design\\components\\scroll-area\\ScrollArea.svelte` | 67:65 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\select\\context.ts` | 11:38 | Cannot find module '$lib/design/api/dsadapters/meltui/_internal/select/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\select\\types.ts` | 15:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\select\\Select.svelte` | 16:39 | Cannot find module '$lib/design/api/dsadapters/meltui/_internal/select/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\select\\Select.svelte` | 80:44 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\select\\SelectContent.svelte` | 25:29 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\select\\SelectGroup.svelte` | 23:26 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\select\\SelectItem.svelte` | 23:25 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\select\\SelectLabel.svelte` | 23:26 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\select\\SelectTrigger.svelte` | 25:28 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\sheet\\types.ts` | 13:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\sheet\\Sheet.svelte` | 9:29 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/sheet/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\sheet\\Sheet.svelte` | 77:66 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\sidebar\\types.ts` | 13:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\sidebar\\Sidebar.svelte` | 9:31 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/sidebar/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\sidebar\\Sidebar.svelte` | 11:25 | Cannot find module '$lib/design/primitives/sidebar/Sidebar.svelte' or its corresponding type declarations. |
| `src\\lib\\design\\components\\sidebar\\Sidebar.svelte` | 70:3 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\skeleton\\types.ts` | 9:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\skeleton\\Skeleton.svelte` | 9:32 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/skeleton/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\skeleton\\Skeleton.svelte` | 11:26 | Cannot find module '$lib/design/primitives/skeleton/Skeleton.svelte' or its corresponding type declarations. |
| `src\\lib\\design\\components\\skeleton\\Skeleton.svelte` | 56:66 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\skip-link\\types.ts` | 13:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\skip-link\\SkipLink.svelte` | 14:32 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/skip-link/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\skip-link\\SkipLink.svelte` | 16:26 | Cannot find module '$lib/design/primitives/skip-link/SkipLink.svelte' or its corresponding type declarations. |
| `src\\lib\\design\\components\\skip-link\\SkipLink.svelte` | 66:79 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\slider\\context.ts` | 10:38 | Cannot find module '$lib/design/api/dsadapters/meltui/_internal/slider/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\slider\\types.ts` | 15:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\slider\\Slider.svelte` | 12:39 | Cannot find module '$lib/design/api/dsadapters/meltui/_internal/slider/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\slider\\Slider.svelte` | 88:57 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\slider\\SliderRange.svelte` | 22:26 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\slider\\SliderThumb.svelte` | 23:26 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\slider\\SliderTrack.svelte` | 22:26 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\spinner\\types.ts` | 9:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\spinner\\Spinner.svelte` | 9:31 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/spinner/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\spinner\\Spinner.svelte` | 11:25 | Cannot find module '$lib/design/primitives/spinner/Spinner.svelte' or its corresponding type declarations. |
| `src\\lib\\design\\components\\spinner\\Spinner.svelte` | 55:86 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\steps\\types.ts` | 13:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\steps\\Steps.svelte` | 8:29 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/steps/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\steps\\Steps.svelte` | 10:23 | Cannot find module '$lib/design/primitives/steps/Steps.svelte' or its corresponding type declarations. |
| `src\\lib\\design\\components\\steps\\Steps.svelte` | 72:73 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\switch\\types.ts` | 10:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\switch\\Switch.svelte` | 9:30 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/switch/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\switch\\Switch.svelte` | 58:85 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\table\\types.ts` | 13:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\table\\Table.svelte` | 15:29 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/table/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\table\\Table.svelte` | 65:69 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\table-of-contents\\types.ts` | 13:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\table-of-contents\\TableOfContents.svelte` | 14:39 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/table-of-contents/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\table-of-contents\\TableOfContents.svelte` | 16:33 | Cannot find module '$lib/design/primitives/table-of-contents/TableOfContents.svelte' or its corresponding type declarations. |
| `src\\lib\\design\\components\\table-of-contents\\TableOfContents.svelte` | 69:70 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\tabs\\context.ts` | 11:36 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/tabs/tabs.svelte.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\tabs\\Tabs.svelte` | 13:31 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/tabs/tabs.svelte.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\tabs\\Tabs.svelte` | 46:18 | Parameter 'v' implicitly has an 'any' type. |
| `src\\lib\\design\\components\\tabs\\Tabs.svelte` | 76:55 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\tabs\\TabsContent.svelte` | 27:26 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\tabs\\TabsList.svelte` | 25:23 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\tabs\\TabsTrigger.svelte` | 27:26 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\text-field\\text-field.types.ts` | 15:18 | Interface 'TextFieldProps' incorrectly extends interface 'Omit<HTMLInputAttributes, \"value\" | \"style\" | \"children\">'.\n  Types of property 'size' are incompatible.\n    Type 'TextFieldSize | und |
| `src\\lib\\design\\components\\textarea\\types.ts` | 9:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\textarea\\Textarea.svelte` | 9:32 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/textarea/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\textarea\\Textarea.svelte` | 11:26 | Cannot find module '$lib/design/primitives/textarea/Textarea.svelte' or its corresponding type declarations. |
| `src\\lib\\design\\components\\textarea\\Textarea.svelte` | 63:87 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\toaster\\types.ts` | 14:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\toggle\\types.ts` | 10:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\toggle\\Toggle.svelte` | 9:39 | Cannot find module '$lib/design/api/dsadapters/meltui/_internal/toggle/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\toggle\\Toggle.svelte` | 65:85 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\toggle-group\\types.ts` | 14:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\toggle-group\\ToggleGroup.svelte` | 13:35 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/toggle-group/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\toggle-group\\ToggleGroup.svelte` | 15:29 | Cannot find module '$lib/design/primitives/toggle-group/ToggleGroup.svelte' or its corresponding type declarations. |
| `src\\lib\\design\\components\\toggle-group\\ToggleGroup.svelte` | 74:79 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\toolbar\\types.ts` | 13:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\toolbar\\Toolbar.svelte` | 10:31 | Cannot find module '$lib/design/api/dsadapters/coldlight/_internal/toolbar/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\toolbar\\Toolbar.svelte` | 73:75 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\tooltip\\context.ts` | 11:39 | Cannot find module '$lib/design/api/dsadapters/meltui/_internal/tooltip/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\tooltip\\types.ts` | 15:15 | Module '\"$lib/design/utils/cn.js\"' has no exported member 'BaseProps'. |
| `src\\lib\\design\\components\\tooltip\\Tooltip.svelte` | 17:40 | Cannot find module '$lib/design/api/dsadapters/meltui/_internal/tooltip/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\tooltip\\TooltipContent.svelte` | 27:29 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\tooltip\\TooltipTrigger.svelte` | 24:12 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\provider\\types.ts` | 8:15 | Module '\"../style/types.js\"' has no exported member 'AccentColor'. |
| `src\\lib\\design\\style\\style.ts` | 28:8 | Cannot find module '../../registry/token-categories.js' or its corresponding type declarations. |
| `src\\lib\\design\\style\\style.ts` | 29:15 | Module '\"./types.js\"' has no exported member 'StateCondition'. |
| `src\\lib\\design\\style\\style.ts` | 29:31 | Module '\"./types.js\"' has no exported member 'StyleProps'. |
| `src\\lib\\design\\style\\style.ts` | 36:49 | Parameter 'c' implicitly has an 'any' type. |
| `src\\lib\\design\\style\\style.ts` | 38:41 | Parameter 'v' implicitly has an 'any' type. |
| `src\\lib\\design\\style\\index.ts` | 3:2 | Module '\"./types.js\"' has no exported member 'AccentColor'. |
| `src\\lib\\design\\style\\index.ts` | 6:2 | Module '\"./types.js\"' has no exported member 'ConditionalValue'. |
| `src\\lib\\design\\style\\index.ts` | 8:2 | '\"./types.js\"' has no exported member named 'FontSizeToken'. Did you mean 'SizeToken'? |
| `src\\lib\\design\\style\\index.ts` | 9:2 | Module '\"./types.js\"' has no exported member 'FontWeightToken'. |
| `src\\lib\\design\\style\\index.ts` | 10:2 | Module '\"./types.js\"' has no exported member 'FrameToken'. |
| `src\\lib\\design\\style\\index.ts` | 12:2 | '\"./types.js\"' has no exported member named 'MaterialToken'. Did you mean 'MatteToken'? |
| `src\\lib\\design\\style\\index.ts` | 13:2 | Module '\"./types.js\"' has no exported member 'MotionToken'. |
| `src\\lib\\design\\style\\index.ts` | 16:2 | Module '\"./types.js\"' has no exported member 'StateCondition'. |
| `src\\lib\\design\\style\\index.ts` | 17:2 | Module '\"./types.js\"' has no exported member 'StyleProps'. |
| `src\\lib\\design\\components\\file-upload\\FileUpload.svelte` | 56:61 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\pin-input\\PinInput.svelte` | 59:61 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\lib\\design\\components\\popover\\Popover.svelte` | 17:40 | Cannot find module '$lib/design/api/dsadapters/meltui/_internal/popover/index.js' or its corresponding type declarations. |
| `src\\lib\\design\\components\\toaster\\Toaster.svelte` | 58:61 | Argument of type 'ClassValue | null | undefined' is not assignable to parameter of type 'string | false | null | undefined'.\n  Type 'ClassArray' is not assignable to type 'string | false | null | und |
| `src\\stories\\shards\\Button.stories.svelte` | 61:30 | Property 'default' does not exist on type '{}'. |
| `src\\stories\\shards\\Panel.stories.svelte` | 85:30 | Property 'default' does not exist on type '{}'. |
