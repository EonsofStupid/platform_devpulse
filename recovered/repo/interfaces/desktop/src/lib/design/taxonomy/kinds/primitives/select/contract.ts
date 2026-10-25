/**
 * @file Select Taxonomy Contract
 * @description ColdLight SSOT contract for the select primitive.
 *
 * ariaStateProvider: "coldlight" — dsAdapter (createSelect) provides ARIA + state.
 * 3-folder parity: taxonomy + adapter + primitive.
 *
 * Reference: W3C WAI-ARIA APG Listbox Pattern (Select = popup listbox)
 * https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
 *
 * Dropdown selection with listbox keyboard navigation and type-ahead.
 */

import { type PrimitiveContract, parseContract } from "../../../schema.js";
import { selectSlotStates } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/**
 * Select primitive contract — ColdLight SSOT
 *
 * Validated at import time via Zod. Invalid contracts fail hard.
 */
const rawContract = {
	kind: "select",
	ariaStateProvider: "coldlight",

	// ═══ SLOTS ═══════════════════════════════════════════════════════════════
	slots: {
		required: ["root", "trigger", "content", "item"],
		optional: ["value", "viewport", "item-text", "group", "label", "separator"],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "fragment",
			children: "renderless",
			aria: { required: [], optional: [] },
		},
		trigger: {
			element: "button",
			children: "snippet",
			aria: {
				role: "combobox",
				required: ["aria-expanded", "aria-haspopup", "aria-controls"],
				optional: ["aria-label", "aria-labelledby", "aria-disabled", "aria-activedescendant"],
			},
		},
		value: {
			element: "span",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
		content: {
			element: "div",
			children: "snippet",
			aria: {
				role: "listbox",
				required: [],
				optional: ["aria-label", "aria-labelledby", "aria-multiselectable"],
			},
		},
		viewport: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
		item: {
			element: "div",
			children: "snippet",
			aria: {
				role: "option",
				required: ["aria-selected"],
				optional: ["aria-disabled"],
			},
		},
		"item-text": {
			element: "span",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
		group: {
			element: "div",
			children: "snippet",
			aria: {
				role: "group",
				required: ["aria-labelledby"],
				optional: [],
			},
		},
		label: {
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

	// ═══ SLOT RELATIONSHIPS (APG requirement) ════════════════════════════════
	slotRelationships: [
		// trigger aria-controls → content (listbox)
		{ sourceSlot: "trigger", attribute: "aria-controls", targetSlot: "content", required: true },
		// trigger aria-activedescendant → item (visual focus)
		{
			sourceSlot: "trigger",
			attribute: "aria-activedescendant",
			targetSlot: "item",
			required: true,
		},
		// group aria-labelledby → label
		{ sourceSlot: "group", attribute: "aria-labelledby", targetSlot: "label", required: false },
	],

	// ═══ STATE ═══════════════════════════════════════════════════════════════
	states: {
		shared: ["focused", "focus-visible", "focus-within", "hover", "active", "disabled"],
		specific: ["open", "selected", "hidden", "visible"],
	},
	slotStates: selectSlotStates,
	slotActions: {
		root: [],
		trigger: ["open", "close", "toggle"],
		value: [],
		content: [],
		viewport: [],
		item: ["select"],
		"item-text": [],
		group: [],
		label: [],
		separator: [],
	},

	// ═══ ARIA ════════════════════════════════════════════════════════════════
	aria: {
		role: "listbox",
		requiredAttrs: ["aria-expanded", "aria-selected", "aria-controls"],
		optionalAttrs: [
			"aria-activedescendant",
			"aria-label",
			"aria-labelledby",
			"aria-disabled",
			"aria-describedby",
			"aria-orientation",
		],
	},

	// ═══ KEYBOARD (Legacy flat array) ════════════════════════════════════════
	keyboard: ["ArrowUp", "ArrowDown", "Enter", "Space", "Escape", "Home", "End", "Tab"],

	// ═══ KEYBOARD MAP (APG-compliant context-aware) ══════════════════════════
	keyboardMap: [
		// When closed - open on arrow/space/enter
		{
			orientation: "vertical",
			focusLocation: "trigger",
			key: "ArrowDown",
			action: "open",
			required: true,
		},
		{
			orientation: "vertical",
			focusLocation: "trigger",
			key: "ArrowUp",
			action: "open",
			required: true,
		},
		{
			orientation: "vertical",
			focusLocation: "trigger",
			key: "Space",
			action: "open",
			required: true,
		},
		{
			orientation: "vertical",
			focusLocation: "trigger",
			key: "Enter",
			action: "open",
			required: true,
		},
		// When open - navigation
		{
			orientation: "vertical",
			focusLocation: "trigger",
			key: "ArrowDown",
			action: "next-item",
			required: true,
		},
		{
			orientation: "vertical",
			focusLocation: "trigger",
			key: "ArrowUp",
			action: "prev-item",
			required: true,
		},
		{
			orientation: "vertical",
			focusLocation: "trigger",
			key: "Home",
			action: "first-item",
			required: true,
		},
		{
			orientation: "vertical",
			focusLocation: "trigger",
			key: "End",
			action: "last-item",
			required: true,
		},
		// Selection and dismissal
		{
			orientation: "both",
			focusLocation: "trigger",
			key: "Enter",
			action: "activate",
			required: true,
		},
		{
			orientation: "both",
			focusLocation: "trigger",
			key: "Space",
			action: "activate",
			required: true,
		},
		{
			orientation: "both",
			focusLocation: "trigger",
			key: "Escape",
			action: "close",
			required: true,
		},
		{ orientation: "both", focusLocation: "trigger", key: "Tab", action: "exit", required: true },
	],

	// ═══ FOCUS (Legacy) ══════════════════════════════════════════════════════
	focusStrategy: "activedescendant",

	// ═══ FOCUS (Detailed spec) ═══════════════════════════════════════════════
	focus: {
		strategy: "activedescendant", // DOM focus stays on trigger, visual focus in listbox
		onEscape: "return-to-trigger",
		tabBehavior: "exit-on-boundary",
	},

	// ═══ SELECTION MODEL (APG) ═══════════════════════════════════════════════
	selection: {
		type: "single", // Standard select is single-select (multiselectable is optional)
		selectionFollowsFocus: false, // Highlight vs select are separate actions
	},

	// ═══ BEHAVIOR ════════════════════════════════════════════════════════════
	compound: true,
	orientation: "vertical",
	dismissBehavior: { escape: true, outsideClick: true },
} as const;

// ═══ VALIDATION ══════════════════════════════════════════════════════════════
// This runs at import time. Invalid contract = build fails.
export const contract: PrimitiveContract = parseContract(rawContract);
