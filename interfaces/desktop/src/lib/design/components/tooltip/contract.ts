/**
 * @file Tooltip Component Contract
 * @kind tooltip
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * MeltUI transport adapter provides ARIA attributes for trigger/content slots.
 * ColdLight adds data-kind, data-slot, data-state.
 *
 * Reference: W3C WAI-ARIA APG Tooltip Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * Tooltip component contract — compile-time enforced.
 *
 * Compound component: root (renderless) → trigger + content.
 * Single context layer: TooltipTransport.
 */
export const contract = {
	kind: "tooltip",
	description:
		"A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/",

	slots: {
		required: ["trigger", "content"],
		optional: ["arrow"],
	},

	slotContracts: {
		trigger: {
			name: "trigger",
			element: "span",
			aria: {
				required: [],
				optional: [{ attr: "aria-describedby", valueType: "aria-describedby" }],
			},
			data: {
				kind: "tooltip",
				slot: "trigger",
				states: [],
			},
		},
		content: {
			name: "content",
			element: "div",
			aria: {
				role: "tooltip",
				required: [],
				optional: [{ attr: "aria-label", valueType: "aria-label" }],
			},
			data: {
				kind: "tooltip",
				slot: "content",
				states: ["open", "closed"],
			},
		},
		arrow: {
			name: "arrow",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "tooltip",
				slot: "arrow",
				states: [],
			},
		},
	},

	accessibleName: {
		required: false,
		sources: ["content", "aria-label"],
	},

	focus: {
		strategy: "none",
	},

	keyboard: {
		global: [{ key: "Escape", action: "close", description: "Close the tooltip" }],
	},

	states: {
		primary: "open",
		all: ["open", "closed"],
		ariaMapping: {},
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: false,
		expandable: false,
	},

	primitiveKind: "tooltip",
} as const satisfies ComponentContract;
