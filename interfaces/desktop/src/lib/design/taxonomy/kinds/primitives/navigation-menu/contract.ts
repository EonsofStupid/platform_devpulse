/**
 * @file NavigationMenu Taxonomy Contract
 * @description ColdLight SSOT contract for the navigation-menu primitive.
 *
 * ariaStateProvider: "coldlight" — semantic HTML nav landmark with roving tabindex.
 * 2-folder parity: taxonomy + primitive.
 *
 * WAI-ARIA: role="navigation" landmark with nested disclosure pattern.
 * Top-level items use roving tabindex for horizontal keyboard navigation.
 * Trigger+content pairs provide sub-menu disclosure.
 */

import type { PrimitiveContract } from "../../../types.js";
import { navigationMenuSlotStates, type NavigationMenuSlot, type NavigationMenuState } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** NavigationMenu primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"navigation-menu", NavigationMenuSlot, NavigationMenuState> = {
	kind: "navigation-menu",
	ariaStateProvider: "coldlight",
	slots: {
		required: ["root", "list", "item"],
		optional: ["trigger", "content", "link", "viewport"],
		forbidden: [],
	},
	slotSpec: {
		root: {
			element: "nav",
			children: "snippet",
			aria: { role: "navigation", required: [], optional: ["aria-label"] },
		},
		list: {
			element: "ul",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
		item: {
			element: "li",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
		trigger: {
			element: "button",
			children: "snippet",
			aria: { role: "button", required: ["aria-expanded"], optional: ["aria-controls", "aria-label", "aria-haspopup"] },
		},
		content: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: ["aria-label"] },
		},
		link: {
			element: "a",
			children: "snippet",
			aria: { role: "link", required: [], optional: ["aria-current", "aria-label"] },
		},
		viewport: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
	},
	states: {
		shared: ["hover", "active", "focused", "focus-visible", "disabled"],
		specific: ["open", "closed"],
	},
	slotStates: navigationMenuSlotStates,
	slotActions: {
		root: [],
		list: [],
		item: [],
		trigger: ["open", "close"],
		content: [],
		link: ["select"],
		viewport: [],
	},
	aria: {
		role: "navigation",
		requiredAttrs: [],
		optionalAttrs: ["aria-label", "aria-labelledby", "aria-expanded", "aria-controls", "aria-current", "aria-haspopup"],
	},
	keyboard: ["ArrowLeft", "ArrowRight", "ArrowDown", "Enter", "Space", "Escape", "Home", "End", "Tab"],
	focusStrategy: "roving",
	compound: true,
	orientation: "horizontal",
};
