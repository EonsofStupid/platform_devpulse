/**
 * @file Button Taxonomy Contract
 * @description ColdLight SSOT contract for the button primitive.
 *
 * ariaStateProvider: "coldlight" — Native <button> handles ARIA.
 * No dsAdapter factory required. 2-folder parity: taxonomy + primitive.
 *
 * Reference: W3C WAI-ARIA APG Button Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/button/
 */

import { type PrimitiveContract, parseContract } from "../../../primitive/contract.js";
import { buttonSlotStates } from "./types.js";

const rawContract = {
	kind: "button",
	ariaStateProvider: "coldlight",
	slots: {
		required: ["root"],
		optional: ["icon", "label"],
		forbidden: [],
	},
	slotSpec: {
		root: {
			element: "button",
			children: "snippet",
			aria: {
				role: "button",
				required: [],
				optional: [
					"aria-pressed",
					"aria-disabled",
					"aria-busy",
					"aria-expanded",
					"aria-haspopup",
					"aria-controls",
					"aria-label",
					"aria-labelledby",
					"aria-describedby",
				],
			},
		},
		icon: {
			element: "span",
			children: "snippet",
			aria: { required: [], optional: ["aria-hidden"] },
		},
		label: {
			element: "span",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
	},
	states: {
		shared: ["focused", "focus-visible", "hover", "active", "disabled"],
		specific: ["pressed", "loading", "busy"],
	},
	slotStates: buttonSlotStates,
	slotActions: {
		root: ["submit", "reset", "toggle"],
		icon: [],
		label: [],
	},
	aria: {
		role: "button",
		requiredAttrs: [],
		optionalAttrs: [
			"aria-pressed",
			"aria-disabled",
			"aria-busy",
			"aria-expanded",
			"aria-haspopup",
			"aria-controls",
			"aria-label",
			"aria-labelledby",
			"aria-describedby",
		],
	},
	keyboard: ["Enter", "Space"],
	keyboardMap: [
		{
			orientation: "both",
			focusLocation: "root",
			key: "Enter",
			action: "activate",
			required: true,
		},
		{
			orientation: "both",
			focusLocation: "root",
			key: "Space",
			action: "activate",
			required: true,
		},
	],
	focusStrategy: "none",
	compound: false,
} as const;

export const contract: PrimitiveContract = parseContract(rawContract);
