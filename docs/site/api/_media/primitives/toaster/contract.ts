/**
 * @file primitives/toaster/contract.ts
 * @kind toaster
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Toaster PrimitiveContract — SSOT declaration for the toaster primitive.
 * Lives WITH the implementation per ColdLight architecture (locked 2026-02-21).
 *
 * ariaStateProvider: "meltui"
 *   MeltUI adapter handles ARIA + state via transport chain.
 *   3-folder parity enforced by scanner.
 *
 * Builder: new Toaster()
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { ToasterSlot, ToasterState } from "./types.js";

export const contract = {
	kind: "toaster",
	ariaStateProvider: "meltui",

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		required: ["root", "content", "close"],
		optional: ["title", "description"],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: {
				role: "region",
				required: ["aria-label"],
				optional: ["aria-live"],
			},
		},
		content: {
			element: "div",
			children: "snippet",
			aria: {
				role: "status",
				required: [],
				optional: ["aria-live", "aria-atomic"],
			},
		},
		title: {
			element: "div",
			children: "snippet",
			aria: {
				required: [],
				optional: [],
			},
		},
		description: {
			element: "div",
			children: "snippet",
			aria: {
				required: [],
				optional: [],
			},
		},
		close: {
			element: "button",
			children: "snippet",
			aria: {
				role: "button",
				required: [],
				optional: ["aria-label"],
			},
		},
	},

	// ─── State ───────────────────────────────────────────────────────────────
	states: {
		shared: ["focused", "focus-visible"],
		specific: ["open", "closed"],
	},

	slotStates: {
		root: [],
		content: ["open", "closed"],
		title: [],
		description: [],
		close: ["focused", "focus-visible"],
	},

	slotActions: {
		root: [],
		content: ["dismiss"],
		title: [],
		description: [],
		close: ["dismiss"],
	},

	// ─── ARIA ─────────────────────────────────────────────────────────────────
	aria: {
		role: "region",
		requiredAttrs: ["aria-label"],
		optionalAttrs: ["aria-live"],
	},

	// ─── Keyboard ─────────────────────────────────────────────────────────────
	keyboard: ["Escape"],

	// ─── Behavior ─────────────────────────────────────────────────────────────
	focusStrategy: "none",
	compound: true,
	dismissBehavior: { escape: true, outsideClick: false },
} as const satisfies PrimitiveContract<"toaster", ToasterSlot, ToasterState>;
