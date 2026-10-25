/**
 * @file primitives/dropdown-menu/contract.ts
 * @kind dropdown-menu
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Dropdown Menu PrimitiveContract — menu with disclosure trigger.
 *
 * ariaStateProvider: "coldlight"
 * ColdLight-owned ARIA (builder pending)
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/menu/
 *
 * ARIA:
 *   trigger: role="button", aria-haspopup, aria-expanded, aria-controls → content
 *   content: role="menu", aria-labelledby → trigger
 *   item: role="menuitem"
 *   separator: role="separator"
 *   checkbox-item: role="menuitemcheckbox", aria-checked
 *   radio-item: role="menuitemradio", aria-checked
 *   sub-trigger: role="menuitem", aria-haspopup, aria-expanded
 *   sub-content: role="menu"
 *
 * Keyboard:
 *   Enter/Space — activate item
 *   ArrowDown/ArrowUp — navigate items
 *   ArrowRight — open submenu
 *   ArrowLeft — close submenu
 *   Home/End — first/last item
 *   Escape — close menu
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { DropdownMenuSlot, DropdownMenuState } from "./types.js";

export const contract = {
	kind: "dropdown-menu",
	ariaStateProvider: "coldlight",

	slots: {
		required: ["trigger", "content", "item"],
		optional: ["separator", "group", "label", "checkbox-item", "radio-item", "sub-trigger", "sub-content"],
		forbidden: [],
	},

	slotSpec: {
		trigger: {
			element: "button",
			children: "snippet",
			aria: {
				role: "button",
				required: ["aria-haspopup", "aria-expanded"],
				optional: ["aria-controls"],
			},
		},
		content: {
			element: "div",
			children: "snippet",
			aria: {
				role: "menu",
				required: ["aria-labelledby"],
				optional: ["aria-orientation"],
			},
		},
		item: {
			element: "div",
			children: "snippet",
			aria: {
				role: "menuitem",
				required: [],
				optional: ["aria-disabled"],
			},
		},
		separator: {
			element: "hr",
			children: "self-closing",
			aria: {
				role: "separator",
				required: [],
				optional: [],
			},
		},
		group: {
			element: "div",
			children: "snippet",
			aria: {
				role: "group",
				required: [],
				optional: ["aria-labelledby"],
			},
		},
		label: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
		"checkbox-item": {
			element: "div",
			children: "snippet",
			aria: {
				role: "menuitemcheckbox",
				required: ["aria-checked"],
				optional: ["aria-disabled"],
			},
		},
		"radio-item": {
			element: "div",
			children: "snippet",
			aria: {
				role: "menuitemradio",
				required: ["aria-checked"],
				optional: ["aria-disabled"],
			},
		},
		"sub-trigger": {
			element: "div",
			children: "snippet",
			aria: {
				role: "menuitem",
				required: ["aria-haspopup", "aria-expanded"],
				optional: ["aria-controls"],
			},
		},
		"sub-content": {
			element: "div",
			children: "snippet",
			aria: {
				role: "menu",
				required: [],
				optional: ["aria-labelledby"],
			},
		},
	},

	states: {
		shared: ["focused", "focus-visible", "hover", "disabled"],
		specific: ["open", "closed", "checked"],
	},

	slotStates: {
		trigger: ["focused", "focus-visible", "open", "closed"],
		content: ["open", "closed"],
		item: ["focused", "hover", "disabled"],
		separator: [],
		group: [],
		label: [],
		"checkbox-item": ["checked", "focused", "hover", "disabled"],
		"radio-item": ["checked", "focused", "hover", "disabled"],
		"sub-trigger": ["focused", "hover", "open", "closed"],
		"sub-content": ["open", "closed"],
	},

	slotActions: {
		trigger: ["open", "toggle"],
		content: [],
		item: ["select"],
		separator: [],
		group: [],
		label: [],
		"checkbox-item": ["check", "uncheck", "toggle"],
		"radio-item": ["select"],
		"sub-trigger": ["open", "toggle"],
		"sub-content": ["close"],
	},

	aria: {
		role: "menu",
		requiredAttrs: [],
		optionalAttrs: ["aria-labelledby", "aria-orientation"],
	},

	keyboard: ["Enter", "Space", "ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Home", "End", "Escape"],
	focusStrategy: "roving",
	compound: true,
	dismissBehavior: { escape: true, outsideClick: true },
} as const satisfies PrimitiveContract<"dropdown-menu", DropdownMenuSlot, DropdownMenuState>;
