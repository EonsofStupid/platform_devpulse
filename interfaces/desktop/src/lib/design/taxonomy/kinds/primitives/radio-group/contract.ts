/**
 * @file RadioGroup Taxonomy Contract
 * @description ColdLight SSOT contract for the radio-group primitive.
 *
 * ariaStateProvider: "coldlight" — native buttons with role="radiogroup"/"radio" + aria-checked at component layer.
 * 2-folder parity: taxonomy + primitive.
 *
 * Reference: W3C WAI-ARIA APG Radio Group Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/radio/
 *
 * WAI-ARIA: role="radiogroup" on container, role="radio" on each item.
 * aria-checked required on items (true/false). Only one item checked at a time.
 * Roving tabindex for keyboard navigation (Arrow keys move focus + select).
 */

import { type PrimitiveContract, parseContract } from "../../../schema.js";
import { radioGroupSlotStates } from "./types.js";

const rawContract = {
	kind: "radio-group",
	ariaStateProvider: "coldlight",
	slots: { required: ["root", "item"], optional: ["indicator"], forbidden: [] },
	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: {
				role: "radiogroup",
				required: [],
				optional: [
					"aria-label",
					"aria-labelledby",
					"aria-describedby",
					"aria-orientation",
					"aria-disabled",
					"aria-required",
				],
			},
		},
		item: {
			element: "button",
			children: "snippet",
			aria: {
				role: "radio",
				required: ["aria-checked"],
				optional: ["aria-label", "aria-labelledby", "aria-disabled"],
			},
		},
		indicator: {
			element: "span",
			children: "snippet",
			aria: { role: "presentation", required: [], optional: [] },
		},
	},
	states: {
		shared: ["hover", "active", "focused", "focus-visible", "disabled"],
		specific: ["checked"],
	},
	slotStates: radioGroupSlotStates,
	slotActions: { root: [], item: ["select"], indicator: [] },
	aria: {
		role: "radiogroup",
		requiredAttrs: [],
		optionalAttrs: [
			"aria-label",
			"aria-labelledby",
			"aria-describedby",
			"aria-orientation",
			"aria-disabled",
			"aria-required",
		],
	},
	keyboard: ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"],
	keyboardMap: [
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
			orientation: "both",
			focusLocation: "item",
			key: "Space",
			action: "activate",
			required: true,
		},
	],
	focusStrategy: "roving",
	focus: {
		strategy: "roving",
		wrapAround: true,
	},
	selection: {
		type: "single",
		selectionFollowsFocus: true,
	},
	compound: true,
	orientation: "vertical",
} as const;

export const contract: PrimitiveContract = parseContract(rawContract);
