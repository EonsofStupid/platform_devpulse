/**
 * @file primitives/date-range-picker/contract.ts
 * @kind date-range-picker
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Date range picker PrimitiveContract — combined range field + calendar popup for range selection.
 *
 * ariaStateProvider: "coldlight"
 * ColdLight-owned ARIA (builder pending)
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { DateRangePickerSlot, DateRangePickerState } from "./types.js";

export const contract = {
	kind: "date-range-picker",
	ariaStateProvider: "coldlight",

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		required: ["root", "start-field", "end-field", "trigger", "content", "calendar"],
		optional: ["label"],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: {
				role: "group",
				required: [],
				optional: ["aria-labelledby"],
			},
		},
		"start-field": {
			element: "div",
			children: "snippet",
			aria: {
				role: "group",
				required: [],
				optional: ["aria-labelledby", "aria-describedby"],
			},
		},
		"end-field": {
			element: "div",
			children: "snippet",
			aria: {
				role: "group",
				required: [],
				optional: ["aria-labelledby", "aria-describedby"],
			},
		},
		trigger: {
			element: "button",
			children: "snippet",
			aria: {
				role: "button",
				required: ["aria-haspopup"],
				optional: ["aria-expanded", "aria-controls", "aria-label"],
			},
		},
		content: {
			element: "div",
			children: "snippet",
			aria: {
				role: "dialog",
				required: ["aria-modal"],
				optional: ["aria-labelledby", "aria-label"],
			},
		},
		calendar: {
			element: "div",
			children: "snippet",
			aria: {
				role: "grid",
				required: [],
				optional: ["aria-labelledby"],
			},
		},
		label: {
			element: "label",
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
		shared: ["focused", "focus-visible", "disabled", "invalid"],
		specific: ["open", "closed"],
	},

	slotStates: {
		root: ["disabled", "invalid"],
		"start-field": ["focused", "focus-visible", "disabled", "invalid"],
		"end-field": ["focused", "focus-visible", "disabled", "invalid"],
		trigger: ["focused", "focus-visible", "open", "closed"],
		content: ["open", "closed"],
		calendar: [],
		label: [],
	},

	slotActions: {
		root: [],
		"start-field": [],
		"end-field": [],
		trigger: ["open", "toggle"],
		content: [],
		calendar: [],
		label: [],
	},

	// ─── ARIA ─────────────────────────────────────────────────────────────────
	aria: {
		role: "group",
		requiredAttrs: [],
		optionalAttrs: ["aria-labelledby", "aria-label"],
	},

	// ─── Keyboard (WAI-ARIA APG: Dialog + Grid) ───────────────────────────────
	keyboard: [
		"Escape",
		"Enter",
		"Space",
		"ArrowUp",
		"ArrowDown",
		"ArrowLeft",
		"ArrowRight",
		"Tab",
	],

	// ─── Behavior ─────────────────────────────────────────────────────────────
	focusStrategy: "trap",
	compound: true,
	dismissBehavior: {
		escape: true,
		outsideClick: true,
	},
} as const satisfies PrimitiveContract<
	"date-range-picker",
	DateRangePickerSlot,
	DateRangePickerState
>;
