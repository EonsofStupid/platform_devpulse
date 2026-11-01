/**
 * @file primitives/textarea/contract.ts
 * @kind textarea
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Textarea PrimitiveContract — multi-line text input.
 * Native <textarea> provides implicit textbox role with aria-multiline.
 *
 * ariaStateProvider: "coldlight"
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { TextareaSlot, TextareaState } from "./types.js";

export const contract = {
	kind: "textarea",
	ariaStateProvider: "coldlight",

	slots: { required: ["root"], optional: [], forbidden: [] },

	slotSpec: {
		root: {
			element: "textarea",
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
					"aria-multiline",
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
		root: ["focus", "blur", "clear"],
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
			"aria-multiline",
		],
	},

	keyboard: [],
	focusStrategy: "none",
	compound: false,
} as const satisfies PrimitiveContract<"textarea", TextareaSlot, TextareaState>;
