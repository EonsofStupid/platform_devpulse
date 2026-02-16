/**
 * @file Textarea Taxonomy Contract
 * @description ColdLight SSOT contract for the textarea primitive.
 *
 * ariaStateProvider: "coldlight" — native <textarea> handles semantics.
 * 2-folder parity: taxonomy + primitive.
 */

import { type PrimitiveContract, parseContract } from "../../../primitive/contract.js";
import { textareaSlotStates } from "./types.js";

const rawContract = {
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
					"aria-required",
					"aria-invalid",
					"aria-errormessage",
					"aria-disabled",
					"aria-readonly",
					"aria-placeholder",
					"aria-multiline",
				],
			},
		},
	},
	states: {
		shared: ["focused", "focus-visible", "hover", "active", "disabled"],
		specific: ["readonly", "invalid", "valid", "required"],
	},
	slotStates: textareaSlotStates,
	slotActions: { root: [] },
	aria: {
		role: "textbox",
		requiredAttrs: [],
		optionalAttrs: [
			"aria-label",
			"aria-labelledby",
			"aria-describedby",
			"aria-invalid",
			"aria-errormessage",
			"aria-required",
			"aria-disabled",
			"aria-placeholder",
			"aria-readonly",
			"aria-multiline",
		],
	},
	keyboard: [],
	focusStrategy: "none",
	compound: false,
} as const;

export const contract: PrimitiveContract = parseContract(rawContract);
