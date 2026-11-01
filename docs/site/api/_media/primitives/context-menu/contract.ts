/**
 * @file primitives/context-menu/contract.ts
 * @kind context-menu
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Context Menu PrimitiveContract — menu triggered by right-click.
 *
 * ariaStateProvider: "meltui"
 * Builder: new ContextMenu()
 * 3-folder parity: primitives/context-menu/ + api/adapters/meltui/_internal/context-menu/ + components/context-menu/
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/menu/
 *
 * ARIA (handled by MeltUI adapter):
 *   trigger: no role (context zone, intercepts right-click)
 *   content: role="menu", aria-labelledby
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
import type { ContextMenuSlot, ContextMenuState } from "./types.js";

export const contract = {
	kind: "context-menu",
	ariaStateProvider: "meltui",

	slots: {
		required: ["trigger", "content", "item"],
		optional: ["separator", "group", "label", "checkbox-item", "radio-item", "sub-trigger", "sub-content"],
		forbidden: [],
	},

	slotSpec: {
		trigger: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: [] },
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
		trigger: ["open", "closed"],
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
		trigger: ["open"],
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
} as const satisfies PrimitiveContract<"context-menu", ContextMenuSlot, ContextMenuState>;
