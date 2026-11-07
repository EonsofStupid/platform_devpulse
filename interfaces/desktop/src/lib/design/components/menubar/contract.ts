/**
 * @file Menubar Component Contract
 * @kind menubar
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * Compound component: root (menubar), menu, trigger, content, item, separator.
 * MeltUI spatialmenu transport adapter provides ARIA per-menu.
 * ColdLight adds data-kind, data-slot, data-state.
 *
 * Pattern: WAI-ARIA APG Menubar Pattern
 * Reference: https://www.w3.org/WAI/ARIA/apg/patterns/menubar/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "menubar",
	description:
		"Horizontal menu bar containing multiple dropdown menus. Root has role='menubar', each trigger has role='menuitem' with aria-haspopup. Supports keyboard navigation between menus via ArrowLeft/ArrowRight and within menus via ArrowUp/ArrowDown.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/menubar/",

	slots: {
		required: ["root", "menu", "trigger", "content", "item"],
		optional: ["separator"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "div",
			aria: {
				role: "menubar",
				required: [],
				optional: [
					{ attr: "aria-orientation", valueType: "aria-orientation" },
					{ attr: "aria-label", valueType: "aria-label" },
				],
			},
			data: {
				kind: "menubar",
				slot: "root",
				states: [],
			},
		},
		menu: {
			name: "menu",
			element: "div",
			aria: {
				role: "none",
				required: [],
				optional: [],
			},
			data: {
				kind: "menubar",
				slot: "menu",
				states: ["open", "closed"],
			},
		},
		trigger: {
			name: "trigger",
			element: "button",
			aria: {
				role: "menuitem",
				required: [
					{ attr: "aria-haspopup", valueType: "aria-haspopup" },
					{ attr: "aria-expanded", valueType: "aria-expanded" },
				],
				optional: [{ attr: "aria-controls", valueType: "aria-controls" }],
			},
			data: {
				kind: "menubar",
				slot: "trigger",
				states: ["open", "closed"],
			},
			keyboard: [
				{ key: "Enter", action: "toggle", description: "Toggle menu" },
				{ key: "Space", action: "toggle", description: "Toggle menu" },
				{ key: "ArrowDown", action: "open", description: "Open menu and focus first item" },
				{ key: "ArrowLeft", action: "prev-menu", description: "Move to previous menu trigger" },
				{ key: "ArrowRight", action: "next-menu", description: "Move to next menu trigger" },
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
				kind: "menubar",
				slot: "content",
				states: ["open", "closed"],
			},
			keyboard: [
				{ key: "ArrowDown", action: "next", description: "Move to next item" },
				{ key: "ArrowUp", action: "prev", description: "Move to previous item" },
				{ key: "Home", action: "first", description: "Move to first item" },
				{ key: "End", action: "last", description: "Move to last item" },
				{ key: "Escape", action: "close", description: "Close menu" },
				{ key: "ArrowLeft", action: "prev-menu", description: "Close and move to previous menu" },
				{ key: "ArrowRight", action: "next-menu", description: "Close and move to next menu" },
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
				kind: "menubar",
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
				kind: "menubar",
				slot: "separator",
				states: [],
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
			{ key: "ArrowLeft", action: "prev-menu", description: "Move to previous menu trigger" },
			{ key: "ArrowRight", action: "next-menu", description: "Move to next menu trigger" },
			{ key: "ArrowDown", action: "open-or-next", description: "Open menu or move to next item" },
			{ key: "ArrowUp", action: "prev", description: "Move to previous item" },
			{ key: "Home", action: "first", description: "Move to first item" },
			{ key: "End", action: "last", description: "Move to last item" },
			{ key: "Enter", action: "select", description: "Select highlighted item" },
			{ key: "Space", action: "select", description: "Select highlighted item" },
			{ key: "Escape", action: "close", description: "Close current menu" },
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

	primitiveKind: "menubar",
} as const satisfies ComponentContract;
