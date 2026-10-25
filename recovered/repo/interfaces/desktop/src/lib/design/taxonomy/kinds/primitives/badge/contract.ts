/**
 * @file Badge Taxonomy Contract
 * @description ColdLight SSOT contract for the badge primitive.
 *
 * ariaStateProvider: "coldlight" — decorative element, minimal ARIA.
 * 2-folder parity: taxonomy + primitive.
 *
 * WAI-ARIA: role="status" for live region status updates.
 */

import { type PrimitiveContract, parseContract } from "../../../schema.js";
import { badgeSlotStates } from "./types.js";

const rawContract = {
	kind: "badge",
	ariaStateProvider: "coldlight",
	slots: { required: ["root"], optional: [], forbidden: [] },
	slotSpec: {
		root: {
			element: "span",
			children: "snippet",
			aria: { role: "status", required: [], optional: ["aria-label", "aria-hidden"] },
		},
	},
	states: { shared: ["hover", "active"], specific: [] },
	slotStates: badgeSlotStates,
	slotActions: { root: [] },
	aria: {
		role: "status",
		requiredAttrs: [],
		optionalAttrs: ["aria-label", "aria-hidden"],
	},
	keyboard: [],
	keyboardMap: [],
	focusStrategy: "none",
	compound: false,
} as const;

export const contract: PrimitiveContract = parseContract(rawContract);
