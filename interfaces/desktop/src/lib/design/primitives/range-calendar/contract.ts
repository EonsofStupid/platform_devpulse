/**
 * @file primitives/range-calendar/contract.ts
 * @kind range-calendar
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Range calendar PrimitiveContract — grid-based date range selection widget.
 *
 * ariaStateProvider: "coldlight"
 * ColdLight-owned ARIA (builder pending)
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { RangeCalendarSlot, RangeCalendarState } from "./types.js";

export const contract = {
	kind: "range-calendar",
	ariaStateProvider: "coldlight",

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		required: ["root", "header", "grid", "heading", "cell", "prev-button", "next-button"],
		optional: [],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: {
				role: "group",
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
		grid: {
			element: "table",
			children: "snippet",
			aria: {
				role: "grid",
				required: ["aria-labelledby"],
				optional: ["aria-readonly", "aria-multiselectable"],
			},
		},
		heading: {
			element: "div",
			children: "snippet",
			aria: {
				role: "none",
				required: [],
				optional: ["aria-live"],
			},
		},
		cell: {
			element: "button",
			children: "snippet",
			aria: {
				role: "gridcell",
				required: [],
				optional: ["aria-selected", "aria-disabled", "aria-current"],
			},
		},
		"prev-button": {
			element: "button",
			children: "snippet",
			aria: {
				role: "button",
				required: [],
				optional: ["aria-label", "aria-disabled"],
			},
		},
		"next-button": {
			element: "button",
			children: "snippet",
			aria: {
				role: "button",
				required: [],
				optional: ["aria-label", "aria-disabled"],
			},
		},
	},

	// ─── State ───────────────────────────────────────────────────────────────
	states: {
		shared: ["focused", "focus-visible", "hover", "disabled", "selected"],
		specific: [],
	},

	slotStates: {
		root: [],
		header: [],
		grid: [],
		heading: [],
		cell: ["selected", "focused", "focus-visible", "hover", "disabled"],
		"prev-button": ["focused", "focus-visible", "disabled"],
		"next-button": ["focused", "focus-visible", "disabled"],
	},

	slotActions: {
		root: [],
		header: [],
		grid: [],
		heading: [],
		cell: ["select"],
		"prev-button": ["select"],
		"next-button": ["select"],
	},

	// ─── ARIA ─────────────────────────────────────────────────────────────────
	aria: {
		role: "grid",
		requiredAttrs: [],
		optionalAttrs: ["aria-labelledby", "aria-label", "aria-multiselectable"],
	},

	// ─── Keyboard (WAI-ARIA APG: Grid) ────────────────────────────────────────
	keyboard: [
		"ArrowUp",
		"ArrowDown",
		"ArrowLeft",
		"ArrowRight",
		"Home",
		"End",
		"PageUp",
		"PageDown",
		"Enter",
		"Space",
	],

	// ─── Behavior ─────────────────────────────────────────────────────────────
	focusStrategy: "roving",
	compound: true,
} as const satisfies PrimitiveContract<"range-calendar", RangeCalendarSlot, RangeCalendarState>;
