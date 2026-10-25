/**
 * @file primitives/navigation-menu/contract.ts
 * @kind navigation-menu
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Navigation Menu PrimitiveContract — site navigation with expandable sub-menus.
 *
 * ariaStateProvider: "coldlight"
 * 2-folder parity: primitives/navigation-menu/ + components/navigation-menu/
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
 *
 * ARIA (handled by ColdLight directly):
 *   root: role="navigation", aria-label
 *   list: role="menubar" (implicit via <ul>)
 *   item: role="none" (presentation)
 *   trigger: role="button", aria-expanded, aria-haspopup, aria-controls → content
 *   content: role="menu" (sub-menu container)
 *   link: role implicit via <a>
 *
 * Keyboard:
 *   ArrowRight/ArrowLeft — navigate between top-level items
 *   ArrowDown — open submenu / move into submenu
 *   ArrowUp — close submenu / move up in submenu
 *   Enter/Space — activate link or toggle submenu
 *   Home/End — first/last item
 *   Escape — close submenu
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { NavigationMenuSlot, NavigationMenuState } from "./types.js";

export const contract = {
	kind: "navigation-menu",
	ariaStateProvider: "coldlight",

	slots: {
		required: ["root", "list", "item", "trigger"],
		optional: ["content", "link"],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "nav",
			children: "snippet",
			aria: {
				role: "navigation",
				required: [],
				optional: ["aria-label"],
			},
		},
		list: {
			element: "ul",
			children: "snippet",
			aria: {
				required: [],
				optional: [],
			},
		},
		item: {
			element: "li",
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
				role: "button",
				required: ["aria-expanded", "aria-haspopup"],
				optional: ["aria-controls"],
			},
		},
		content: {
			element: "div",
			children: "snippet",
			aria: {
				required: [],
				optional: ["aria-labelledby"],
			},
		},
		link: {
			element: "a",
			children: "snippet",
			aria: {
				required: [],
				optional: ["aria-current", "aria-disabled"],
			},
		},
	},

	states: {
		shared: ["focused", "focus-visible", "hover", "disabled"],
		specific: ["open", "closed", "active"],
	},

	slotStates: {
		root: [],
		list: [],
		item: ["open", "closed", "active"],
		trigger: ["focused", "focus-visible", "hover", "open", "closed", "disabled"],
		content: ["open", "closed"],
		link: ["focused", "focus-visible", "hover", "active", "disabled"],
	},

	slotActions: {
		root: [],
		list: [],
		item: [],
		trigger: ["open", "close", "toggle"],
		content: [],
		link: ["select"],
	},

	aria: {
		role: "navigation",
		requiredAttrs: [],
		optionalAttrs: ["aria-label"],
	},

	keyboard: ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Enter", "Space", "Home", "End", "Escape"],
	focusStrategy: "roving",
	compound: true,
	orientation: "horizontal",
} as const satisfies PrimitiveContract<"navigation-menu", NavigationMenuSlot, NavigationMenuState>;
