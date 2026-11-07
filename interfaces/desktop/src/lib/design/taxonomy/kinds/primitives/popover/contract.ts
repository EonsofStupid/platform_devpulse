/**
 * @file Popover Taxonomy Contract
 * @description ColdLight SSOT contract for the popover primitive.
 *
 * ariaStateProvider: "coldlight" — dsAdapter (createPopover) provides ARIA + state.
 * 3-folder parity: taxonomy + adapter + primitive.
 * Non-modal floating content anchored to trigger via Floating UI.
 */

import { type PrimitiveContract, parseContract } from "../../../schema.js";
import { popoverSlotStates } from "./types.js";

const rawContract = {
	kind: "popover",
	ariaStateProvider: "coldlight",
	slots: {
		required: ["root", "trigger", "content"],
		optional: ["arrow", "close"],
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
		content: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: ["aria-label", "aria-labelledby", "aria-describedby"] },
		},
		arrow: { element: "div", children: "snippet", aria: { required: [], optional: [] } },
		close: {
			element: "button",
			children: "snippet",
			aria: { role: "button", required: [], optional: ["aria-label"] },
		},
	},
	slotRelationships: [
		{ sourceSlot: "trigger", attribute: "aria-controls", targetSlot: "content", required: false },
	],
	states: {
		shared: ["focused", "focus-visible", "focus-within", "hover", "active"],
		specific: ["open", "hidden", "visible", "entering", "exiting"],
	},
	slotStates: popoverSlotStates,
	slotActions: {
		root: [],
		trigger: ["toggle"],
		content: [],
		arrow: [],
		close: ["close"],
	},
	aria: {
		role: "dialog",
		requiredAttrs: ["aria-expanded", "aria-controls"],
		optionalAttrs: [
			"aria-haspopup",
			"aria-label",
			"aria-labelledby",
			"aria-describedby",
			"aria-hidden",
		],
	},
	keyboard: ["Escape", "Tab"],
	keyboardMap: [
		{
			orientation: "both",
			focusLocation: "content",
			key: "Escape",
			action: "close",
			required: true,
		},
	],
	focusStrategy: "redirect",
	focus: {
		strategy: "redirect",
		onEscape: "return-to-trigger",
	},
	compound: true,
	dismissBehavior: { escape: true, outsideClick: true },
} as const;

export const contract: PrimitiveContract = parseContract(rawContract);
