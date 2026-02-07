/**
 * @file ToggleGroup Taxonomy Contract
 * @description ColdLight SSOT contract for the toggle-group primitive.
 *
 * ariaStateProvider: "coldlight" — createToggleGroup provides roving tabindex + aria-pressed management.
 * 2-folder parity: taxonomy + primitive.
 *
 * Reference: W3C WAI-ARIA APG Button Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/button/
 *
 * WAI-ARIA: role="group" container with toggle buttons using aria-pressed.
 * Supports single or multiple selection modes.
 * Roving tabindex for keyboard navigation between items.
 */

import { type PrimitiveContract, parseContract } from "../../../schema.js";
import { toggleGroupSlotStates } from "./types.js";

const rawContract = {
	kind: "toggle-group",
	ariaStateProvider: "coldlight",
	slots: { required: ["root", "item"], optional: [], forbidden: [] },
	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: {
				role: "group",
				required: [],
				optional: ["aria-label", "aria-orientation", "aria-disabled"],
			},
		},
		item: {
			element: "button",
			children: "snippet",
			aria: { required: ["aria-pressed"], optional: ["aria-label", "aria-disabled"] },
		},
	},
	states: {
		shared: ["hover", "active", "focused", "focus-visible", "disabled"],
		specific: ["pressed"],
	},
	slotStates: toggleGroupSlotStates,
	slotActions: { root: [], item: ["toggle"] },
	aria: {
		role: "group",
		requiredAttrs: [],
		optionalAttrs: ["aria-label", "aria-orientation", "aria-disabled"],
	},
	keyboard: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "Space", "Enter"],
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
			orientation: "vertical",
			focusLocation: "item",
			key: "ArrowDown",
			action: "next-item",
			required: true,
		},
		{
			orientation: "vertical",
			focusLocation: "item",
			key: "ArrowUp",
			action: "prev-item",
			required: true,
		},
		{
			orientation: "both",
			focusLocation: "item",
			key: "Home",
			action: "first-item",
			required: true,
		},
		{ orientation: "both", focusLocation: "item", key: "End", action: "last-item", required: true },
		{ orientation: "both", focusLocation: "item", key: "Space", action: "toggle", required: true },
		{ orientation: "both", focusLocation: "item", key: "Enter", action: "toggle", required: true },
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
