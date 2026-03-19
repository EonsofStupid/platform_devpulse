/**
 * @file Combobox Component Contract — Gold Standard
 * @kind combobox
 * @layer components
 * @package @devpulse/coldlight
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * This is the GOLD STANDARD component contract. It implements:
 *
 * 1. WAI-ARIA APG Combobox Pattern (full keyboard + focus model)
 *    https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
 *
 * 2. WAI-ARIA 1.3 Working Draft (new attributes)
 *    https://w3c.github.io/aria/
 *    - aria-description: supplementary context on options
 *    - aria-details: multi-ID references for rich descriptions
 *
 * 3. WAI-Adapt Content Module (machine-readable semantics for AI/AT)
 *    https://w3c.github.io/adapt/
 *    - adapt-action: per-slot action purpose
 *    - adapt-purpose: input field purpose declaration
 *    - adapt-simplification: cognitive accessibility importance
 *
 * MeltUI transport adapter provides ARIA attributes for melt-managed slots.
 * ColdLight adds data-kind, data-slot, data-state, WAI-Adapt attributes.
 *
 * Compound component: root → (label + input + trigger + content → (group → option[]) + empty + announce)
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * Combobox component contract — compile-time enforced.
 *
 * Compound component with 9 slots (6 required, 3 optional):
 *   root     → wrapper div, structural container
 *   input    → role="combobox", text input with autocomplete
 *   trigger  → toggle button, opens/closes listbox
 *   content  → role="listbox", popup container
 *   option   → role="option", selectable items
 *   group    → role="group", grouped options with label
 *   label    → label element, associates with input
 *   empty    → no-results state, role="status" for live announcement
 *   announce → aria-live="polite" region for filtering result counts
 */
export const contract = {
	kind: "combobox",
	description:
		"Compound combobox with text input autocomplete, toggle trigger, floating listbox popup, selectable options with grouping support. MeltUI adapter provides ARIA, keyboard navigation, and focus management via aria-activedescendant. WAI-Adapt declares machine-readable action/purpose for AI agents.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/combobox/",

	// =========================================================================
	// SLOTS
	// =========================================================================

	slots: {
		required: ["root", "input", "trigger", "content", "option", "group"],
		optional: ["label", "empty", "announce"],
	},

	// =========================================================================
	// PER-SLOT CONTRACTS
	// =========================================================================

	slotContracts: {
		root: {
			name: "root",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "combobox",
				slot: "root",
				states: [],
			},
		},

		input: {
			name: "input",
			element: "input",
			aria: {
				role: "combobox",
				required: [
					{ attr: "aria-expanded", valueType: "aria-expanded" },
					{ attr: "aria-controls", valueType: "aria-controls" },
				],
				optional: [
					{ attr: "aria-activedescendant", valueType: "aria-activedescendant" },
					{ attr: "aria-autocomplete", valueType: "aria-autocomplete" },
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-labelledby", valueType: "aria-labelledby" },
					{ attr: "aria-describedby", valueType: "aria-describedby" },
					// ARIA 1.3 — supplementary description for richer context
					{ attr: "aria-description", valueType: "aria-description" },
				],
				relationships: [
					{ attr: "aria-controls", targetSlot: "content", required: true },
					{ attr: "aria-labelledby", targetSlot: "label", required: false },
				],
			},
			data: {
				kind: "combobox",
				slot: "input",
				states: ["open", "closed"],
			},
			keyboard: [
				{
					key: "ArrowDown",
					action: "open-or-next",
					description: "Open listbox or highlight next option",
				},
				{
					key: "ArrowUp",
					action: "open-or-prev",
					description: "Open listbox or highlight previous option",
				},
				{ key: "Enter", action: "select", description: "Select the currently highlighted option" },
				{ key: "Escape", action: "close", description: "Close the listbox popup" },
				{ key: "Home", action: "first", description: "Highlight the first option" },
				{ key: "End", action: "last", description: "Highlight the last option" },
				{
					key: "Tab",
					action: "accept-and-move",
					description: "Accept current selection and move focus out",
				},
			],
		},

		trigger: {
			name: "trigger",
			element: "button",
			aria: {
				role: "button",
				required: [],
				optional: [
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-expanded", valueType: "aria-expanded" },
				],
			},
			data: {
				kind: "combobox",
				slot: "trigger",
				states: ["open", "closed"],
			},
			keyboard: [
				{ key: "Enter", action: "toggle", description: "Toggle listbox open/closed" },
				{ key: "Space", action: "toggle", description: "Toggle listbox open/closed" },
			],
		},

		content: {
			name: "content",
			element: "div",
			aria: {
				role: "listbox",
				required: [],
				optional: [
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-labelledby", valueType: "aria-labelledby" },
					{ attr: "aria-multiselectable", valueType: "aria-multiselectable" },
				],
			},
			data: {
				kind: "combobox",
				slot: "content",
				states: ["open", "closed"],
			},
		},

		option: {
			name: "option",
			element: "div",
			aria: {
				role: "option",
				required: [{ attr: "aria-selected", valueType: "aria-selected" }],
				optional: [
					{ attr: "aria-disabled", valueType: "aria-disabled" },
					// ARIA 1.3 — supplementary description per option
					{ attr: "aria-description", valueType: "aria-description" },
					// ARIA 1.3 — multi-ID references for rich content
					{ attr: "aria-details", valueType: "aria-details" },
				],
			},
			data: {
				kind: "combobox",
				slot: "option",
				states: ["selected", "highlighted", "disabled"],
			},
		},

		group: {
			name: "group",
			element: "div",
			aria: {
				role: "group",
				required: [{ attr: "aria-labelledby", valueType: "aria-labelledby" }],
				optional: [],
				relationships: [{ attr: "aria-labelledby", targetSlot: "group-label", required: true }],
			},
			data: {
				kind: "combobox",
				slot: "group",
				states: [],
			},
		},

		label: {
			name: "label",
			element: "label",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "combobox",
				slot: "label",
				states: [],
			},
		},

		empty: {
			name: "empty",
			element: "div",
			aria: {
				role: "status",
				required: [],
				optional: [{ attr: "aria-live", valueType: "aria-live" }],
			},
			data: {
				kind: "combobox",
				slot: "empty",
				states: [],
			},
		},

		announce: {
			name: "announce",
			element: "div",
			aria: {
				required: [
					{ attr: "aria-live", valueType: "aria-live" },
					{ attr: "aria-atomic", valueType: "aria-atomic" },
				],
				optional: [],
			},
			data: {
				kind: "combobox",
				slot: "announce",
				states: [],
			},
		},
	},

	// =========================================================================
	// ACCESSIBLE NAME
	// =========================================================================

	accessibleName: {
		required: true,
		sources: ["aria-label", "aria-labelledby"],
		defaultSlot: "label",
	},

	// =========================================================================
	// FOCUS MANAGEMENT — APG: activedescendant
	// =========================================================================

	focus: {
		strategy: "activedescendant",
		initialFocus: "input",
		returnFocus: "input",
	},

	// =========================================================================
	// KEYBOARD MODEL — APG Combobox Pattern
	// =========================================================================

	keyboard: {
		global: [
			{
				key: "ArrowDown",
				action: "open-or-next",
				description: "Open listbox or highlight next option",
			},
			{
				key: "ArrowUp",
				action: "open-or-prev",
				description: "Open listbox or highlight previous option",
			},
			{ key: "Home", action: "first", description: "Highlight the first option" },
			{ key: "End", action: "last", description: "Highlight the last option" },
			{ key: "Enter", action: "select", description: "Select the currently highlighted option" },
			{ key: "Escape", action: "close", description: "Close the listbox popup" },
			{ key: "Tab", action: "accept-and-move", description: "Accept current value and move focus" },
		],
	},

	// =========================================================================
	// STATE SEMANTICS
	// =========================================================================

	states: {
		primary: "open",
		all: ["open", "closed", "selected", "highlighted", "disabled"],
		ariaMapping: {
			open: "aria-expanded",
			selected: "aria-selected",
			disabled: "aria-disabled",
		},
	},

	// =========================================================================
	// INTERACTION SEMANTICS
	// =========================================================================

	interactions: {
		modal: false,
		selectable: true,
		editable: true,
		expandable: true,
	},

	primitiveKind: "combobox",

	// =========================================================================
	// ARIA 1.3 — Spec version + new features
	// https://w3c.github.io/aria/
	// =========================================================================

	ariaVersion: "1.3",

	aria13: {
		attributes: ["aria-description", "aria-details"],
	},

	// =========================================================================
	// WAI-ADAPT — Machine-readable semantics for AI/AT
	// https://w3c.github.io/adapt/
	// =========================================================================

	waiAdapt: {
		action: "filter",
		purpose: "search-term",
		simplification: "critical",
		slotAdapt: {
			input: { action: "filter", purpose: "search-term" },
			trigger: { action: "open-listbox" },
			option: { action: "select" },
			empty: { action: "info" },
		},
	},

	// =========================================================================
	// LIVE REGIONS — Dynamic content announcements
	// =========================================================================

	liveRegions: [
		{
			slot: "announce",
			politeness: "polite",
			relevant: ["text"],
			atomic: true,
			announces: "Number of matching results after filtering (e.g., '5 results available')",
		},
		{
			slot: "empty",
			politeness: "polite",
			atomic: true,
			announces: "No results found message when filter produces zero matches",
		},
	],
} as const satisfies ComponentContract;
