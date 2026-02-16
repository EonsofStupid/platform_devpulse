/**
 * @file Separator Taxonomy Contract
 * @description ColdLight SSOT contract for the separator primitive.
 *
 * ariaStateProvider: "coldlight" — native HTML handles semantics.
 * 2-folder parity: taxonomy + primitive.
 *
 * WAI-ARIA: role="separator" with optional focusability for draggable splitters.
 * When focusable (tabindex=0), supports aria-valuenow for resizable split views.
 */

import { type PrimitiveContract, parseContract } from "../../../primitive/contract.js";
import { separatorSlotStates } from "./types.js";

const rawContract = {
	kind: "separator",
	ariaStateProvider: "coldlight",
	slots: { required: ["root"], optional: [], forbidden: [] },
	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: {
				role: "separator",
				required: [],
				optional: [
					"aria-orientation",
					"aria-label",
					"aria-labelledby",
					"aria-disabled",
					"aria-valuemin",
					"aria-valuemax",
					"aria-valuenow",
					"aria-valuetext",
				],
			},
		},
	},
	states: {
		shared: ["focused", "focus-visible", "hover", "active", "disabled"],
		specific: [],
	},
	slotStates: separatorSlotStates,
	slotActions: { root: [] },
	aria: {
		role: "separator",
		requiredAttrs: [],
		optionalAttrs: [
			"aria-orientation",
			"aria-label",
			"aria-labelledby",
			"aria-disabled",
			"aria-valuemin",
			"aria-valuemax",
			"aria-valuenow",
			"aria-valuetext",
		],
	},
	keyboard: ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"],
	keyboardMap: [
		{
			orientation: "horizontal",
			focusLocation: "root",
			key: "ArrowLeft",
			action: "decrement",
			required: false,
		},
		{
			orientation: "horizontal",
			focusLocation: "root",
			key: "ArrowRight",
			action: "increment",
			required: false,
		},
		{
			orientation: "vertical",
			focusLocation: "root",
			key: "ArrowUp",
			action: "decrement",
			required: false,
		},
		{
			orientation: "vertical",
			focusLocation: "root",
			key: "ArrowDown",
			action: "increment",
			required: false,
		},
		{
			orientation: "both",
			focusLocation: "root",
			key: "Home",
			action: "first-item",
			required: false,
		},
		{
			orientation: "both",
			focusLocation: "root",
			key: "End",
			action: "last-item",
			required: false,
		},
	],
	focusStrategy: "none",
	compound: false,
} as const;

export const contract: PrimitiveContract = parseContract(rawContract);
