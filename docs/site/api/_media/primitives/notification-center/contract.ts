/**
 * @file primitives/notification-center/contract.ts
 * @kind notification-center
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * NotificationCenter PrimitiveContract — Notification list panel with live region.
 *
 * ariaStateProvider: "coldlight"
 *   ColdLight owns ARIA directly. No adapter. Native <div> with role="log" semantics.
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { NotificationCenterSlot, NotificationCenterState } from "./types.js";

export const contract = {
	kind: "notification-center",
	ariaStateProvider: "coldlight",

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		required: ["root"],
		optional: ["header", "list", "item", "action", "empty"],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: {
				role: "log",
				required: ["aria-live"],
				optional: ["aria-label", "aria-labelledby", "aria-relevant", "aria-atomic"],
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
		list: {
			element: "div",
			children: "snippet",
			aria: {
				role: "none",
				required: [],
				optional: [],
			},
		},
		item: {
			element: "div",
			children: "snippet",
			aria: {
				role: "none",
				required: [],
				optional: ["aria-label"],
			},
		},
		action: {
			element: "button",
			children: "snippet",
			aria: {
				role: "button",
				required: [],
				optional: ["aria-label"],
			},
		},
		empty: {
			element: "div",
			children: "snippet",
			aria: {
				role: "status",
				required: [],
				optional: [],
			},
		},
	},

	// ─── State ───────────────────────────────────────────────────────────────
	states: {
		shared: [],
		specific: ["open", "closed"],
	},

	slotStates: {
		root: ["open", "closed"],
		header: [],
		list: [],
		item: [],
		action: [],
		empty: [],
	},

	slotActions: {
		root: ["open", "close", "toggle"],
		header: [],
		list: [],
		item: ["dismiss"],
		action: [],
		empty: [],
	},

	// ─── ARIA ─────────────────────────────────────────────────────────────────
	aria: {
		role: "log",
		requiredAttrs: ["aria-live"],
		optionalAttrs: ["aria-label", "aria-labelledby", "aria-relevant", "aria-atomic"],
	},

	// ─── Keyboard ─────────────────────────────────────────────────────────────
	keyboard: ["Escape"],

	// ─── Behavior ─────────────────────────────────────────────────────────────
	focusStrategy: "none",
	compound: true,
} as const satisfies PrimitiveContract<"notification-center", NotificationCenterSlot, NotificationCenterState>;
