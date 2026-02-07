/**
 * @file Label Taxonomy Contract
 * @description ColdLight SSOT contract for the label primitive.
 *
 * ariaStateProvider: "coldlight" — native <label> handles semantics.
 * 2-folder parity: taxonomy + primitive.
 */

import { type PrimitiveContract, parseContract } from "../../../schema.js";
import { labelSlotStates } from "./types.js";

const rawContract = {
	kind: "label",
	ariaStateProvider: "coldlight",
	slots: { required: ["root"], optional: [], forbidden: [] },
	slotSpec: {
		root: {
			element: "label",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
	},
	states: {
		shared: ["focused", "focus-visible", "hover", "active", "disabled"],
		specific: [],
	},
	slotStates: labelSlotStates,
	slotActions: { root: [] },
	aria: {
		role: "none",
		requiredAttrs: [],
		optionalAttrs: [],
	},
	keyboard: [],
	focusStrategy: "none",
	compound: false,
} as const;

export const contract: PrimitiveContract = parseContract(rawContract);
