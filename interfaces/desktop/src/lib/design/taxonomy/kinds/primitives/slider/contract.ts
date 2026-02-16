/**
 * @file Slider Taxonomy Contract
 * @description ColdLight SSOT contract for the slider primitive.
 *
 * ariaStateProvider: "coldlight" — createSlider provides ARIA range widget + keyboard interaction.
 * 2-folder parity: taxonomy + primitive.
 *
 * Reference: W3C WAI-ARIA APG Slider Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/slider/
 *
 * WAI-ARIA: role="slider" on each thumb element.
 * Required: aria-valuenow, aria-valuemin, aria-valuemax.
 * Supports single and multi-thumb (range) configurations.
 * Keyboard: arrow keys for fine adjustment, Page/Home/End for coarse.
 */

import { type PrimitiveContract, parseContract } from "../../../primitive/contract.js";
import { sliderSlotStates } from "./types.js";

const rawContract = {
	kind: "slider",
	ariaStateProvider: "coldlight",
	slots: { required: ["root", "track", "range", "thumb"], optional: [], forbidden: [] },
	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: ["aria-label", "aria-orientation", "aria-disabled"] },
		},
		track: {
			element: "div",
			children: "snippet",
			aria: { role: "presentation", required: [], optional: [] },
		},
		range: {
			element: "div",
			children: "snippet",
			aria: { role: "presentation", required: [], optional: [] },
		},
		thumb: {
			element: "span",
			children: "snippet",
			aria: {
				role: "slider",
				required: ["aria-valuenow", "aria-valuemin", "aria-valuemax"],
				optional: ["aria-valuetext", "aria-label", "aria-labelledby", "aria-disabled"],
			},
		},
	},
	states: {
		shared: ["hover", "active", "focused", "focus-visible", "disabled"],
		specific: [],
	},
	slotStates: sliderSlotStates,
	slotActions: { root: [], track: [], range: [], thumb: ["increment", "decrement"] },
	aria: {
		role: "slider",
		requiredAttrs: ["aria-valuenow", "aria-valuemin", "aria-valuemax"],
		optionalAttrs: [
			"aria-valuetext",
			"aria-label",
			"aria-labelledby",
			"aria-orientation",
			"aria-disabled",
		],
	},
	keyboard: [
		"ArrowLeft",
		"ArrowRight",
		"ArrowUp",
		"ArrowDown",
		"Home",
		"End",
		"PageUp",
		"PageDown",
	],
	keyboardMap: [
		{
			orientation: "horizontal",
			focusLocation: "thumb",
			key: "ArrowRight",
			action: "increment",
			required: true,
		},
		{
			orientation: "horizontal",
			focusLocation: "thumb",
			key: "ArrowLeft",
			action: "decrement",
			required: true,
		},
		{
			orientation: "vertical",
			focusLocation: "thumb",
			key: "ArrowUp",
			action: "increment",
			required: true,
		},
		{
			orientation: "vertical",
			focusLocation: "thumb",
			key: "ArrowDown",
			action: "decrement",
			required: true,
		},
		{
			orientation: "both",
			focusLocation: "thumb",
			key: "Home",
			action: "first-item",
			required: true,
		},
		{
			orientation: "both",
			focusLocation: "thumb",
			key: "End",
			action: "last-item",
			required: true,
		},
		{
			orientation: "both",
			focusLocation: "thumb",
			key: "PageUp",
			action: "increment",
			required: false,
		},
		{
			orientation: "both",
			focusLocation: "thumb",
			key: "PageDown",
			action: "decrement",
			required: false,
		},
	],
	focusStrategy: "none",
	compound: true,
	orientation: "horizontal",
} as const;

export const contract: PrimitiveContract = parseContract(rawContract);
