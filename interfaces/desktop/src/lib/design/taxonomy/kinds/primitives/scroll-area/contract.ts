/**
 * @file ScrollArea Taxonomy Contract
 * @description ColdLight SSOT contract for the scroll-area primitive.
 *
 * ariaStateProvider: "coldlight" — native HTML handles semantics.
 * 2-folder parity: taxonomy + primitive.
 *
 * WAI-ARIA: role="scrollbar" on scrollbar elements with aria-controls.
 * Native scroll keyboard behavior (Arrow, Page, Home, End).
 */

import { type PrimitiveContract, parseContract } from "../../../primitive/contract.js";
import { scrollAreaSlotStates } from "./types.js";

const rawContract = {
	kind: "scroll-area",
	ariaStateProvider: "coldlight",
	slots: {
		required: ["root", "viewport"],
		optional: ["scrollbar", "thumb", "corner"],
		forbidden: [],
	},
	slotSpec: {
		root: { element: "div", children: "snippet", aria: { required: [], optional: [] } },
		viewport: { element: "div", children: "snippet", aria: { required: [], optional: [] } },
		scrollbar: {
			element: "div",
			children: "snippet",
			aria: {
				role: "scrollbar",
				required: ["aria-controls", "aria-valuenow", "aria-valuemin", "aria-valuemax"],
				optional: ["aria-orientation"],
			},
		},
		thumb: { element: "div", children: "snippet", aria: { required: [], optional: [] } },
		corner: { element: "div", children: "snippet", aria: { required: [], optional: [] } },
	},
	slotRelationships: [
		{ sourceSlot: "scrollbar", attribute: "aria-controls", targetSlot: "viewport", required: true },
	],
	states: { shared: ["hover", "active"], specific: ["visible", "hidden"] },
	slotStates: scrollAreaSlotStates,
	slotActions: {
		root: [],
		viewport: [],
		scrollbar: [],
		thumb: [],
		corner: [],
	},
	aria: {
		role: "region",
		requiredAttrs: [],
		optionalAttrs: [
			"aria-label",
			"aria-orientation",
			"aria-valuenow",
			"aria-valuemin",
			"aria-valuemax",
			"aria-controls",
		],
	},
	keyboard: [
		"ArrowUp",
		"ArrowDown",
		"ArrowLeft",
		"ArrowRight",
		"PageUp",
		"PageDown",
		"Home",
		"End",
	],
	keyboardMap: [
		{
			orientation: "vertical",
			focusLocation: "viewport",
			key: "ArrowDown",
			action: "next-item",
			required: false,
		},
		{
			orientation: "vertical",
			focusLocation: "viewport",
			key: "ArrowUp",
			action: "prev-item",
			required: false,
		},
		{
			orientation: "horizontal",
			focusLocation: "viewport",
			key: "ArrowRight",
			action: "next-item",
			required: false,
		},
		{
			orientation: "horizontal",
			focusLocation: "viewport",
			key: "ArrowLeft",
			action: "prev-item",
			required: false,
		},
		{
			orientation: "both",
			focusLocation: "viewport",
			key: "PageDown",
			action: "next-item",
			required: false,
		},
		{
			orientation: "both",
			focusLocation: "viewport",
			key: "PageUp",
			action: "prev-item",
			required: false,
		},
		{
			orientation: "both",
			focusLocation: "viewport",
			key: "Home",
			action: "first-item",
			required: false,
		},
		{
			orientation: "both",
			focusLocation: "viewport",
			key: "End",
			action: "last-item",
			required: false,
		},
	],
	focusStrategy: "none",
	compound: false,
	orientation: "both",
} as const;

export const contract: PrimitiveContract = parseContract(rawContract);
