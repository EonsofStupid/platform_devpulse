/**
 * @file Skeleton Taxonomy Contract
 * @description ColdLight SSOT contract for the skeleton primitive.
 *
 * ariaStateProvider: "coldlight" — presentational placeholder, no complex state machine.
 * 2-folder parity: taxonomy + primitive.
 *
 * WAI-ARIA: role="status" with aria-busy for loading indication.
 */

import { type PrimitiveContract, parseContract } from "../../../primitive/contract.js";
import { skeletonSlotStates } from "./types.js";

const rawContract = {
	kind: "skeleton",
	ariaStateProvider: "coldlight",
	slots: { required: ["root"], optional: [], forbidden: [] },
	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: { role: "status", required: [], optional: ["aria-busy", "aria-label", "aria-hidden"] },
		},
	},
	states: {
		shared: [],
		specific: ["loading", "busy", "visible", "hidden"],
	},
	slotStates: skeletonSlotStates,
	slotActions: { root: [] },
	aria: {
		role: "status",
		requiredAttrs: [],
		optionalAttrs: ["aria-busy", "aria-label", "aria-hidden"],
	},
	keyboard: [],
	keyboardMap: [],
	focusStrategy: "none",
	compound: false,
} as const;

export const contract: PrimitiveContract = parseContract(rawContract);
