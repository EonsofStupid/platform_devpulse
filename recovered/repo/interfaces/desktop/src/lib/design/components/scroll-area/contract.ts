/**
 * @file ScrollArea Component Contract
 * @kind scroll-area
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * Custom scrollbar container with viewport, scrollbar track, and thumb.
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * ScrollArea component contract — compile-time enforced.
 *
 * `satisfies ComponentContract` validates shape at compile time.
 */
export const contract = {
	kind: "scroll-area",
	description:
		"Custom scrollbar container with accessible viewport region, scrollbar track, and draggable thumb. Supports vertical and horizontal orientations.",

	slots: {
		required: ["root", "viewport"],
		optional: ["scrollbar", "thumb"],
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
				kind: "scroll-area",
				slot: "root",
				states: [],
			},
		},
		viewport: {
			name: "viewport",
			element: "div",
			aria: {
				role: "region",
				required: [],
				optional: [{ attr: "aria-label", valueType: "aria-label" }],
			},
			data: {
				kind: "scroll-area",
				slot: "viewport",
				states: [],
			},
		},
		scrollbar: {
			name: "scrollbar",
			element: "div",
			aria: {
				role: "scrollbar",
				required: [
					{ attr: "aria-controls", valueType: "aria-controls" },
					{ attr: "aria-orientation", valueType: "aria-orientation" },
					{ attr: "aria-valuemin", valueType: "aria-valuemin" },
					{ attr: "aria-valuemax", valueType: "aria-valuemax" },
					{ attr: "aria-valuenow", valueType: "aria-valuenow" },
				],
				optional: [],
			},
			data: {
				kind: "scroll-area",
				slot: "scrollbar",
				states: ["hover", "active"],
			},
		},
		thumb: {
			name: "thumb",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "scroll-area",
				slot: "thumb",
				states: ["hover", "active"],
			},
		},
	},

	accessibleName: {
		required: false,
		sources: ["aria-label"],
		defaultSlot: "viewport",
	},

	focus: {
		strategy: "none",
	},

	keyboard: {
		global: [],
	},

	states: {
		all: ["hover", "active"],
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: false,
		expandable: false,
	},

	primitiveKind: "scroll-area",
} as const satisfies ComponentContract;
