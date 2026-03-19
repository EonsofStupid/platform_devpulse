/**
 * @file Context Menu Component Contract
 * @kind context-menu
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * Compound component: trigger (right-click zone), content, item, separator.
 * MeltUI spatialmenu transport adapter provides ARIA.
 * ColdLight adds data-kind, data-slot, data-state.
 *
 * Pattern: WAI-ARIA APG Menu Pattern (context menu variant)
 * Reference: https://www.w3.org/WAI/ARIA/apg/patterns/menu/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "context-menu",
	description:
		"Right-click triggered context menu with keyboard navigation and item selection. Uses role='menu' with role='menuitem' children. MeltUI spatialmenu adapter provides ARIA and focus management.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/menu/",

	slots: {
		required: ["trigger", "content", "item"],
		optional: ["separator"],
	},

	slotContracts: {
		trigger: {
			name: "trigger",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "context-menu",
				slot: "trigger",
				states: ["open", "closed"],
			},
		},
		content: {
			name: "content",
			element: "div",
			aria: {
				role: "menu",
				required: [],
				optional: [{ attr: "aria-orientation", valueType: "aria-orientation" }],
			},
			data: {
				kind: "context-menu",
				slot: "content",
				states: ["open", "closed"],
			},
			keyboard: [
				{ key: "ArrowDown", action: "next", description: "Move to next item" },
				{ key: "ArrowUp", action: "prev", description: "Move to previous item" },
				{ key: "Home", action: "first", description: "Move to first item" },
				{ key: "End", action: "last", description: "Move to last item" },
				{ key: "Escape", action: "close", description: "Close menu" },
			],
		},
		item: {
			name: "item",
			element: "div",
			aria: {
				role: "menuitem",
				required: [],
				optional: [{ attr: "aria-disabled", valueType: "aria-disabled" }],
			},
			data: {
				kind: "context-menu",
				slot: "item",
				states: ["highlighted", "disabled"],
			},
			keyboard: [
				{ key: "Enter", action: "select", description: "Select item" },
				{ key: "Space", action: "select", description: "Select item" },
			],
		},
		separator: {
			name: "separator",
			element: "div",
			aria: {
				role: "separator",
				required: [],
				optional: [],
			},
			data: {
				kind: "context-menu",
				slot: "separator",
				states: [],
			},
		},
	},

	accessibleName: {
		required: false,
		sources: ["aria-label"],
	},

	focus: {
		strategy: "activedescendant",
		initialFocus: "content",
	},

	keyboard: {
		global: [
			{ key: "ArrowDown", action: "next", description: "Move to next item" },
			{ key: "ArrowUp", action: "prev", description: "Move to previous item" },
			{ key: "Home", action: "first", description: "Move to first item" },
			{ key: "End", action: "last", description: "Move to last item" },
			{ key: "Enter", action: "select", description: "Select highlighted item" },
			{ key: "Space", action: "select", description: "Select highlighted item" },
			{ key: "Escape", action: "close", description: "Close context menu" },
		],
	},

	states: {
		primary: "open",
		all: ["open", "closed", "highlighted", "disabled"],
		ariaMapping: {
			open: "aria-expanded",
			disabled: "aria-disabled",
		},
	},

	interactions: {
		modal: false,
		selectable: true,
		editable: false,
		expandable: true,
	},

	primitiveKind: "context-menu",
} as const satisfies ComponentContract;
