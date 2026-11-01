/**
 * @file primitives/slider/contract.ts
 * @kind slider
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Slider PrimitiveContract — SSOT declaration for the slider primitive.
 * Lives WITH the implementation per ColdLight architecture (locked 2026-02-21).
 *
 * ariaStateProvider: "meltui"
 *   MeltUI adapter handles ARIA via transport chain, 3-folder parity enforced.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/slider/
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { SliderSlot, SliderState } from "./types.js";

export const contract = {
	kind: "slider",
	ariaStateProvider: "meltui",

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		required: ["root", "thumb"],
		optional: ["range"],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: {
				role: "none",
				required: [],
				optional: ["aria-label", "aria-labelledby"],
			},
		},
		thumb: {
			element: "span",
			children: "snippet",
			aria: {
				role: "slider",
				required: ["aria-valuenow", "aria-valuemin", "aria-valuemax"],
				optional: ["aria-label", "aria-valuetext", "aria-orientation", "aria-disabled"],
			},
		},
		range: {
			element: "span",
			children: "snippet",
			aria: {
				required: [],
				optional: [],
			},
		},
	},

	// ─── State ───────────────────────────────────────────────────────────────
	states: {
		shared: ["focused", "focus-visible", "hover", "disabled"],
		specific: [],
	},

	slotStates: {
		root: ["disabled"],
		thumb: ["focused", "focus-visible", "hover", "disabled"],
		range: [],
	},

	slotActions: {
		root: [],
		thumb: ["increment", "decrement"],
		range: [],
	},

	// ─── ARIA ─────────────────────────────────────────────────────────────────
	aria: {
		role: "slider",
		requiredAttrs: ["aria-valuenow", "aria-valuemin", "aria-valuemax"],
		optionalAttrs: ["aria-label", "aria-valuetext", "aria-orientation", "aria-disabled"],
	},

	// ─── Keyboard (WAI-ARIA APG: Slider) ──────────────────────────────────────
	// ArrowUp/ArrowRight: increment value
	// ArrowDown/ArrowLeft: decrement value
	// Home: set to minimum value
	// End: set to maximum value
	// PageUp: increment by large step
	// PageDown: decrement by large step
	keyboard: ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown"],

	// ─── Behavior ─────────────────────────────────────────────────────────────
	focusStrategy: "none",
	compound: true,
	orientation: "horizontal",
} as const satisfies PrimitiveContract<"slider", SliderSlot, SliderState>;
