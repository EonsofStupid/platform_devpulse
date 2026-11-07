/**
 * @file PinInput Adapter Schema — The Schema IS The Contract
 * @package @devpulse/coldlight
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const PinInputSchema = {
	kind: "pin-input",
	engine: "meltui",
	slots: ["root", "input"],
	states: ["focused", "focus-visible", "disabled"],
	aria: ["aria-label", "aria-labelledby", "aria-disabled"],
	interactions: ["keydown", "input"],

	meltui: {
		meltClass: "PinInput",
		meltImport: "melt/builders",
		compound: true,

		slotMapping: {
			root: {
				meltGetter: "root",
				coldlightSlot: "root",
				element: "div",
				aria: {
					role: "group",
					required: [],
					optional: ["aria-label", "aria-labelledby"],
				},
				states: ["disabled"],
				dataAttributes: ["data-cl-pin-input-root"],
			},
		},

		itemSlotMapping: {
			input: {
				meltGetter: "inputs",
				coldlightSlot: "input",
				element: "input",
				aria: {
					role: "textbox",
					required: [],
					optional: ["aria-label", "aria-disabled"],
				},
				states: ["focused", "focus-visible", "disabled"],
				dataAttributes: ["data-cl-pin-input-input"],
			},
		},

		propMapping: [
			{ meltProp: "maxLength", coldlightProp: "length", type: "number", required: false, defaultValue: 4 },
			{ meltProp: "placeholder", coldlightProp: "placeholder", type: "string", required: false, defaultValue: "◯" },
			{ meltProp: "disabled", coldlightProp: "disabled", type: "boolean", required: false, defaultValue: false },
			{ meltProp: "mask", coldlightProp: "mask", type: "boolean", required: false, defaultValue: false },
			{ meltProp: "type", coldlightProp: "type", type: "\"text\" | \"numeric\" | \"alphanumeric\"", required: false, defaultValue: "text" },
			{ meltProp: "allowPaste", coldlightProp: "allowPaste", type: "boolean", required: false, defaultValue: true },
		],

		keyboardMapping: [
			{ key: "ArrowLeft", action: "focusPrev", description: "Focus previous input", slot: "input" },
			{ key: "ArrowRight", action: "focusNext", description: "Focus next input", slot: "input" },
			{ key: "Backspace", action: "delete", description: "Delete and focus previous", slot: "input" },
			{ key: "Delete", action: "delete", description: "Delete current", slot: "input" },
			{ key: "Tab", action: "exit", description: "Exit pin input", slot: "input" },
		],
	},
} as const;
