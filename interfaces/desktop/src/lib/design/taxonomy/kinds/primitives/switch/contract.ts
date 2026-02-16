/**
 * @file Switch Taxonomy Contract
 * @description ColdLight SSOT contract for the switch primitive.
 *
 * ariaStateProvider: "coldlight" — native <button> with role="switch" + aria-checked at component layer.
 * 2-folder parity: taxonomy + primitive.
 *
 * Reference: W3C WAI-ARIA APG Switch Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/switch/
 *
 * WAI-ARIA: role="switch" is a type of checkbox that represents on/off.
 * aria-checked is required (true/false, never "mixed" unlike checkbox).
 */

import { type PrimitiveContract, parseContract } from "../../../primitive/contract.js";
import { switchSlotStates } from "./types.js";

const rawContract = {
	kind: "switch",
	ariaStateProvider: "coldlight",
	slots: { required: ["root", "thumb"], optional: [], forbidden: [] },
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
			children: "snippet",
			aria: { role: "presentation", required: [], optional: [] },
		},
	},
	states: {
		shared: ["hover", "active", "focused", "focus-visible", "disabled"],
		specific: ["checked"],
	},
	slotStates: switchSlotStates,
	slotActions: { root: ["check", "uncheck", "toggle"], thumb: [] },
	aria: {
		role: "switch",
		requiredAttrs: ["aria-checked"],
		optionalAttrs: ["aria-label", "aria-labelledby", "aria-describedby", "aria-disabled"],
	},
	keyboard: ["Space"],
	keyboardMap: [
		{ orientation: "both", focusLocation: "root", key: "Space", action: "toggle", required: true },
	],
	focusStrategy: "none",
	compound: true,
} as const;

export const contract: PrimitiveContract = parseContract(rawContract);
