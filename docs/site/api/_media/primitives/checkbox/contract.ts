/**
 * @file primitives/checkbox/contract.ts
 * @kind checkbox
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Checkbox PrimitiveContract — toggle control with tri-state support.
 *
 * ariaStateProvider: "coldlight"
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/
 *
 * ARIA (applied by component layer):
 *   role="checkbox"
 *   aria-checked="true" | "false" | "mixed"
 *   aria-label / aria-labelledby
 *
 * Keyboard:
 *   Space — toggles checked state
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { CheckboxSlot, CheckboxState } from "./types.js";

export const contract = {
	kind: "checkbox",
	ariaStateProvider: "coldlight",

	slots: {
		required: ["root"],
		optional: ["indicator", "label"],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "button",
			children: "snippet",
			aria: {
				role: "checkbox",
				required: ["aria-checked"],
				optional: ["aria-label", "aria-labelledby", "aria-describedby", "aria-disabled"],
			},
		},
		indicator: {
			element: "span",
			children: "snippet",
			aria: {
				required: [],
				optional: ["aria-hidden"],
			},
		},
		label: {
			element: "span",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
	},

	states: {
		shared: ["focused", "focus-visible", "hover", "disabled"],
		specific: ["checked", "indeterminate"],
	},

	slotStates: {
		root: ["checked", "indeterminate", "focused", "focus-visible", "hover", "disabled"],
		indicator: ["checked", "indeterminate"],
		label: ["disabled"],
	},

	slotActions: {
		root: ["check", "uncheck", "toggle"],
		indicator: [],
		label: [],
	},

	aria: {
		role: "checkbox",
		requiredAttrs: ["aria-checked"],
		optionalAttrs: ["aria-label", "aria-labelledby", "aria-describedby", "aria-disabled"],
	},

	keyboard: ["Space"],
	focusStrategy: "none",
	compound: false,
} as const satisfies PrimitiveContract<"checkbox", CheckboxSlot, CheckboxState>;
