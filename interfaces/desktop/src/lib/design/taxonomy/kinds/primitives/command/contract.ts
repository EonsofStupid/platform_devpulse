/**
 * @file Command Taxonomy Contract
 * @description ColdLight SSOT contract for the command primitive.
 *
 * ariaStateProvider: "coldlight" — native combobox/listbox pattern with activedescendant focus.
 * 2-folder parity: taxonomy + primitive.
 *
 * Reference: W3C WAI-ARIA APG Combobox Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
 *
 * WAI-ARIA: role="combobox" root with searchbox input and listbox results.
 * Activedescendant focus for keyboard navigation through filtered items.
 * Supports grouping, empty state, and separator slots.
 */

import { type PrimitiveContract, parseContract } from "../../../primitive/contract.js";
import { commandSlotStates } from "./types.js";

const rawContract = {
	kind: "command",
	ariaStateProvider: "coldlight",
	slots: {
		required: ["root", "input", "list"],
		optional: ["group", "item", "empty", "separator"],
		forbidden: [],
	},
	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: {
				role: "combobox",
				required: ["aria-expanded"],
				optional: ["aria-label", "aria-haspopup"],
			},
		},
		input: {
			element: "input",
			children: "self-closing",
			aria: {
				role: "searchbox",
				required: [],
				optional: ["aria-label", "aria-autocomplete", "aria-controls", "aria-activedescendant"],
			},
		},
		list: {
			element: "div",
			children: "snippet",
			aria: { role: "listbox", required: [], optional: ["aria-label"] },
		},
		group: {
			element: "div",
			children: "snippet",
			aria: { role: "group", required: [], optional: ["aria-label", "aria-labelledby"] },
		},
		item: {
			element: "div",
			children: "snippet",
			aria: {
				role: "option",
				required: [],
				optional: ["aria-label", "aria-disabled", "aria-selected"],
			},
		},
		empty: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
		separator: {
			element: "div",
			children: "snippet",
			aria: { role: "separator", required: [], optional: [] },
		},
	},
	slotRelationships: [
		{ sourceSlot: "input", attribute: "aria-controls", targetSlot: "list", required: true },
		{
			sourceSlot: "input",
			attribute: "aria-activedescendant",
			targetSlot: "item",
			required: false,
		},
	],
	states: {
		shared: ["hover", "active", "focused", "focus-visible", "disabled"],
		specific: ["selected"],
	},
	slotStates: commandSlotStates,
	slotActions: {
		root: [],
		input: ["filter", "clear"],
		list: [],
		group: [],
		item: ["select"],
		empty: [],
		separator: [],
	},
	aria: {
		role: "combobox",
		requiredAttrs: ["aria-expanded"],
		optionalAttrs: [
			"aria-label",
			"aria-haspopup",
			"aria-autocomplete",
			"aria-controls",
			"aria-activedescendant",
			"aria-selected",
			"aria-disabled",
		],
	},
	keyboard: ["ArrowUp", "ArrowDown", "Enter", "Escape", "Home", "End"],
	keyboardMap: [
		{
			orientation: "vertical",
			focusLocation: "input",
			key: "ArrowDown",
			action: "next-item",
			required: true,
		},
		{
			orientation: "vertical",
			focusLocation: "input",
			key: "ArrowUp",
			action: "prev-item",
			required: true,
		},
		{ orientation: "both", focusLocation: "input", key: "Enter", action: "select", required: true },
		{ orientation: "both", focusLocation: "input", key: "Escape", action: "close", required: true },
		{
			orientation: "both",
			focusLocation: "input",
			key: "Home",
			action: "first-item",
			required: false,
		},
		{
			orientation: "both",
			focusLocation: "input",
			key: "End",
			action: "last-item",
			required: false,
		},
	],
	focusStrategy: "activedescendant",
	focus: {
		strategy: "activedescendant",
		wrapAround: true,
	},
	compound: true,
	filtering: {
		enabled: true,
		mode: "contains",
		typeahead: true,
	},
} as const;

export const contract: PrimitiveContract = parseContract(rawContract);
