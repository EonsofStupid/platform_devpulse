/**
 * @file Sidebar Component Contract
 * @kind sidebar
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * Side navigation panel with expand/collapse toggle.
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * Sidebar component contract — compile-time enforced.
 *
 * `satisfies ComponentContract` validates shape at compile time.
 */
export const contract = {
	kind: "sidebar",
	description:
		"Side navigation panel with expand/collapse toggle. Contains header, content, and footer sub-slots with aria-expanded state management.",

	slots: {
		required: ["root"],
		optional: ["trigger", "header", "content", "footer"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "aside",
			aria: {
				role: "navigation",
				required: [],
				optional: [
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-labelledby", valueType: "aria-labelledby" },
				],
			},
			data: {
				kind: "sidebar",
				slot: "root",
				states: ["expanded", "collapsed"],
			},
		},
		trigger: {
			name: "trigger",
			element: "button",
			aria: {
				role: "button",
				required: [],
				optional: [
					{ attr: "aria-expanded", valueType: "aria-expanded" },
					{ attr: "aria-controls", valueType: "aria-controls" },
				],
			},
			data: {
				kind: "sidebar",
				slot: "trigger",
				states: ["expanded", "collapsed"],
			},
		},
		header: {
			name: "header",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "sidebar",
				slot: "header",
				states: [],
			},
		},
		content: {
			name: "content",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "sidebar",
				slot: "content",
				states: [],
			},
		},
		footer: {
			name: "footer",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "sidebar",
				slot: "footer",
				states: [],
			},
		},
	},

	accessibleName: {
		required: true,
		sources: ["aria-label", "aria-labelledby"],
	},

	focus: {
		strategy: "none",
	},

	keyboard: {
		global: [],
	},

	states: {
		primary: "expanded",
		all: ["expanded", "collapsed"],
		ariaMapping: {
			expanded: "aria-expanded",
		},
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: false,
		expandable: true,
	},

	primitiveKind: "sidebar",
} as const satisfies ComponentContract;
