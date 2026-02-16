/**
 * @file Toggle Taxonomy Contract
 * @description ColdLight SSOT contract for the toggle primitive.
 *
 * ariaStateProvider: "coldlight" — native <button> + aria-pressed at component layer.
 * 2-folder parity: taxonomy + primitive.
 *
 * Reference: W3C WAI-ARIA APG Button Pattern (Toggle Button variant)
 * https://www.w3.org/WAI/ARIA/apg/patterns/button/
 */

import { type PrimitiveContract, parseContract } from "../../../primitive/contract.js";
import { toggleSlotStates } from "./types.js";

const rawContract = {
	kind: "toggle",
	ariaStateProvider: "coldlight",
	slots: { required: ["root"], optional: [], forbidden: [] },
	slotSpec: {
		root: {
			element: "button",
			children: "snippet",
			aria: {
				role: "button",
				required: ["aria-pressed"],
				optional: ["aria-disabled", "aria-label", "aria-labelledby", "aria-describedby"],
			},
		},
	},
	states: {
		shared: ["focused", "focus-visible", "hover", "active", "disabled"],
		specific: ["pressed"],
	},
	slotStates: toggleSlotStates,
	slotActions: { root: ["toggle"] },
	aria: {
		role: "button",
		requiredAttrs: ["aria-pressed"],
		optionalAttrs: ["aria-label", "aria-labelledby", "aria-describedby", "aria-disabled"],
	},
	keyboard: ["Enter", "Space"],
	keyboardMap: [
		{ orientation: "both", focusLocation: "root", key: "Enter", action: "toggle", required: true },
		{ orientation: "both", focusLocation: "root", key: "Space", action: "toggle", required: true },
	],
	focusStrategy: "none",
	compound: true,
} as const;

export const contract: PrimitiveContract = parseContract(rawContract);
