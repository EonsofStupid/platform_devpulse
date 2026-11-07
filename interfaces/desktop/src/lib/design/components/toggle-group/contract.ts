/**
 * @file Toggle Group Component Contract
 * @kind toggle-group
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * Reference: W3C WAI-ARIA APG Toolbar Pattern (toggle-group variant)
 * https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * ToggleGroup component contract — compile-time enforced.
 */
export const contract = {
	kind: "toggle-group",
	description:
		"Group of toggle buttons with single or multiple selection. Supports roving tabindex, arrow key navigation, and orientation.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/",

	slots: {
		required: ["root"],
		optional: ["item"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "div",
			aria: {
				role: "group",
				required: [],
				optional: [{ attr: "aria-orientation", valueType: "aria-orientation" }],
			},
			data: {
				kind: "toggle-group",
				slot: "root",
				states: ["disabled"],
			},
		},
		item: {
			name: "item",
			element: "button",
			aria: {
				role: "button",
				required: [{ attr: "aria-pressed", valueType: "aria-pressed" }],
				optional: [{ attr: "aria-disabled", valueType: "aria-disabled" }],
			},
			data: {
				kind: "toggle-group",
				slot: "item",
				states: ["pressed", "focused", "focus-visible", "hover", "disabled"],
			},
			keyboard: [
				{ key: "Space", action: "toggle", description: "Toggle item pressed state" },
				{ key: "Enter", action: "toggle", description: "Toggle item pressed state" },
				{ key: "ArrowRight", action: "focusNext", description: "Focus next item (horizontal)" },
				{ key: "ArrowLeft", action: "focusPrev", description: "Focus previous item (horizontal)" },
				{ key: "ArrowDown", action: "focusNext", description: "Focus next item (vertical)" },
				{ key: "ArrowUp", action: "focusPrev", description: "Focus previous item (vertical)" },
				{ key: "Home", action: "focusFirst", description: "Focus first item" },
				{ key: "End", action: "focusLast", description: "Focus last item" },
			],
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
			{ key: "ArrowRight", action: "focusNext", description: "Focus next item (horizontal)" },
			{ key: "ArrowLeft", action: "focusPrev", description: "Focus previous item (horizontal)" },
			{ key: "Home", action: "focusFirst", description: "Focus first item" },
			{ key: "End", action: "focusLast", description: "Focus last item" },
			{ key: "Space", action: "toggle", description: "Toggle pressed state" },
			{ key: "Enter", action: "toggle", description: "Toggle pressed state" },
		],
	},

	states: {
		all: ["pressed", "focused", "focus-visible", "hover", "disabled"],
		ariaMapping: {
			pressed: "aria-pressed",
			disabled: "aria-disabled",
		},
	},

	interactions: {
		modal: false,
		selectable: true,
		editable: false,
		expandable: false,
	},

	primitiveKind: "toggle-group",
} as const satisfies ComponentContract;
