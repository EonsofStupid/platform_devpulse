/**
 * @file Collapsible Taxonomy Contract
 * @description ColdLight SSOT contract for the collapsible primitive.
 *
 * ariaStateProvider: "coldlight" — native HTML handles semantics.
 * 2-folder parity: taxonomy + primitive.
 *
 * Reference: W3C WAI-ARIA APG Disclosure Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
 */

import { type PrimitiveContract, parseContract } from "../../../schema.js";
import { collapsibleSlotStates } from "./types.js";

const rawContract = {
	kind: "collapsible",
	ariaStateProvider: "coldlight",
	slots: {
		required: ["root", "trigger", "content"],
		optional: [],
		forbidden: [],
	},
	slotSpec: {
		root: {
			element: "fragment",
			children: "renderless",
			aria: { required: [], optional: [] },
		},
		trigger: {
			element: "button",
			children: "snippet",
			aria: {
				role: "button",
				required: ["aria-expanded", "aria-controls"],
				optional: ["aria-disabled", "aria-label"],
			},
		},
		content: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: ["aria-hidden"] },
		},
	},
	slotRelationships: [
		{ sourceSlot: "trigger", attribute: "aria-controls", targetSlot: "content", required: true },
	],
	states: {
		shared: ["focused", "focus-visible", "hover", "active", "disabled"],
		specific: ["open", "closed"],
	},
	slotStates: collapsibleSlotStates,
	slotActions: { root: [], trigger: ["toggle"], content: [] },
	aria: {
		role: "group",
		requiredAttrs: [],
		optionalAttrs: ["aria-expanded", "aria-controls", "aria-disabled", "aria-hidden"],
	},
	keyboard: ["Enter", "Space"],
	keyboardMap: [
		{
			orientation: "both",
			focusLocation: "trigger",
			key: "Enter",
			action: "toggle",
			required: true,
		},
		{
			orientation: "both",
			focusLocation: "trigger",
			key: "Space",
			action: "toggle",
			required: true,
		},
	],
	focusStrategy: "none",
	compound: true,
} as const;

export const contract: PrimitiveContract = parseContract(rawContract);
