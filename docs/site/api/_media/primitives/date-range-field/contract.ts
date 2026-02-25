/**
 * @file primitives/date-range-field/contract.ts
 * @kind date-range-field
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Date range field PrimitiveContract — two segmented date fields for range input.
 *
 * ariaStateProvider: "meltui"
 * Builder: new DateRangeField()
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { DateRangeFieldSlot, DateRangeFieldState } from "./types.js";

export const contract = {
	kind: "date-range-field",
	ariaStateProvider: "meltui",

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		required: ["root", "start-segment", "end-segment", "label"],
		optional: ["separator"],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: {
				role: "group",
				required: [],
				optional: ["aria-labelledby", "aria-describedby"],
			},
		},
		"start-segment": {
			element: "span",
			children: "snippet",
			aria: {
				role: "spinbutton",
				required: ["aria-valuemin", "aria-valuemax", "aria-valuenow"],
				optional: ["aria-valuetext", "aria-label", "aria-readonly"],
			},
		},
		"end-segment": {
			element: "span",
			children: "snippet",
			aria: {
				role: "spinbutton",
				required: ["aria-valuemin", "aria-valuemax", "aria-valuenow"],
				optional: ["aria-valuetext", "aria-label", "aria-readonly"],
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
		separator: {
			element: "span",
			children: "snippet",
			aria: {
				role: "presentation",
				required: [],
				optional: [],
			},
		},
	},

	// ─── State ───────────────────────────────────────────────────────────────
	states: {
		shared: ["focused", "focus-visible", "disabled", "invalid", "readonly"],
		specific: [],
	},

	slotStates: {
		root: ["focused", "focus-visible", "disabled", "invalid", "readonly"],
		"start-segment": ["focused", "focus-visible", "disabled", "readonly"],
		"end-segment": ["focused", "focus-visible", "disabled", "readonly"],
		label: [],
		separator: [],
	},

	slotActions: {
		root: [],
		"start-segment": ["increment", "decrement"],
		"end-segment": ["increment", "decrement"],
		label: [],
		separator: [],
	},

	// ─── ARIA ─────────────────────────────────────────────────────────────────
	aria: {
		role: "group",
		requiredAttrs: [],
		optionalAttrs: ["aria-labelledby", "aria-describedby"],
	},

	// ─── Keyboard (WAI-ARIA APG: Spinbutton) ──────────────────────────────────
	keyboard: ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab", "Enter"],

	// ─── Behavior ─────────────────────────────────────────────────────────────
	focusStrategy: "roving",
	compound: true,
} as const satisfies PrimitiveContract<"date-range-field", DateRangeFieldSlot, DateRangeFieldState>;
