/**
 * @file primitives/date-field/contract.ts
 * @kind date-field
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Date field PrimitiveContract — segmented date input fields with spinbutton segments.
 *
 * ariaStateProvider: "meltui"
 * Builder: new DateField()
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { DateFieldSlot, DateFieldState } from "./types.js";

export const contract = {
	kind: "date-field",
	ariaStateProvider: "meltui",

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		required: ["root", "segment", "label"],
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
				optional: ["aria-labelledby", "aria-describedby"],
			},
		},
		segment: {
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
	},

	// ─── State ───────────────────────────────────────────────────────────────
	states: {
		shared: ["focused", "focus-visible", "disabled", "invalid", "readonly"],
		specific: [],
	},

	slotStates: {
		root: ["focused", "focus-visible", "disabled", "invalid", "readonly"],
		segment: ["focused", "focus-visible", "disabled", "readonly"],
		label: [],
	},

	slotActions: {
		root: [],
		segment: ["increment", "decrement"],
		label: [],
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
} as const satisfies PrimitiveContract<"date-field", DateFieldSlot, DateFieldState>;
