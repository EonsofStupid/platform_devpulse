/**
 * @file LoadingOverlay Component Contract
 * @kind loading-overlay
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * LoadingOverlay uses role="alert" with aria-busy="true" when visible.
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "loading-overlay",
	description:
		"Full-area loading overlay with role='alert' and aria-busy. Covers content with a semi-transparent backdrop, spinner, and optional label. Hidden when not visible.",

	slots: {
		required: ["root"],
		optional: ["spinner", "label"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "div",
			aria: {
				role: "alert",
				required: [],
				optional: [
					{ attr: "aria-busy", valueType: "aria-busy" },
					{ attr: "aria-label", valueType: "aria-label" },
				],
			},
			data: {
				kind: "loading-overlay",
				slot: "root",
				states: ["visible", "hidden"],
			},
		},
		spinner: {
			name: "spinner",
			element: "div",
			aria: {
				required: [],
				optional: [{ attr: "aria-hidden", valueType: "aria-hidden" }],
			},
			data: {
				kind: "loading-overlay",
				slot: "spinner",
				states: [],
			},
		},
		label: {
			name: "label",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "loading-overlay",
				slot: "label",
				states: [],
			},
		},
	},

	accessibleName: {
		required: false,
		sources: ["aria-label"],
	},

	focus: {
		strategy: "none",
	},

	keyboard: {
		global: [],
	},

	states: {
		all: ["visible", "hidden"],
		ariaMapping: {
			visible: "aria-busy",
		},
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: false,
		expandable: false,
	},

	primitiveKind: "loading-overlay",
} as const satisfies ComponentContract;
