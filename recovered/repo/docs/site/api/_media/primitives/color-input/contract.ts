/**
 * @file primitives/color-input/contract.ts
 * @kind color-input
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * ColorInput PrimitiveContract — Color picker input with swatch preview.
 *
 * ariaStateProvider: "coldlight"
 *   ColdLight owns ARIA directly. No adapter. Native <input type="color"> semantics.
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { ColorInputSlot, ColorInputState } from "./types.js";

export const contract = {
	kind: "color-input",
	ariaStateProvider: "coldlight",

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		required: ["root", "swatch", "input"],
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
		swatch: {
			element: "span",
			children: "snippet",
			aria: {
				role: "presentation",
				required: [],
				optional: [],
			},
		},
		input: {
			element: "input",
			children: "self-closing",
			aria: {
				role: "none",
				required: [],
				optional: ["aria-label", "aria-describedby", "aria-invalid", "aria-required", "aria-disabled"],
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
		specific: [],
	},

	slotStates: {
		root: ["disabled", "invalid"],
		swatch: [],
		input: ["focused", "focus-visible", "disabled", "invalid"],
		label: [],
	},

	slotActions: {
		root: [],
		swatch: [],
		input: [],
		label: [],
	},

	// ─── ARIA ─────────────────────────────────────────────────────────────────
	aria: {
		role: "group",
		requiredAttrs: [],
		optionalAttrs: ["aria-labelledby", "aria-label"],
	},

	// ─── Keyboard ─────────────────────────────────────────────────────────────
	keyboard: ["Enter", "Space"],

	// ─── Behavior ─────────────────────────────────────────────────────────────
	focusStrategy: "none",
	compound: true,
} as const satisfies PrimitiveContract<"color-input", ColorInputSlot, ColorInputState>;
