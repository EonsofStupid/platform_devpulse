/**
 * @file PinInput Taxonomy Contract
 * @description ColdLight SSOT contract for the pin-input primitive.
 *
 * ariaStateProvider: "coldlight" — createPinInput provides auto-advance, backspace navigation, and paste handling.
 * 2-folder parity: taxonomy + primitive.
 *
 * WAI-ARIA: Group of individual text inputs for one-time passwords or PIN codes.
 * role="group" on root container with aria-label for accessible name.
 */

import { type PrimitiveContract, parseContract } from "../../../schema.js";
import { pinInputSlotStates } from "./types.js";

const rawContract = {
	kind: "pin-input",
	ariaStateProvider: "coldlight",
	slots: { required: ["root", "input"], optional: [], forbidden: [] },
	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: {
				role: "group",
				required: [],
				optional: ["aria-label", "aria-labelledby", "aria-describedby", "aria-disabled"],
			},
		},
		input: {
			element: "input",
			children: "self-closing",
			aria: { required: [], optional: ["aria-label", "aria-invalid", "aria-disabled"] },
		},
	},
	states: {
		shared: ["focused", "focus-visible", "disabled"],
		specific: ["invalid", "valid"],
	},
	slotStates: pinInputSlotStates,
	slotActions: { root: [], input: ["focus"] },
	aria: {
		role: "group",
		requiredAttrs: [],
		optionalAttrs: [
			"aria-label",
			"aria-labelledby",
			"aria-describedby",
			"aria-disabled",
			"aria-invalid",
		],
	},
	keyboard: ["ArrowLeft", "ArrowRight", "Backspace", "Delete"],
	keyboardMap: [
		{
			orientation: "horizontal",
			focusLocation: "input",
			key: "ArrowRight",
			action: "next-item",
			required: true,
		},
		{
			orientation: "horizontal",
			focusLocation: "input",
			key: "ArrowLeft",
			action: "prev-item",
			required: true,
		},
		{
			orientation: "horizontal",
			focusLocation: "input",
			key: "Backspace",
			action: "delete",
			required: true,
		},
		{
			orientation: "horizontal",
			focusLocation: "input",
			key: "Delete",
			action: "delete",
			required: true,
		},
	],
	focusStrategy: "none",
	compound: true,
} as const;

export const contract: PrimitiveContract = parseContract(rawContract);
