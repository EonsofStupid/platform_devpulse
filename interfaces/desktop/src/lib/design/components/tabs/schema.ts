/**
 * @file Tabs Component Schema
 * @package @devpulse/coldlight
 *
 * FULL ARIA CONTRACT for the Tabs component.
 * AI-ready semantic description of all ARIA requirements.
 *
 * Reference: W3C WAI-ARIA APG Tabs Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 */

import { contract as primitiveContract } from "$lib/design/taxonomy/kinds/primitives/tabs/contract.js";
import type { ComponentContract, ComponentSlotContract } from "../schema.js";
import { parseComponentContract, validateComponentContract } from "../schema.js";

// =============================================================================
// SLOT CONTRACTS — Full ARIA requirements per sub-component
// =============================================================================

/**
 * Tabs Root slot — container element.
 * No ARIA — purely structural container.
 */
export const tabsRootSlot: ComponentSlotContract = {
	name: "root",
	element: "div",
	aria: {
		role: undefined,
		required: [],
		optional: [],
		relationships: [],
	},
	data: {
		kind: "tabs",
		slot: "root",
		states: [],
	},
	keyboard: [],
};

/**
 * Tabs List slot — tablist container.
 *
 * APG Requirements:
 * - MUST have role="tablist"
 * - MUST have aria-orientation ("horizontal" or "vertical")
 * - SHOULD have aria-label or aria-labelledby for accessible name
 */
export const tabsListSlot: ComponentSlotContract = {
	name: "list",
	element: "div",
	aria: {
		role: "tablist",
		required: [{ attr: "aria-orientation", valueType: "aria-orientation" }],
		optional: [
			{ attr: "aria-label", valueType: "aria-label" },
			{ attr: "aria-labelledby", valueType: "aria-labelledby" },
		],
		relationships: [],
	},
	data: {
		kind: "tabs",
		slot: "list",
		states: ["focus-within"],
	},
	keyboard: [],
};

/**
 * Tabs Trigger slot — individual tab button.
 *
 * APG Requirements:
 * - MUST have role="tab"
 * - MUST have aria-selected="true/false"
 * - MUST have aria-controls pointing to associated tabpanel
 * - MAY have aria-disabled for disabled tabs
 */
export const tabsTriggerSlot: ComponentSlotContract = {
	name: "trigger",
	element: "button",
	aria: {
		role: "tab",
		required: [
			{ attr: "aria-selected", valueType: "aria-selected" },
			{ attr: "aria-controls", valueType: "aria-controls" },
		],
		optional: [{ attr: "aria-disabled", valueType: "aria-disabled" }],
		relationships: [{ attr: "aria-controls", targetSlot: "content", required: true }],
	},
	data: {
		kind: "tabs",
		slot: "trigger",
		states: ["selected", "focused", "focus-visible", "hover", "active", "disabled"],
	},
	keyboard: [
		{
			key: "ArrowRight",
			action: "next-item",
			description: "Move focus to next tab (horizontal orientation)",
		},
		{
			key: "ArrowLeft",
			action: "prev-item",
			description: "Move focus to previous tab (horizontal orientation)",
		},
		{
			key: "ArrowDown",
			action: "next-item",
			description: "Move focus to next tab (vertical orientation)",
		},
		{
			key: "ArrowUp",
			action: "prev-item",
			description: "Move focus to previous tab (vertical orientation)",
		},
		{ key: "Home", action: "first-item", description: "Move focus to first tab" },
		{ key: "End", action: "last-item", description: "Move focus to last tab" },
		{
			key: "Enter",
			action: "activate",
			description: "Activate focused tab (manual activation mode)",
		},
		{
			key: "Space",
			action: "activate",
			description: "Activate focused tab (manual activation mode)",
		},
	],
};

/**
 * Tabs Content slot — tabpanel container.
 *
 * APG Requirements:
 * - MUST have role="tabpanel"
 * - MUST have aria-labelledby pointing to associated tab
 * - MAY have aria-hidden when not active (if DOM is preserved)
 */
export const tabsContentSlot: ComponentSlotContract = {
	name: "content",
	element: "div",
	aria: {
		role: "tabpanel",
		required: [{ attr: "aria-labelledby", valueType: "aria-labelledby" }],
		optional: [{ attr: "aria-hidden", valueType: "aria-hidden" }],
		relationships: [{ attr: "aria-labelledby", targetSlot: "trigger", required: true }],
	},
	data: {
		kind: "tabs",
		slot: "content",
		states: ["hidden", "visible"],
	},
	keyboard: [],
};

// =============================================================================
// FULL COMPONENT CONTRACT — AI-introspectable semantic description
// =============================================================================

/**
 * Tabs Component Contract.
 *
 * Full ARIA semantics for AI agents to understand:
 * - What the component does (tabbed interface for switching content panels)
 * - How to interact with it (keyboard, focus)
 * - What ARIA attributes MUST/SHOULD be present
 * - Relationship graph between slots
 */
const rawContract = {
	kind: "tabs",
	description:
		"Tabbed interface for organizing content into separate panels. Only one panel is visible at a time. " +
		"Tabs use roving tabindex for keyboard navigation within the tab list. " +
		"Supports automatic activation (focus follows selection) or manual activation (Enter/Space to select).",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/tabs/",

	slots: {
		required: ["root", "list", "trigger", "content"],
		optional: [],
	},

	slotContracts: {
		root: tabsRootSlot,
		list: tabsListSlot,
		trigger: tabsTriggerSlot,
		content: tabsContentSlot,
	},

	accessibleName: {
		required: true,
		sources: ["aria-label", "aria-labelledby"],
		defaultSlot: "list",
	},

	focus: {
		strategy: "roving",
		initialFocus: undefined, // First/selected tab
		returnFocus: undefined, // N/A — not a modal
		trapContainer: undefined, // No focus trap — Tab exits
	},

	keyboard: {
		global: [
			{
				key: "ArrowRight",
				action: "next-item",
				description: "Move focus to next tab (wraps at end)",
			},
			{
				key: "ArrowLeft",
				action: "prev-item",
				description: "Move focus to previous tab (wraps at start)",
			},
			{
				key: "ArrowDown",
				action: "next-item",
				description: "Move focus to next tab (vertical orientation)",
			},
			{
				key: "ArrowUp",
				action: "prev-item",
				description: "Move focus to previous tab (vertical orientation)",
			},
			{ key: "Home", action: "first-item", description: "Move focus to first tab" },
			{ key: "End", action: "last-item", description: "Move focus to last tab" },
		],
	},

	states: {
		primary: "selected",
		all: [
			"selected",
			"hidden",
			"visible",
			"focused",
			"focus-visible",
			"focus-within",
			"hover",
			"active",
			"disabled",
		],
		ariaMapping: {
			selected: "aria-selected",
			hidden: "aria-hidden",
		},
	},

	interactions: {
		modal: false,
		selectable: true,
		editable: false,
		expandable: false,
	},

	primitiveKind: "tabs",
} as const;

// =============================================================================
// VALIDATION — Ensure component contract matches primitive
// =============================================================================

export const contract: ComponentContract = parseComponentContract(rawContract);

// Validate against primitive contract at import time
const validation = validateComponentContract(contract, primitiveContract);
if (!validation.valid) {
	console.error("[Tabs Component Schema] Validation errors:", validation.errors);
}
