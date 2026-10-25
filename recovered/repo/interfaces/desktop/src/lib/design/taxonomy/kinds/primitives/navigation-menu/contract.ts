/**
 * @file NavigationMenu Taxonomy Contract
 * @description ColdLight SSOT contract for the navigation-menu primitive.
 *
 * ariaStateProvider: "coldlight" — semantic HTML nav landmark with roving tabindex.
 * 2-folder parity: taxonomy + primitive.
 *
 * Reference: W3C WAI-ARIA APG Navigation Menubar
 * https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
 *
 * WAI-ARIA: role="navigation" landmark with nested disclosure pattern.
 */

import { type PrimitiveContract, parseContract } from "../../../schema.js";
import { navigationMenuSlotStates } from "./types.js";

const rawContract = {
	kind: "navigation-menu",
	ariaStateProvider: "coldlight",
	slots: {
		required: ["root", "list", "item"],
		optional: ["trigger", "content", "link", "viewport"],
		forbidden: [],
	},
	slotSpec: {
		root: {
			element: "nav",
			children: "snippet",
			aria: { role: "navigation", required: [], optional: ["aria-label"] },
		},
		list: {
			element: "ul",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
		item: {
			element: "li",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
		trigger: {
			element: "button",
			children: "snippet",
			aria: {
				role: "button",
				required: ["aria-expanded"],
				optional: ["aria-controls", "aria-label", "aria-haspopup"],
			},
		},
		content: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: ["aria-label"] },
		},
		link: {
			element: "a",
			children: "snippet",
			aria: { role: "link", required: [], optional: ["aria-current", "aria-label"] },
		},
		viewport: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
	},
	slotRelationships: [
		{ sourceSlot: "trigger", attribute: "aria-controls", targetSlot: "content", required: false },
	],
	states: {
		shared: ["hover", "active", "focused", "focus-visible", "disabled"],
		specific: ["open", "closed"],
	},
	slotStates: navigationMenuSlotStates,
	slotActions: {
		root: [],
		list: [],
		item: [],
		trigger: ["open", "close", "toggle"],
		content: [],
		link: ["select"],
		viewport: [],
	},
	aria: {
		role: "navigation",
		requiredAttrs: [],
		optionalAttrs: [
			"aria-label",
			"aria-labelledby",
			"aria-expanded",
			"aria-controls",
			"aria-current",
			"aria-haspopup",
		],
	},
	keyboard: [
		"ArrowLeft",
		"ArrowRight",
		"ArrowDown",
		"Enter",
		"Space",
		"Escape",
		"Home",
		"End",
		"Tab",
	],
	keyboardMap: [
		{
			orientation: "horizontal",
			focusLocation: "trigger",
			key: "ArrowRight",
			action: "next-item",
			required: true,
		},
		{
			orientation: "horizontal",
			focusLocation: "trigger",
			key: "ArrowLeft",
			action: "prev-item",
			required: true,
		},
		{
			orientation: "horizontal",
			focusLocation: "trigger",
			key: "Home",
			action: "first-item",
			required: true,
		},
		{
			orientation: "horizontal",
			focusLocation: "trigger",
			key: "End",
			action: "last-item",
			required: true,
		},
		{
			orientation: "horizontal",
			focusLocation: "trigger",
			key: "ArrowDown",
			action: "open",
			required: true,
		},
		{
			orientation: "horizontal",
			focusLocation: "trigger",
			key: "Enter",
			action: "open",
			required: true,
		},
		{
			orientation: "horizontal",
			focusLocation: "trigger",
			key: "Space",
			action: "open",
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
	focusStrategy: "roving",
	focus: {
		strategy: "roving",
		wrapAround: true,
	},
	compound: true,
	orientation: "horizontal",
} as const;

export const contract: PrimitiveContract = parseContract(rawContract);
