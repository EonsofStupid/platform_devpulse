/**
 * @file Progress Component Contract
 * @kind progress
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * Reference: W3C WAI-ARIA APG — Meter / Progressbar
 * https://www.w3.org/WAI/ARIA/apg/patterns/meter/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * Progress component contract — compile-time enforced.
 *
 * `satisfies ComponentContract` validates shape at compile time.
 * Progress uses role="progressbar" with required value attributes.
 */
export const contract = {
	kind: "progress",
	description:
		"Progress bar indicating completion status. Supports determinate (aria-valuenow) and indeterminate states. Uses role='progressbar' with required aria-valuemin, aria-valuemax, and aria-valuenow.",

	slots: {
		required: ["root"],
		optional: ["indicator"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "div",
			aria: {
				role: "progressbar",
				required: [
					{ attr: "aria-valuenow", valueType: "aria-valuenow" },
					{ attr: "aria-valuemin", valueType: "aria-valuemin" },
					{ attr: "aria-valuemax", valueType: "aria-valuemax" },
				],
				optional: [
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-labelledby", valueType: "aria-labelledby" },
					{ attr: "aria-valuetext", valueType: "aria-valuetext" },
				],
			},
			data: {
				kind: "progress",
				slot: "root",
				states: ["loading", "pending"],
			},
		},
		indicator: {
			name: "indicator",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "progress",
				slot: "indicator",
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
		all: ["loading", "pending"],
		ariaMapping: {},
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: false,
		expandable: false,
	},

	primitiveKind: "progress",
} as const satisfies ComponentContract;
