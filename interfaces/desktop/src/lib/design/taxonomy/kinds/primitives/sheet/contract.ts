/**
 * @file Sheet Taxonomy Contract
 * @description ColdLight SSOT contract for the sheet primitive.
 *
 * ariaStateProvider: "coldlight" — dsAdapter (createDialog) provides ARIA + state.
 * 3-folder parity: taxonomy + adapter + primitive.
 *
 * Reference: W3C WAI-ARIA APG Dialog Pattern (side-anchored variant)
 * https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 */

import { type PrimitiveContract, parseContract } from "../../../primitive/contract.js";
import { sheetSlotStates } from "./types.js";

const rawContract = {
	kind: "sheet",
	ariaStateProvider: "coldlight",
	slots: {
		required: ["root", "content"],
		optional: ["trigger", "portal", "overlay", "header", "footer", "title", "description", "close"],
		forbidden: [],
	},
	slotSpec: {
		root: { element: "fragment", children: "renderless", aria: { required: [], optional: [] } },
		trigger: {
			element: "button",
			children: "snippet",
			aria: {
				role: "button",
				required: ["aria-haspopup", "aria-expanded"],
				optional: ["aria-controls", "aria-label"],
			},
		},
		portal: { element: "div", children: "snippet", aria: { required: [], optional: [] } },
		overlay: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: ["aria-hidden"] },
		},
		content: {
			element: "div",
			children: "snippet",
			aria: {
				role: "dialog",
				required: ["aria-modal", "aria-labelledby"],
				optional: ["aria-label", "aria-describedby"],
			},
		},
		header: { element: "div", children: "snippet", aria: { required: [], optional: [] } },
		footer: { element: "div", children: "snippet", aria: { required: [], optional: [] } },
		title: { element: "h2", children: "snippet", aria: { required: [], optional: [] } },
		description: { element: "p", children: "snippet", aria: { required: [], optional: [] } },
		close: {
			element: "button",
			children: "snippet",
			aria: { role: "button", required: [], optional: ["aria-label"] },
		},
	},
	slotRelationships: [
		{ sourceSlot: "trigger", attribute: "aria-controls", targetSlot: "content", required: false },
		{ sourceSlot: "content", attribute: "aria-labelledby", targetSlot: "title", required: true },
		{
			sourceSlot: "content",
			attribute: "aria-describedby",
			targetSlot: "description",
			required: false,
		},
	],
	states: {
		shared: ["focused", "focus-visible", "focus-within", "hover", "active"],
		specific: ["hidden", "visible", "open", "entering", "exiting"],
	},
	slotStates: sheetSlotStates,
	slotActions: {
		root: [],
		trigger: ["open"],
		portal: [],
		overlay: ["close"],
		content: [],
		header: [],
		footer: [],
		title: [],
		description: [],
		close: ["close"],
	},
	aria: {
		role: "dialog",
		requiredAttrs: ["aria-modal", "aria-labelledby"],
		optionalAttrs: ["aria-label", "aria-describedby", "aria-hidden", "aria-busy"],
	},
	keyboard: ["Escape", "Tab"],
	keyboardMap: [
		{
			orientation: "both",
			focusLocation: "content",
			key: "Tab",
			action: "next-item",
			required: true,
		},
		{
			orientation: "both",
			focusLocation: "content",
			key: "Escape",
			action: "close",
			required: true,
		},
	],
	focusStrategy: "trap",
	focus: {
		strategy: "trap",
		onOpen: "first-focusable",
		onEscape: "return-to-trigger",
		tabBehavior: "cycle-within",
	},
	compound: true,
	dismissBehavior: { escape: true, outsideClick: true },
} as const;

export const contract: PrimitiveContract = parseContract(rawContract);
