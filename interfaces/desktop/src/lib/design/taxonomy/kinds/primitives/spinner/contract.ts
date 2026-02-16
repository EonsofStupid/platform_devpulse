/**
 * @file Spinner Taxonomy Contract
 * @description ColdLight SSOT contract for the spinner primitive.
 *
 * ariaStateProvider: "coldlight" — polite live region announcing loading state to assistive technology.
 * 2-folder parity: taxonomy + primitive.
 *
 * WAI-ARIA: role="status" with implicit aria-live="polite", aria-atomic="true".
 * Accessible name required via aria-label (e.g., "Loading").
 * No keyboard interaction. No focus management. Purely informational.
 */

import { type PrimitiveContract, parseContract } from "../../../primitive/contract.js";
import { spinnerSlotStates } from "./types.js";

const rawContract = {
	kind: "spinner",
	ariaStateProvider: "coldlight",
	slots: { required: ["root"], optional: [], forbidden: [] },
	slotSpec: {
		root: {
			element: "span",
			children: "snippet",
			aria: {
				role: "status",
				required: [],
				optional: ["aria-label", "aria-hidden", "aria-busy", "aria-live"],
			},
		},
	},
	states: { shared: [], specific: ["loading", "visible", "hidden"] },
	slotStates: spinnerSlotStates,
	slotActions: { root: [] },
	aria: {
		role: "status",
		requiredAttrs: [],
		optionalAttrs: ["aria-label", "aria-hidden", "aria-busy", "aria-live"],
	},
	keyboard: [],
	keyboardMap: [],
	focusStrategy: "none",
	compound: false,
} as const;

export const contract: PrimitiveContract = parseContract(rawContract);
