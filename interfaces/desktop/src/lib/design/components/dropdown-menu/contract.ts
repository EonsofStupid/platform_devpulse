/**
 * @file Dropdown Menu Component Contract
 * @kind dropdown-menu
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * Compound component: trigger, content, item, separator, group, group-label.
 * MeltUI spatialmenu transport adapter provides ARIA.
 * ColdLight adds data-kind, data-slot, data-state.
 *
 * Pattern: WAI-ARIA APG Menu Pattern
 * Reference: https://www.w3.org/WAI/ARIA/apg/patterns/menu/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "dropdown-menu",
	description:
		"Disclosure-triggered menu with keyboard navigation, item selection, and nested groups. Uses role='menu' with role='menuitem' children. MeltUI spatialmenu adapter provides ARIA and focus management.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/menu/",

	slots: {
		required: ["trigger", "content", "item"],
		optional: ["separator", "group", "group-label"],
	},

	slotContracts: {
		trigger: {
			name: "trigger",
			element: "button",
			aria: {
				role: "button",
				required: [
					{ attr: "aria-haspopup", valueType: "aria-haspopup" },
					{ attr: "aria-expanded", valueType: "aria-expanded" },
				],
				optional: [{ attr: "aria-controls", valueType: "aria-controls" }],
			},
			data: {
				kind: "dropdown-menu",
				slot: "trigger",
				states: ["open", "closed"],
			},
			keyboard: [
				{ key: "Enter", action: "toggle", description: "Toggle menu" },
				{ key: "Space", action: "toggle", description: "Toggle menu" },
				{ key: "ArrowDown", action: "open-first", description: "Open menu and focus first item" },
				{ key: "ArrowUp", action: "open-last", description: "Open menu and focus last item" },
			],
		},
		content: {
			name: "content",
			element: "div",
			aria: {
				role: "menu",
				required: [],
				optional: [
					{ attr: "aria-labelledby", valueType: "aria-labelledby" },
					{ attr: "aria-orientation", valueType: "aria-orientation" },
				],
				relationships: [{ attr: "aria-labelledby", targetSlot: "trigger", required: false }],
			},
			data: {
				kind: "dropdown-menu",
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
				kind: "dropdown-menu",
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
				kind: "dropdown-menu",
				slot: "separator",
				states: [],
			},
		},
		group: {
			name: "group",
			element: "div",
			aria: {
				role: "group",
				required: [],
				optional: [{ attr: "aria-labelledby", valueType: "aria-labelledby" }],
			},
			data: {
				kind: "dropdown-menu",
				slot: "group",
				states: [],
			},
		},
		"group-label": {
			name: "group-label",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "dropdown-menu",
				slot: "group-label",
				states: [],
			},
		},
	},

	accessibleName: {
		required: false,
		sources: ["aria-label", "aria-labelledby"],
		defaultSlot: "trigger",
	},

	focus: {
		strategy: "activedescendant",
		initialFocus: "content",
		returnFocus: "trigger",
	},

	keyboard: {
		global: [
			{ key: "ArrowDown", action: "next", description: "Move to next item" },
			{ key: "ArrowUp", action: "prev", description: "Move to previous item" },
			{ key: "Home", action: "first", description: "Move to first item" },
			{ key: "End", action: "last", description: "Move to last item" },
			{ key: "Enter", action: "select", description: "Select highlighted item" },
			{ key: "Space", action: "select", description: "Select highlighted item" },
			{ key: "Escape", action: "close", description: "Close menu and return focus to trigger" },
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

	primitiveKind: "dropdown-menu",
} as const satisfies ComponentContract;
