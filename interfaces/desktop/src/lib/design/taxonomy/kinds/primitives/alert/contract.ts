/**
 * @file Alert Taxonomy Contract
 * @description ColdLight SSOT contract for the alert primitive.
 *
 * ariaStateProvider: "coldlight" — native live region, direct ARIA application.
 * 2-folder parity: taxonomy + primitive.
 *
 * Reference: W3C WAI-ARIA APG Alert Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/alert/
 *
 * WAI-ARIA: role="alert" is an assertive live region.
 * Implicit aria-live="assertive", aria-atomic="true".
 */

import { type PrimitiveContract, parseContract } from "../../../primitive/contract.js";
import { alertSlotStates } from "./types.js";

const rawContract = {
	kind: "alert",
	ariaStateProvider: "coldlight",
	slots: {
		required: ["root"],
		optional: ["title", "description"],
		forbidden: [],
	},
	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: {
				role: "alert",
				required: [],
				optional: ["aria-live", "aria-atomic", "aria-label", "aria-labelledby", "aria-describedby"],
			},
		},
		title: {
			element: "h5",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
		description: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
	},
	states: {
		shared: ["hover", "active"],
		specific: ["visible", "hidden"],
	},
	slotStates: alertSlotStates,
	slotActions: { root: ["dismiss"], title: [], description: [] },
	aria: {
		role: "alert",
		requiredAttrs: [],
		optionalAttrs: [
			"aria-live",
			"aria-atomic",
			"aria-label",
			"aria-labelledby",
			"aria-describedby",
		],
	},
	keyboard: ["Escape"],
	keyboardMap: [
		{ orientation: "both", focusLocation: "root", key: "Escape", action: "close", required: false },
	],
	focusStrategy: "none",
	compound: false,
} as const;

export const contract: PrimitiveContract = parseContract(rawContract);
