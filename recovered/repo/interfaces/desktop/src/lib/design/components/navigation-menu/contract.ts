/**
 * @file Navigation Menu Component Contract
 * @kind navigation-menu
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * ColdLight-owned — NO MeltUI adapter. Native ARIA on semantic HTML elements.
 * Uses <nav>, <ul>, <li>, <button>, <a> with ARIA attributes applied directly.
 *
 * Compound component: root (nav), list (ul), item (li), trigger (button),
 * content (div), link (a).
 *
 * Pattern: WAI-ARIA APG Disclosure Navigation Pattern
 * Reference: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "navigation-menu",
	description:
		"Site navigation component with expandable sub-menus. Uses semantic HTML (nav, ul, li, a) with ColdLight-owned ARIA. Roving tabindex across top-level items, disclosure pattern for sub-menus. No MeltUI dependency.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/",

	slots: {
		required: ["root", "list", "item"],
		optional: ["trigger", "content", "link"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "nav",
			aria: {
				role: "navigation",
				required: [],
				optional: [{ attr: "aria-label", valueType: "aria-label" }],
			},
			data: {
				kind: "navigation-menu",
				slot: "root",
				states: [],
			},
		},
		list: {
			name: "list",
			element: "ul",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "navigation-menu",
				slot: "list",
				states: [],
			},
		},
		item: {
			name: "item",
			element: "li",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "navigation-menu",
				slot: "item",
				states: ["open", "closed", "active"],
			},
		},
		trigger: {
			name: "trigger",
			element: "button",
			aria: {
				role: "button",
				required: [
					{ attr: "aria-expanded", valueType: "aria-expanded" },
					{ attr: "aria-haspopup", valueType: "aria-haspopup" },
				],
				optional: [{ attr: "aria-controls", valueType: "aria-controls" }],
			},
			data: {
				kind: "navigation-menu",
				slot: "trigger",
				states: ["open", "closed"],
			},
			keyboard: [
				{ key: "Enter", action: "toggle", description: "Toggle sub-menu" },
				{ key: "Space", action: "toggle", description: "Toggle sub-menu" },
				{ key: "ArrowDown", action: "open", description: "Open sub-menu" },
				{ key: "Escape", action: "close", description: "Close sub-menu" },
				{ key: "ArrowLeft", action: "prev-item", description: "Move to previous nav item" },
				{ key: "ArrowRight", action: "next-item", description: "Move to next nav item" },
			],
		},
		content: {
			name: "content",
			element: "div",
			aria: {
				required: [],
				optional: [{ attr: "aria-labelledby", valueType: "aria-labelledby" }],
				relationships: [{ attr: "aria-labelledby", targetSlot: "trigger", required: false }],
			},
			data: {
				kind: "navigation-menu",
				slot: "content",
				states: ["open", "closed"],
			},
		},
		link: {
			name: "link",
			element: "a",
			aria: {
				required: [],
				optional: [
					{ attr: "aria-current", valueType: "aria-current" },
					{ attr: "aria-disabled", valueType: "aria-disabled" },
				],
			},
			data: {
				kind: "navigation-menu",
				slot: "link",
				states: ["active"],
			},
			keyboard: [
				{ key: "Enter", action: "navigate", description: "Navigate to link" },
				{ key: "ArrowLeft", action: "prev-item", description: "Move to previous nav item" },
				{ key: "ArrowRight", action: "next-item", description: "Move to next nav item" },
			],
		},
	},

	accessibleName: {
		required: true,
		sources: ["aria-label", "aria-labelledby"],
	},

	focus: {
		strategy: "roving",
	},

	keyboard: {
		global: [
			{ key: "ArrowLeft", action: "prev-item", description: "Move to previous nav item" },
			{ key: "ArrowRight", action: "next-item", description: "Move to next nav item" },
			{ key: "ArrowDown", action: "open-submenu", description: "Open sub-menu or move into it" },
			{ key: "ArrowUp", action: "close-submenu", description: "Close sub-menu or move up" },
			{ key: "Enter", action: "activate", description: "Activate link or toggle sub-menu" },
			{ key: "Space", action: "activate", description: "Activate link or toggle sub-menu" },
			{ key: "Home", action: "first", description: "Move to first nav item" },
			{ key: "End", action: "last", description: "Move to last nav item" },
			{ key: "Escape", action: "close", description: "Close sub-menu" },
		],
	},

	states: {
		primary: "open",
		all: ["open", "closed", "active"],
		ariaMapping: {
			open: "aria-expanded",
			active: "aria-current",
		},
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: false,
		expandable: true,
	},

	primitiveKind: "navigation-menu",
} as const satisfies ComponentContract;
