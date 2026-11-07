/**
 * @file Toolbar Taxonomy Contract
 * @description ColdLight SSOT contract for the toolbar primitive.
 *
 * ariaStateProvider: "coldlight" — native HTML handles semantics.
 * 2-folder parity: taxonomy + primitive.
 *
 * Reference: W3C WAI-ARIA APG Toolbar Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
 */

import { type PrimitiveContract, parseContract } from "../../../schema.js";
import { toolbarSlotStates } from "./types.js";

const rawContract = {
	kind: "toolbar",
	ariaStateProvider: "coldlight",
	slots: {
		required: ["root"],
		optional: ["group", "item", "separator", "link"],
		forbidden: [],
	},
	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: {
				role: "toolbar",
				required: [],
				optional: ["aria-label", "aria-labelledby", "aria-orientation"],
			},
		},
		group: {
			element: "div",
			children: "snippet",
			aria: { role: "group", required: [], optional: ["aria-label"] },
		},
		item: {
			element: "button",
			children: "snippet",
			aria: {
				role: "button",
				required: [],
				optional: ["aria-disabled", "aria-pressed", "aria-label"],
			},
		},
		separator: {
			element: "div",
			children: "snippet",
			aria: { role: "separator", required: [], optional: ["aria-orientation"] },
		},
		link: {
			element: "a",
			children: "snippet",
			aria: { role: "link", required: [], optional: ["aria-label", "aria-disabled"] },
		},
	},
	states: {
		shared: ["focused", "focus-visible", "hover", "active", "disabled"],
		specific: [],
	},
	slotStates: toolbarSlotStates,
	slotActions: {
		root: [],
		group: [],
		item: [],
		separator: [],
		link: [],
	},
	aria: {
		role: "toolbar",
		requiredAttrs: ["aria-label"],
		optionalAttrs: ["aria-orientation", "aria-controls", "aria-disabled"],
	},
	keyboard: ["ArrowLeft", "ArrowRight", "Home", "End", "Tab"],
	keyboardMap: [
		{
			orientation: "horizontal",
			focusLocation: "item",
			key: "ArrowRight",
			action: "next-item",
			required: true,
		},
		{
			orientation: "horizontal",
			focusLocation: "item",
			key: "ArrowLeft",
			action: "prev-item",
			required: true,
		},
		{
			orientation: "horizontal",
			focusLocation: "item",
			key: "Home",
			action: "first-item",
			required: true,
		},
		{
			orientation: "horizontal",
			focusLocation: "item",
			key: "End",
			action: "last-item",
			required: true,
		},
	],
	focusStrategy: "roving",
	focus: {
		strategy: "roving",
		wrapAround: true,
	},
	compound: false,
	orientation: "horizontal",
} as const;

export const contract: PrimitiveContract = parseContract(rawContract);
