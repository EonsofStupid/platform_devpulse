/**
 * @file primitives/switch/contract.ts
 * @kind switch
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Switch PrimitiveContract — on/off toggle.
 *
 * ariaStateProvider: "coldlight"
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/switch/
 *
 * ARIA: role="switch", aria-checked (required)
 * Keyboard: Space (toggle), Enter (toggle)
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { SwitchSlot, SwitchState } from "./types.js";

export const contract = {
	kind: "switch",
	ariaStateProvider: "coldlight",

	slots: {
		required: ["root"],
		optional: ["thumb", "label"],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "button",
			children: "snippet",
			aria: {
				role: "switch",
				required: ["aria-checked"],
				optional: ["aria-label", "aria-labelledby", "aria-describedby", "aria-disabled"],
			},
		},
		thumb: {
			element: "span",
			children: "self-closing",
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
		specific: ["checked"],
	},

	slotStates: {
		root: ["checked", "focused", "focus-visible", "hover", "disabled"],
		thumb: ["checked"],
		label: ["disabled"],
	},

	slotActions: {
		root: ["check", "uncheck", "toggle"],
		thumb: [],
		label: [],
	},

	aria: {
		role: "switch",
		requiredAttrs: ["aria-checked"],
		optionalAttrs: ["aria-label", "aria-labelledby", "aria-describedby", "aria-disabled"],
	},

	keyboard: ["Space", "Enter"],
	focusStrategy: "none",
	compound: false,
} as const satisfies PrimitiveContract<"switch", SwitchSlot, SwitchState>;
