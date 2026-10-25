/**
 * @file Combobox Taxonomy Contract
 * @description ColdLight SSOT contract for the combobox primitive.
 *
 * ariaStateProvider: "meltui" — createCombobox provides ARIA roles, keyboard nav, and filtering.
 * 3-folder parity: taxonomy + adapter + primitive.
 *
 * Reference: W3C WAI-ARIA APG Combobox Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
 *
 * WAI-ARIA: Combobox pattern. role="combobox" on input, role="listbox" on content.
 * Keyboard: ArrowUp/Down to navigate, Enter to select, Escape to close.
 * Root is renderless (fragment). Input is self-closing.
 */

import { type PrimitiveContract, parseContract } from "../../../schema.js";
import { comboboxSlotStates } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/**
 * Combobox primitive contract — ColdLight SSOT
 *
 * Validated at import time via Zod. Invalid contracts fail hard.
 */
const rawContract = {
	kind: "combobox",
	ariaStateProvider: "meltui",

	// ═══ SLOTS ═══════════════════════════════════════════════════════════════
	slots: {
		required: ["root", "input", "content"],
		optional: ["trigger", "item", "group", "empty"],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "fragment",
			children: "renderless",
			aria: { required: [], optional: [] },
		},
		input: {
			element: "input",
			children: "self-closing",
			aria: {
				role: "combobox",
				required: ["aria-expanded", "aria-controls", "aria-haspopup"],
				optional: ["aria-label", "aria-autocomplete", "aria-activedescendant"],
			},
		},
		trigger: {
			element: "button",
			children: "snippet",
			aria: {
				role: "button",
				required: ["aria-label"],
				optional: ["aria-expanded"],
			},
		},
		content: {
			element: "div",
			children: "snippet",
			aria: {
				role: "listbox",
				required: [],
				optional: ["aria-label", "aria-labelledby"],
			},
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
		group: {
			element: "div",
			children: "snippet",
			aria: {
				role: "group",
				required: ["aria-labelledby"],
				optional: ["aria-label"],
			},
		},
		empty: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
	},

	// ═══ SLOT RELATIONSHIPS (APG requirement) ════════════════════════════════
	slotRelationships: [
		// input aria-controls → content (listbox) - REQUIRED per APG
		{ sourceSlot: "input", attribute: "aria-controls", targetSlot: "content", required: true },
		// input aria-activedescendant → item (visual focus) - REQUIRED when using activedescendant
		{ sourceSlot: "input", attribute: "aria-activedescendant", targetSlot: "item", required: true },
		// group aria-labelledby → group label element
		{ sourceSlot: "group", attribute: "aria-labelledby", targetSlot: "group", required: false },
	],

	// ═══ STATE ═══════════════════════════════════════════════════════════════
	states: {
		shared: ["hover", "active", "focused", "focus-visible", "disabled"],
		specific: ["open", "closed", "selected", "checked"],
	},
	slotStates: comboboxSlotStates,
	slotActions: {
		root: [],
		input: ["filter", "clear"],
		trigger: ["open", "close", "toggle"],
		content: [],
		item: ["select"],
		group: [],
		empty: [],
	},

	// ═══ ARIA ════════════════════════════════════════════════════════════════
	aria: {
		role: "combobox",
		requiredAttrs: ["aria-expanded", "aria-controls", "aria-haspopup"],
		optionalAttrs: [
			"aria-label",
			"aria-autocomplete",
			"aria-activedescendant",
			"aria-selected",
			"aria-disabled",
		],
	},

	// ═══ KEYBOARD (Legacy flat array) ════════════════════════════════════════
	keyboard: ["ArrowUp", "ArrowDown", "Enter", "Escape", "Home", "End", "Tab"],

	// ═══ KEYBOARD MAP (APG-compliant context-aware) ══════════════════════════
	keyboardMap: [
		// When popup is closed
		{
			orientation: "vertical",
			focusLocation: "input",
			key: "ArrowDown",
			action: "open",
			required: true,
		},
		{
			orientation: "vertical",
			focusLocation: "input",
			key: "ArrowUp",
			action: "open",
			required: true,
		},
		// When popup is open - navigation
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
		{
			orientation: "vertical",
			focusLocation: "input",
			key: "Home",
			action: "first-item",
			required: true,
		},
		{
			orientation: "vertical",
			focusLocation: "input",
			key: "End",
			action: "last-item",
			required: true,
		},
		// Selection and dismissal
		{
			orientation: "both",
			focusLocation: "input",
			key: "Enter",
			action: "activate",
			required: true,
		},
		{ orientation: "both", focusLocation: "input", key: "Escape", action: "close", required: true },
		// Tab exits the combobox (does not cycle)
		{ orientation: "both", focusLocation: "input", key: "Tab", action: "exit", required: true },
	],

	// ═══ FOCUS (Legacy) ══════════════════════════════════════════════════════
	focusStrategy: "activedescendant",

	// ═══ FOCUS (Detailed spec) ═══════════════════════════════════════════════
	focus: {
		strategy: "activedescendant", // DOM focus stays on input, visual focus via aria-activedescendant
		onEscape: "close-only", // Close popup, keep input value
		tabBehavior: "exit-on-boundary", // Tab exits combobox entirely
	},

	// ═══ SELECTION MODEL (APG) ═══════════════════════════════════════════════
	selection: {
		type: "single", // Standard combobox is single-select
		selectionFollowsFocus: false, // Arrow keys highlight, Enter selects
	},

	// ═══ FILTERING (Combobox-specific) ═══════════════════════════════════════
	filtering: {
		enabled: true,
		mode: "contains", // Default: substring match
		typeahead: true, // Printable characters filter options
	},

	// ═══ BEHAVIOR ════════════════════════════════════════════════════════════
	compound: true,
	orientation: "vertical",
} as const;

// ═══ VALIDATION ══════════════════════════════════════════════════════════════
// This runs at import time. Invalid contract = build fails.
export const contract: PrimitiveContract = parseContract(rawContract);
