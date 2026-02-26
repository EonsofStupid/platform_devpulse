/**
 * @file NavItem Component Contract
 * @kind nav-item
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape -- zero runtime overhead.
 *
 * Reference: W3C WAI-ARIA APG Landmarks
 * https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "nav-item",
	description:
		"Navigation link item. Supports active (aria-current=page) and disabled states. Child of Nav.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/",

	slots: {
		required: ["root"],
		optional: [],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "a",
			aria: {
				role: "link",
				required: [],
				optional: [
					{ attr: "aria-current", valueType: "aria-current" },
					{ attr: "aria-disabled", valueType: "aria-disabled" },
				],
			},
			data: {
				kind: "nav-item",
				slot: "root",
				states: ["active", "focused", "focus-visible", "hover", "disabled"],
			},
			keyboard: [
				{ key: "Enter", action: "navigate", description: "Follow the link" },
			],
		},
	},

	accessibleName: {
		required: true,
		sources: ["content", "aria-label"],
	},

	focus: {
		strategy: "none",
	},

	keyboard: {
		global: [
			{ key: "Enter", action: "navigate", description: "Follow the link" },
		],
	},

	states: {
		all: ["active", "focused", "focus-visible", "hover", "disabled"],
		ariaMapping: {
			active: "aria-current",
			disabled: "aria-disabled",
		},
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: false,
		expandable: false,
	},

	primitiveKind: "nav-item",
} as const satisfies ComponentContract;
