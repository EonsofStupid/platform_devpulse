/**
 * @file primitives/radio-group/contract.ts
 * @kind radio-group
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Radio group PrimitiveContract — SSOT declaration for the radio-group primitive.
 * Lives WITH the implementation per ColdLight architecture (locked 2026-02-21).
 *
 * ariaStateProvider: "meltui"
 *   MeltUI adapter handles ARIA via transport chain, 3-folder parity enforced.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/radio/
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { RadioGroupSlot, RadioGroupState } from "./types.js";

export const contract = {
	kind: "radio-group",
	ariaStateProvider: "meltui",

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		required: ["root", "item"],
		optional: [],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: {
				role: "radiogroup",
				required: [],
				optional: ["aria-label", "aria-labelledby", "aria-orientation", "aria-required"],
			},
		},
		item: {
			element: "button",
			children: "snippet",
			aria: {
				role: "radio",
				required: ["aria-checked"],
				optional: ["aria-disabled", "aria-label"],
			},
		},
	},

	// ─── State ───────────────────────────────────────────────────────────────
	states: {
		shared: ["focused", "focus-visible", "hover", "disabled"],
		specific: ["checked"],
	},

	slotStates: {
		root: [],
		item: ["checked", "focused", "focus-visible", "hover", "disabled"],
	},

	slotActions: {
		root: [],
		item: ["select"],
	},

	// ─── ARIA ─────────────────────────────────────────────────────────────────
	aria: {
		role: "radiogroup",
		requiredAttrs: [],
		optionalAttrs: ["aria-label", "aria-labelledby", "aria-orientation", "aria-required"],
	},

	// ─── Keyboard (WAI-ARIA APG: Radio Group) ─────────────────────────────────
	// ArrowDown/ArrowRight: move focus to next radio + select
	// ArrowUp/ArrowLeft: move focus to previous radio + select
	// Space: select focused radio
	keyboard: ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Space"],

	// ─── Behavior ─────────────────────────────────────────────────────────────
	focusStrategy: "roving",
	compound: true,
	orientation: "vertical",
} as const satisfies PrimitiveContract<"radio-group", RadioGroupSlot, RadioGroupState>;
