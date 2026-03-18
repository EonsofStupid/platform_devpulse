/**
 * @file TableOfContents Component Contract
 * @kind table-of-contents
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape -- zero runtime overhead.
 *
 * Navigation list of document headings with active heading tracking.
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "table-of-contents",
	description:
		"Navigation list of document headings. Tracks the currently visible heading with aria-current=location. Uses nav + ol structure.",

	slots: {
		required: ["root"],
		optional: ["item", "link"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "nav",
			aria: {
				role: "navigation",
				required: [],
				optional: [
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-labelledby", valueType: "aria-labelledby" },
				],
			},
			data: {
				kind: "table-of-contents",
				slot: "root",
				states: [],
			},
		},
		item: {
			name: "item",
			element: "li",
			aria: {
				role: "none",
				required: [],
				optional: [{ attr: "aria-current", valueType: "aria-current" }],
			},
			data: {
				kind: "table-of-contents",
				slot: "item",
				states: ["active"],
			},
		},
		link: {
			name: "link",
			element: "a",
			aria: {
				role: "link",
				required: [],
				optional: [{ attr: "aria-current", valueType: "aria-current" }],
			},
			data: {
				kind: "table-of-contents",
				slot: "link",
				states: ["focused", "focus-visible", "active"],
			},
		},
	},

	accessibleName: {
		required: true,
		sources: ["aria-label", "aria-labelledby"],
		defaultSlot: "root",
	},

	focus: {
		strategy: "none",
	},

	keyboard: {
		global: [{ key: "Enter", action: "navigate", description: "Navigate to heading" }],
	},

	states: {
		all: ["focused", "focus-visible", "active"],
		ariaMapping: {
			active: "aria-current",
		},
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: false,
		expandable: false,
	},

	primitiveKind: "table-of-contents",
} as const satisfies ComponentContract;
