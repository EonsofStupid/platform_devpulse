/**
 * @file RadioGroup Adapter Schema — The Schema IS The Contract
 * @package @devpulse/coldlight
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/radio/
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const RadioGroupSchema = {
	kind: "radio-group",
	engine: "meltui",
	slots: ["root", "item"],
	states: ["checked", "focused", "focus-visible", "hover", "disabled"],
	aria: ["aria-checked", "aria-disabled", "aria-label", "aria-labelledby", "aria-orientation", "aria-required"],
	interactions: ["click", "keydown"],

	meltui: {
		meltClass: "RadioGroup",
		meltImport: "melt/builders",
		compound: true,

		slotMapping: {
			root: {
				meltGetter: "root",
				coldlightSlot: "root",
				element: "div",
				aria: {
					role: "radiogroup",
					required: [],
					optional: ["aria-label", "aria-labelledby", "aria-orientation", "aria-required"],
				},
				states: [],
				dataAttributes: ["data-cl-radio-group-root"],
			},
		},

		itemSlotMapping: {
			item: {
				meltGetter: "getItem",
				coldlightSlot: "item",
				element: "button",
				aria: {
					role: "radio",
					required: ["aria-checked"],
					optional: ["aria-disabled", "aria-label"],
				},
				states: ["checked", "focused", "focus-visible", "hover", "disabled"],
				dataAttributes: ["data-cl-radio-group-item"],
			},
		},

		propMapping: [
			{ meltProp: "value", coldlightProp: "value", type: "string", required: false },
			{ meltProp: "onValueChange", coldlightProp: "onValueChange", type: "(value: string) => void", required: false },
			{ meltProp: "disabled", coldlightProp: "disabled", type: "boolean", required: false, defaultValue: false },
			{ meltProp: "required", coldlightProp: "required", type: "boolean", required: false, defaultValue: false },
			{ meltProp: "loop", coldlightProp: "loop", type: "boolean", required: false, defaultValue: true },
			{ meltProp: "selectWhenFocused", coldlightProp: "selectWhenFocused", type: "boolean", required: false, defaultValue: true },
			{ meltProp: "orientation", coldlightProp: "orientation", type: "\"horizontal\" | \"vertical\"", required: false, defaultValue: "vertical" },
		],

		keyboardMapping: [
			{ key: "ArrowDown", action: "next-item", description: "Focus next radio", slot: "item" },
			{ key: "ArrowUp", action: "prev-item", description: "Focus previous radio", slot: "item" },
			{ key: "ArrowRight", action: "next-item", description: "Focus next radio", slot: "item" },
			{ key: "ArrowLeft", action: "prev-item", description: "Focus previous radio", slot: "item" },
			{ key: "Space", action: "select", description: "Select focused radio", slot: "item" },
		],
	},
} as const;
