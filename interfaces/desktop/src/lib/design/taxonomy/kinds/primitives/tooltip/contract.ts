/**
 * @file Tooltip Taxonomy Contract
 * @description ColdLight SSOT contract for the tooltip primitive.
 *
 * ariaStateProvider: "coldlight" — dsAdapter (createTooltip) provides ARIA + state.
 * 3-folder parity: taxonomy + adapter + primitive.
 *
 * Reference: W3C WAI-ARIA APG Tooltip Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
 *
 * Non-interactive, appears on hover/focus after delay. Dismissed on Escape.
 */

import { type PrimitiveContract, parseContract } from "../../../primitive/contract.js";
import { tooltipSlotStates } from "./types.js";

const rawContract = {
	kind: "tooltip",
	ariaStateProvider: "coldlight",
	slots: {
		required: ["root", "trigger", "content"],
		optional: ["arrow"],
		forbidden: [],
	},
	slotSpec: {
		root: { element: "fragment", children: "renderless", aria: { required: [], optional: [] } },
		trigger: {
			element: "button",
			children: "snippet",
			aria: { required: ["aria-describedby"], optional: [] },
		},
		content: {
			element: "div",
			children: "snippet",
			aria: { role: "tooltip", required: [], optional: ["aria-label"] },
		},
		arrow: { element: "div", children: "snippet", aria: { required: [], optional: [] } },
	},
	slotRelationships: [
		{ sourceSlot: "trigger", attribute: "aria-describedby", targetSlot: "content", required: true },
	],
	states: {
		shared: ["focused", "focus-visible", "hover"],
		specific: ["open", "hidden", "visible", "entering", "exiting"],
	},
	slotStates: tooltipSlotStates,
	slotActions: {
		root: [],
		trigger: [],
		content: [],
		arrow: [],
	},
	aria: {
		role: "tooltip",
		requiredAttrs: [],
		optionalAttrs: ["aria-describedby"],
	},
	keyboard: ["Escape"],
	keyboardMap: [
		{
			orientation: "both",
			focusLocation: "trigger",
			key: "Escape",
			action: "close",
			required: true,
		},
	],
	focusStrategy: "none",
	compound: true,
	dismissBehavior: { escape: true, outsideClick: false },
} as const;

export const contract: PrimitiveContract = parseContract(rawContract);
