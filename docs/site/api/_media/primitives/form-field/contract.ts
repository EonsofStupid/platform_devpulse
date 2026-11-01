/**
 * @file primitives/form-field/contract.ts
 * @kind form-field
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * FormField PrimitiveContract — compound wrapper for label + input + description + error.
 * Provides context for aria-describedby and aria-errormessage linking.
 *
 * ariaStateProvider: "coldlight"
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { FormFieldSlot, FormFieldState } from "./types.js";

export const contract = {
	kind: "form-field",
	ariaStateProvider: "coldlight",

	slots: {
		required: ["root", "label", "control"],
		optional: ["description", "error"],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
		label: {
			element: "label",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
		control: {
			element: "div",
			children: "snippet",
			aria: {
				required: [],
				optional: ["aria-describedby", "aria-errormessage", "aria-invalid", "aria-required"],
			},
		},
		description: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
		error: {
			element: "div",
			children: "snippet",
			aria: {
				role: "alert",
				required: [],
				optional: ["aria-live"],
			},
		},
	},

	states: {
		shared: ["disabled"],
		specific: ["invalid", "valid", "required"],
	},

	slotStates: {
		root: ["invalid", "valid", "required", "disabled"],
		label: ["required", "disabled"],
		control: ["invalid", "valid", "required", "disabled"],
		description: [],
		error: ["invalid"],
	},

	slotActions: {
		root: [],
		label: [],
		control: [],
		description: [],
		error: [],
	},

	aria: { role: "group", requiredAttrs: [], optionalAttrs: ["aria-labelledby"] },
	keyboard: [],
	focusStrategy: "none",
	compound: true,
} as const satisfies PrimitiveContract<"form-field", FormFieldSlot, FormFieldState>;
