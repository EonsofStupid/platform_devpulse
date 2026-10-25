/**
 * @file primitives/input/contract.ts
 * @kind input
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Input PrimitiveContract — text input.
 * Native <input> provides implicit textbox role.
 *
 * ariaStateProvider: "coldlight"
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { InputSlot, InputState } from "./types.js";

export const contract = {
	kind: "input",
	ariaStateProvider: "coldlight",

	slots: { required: ["root"], optional: [], forbidden: [] },

	slotSpec: {
		root: {
			element: "input",
			children: "self-closing",
			aria: {
				role: "textbox",
				required: [],
				optional: [
					"aria-label",
					"aria-labelledby",
					"aria-describedby",
					"aria-errormessage",
					"aria-invalid",
					"aria-required",
					"aria-disabled",
					"aria-readonly",
					"aria-placeholder",
				],
			},
		},
	},

	states: {
		shared: ["focused", "focus-visible", "hover", "disabled"],
		specific: ["readonly", "required", "invalid", "valid"],
	},

	slotStates: {
		root: ["focused", "focus-visible", "hover", "disabled", "readonly", "required", "invalid", "valid"],
	},

	slotActions: {
		root: ["focus", "blur", "clear", "submit"],
	},

	aria: {
		role: "textbox",
		requiredAttrs: [],
		optionalAttrs: [
			"aria-label",
			"aria-labelledby",
			"aria-describedby",
			"aria-errormessage",
			"aria-invalid",
			"aria-required",
			"aria-disabled",
			"aria-readonly",
			"aria-placeholder",
		],
	},

	keyboard: ["Enter"],
	focusStrategy: "none",
	compound: false,
} as const satisfies PrimitiveContract<"input", InputSlot, InputState>;
