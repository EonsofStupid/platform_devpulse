/**
 * @file Banner Component Contract
 * @kind banner
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * Reference: W3C WAI-ARIA APG Alert Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/alert/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "banner",
	description:
		"Full-width alert banner for important messages. Uses role='alert' for assertive live region. Supports dismiss via action slot. Intents: info, success, warning, error.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/alert/",

	slots: {
		required: ["root"],
		optional: ["icon", "content", "action"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "div",
			aria: {
				role: "alert",
				required: [],
				optional: [
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-live", valueType: "aria-live" },
				],
			},
			data: {
				kind: "banner",
				slot: "root",
				states: ["visible", "hidden"],
			},
		},
		icon: {
			name: "icon",
			element: "span",
			aria: {
				required: [],
				optional: [{ attr: "aria-hidden", valueType: "aria-hidden" }],
			},
			data: {
				kind: "banner",
				slot: "icon",
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
				kind: "banner",
				slot: "content",
				states: [],
			},
		},
		action: {
			name: "action",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "banner",
				slot: "action",
				states: [],
			},
		},
	},

	accessibleName: {
		required: false,
		sources: ["content", "aria-label"],
		defaultSlot: "content",
	},

	focus: {
		strategy: "none",
	},

	keyboard: {
		global: [],
	},

	states: {
		all: ["visible", "hidden"],
		ariaMapping: {},
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: false,
		expandable: false,
	},

	primitiveKind: "banner",
} as const satisfies ComponentContract;
