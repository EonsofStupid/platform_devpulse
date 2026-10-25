/**
 * @file Combobox Component Schema
 * @package @devpulse/coldlight
 *
 * FULL ARIA CONTRACT for the Combobox component.
 * AI-ready semantic description of all ARIA requirements.
 *
 * Reference: W3C WAI-ARIA APG Combobox Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
 */

import { contract as primitiveContract } from "$lib/design/taxonomy/kinds/primitives/combobox/contract.js";
import type { ComponentContract, ComponentSlotContract } from "../schema.js";
import { parseComponentContract, validateComponentContract } from "../schema.js";

// =============================================================================
// SLOT CONTRACTS — Full ARIA requirements per sub-component
// =============================================================================

/**
 * Combobox Root slot — renderless context provider.
 * No ARIA attributes — delegates to child slots.
 */
export const comboboxRootSlot: ComponentSlotContract = {
	name: "root",
	element: "fragment",
	aria: {
		role: undefined,
		required: [],
		optional: [],
		relationships: [],
	},
	data: {
		kind: "combobox",
		slot: "root",
		states: [],
	},
	keyboard: [],
};

/**
 * Combobox Input slot — main interactive element.
 *
 * APG Requirements:
 * - MUST have role="combobox"
 * - MUST have aria-expanded="true/false"
 * - MUST have aria-controls pointing to listbox
 * - MUST have aria-haspopup="listbox"
 * - MUST have aria-activedescendant when popup is open and item is highlighted
 * - SHOULD have aria-autocomplete to indicate filtering behavior
 */
export const comboboxInputSlot: ComponentSlotContract = {
	name: "input",
	element: "input",
	aria: {
		role: "combobox",
		required: [
			{ attr: "aria-expanded", valueType: "aria-expanded" },
			{ attr: "aria-controls", valueType: "aria-controls" },
			{ attr: "aria-haspopup", valueType: "aria-haspopup" },
		],
		optional: [
			{ attr: "aria-label", valueType: "aria-label" },
			{ attr: "aria-autocomplete", valueType: "aria-autocomplete" },
			{ attr: "aria-activedescendant", valueType: "aria-activedescendant" },
		],
		relationships: [
			{ attr: "aria-controls", targetSlot: "content", required: true },
			{ attr: "aria-activedescendant", targetSlot: "item", required: true },
		],
	},
	data: {
		kind: "combobox",
		slot: "input",
		states: ["focused", "focus-visible", "disabled"],
	},
	keyboard: [
		{
			key: "ArrowDown",
			action: "open",
			description: "When closed: opens popup and highlights first/last option",
		},
		{
			key: "ArrowUp",
			action: "open",
			description: "When closed: opens popup and highlights last option",
		},
		{
			key: "ArrowDown",
			action: "next-item",
			description: "When open: moves visual focus to next option",
		},
		{
			key: "ArrowUp",
			action: "prev-item",
			description: "When open: moves visual focus to previous option",
		},
		{ key: "Home", action: "first-item", description: "Moves visual focus to first option" },
		{ key: "End", action: "last-item", description: "Moves visual focus to last option" },
		{
			key: "Enter",
			action: "activate",
			description: "Selects highlighted option and closes popup",
		},
		{ key: "Escape", action: "close", description: "Closes popup without selecting" },
		{ key: "Tab", action: "exit", description: "Exits combobox (closes popup if open)" },
	],
};

/**
 * Combobox Trigger slot — optional button to toggle popup.
 * ARIA: role="button", aria-label required for icon-only buttons.
 */
export const comboboxTriggerSlot: ComponentSlotContract = {
	name: "trigger",
	element: "button",
	aria: {
		role: "button",
		required: [{ attr: "aria-label", valueType: "aria-label" }],
		optional: [{ attr: "aria-expanded", valueType: "aria-expanded" }],
		relationships: [],
	},
	data: {
		kind: "combobox",
		slot: "trigger",
		states: ["hover", "active", "disabled"],
	},
	keyboard: [
		{ key: "Enter", action: "toggle", description: "Toggle popup open/closed" },
		{ key: "Space", action: "toggle", description: "Toggle popup open/closed" },
	],
};

/**
 * Combobox Content slot — popup listbox container.
 *
 * APG Requirements:
 * - MUST have role="listbox"
 * - SHOULD have aria-label or aria-labelledby
 */
export const comboboxContentSlot: ComponentSlotContract = {
	name: "content",
	element: "div",
	aria: {
		role: "listbox",
		required: [],
		optional: [
			{ attr: "aria-label", valueType: "aria-label" },
			{ attr: "aria-labelledby", valueType: "aria-labelledby" },
		],
		relationships: [],
	},
	data: {
		kind: "combobox",
		slot: "content",
		states: ["open", "closed"],
	},
	keyboard: [],
};

/**
 * Combobox Item slot — selectable option.
 *
 * APG Requirements:
 * - MUST have role="option"
 * - MUST have aria-selected="true/false"
 * - MAY have aria-disabled
 */
export const comboboxItemSlot: ComponentSlotContract = {
	name: "item",
	element: "div",
	aria: {
		role: "option",
		required: [{ attr: "aria-selected", valueType: "aria-selected" }],
		optional: [{ attr: "aria-disabled", valueType: "aria-disabled" }],
		relationships: [],
	},
	data: {
		kind: "combobox",
		slot: "item",
		states: ["hover", "active", "focused", "focus-visible", "disabled", "selected", "checked"],
	},
	keyboard: [],
};

/**
 * Combobox Group slot — group of related options.
 * ARIA: role="group", aria-labelledby required.
 */
export const comboboxGroupSlot: ComponentSlotContract = {
	name: "group",
	element: "div",
	aria: {
		role: "group",
		required: [{ attr: "aria-labelledby", valueType: "aria-labelledby" }],
		optional: [{ attr: "aria-label", valueType: "aria-label" }],
		relationships: [],
	},
	data: {
		kind: "combobox",
		slot: "group",
		states: [],
	},
	keyboard: [],
};

/**
 * Combobox Empty slot — shown when no options match filter.
 * No ARIA — purely presentational feedback.
 */
export const comboboxEmptySlot: ComponentSlotContract = {
	name: "empty",
	element: "div",
	aria: {
		role: undefined,
		required: [],
		optional: [],
		relationships: [],
	},
	data: {
		kind: "combobox",
		slot: "empty",
		states: [],
	},
	keyboard: [],
};

// =============================================================================
// FULL COMPONENT CONTRACT — AI-introspectable semantic description
// =============================================================================

/**
 * Combobox Component Contract.
 *
 * Full ARIA semantics for AI agents to understand:
 * - What the component does (autocomplete/select with filtering)
 * - How to interact with it (keyboard, focus)
 * - What ARIA attributes MUST/SHOULD be present
 * - Relationship graph between slots
 */
const rawContract = {
	kind: "combobox",
	description:
		"Autocomplete input with filterable dropdown list. Combines text input with a popup listbox " +
		"for selecting from predefined options. Supports single selection with type-ahead filtering.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/combobox/",

	slots: {
		required: ["root", "input", "content"],
		optional: ["trigger", "item", "group", "empty"],
	},

	slotContracts: {
		root: comboboxRootSlot,
		input: comboboxInputSlot,
		trigger: comboboxTriggerSlot,
		content: comboboxContentSlot,
		item: comboboxItemSlot,
		group: comboboxGroupSlot,
		empty: comboboxEmptySlot,
	},

	accessibleName: {
		required: true,
		sources: ["aria-label", "aria-labelledby"],
		defaultSlot: "input",
	},

	focus: {
		strategy: "activedescendant",
		initialFocus: "input", // Focus stays on input
		returnFocus: undefined, // N/A — not a modal
		trapContainer: undefined, // No focus trap
	},

	keyboard: {
		global: [
			{
				key: "ArrowDown",
				action: "next-item",
				description: "Move visual focus to next option (or open popup if closed)",
			},
			{
				key: "ArrowUp",
				action: "prev-item",
				description: "Move visual focus to previous option (or open popup if closed)",
			},
			{ key: "Enter", action: "activate", description: "Select highlighted option" },
			{ key: "Escape", action: "close", description: "Close popup without selecting" },
			{ key: "Home", action: "first-item", description: "Move visual focus to first option" },
			{ key: "End", action: "last-item", description: "Move visual focus to last option" },
			{ key: "Tab", action: "exit", description: "Exit combobox (closes popup)" },
		],
	},

	states: {
		primary: "open",
		all: [
			"open",
			"closed",
			"hover",
			"active",
			"focused",
			"focus-visible",
			"disabled",
			"selected",
			"checked",
		],
		ariaMapping: {
			open: "aria-expanded",
			selected: "aria-selected",
		},
	},

	interactions: {
		modal: false,
		selectable: true,
		editable: true,
		expandable: true,
	},

	primitiveKind: "combobox",
} as const;

// =============================================================================
// VALIDATION — Ensure component contract matches primitive
// =============================================================================

export const contract: ComponentContract = parseComponentContract(rawContract);

// Validate against primitive contract at import time
const validation = validateComponentContract(contract, primitiveContract);
if (!validation.valid) {
	console.error("[Combobox Component Schema] Validation errors:", validation.errors);
}
