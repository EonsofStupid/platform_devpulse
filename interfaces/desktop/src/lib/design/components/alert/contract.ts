/**
 * @file Alert Component Contract
 * @kind alert
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 * Cross-references the alert PrimitiveContract for slot derivation.
 *
 * Pattern: Zag-style anatomy definition + React Spectrum layered contracts.
 * The component contract declares what the styled component MUST render.
 * Build scripts validate via Zod. App code pays zero cost.
 *
 * Reference: W3C WAI-ARIA APG Alert Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/alert/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * Alert component contract — compile-time enforced.
 *
 * `satisfies ComponentContract` validates shape at compile time.
 * Slot contracts are inlined (not derived at runtime) for full static analysis.
 */
export const contract = {
	kind: "alert",
	description:
		"Static alert banner for important messages. Uses role='alert' which provides implicit aria-live='assertive'. Supports info, success, warning, and error intents.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/alert/",

	slots: {
		required: ["root"],
		optional: ["icon", "title", "description", "action"],
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
					{ attr: "aria-labelledby", valueType: "aria-labelledby" },
					{ attr: "aria-live", valueType: "aria-live" },
				],
			},
			data: {
				kind: "alert",
				slot: "root",
				states: [],
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
				kind: "alert",
				slot: "icon",
				states: [],
			},
		},
		title: {
			name: "title",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "alert",
				slot: "title",
				states: [],
			},
		},
		description: {
			name: "description",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "alert",
				slot: "description",
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
				kind: "alert",
				slot: "action",
				states: [],
			},
		},
	},

	accessibleName: {
		required: false,
		sources: ["content", "aria-label", "aria-labelledby"],
		defaultSlot: "title",
	},

	focus: {
		strategy: "none",
	},

	keyboard: {
		global: [],
	},

	states: {
		all: [],
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: false,
		expandable: false,
	},

	primitiveKind: "alert",
} as const satisfies ComponentContract;
