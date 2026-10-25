/**
 * @file Tabs Component Contract
 * @kind tabs
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * Compound component: root, list, trigger, content slots.
 * Roving tabindex keyboard navigation with ArrowLeft/Right/Up/Down, Home, End.
 *
 * Pattern: WAI-ARIA APG Tabs Pattern
 * Reference: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * Tabs component contract — compile-time enforced.
 *
 * `satisfies ComponentContract` validates shape at compile time.
 * Slot contracts are inlined for full static analysis.
 */
export const contract = {
	kind: "tabs",
	description:
		"Tabbed navigation with roving tabindex. Uses role='tablist', role='tab', role='tabpanel' with aria-selected and aria-controls/aria-labelledby linking. ColdLight-owned ARIA — no MeltUI dependency.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/tabs/",

	slots: {
		required: ["root", "list", "trigger", "content"],
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
				kind: "tabs",
				slot: "root",
				states: [],
			},
		},
		list: {
			name: "list",
			element: "div",
			aria: {
				role: "tablist",
				required: [],
				optional: [{ attr: "aria-orientation", valueType: "aria-orientation" }],
			},
			data: {
				kind: "tabs",
				slot: "list",
				states: [],
			},
		},
		trigger: {
			name: "trigger",
			element: "button",
			aria: {
				role: "tab",
				required: [{ attr: "aria-selected", valueType: "aria-selected" }],
				optional: [
					{ attr: "aria-controls", valueType: "aria-controls" },
					{ attr: "aria-disabled", valueType: "aria-disabled" },
				],
				relationships: [{ attr: "aria-controls", targetSlot: "content", required: true }],
			},
			data: {
				kind: "tabs",
				slot: "trigger",
				states: ["active", "selected", "disabled"],
			},
			keyboard: [
				{ key: "ArrowRight", action: "next-item", description: "Focus next tab (horizontal)" },
				{ key: "ArrowLeft", action: "prev-item", description: "Focus previous tab (horizontal)" },
				{ key: "ArrowDown", action: "next-item", description: "Focus next tab (vertical)" },
				{ key: "ArrowUp", action: "prev-item", description: "Focus previous tab (vertical)" },
				{ key: "Home", action: "first-item", description: "Focus first tab" },
				{ key: "End", action: "last-item", description: "Focus last tab" },
			],
		},
		content: {
			name: "content",
			element: "div",
			aria: {
				role: "tabpanel",
				required: [],
				optional: [{ attr: "aria-labelledby", valueType: "aria-labelledby" }],
				relationships: [{ attr: "aria-labelledby", targetSlot: "trigger", required: true }],
			},
			data: {
				kind: "tabs",
				slot: "content",
				states: ["visible", "hidden"],
			},
		},
	},

	accessibleName: {
		required: false,
		sources: ["aria-label", "aria-labelledby"],
	},

	focus: {
		strategy: "roving",
	},

	keyboard: {
		global: [
			{ key: "ArrowRight", action: "next-item", description: "Focus next tab (horizontal)" },
			{ key: "ArrowLeft", action: "prev-item", description: "Focus previous tab (horizontal)" },
			{ key: "Home", action: "first-item", description: "Focus first tab" },
			{ key: "End", action: "last-item", description: "Focus last tab" },
		],
	},

	states: {
		all: ["active", "selected", "visible", "hidden", "disabled"],
		ariaMapping: {
			active: "aria-selected",
			disabled: "aria-disabled",
		},
	},

	interactions: {
		modal: false,
		selectable: true,
		editable: false,
		expandable: false,
	},

	primitiveKind: "tabs",
} as const satisfies ComponentContract;
