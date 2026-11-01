/**
 * @file primitives/menubar/contract.ts
 * @kind menubar
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Menubar PrimitiveContract — horizontal menu bar with dropdown menus.
 *
 * ariaStateProvider: "meltui"
 * Builder: new Menubar()
 * 3-folder parity: primitives/menubar/ + api/adapters/meltui/_internal/menubar/ + components/menubar/
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/menubar/
 *
 * ARIA (handled by MeltUI adapter):
 *   root: role="menubar"
 *   trigger: role="menuitem", aria-haspopup, aria-expanded, aria-controls → content
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
 *   ArrowDown/ArrowUp — navigate items within menu
 *   ArrowRight/ArrowLeft — navigate between menus
 *   Home/End — first/last item
 *   Escape — close menu
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { MenubarSlot, MenubarState } from "./types.js";

export const contract = {
	kind: "menubar",
	ariaStateProvider: "meltui",

	slots: {
		required: ["root", "menu", "trigger", "content", "item"],
		optional: ["separator", "group", "label", "checkbox-item", "radio-item", "sub-trigger", "sub-content"],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: {
				role: "menubar",
				required: [],
				optional: ["aria-orientation", "aria-label"],
			},
		},
		menu: {
			element: "div",
			children: "snippet",
			aria: {
				role: "none",
				required: [],
				optional: [],
			},
		},
		trigger: {
			element: "button",
			children: "snippet",
			aria: {
				role: "menuitem",
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
		root: [],
		menu: ["open", "closed"],
		trigger: ["focused", "focus-visible", "open", "closed", "hover"],
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
		root: [],
		menu: [],
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
		role: "menubar",
		requiredAttrs: [],
		optionalAttrs: ["aria-orientation", "aria-label"],
	},

	keyboard: ["Enter", "Space", "ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Home", "End", "Escape"],
	focusStrategy: "roving",
	compound: true,
	orientation: "horizontal",
} as const satisfies PrimitiveContract<"menubar", MenubarSlot, MenubarState>;
