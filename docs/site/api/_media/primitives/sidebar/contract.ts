/**
 * @file primitives/sidebar/contract.ts
 * @kind sidebar
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Sidebar PrimitiveContract — Side navigation panel with header/content/footer.
 *
 * ariaStateProvider: "coldlight"
 *   ColdLight owns ARIA directly. No adapter. Native <aside> semantics.
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { SidebarSlot, SidebarState } from "./types.js";

export const contract = {
	kind: "sidebar",
	ariaStateProvider: "coldlight",

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		required: ["root"],
		optional: ["header", "content", "footer"],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "aside",
			children: "snippet",
			aria: {
				role: "navigation",
				required: [],
				optional: ["aria-label", "aria-labelledby"],
			},
		},
		header: {
			element: "div",
			children: "snippet",
			aria: {
				role: "none",
				required: [],
				optional: [],
			},
		},
		content: {
			element: "div",
			children: "snippet",
			aria: {
				role: "none",
				required: [],
				optional: [],
			},
		},
		footer: {
			element: "div",
			children: "snippet",
			aria: {
				role: "none",
				required: [],
				optional: [],
			},
		},
	},

	// ─── State ───────────────────────────────────────────────────────────────
	states: {
		shared: [],
		specific: ["expanded", "collapsed"],
	},

	slotStates: {
		root: ["expanded", "collapsed"],
		header: [],
		content: [],
		footer: [],
	},

	slotActions: {
		root: ["expand", "collapse", "toggle"],
		header: [],
		content: [],
		footer: [],
	},

	// ─── ARIA ─────────────────────────────────────────────────────────────────
	aria: {
		role: "navigation",
		requiredAttrs: [],
		optionalAttrs: ["aria-label", "aria-labelledby"],
	},

	// ─── Keyboard ─────────────────────────────────────────────────────────────
	keyboard: [],

	// ─── Behavior ─────────────────────────────────────────────────────────────
	focusStrategy: "none",
	compound: true,
} as const satisfies PrimitiveContract<"sidebar", SidebarSlot, SidebarState>;
