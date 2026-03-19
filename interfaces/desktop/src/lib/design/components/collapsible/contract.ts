/**
 * @file Collapsible Component Contract
 * @kind collapsible
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * MeltUI transport adapter provides ARIA attributes for trigger/content slots.
 * ColdLight adds data-kind, data-slot, data-state.
 *
 * Reference: W3C WAI-ARIA APG Disclosure (Show/Hide) Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * Collapsible component contract — compile-time enforced.
 *
 * Compound component: root → trigger + content.
 * Single context layer: CollapsibleTransport.
 */
export const contract = {
	kind: "collapsible",
	description:
		"A disclosure widget that shows or hides associated content. The trigger toggles the visibility of the content section.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/",

	slots: {
		required: ["root", "trigger", "content"],
		optional: [],
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
				kind: "collapsible",
				slot: "root",
				states: ["open", "closed"],
			},
		},
		trigger: {
			name: "trigger",
			element: "button",
			aria: {
				role: "button",
				required: [
					{ attr: "aria-expanded", valueType: "aria-expanded" },
					{ attr: "aria-controls", valueType: "aria-controls" },
				],
				optional: [{ attr: "aria-disabled", valueType: "aria-disabled" }],
			},
			data: {
				kind: "collapsible",
				slot: "trigger",
				states: ["expanded", "collapsed", "disabled"],
			},
			keyboard: [
				{ key: "Enter", action: "toggle", description: "Toggle collapsible content" },
				{ key: "Space", action: "toggle", description: "Toggle collapsible content" },
			],
		},
		content: {
			name: "content",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "collapsible",
				slot: "content",
				states: ["open", "closed"],
			},
		},
	},

	accessibleName: {
		required: false,
		sources: ["aria-label", "aria-labelledby", "content"],
	},

	focus: {
		strategy: "none",
	},

	keyboard: {
		global: [
			{ key: "Enter", action: "toggle", description: "Toggle collapsible content" },
			{ key: "Space", action: "toggle", description: "Toggle collapsible content" },
		],
	},

	states: {
		primary: "open",
		all: ["open", "closed", "disabled"],
		ariaMapping: {
			expanded: "aria-expanded",
			disabled: "aria-disabled",
		},
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: false,
		expandable: true,
	},

	primitiveKind: "collapsible",
} as const satisfies ComponentContract;
