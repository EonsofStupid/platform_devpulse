/**
 * @file Select Component Contract
 * @kind select
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * MeltUI transport adapter provides ARIA attributes for trigger/content/item slots.
 * ColdLight adds data-kind, data-slot, data-state.
 *
 * Reference: W3C WAI-ARIA APG Listbox Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * Select component contract — compile-time enforced.
 *
 * Compound component: root → (trigger + content → item[])
 * Optional slots: label, group.
 */
export const contract = {
	kind: "select",
	description:
		"Compound select/listbox component with trigger button, dropdown content, selectable items, and optional label and groups. MeltUI adapter provides ARIA and keyboard navigation.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/listbox/",

	slots: {
		required: ["root", "trigger", "content", "item"],
		optional: ["label", "group"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "select",
				slot: "root",
				states: [],
			},
		},
		trigger: {
			name: "trigger",
			element: "button",
			aria: {
				role: "combobox",
				required: [
					{ attr: "aria-expanded", valueType: "aria-expanded" },
					{ attr: "aria-haspopup", valueType: "aria-haspopup" },
				],
				optional: [
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-labelledby", valueType: "aria-labelledby" },
					{ attr: "aria-disabled", valueType: "aria-disabled" },
					{ attr: "aria-controls", valueType: "aria-controls" },
				],
			},
			data: {
				kind: "select",
				slot: "trigger",
				states: ["open", "closed"],
			},
			keyboard: [
				{
					key: "ArrowDown",
					action: "open-or-next",
					description: "Open listbox or move to next option",
				},
				{
					key: "ArrowUp",
					action: "open-or-prev",
					description: "Open listbox or move to previous option",
				},
				{ key: "Enter", action: "select", description: "Select focused option" },
				{ key: "Space", action: "select", description: "Select focused option" },
				{ key: "Escape", action: "close", description: "Close listbox" },
				{ key: "Home", action: "first", description: "Move to first option" },
				{ key: "End", action: "last", description: "Move to last option" },
				{ key: "Tab", action: "accept-and-move", description: "Accept and move focus" },
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
				],
			},
			data: {
				kind: "select",
				slot: "content",
				states: ["open", "closed"],
			},
		},
		item: {
			name: "item",
			element: "div",
			aria: {
				role: "option",
				required: [{ attr: "aria-selected", valueType: "aria-selected" }],
				optional: [{ attr: "aria-disabled", valueType: "aria-disabled" }],
			},
			data: {
				kind: "select",
				slot: "item",
				states: ["selected"],
			},
		},
		label: {
			name: "label",
			element: "span",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "select",
				slot: "label",
				states: [],
			},
		},
		group: {
			name: "group",
			element: "div",
			aria: {
				role: "group",
				required: [],
				optional: [{ attr: "aria-label", valueType: "aria-label" }],
			},
			data: {
				kind: "select",
				slot: "group",
				states: [],
			},
		},
	},

	accessibleName: {
		required: false,
		sources: ["aria-label", "aria-labelledby"],
		defaultSlot: "label",
	},

	focus: {
		strategy: "activedescendant",
	},

	keyboard: {
		global: [
			{
				key: "ArrowDown",
				action: "open-or-next",
				description: "Open listbox or move to next option",
			},
			{
				key: "ArrowUp",
				action: "open-or-prev",
				description: "Open listbox or move to previous option",
			},
			{ key: "Home", action: "first", description: "Move to first option" },
			{ key: "End", action: "last", description: "Move to last option" },
			{ key: "Enter", action: "select", description: "Select focused option" },
			{ key: "Space", action: "select", description: "Select focused option" },
			{ key: "Escape", action: "close", description: "Close listbox" },
			{ key: "Tab", action: "accept-and-move", description: "Accept and move focus" },
		],
	},

	states: {
		primary: "open",
		all: ["open", "closed", "selected", "disabled"],
		ariaMapping: {
			open: "aria-expanded",
			selected: "aria-selected",
			disabled: "aria-disabled",
		},
	},

	interactions: {
		modal: false,
		selectable: true,
		editable: false,
		expandable: true,
	},

	primitiveKind: "select",
} as const satisfies ComponentContract;
