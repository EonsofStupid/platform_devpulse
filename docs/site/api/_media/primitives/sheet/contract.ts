/**
 * @file primitives/sheet/contract.ts
 * @kind sheet
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Sheet PrimitiveContract — SSOT declaration for the sheet primitive.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight"
 *   ColdLight owns ARIA directly. No adapter. Focus trap for overlay.
 *   2-folder parity enforced by scanner: primitives/sheet/ (colocated contract + implementation)
 *
 * Sheet is a slide-in panel overlay pattern (side drawer).
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { SheetSlot, SheetState } from "./types.js";

export const contract = {
	kind: "sheet",
	ariaStateProvider: "coldlight",

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		required: ["trigger", "content"],
		optional: ["overlay", "close"],
		forbidden: [],
	},

	slotSpec: {
		trigger: {
			element: "button",
			children: "snippet",
			aria: {
				role: "button",
				required: [],
				optional: ["aria-haspopup", "aria-expanded", "aria-controls"],
			},
		},
		overlay: {
			element: "div",
			children: "snippet",
			aria: {
				role: "presentation",
				required: [],
				optional: ["aria-hidden"],
			},
		},
		content: {
			element: "div",
			children: "snippet",
			aria: {
				role: "dialog",
				required: ["aria-modal"],
				optional: ["aria-label", "aria-labelledby"],
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
		trigger: ["focused", "focus-visible"],
		overlay: ["open", "closed"],
		content: ["open", "closed"],
		close: ["focused", "focus-visible"],
	},

	slotActions: {
		trigger: ["open"],
		overlay: ["close"],
		content: [],
		close: ["close"],
	},

	// ─── ARIA ─────────────────────────────────────────────────────────────────
	aria: {
		role: "dialog",
		requiredAttrs: ["aria-modal"],
		optionalAttrs: ["aria-label", "aria-labelledby"],
	},

	// ─── Keyboard ─────────────────────────────────────────────────────────────
	keyboard: ["Escape", "Tab"],

	// ─── Behavior ─────────────────────────────────────────────────────────────
	focusStrategy: "trap",
	compound: true,
	dismissBehavior: {
		escape: true,
		outsideClick: true,
	},
} as const satisfies PrimitiveContract<"sheet", SheetSlot, SheetState>;
