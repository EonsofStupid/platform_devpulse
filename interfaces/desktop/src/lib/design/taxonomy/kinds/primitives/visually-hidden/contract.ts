/**
 * @file VisuallyHidden Taxonomy Contract
 * @description ColdLight SSOT contract for the visually-hidden utility primitive.
 *
 * ariaStateProvider: "coldlight" — CSS-only screen-reader utility, zero JS behavior.
 * 2-folder parity: taxonomy + primitive.
 *
 * Utility primitive. Renders a <span> that is visually hidden but accessible
 * to screen readers. Uses the proven clip-rect technique.
 * No ARIA role — the content inside carries its own semantics.
 * No states, no keyboard, no focus management.
 */

import { type PrimitiveContract, parseContract } from "../../../primitive/contract.js";
import { visuallyHiddenSlotStates } from "./types.js";

const rawContract = {
	kind: "visually-hidden",
	ariaStateProvider: "coldlight",
	slots: { required: ["root"], optional: [], forbidden: [] },
	slotSpec: {
		root: {
			element: "span",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
	},
	states: { shared: [], specific: [] },
	slotStates: visuallyHiddenSlotStates,
	slotActions: { root: [] },
	aria: {
		role: "none",
		requiredAttrs: [],
		optionalAttrs: [],
	},
	keyboard: [],
	keyboardMap: [],
	focusStrategy: "none",
	compound: false,
} as const;

export const contract: PrimitiveContract = parseContract(rawContract);
