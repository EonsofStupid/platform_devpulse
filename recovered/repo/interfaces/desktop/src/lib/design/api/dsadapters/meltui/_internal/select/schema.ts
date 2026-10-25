/**
 * @file Select Adapter Schema — The Schema IS The Contract
 * @package @devpulse/coldlight
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const SelectSchema = {
	kind: "select",
	engine: "meltui",
	slots: ["trigger", "content", "label", "option"],
	states: ["open", "closed", "focused", "focus-visible", "hover", "disabled", "selected"],
	aria: ["aria-expanded", "aria-haspopup", "aria-label", "aria-labelledby", "aria-disabled", "aria-controls", "aria-selected"],
	interactions: ["click", "keydown"],

	meltui: {
		meltClass: "Select",
		meltImport: "melt/builders",
		compound: true,

		slotMapping: {
			trigger: {
				meltGetter: "trigger",
				coldlightSlot: "trigger",
				element: "button",
				aria: {
					role: "combobox",
					required: ["aria-expanded", "aria-haspopup"],
					optional: ["aria-label", "aria-labelledby", "aria-disabled", "aria-controls"],
				},
				states: ["open", "focused", "focus-visible", "hover", "disabled"],
				dataAttributes: ["data-cl-select-trigger"],
			},
			content: {
				meltGetter: "content",
				coldlightSlot: "content",
				element: "div",
				aria: {
					role: "listbox",
					required: [],
					optional: ["aria-label", "aria-labelledby"],
				},
				states: ["open", "closed"],
				dataAttributes: ["data-cl-select-content"],
			},
			label: {
				meltGetter: "label",
				coldlightSlot: "label",
				element: "span",
				aria: { required: [], optional: [] },
				states: ["disabled"],
				dataAttributes: ["data-cl-select-label"],
			},
		},

		itemSlotMapping: {
			option: {
				meltGetter: "getOption",
				coldlightSlot: "option",
				element: "div",
				aria: {
					role: "option",
					required: ["aria-selected"],
					optional: ["aria-disabled"],
				},
				states: ["selected", "focused", "hover", "disabled"],
				dataAttributes: ["data-cl-select-option"],
			},
		},

		propMapping: [
			{ meltProp: "value", coldlightProp: "value", type: "T | undefined", required: false },
			{ meltProp: "onValueChange", coldlightProp: "onValueChange", type: "(value: T | undefined) => void", required: false },
			{ meltProp: "open", coldlightProp: "open", type: "boolean", required: false, defaultValue: false },
			{ meltProp: "onOpenChange", coldlightProp: "onOpenChange", type: "(open: boolean) => void", required: false },
			{ meltProp: "floatingConfig", coldlightProp: "floatingConfig", type: "object", required: false },
			{ meltProp: "typeaheadTimeout", coldlightProp: "typeaheadTimeout", type: "number", required: false },
		],

		keyboardMapping: [
			{ key: "ArrowDown", action: "highlightNext", description: "Highlight next option", slot: "trigger" },
			{ key: "ArrowUp", action: "highlightPrev", description: "Highlight previous option", slot: "trigger" },
			{ key: "Home", action: "highlightFirst", description: "Highlight first option", slot: "trigger" },
			{ key: "End", action: "highlightLast", description: "Highlight last option", slot: "trigger" },
			{ key: "Enter", action: "select", description: "Select option", slot: "trigger" },
			{ key: "Space", action: "select", description: "Select option", slot: "trigger" },
			{ key: "Escape", action: "close", description: "Close select", slot: "trigger" },
			{ key: "Tab", action: "exit", description: "Exit select", slot: "trigger" },
		],
	},
} as const;
