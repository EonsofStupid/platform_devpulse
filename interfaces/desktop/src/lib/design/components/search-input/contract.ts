/**
 * @file Search Input Component Contract
 * @kind search-input
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * Reference: W3C WAI-ARIA search landmark + searchbox role.
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * SearchInput component contract — compile-time enforced.
 */
export const contract = {
	kind: "search-input",
	description:
		"Search input with search landmark, decorative icon, and clear button. Escape key clears value.",

	slots: {
		required: ["root", "input"],
		optional: ["icon", "clear"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "div",
			aria: {
				role: "search",
				required: [],
				optional: [{ attr: "aria-label", valueType: "aria-label" }],
			},
			data: {
				kind: "search-input",
				slot: "root",
				states: ["disabled"],
			},
		},
		input: {
			name: "input",
			element: "input",
			aria: {
				role: "searchbox",
				required: [],
				optional: [
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-describedby", valueType: "aria-describedby" },
					{ attr: "aria-disabled", valueType: "aria-disabled" },
				],
			},
			data: {
				kind: "search-input",
				slot: "input",
				states: ["focused", "focus-visible", "disabled"],
			},
			keyboard: [{ key: "Escape", action: "clear", description: "Clear search value" }],
		},
		icon: {
			name: "icon",
			element: "span",
			aria: {
				required: [],
				optional: [{ attr: "aria-hidden", valueType: "aria-hidden" }],
			},
			data: {
				kind: "search-input",
				slot: "icon",
				states: [],
			},
		},
		clear: {
			name: "clear",
			element: "button",
			aria: {
				required: [],
				optional: [
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-disabled", valueType: "aria-disabled" },
				],
			},
			data: {
				kind: "search-input",
				slot: "clear",
				states: ["hover", "focused", "focus-visible"],
			},
		},
	},

	accessibleName: {
		required: true,
		sources: ["aria-label", "aria-labelledby"],
		defaultSlot: "input",
	},

	focus: {
		strategy: "none",
	},

	keyboard: {
		global: [{ key: "Escape", action: "clear", description: "Clear search value" }],
	},

	states: {
		all: ["focused", "focus-visible", "hover", "disabled"],
		ariaMapping: {
			disabled: "aria-disabled",
		},
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: true,
		expandable: false,
	},

	primitiveKind: "search-input",
} as const satisfies ComponentContract;
