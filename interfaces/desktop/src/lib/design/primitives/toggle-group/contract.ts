/**
 * @file primitives/toggle-group/contract.ts
 * @kind toggle-group
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Toggle-group PrimitiveContract — SSOT declaration for the toggle-group primitive.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight"
 *   ColdLight owns ARIA directly. No adapter. Roving tabindex for keyboard nav.
 *   2-folder parity enforced by scanner: primitives/toggle-group/ (colocated contract + implementation)
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/ (toggle group pattern)
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { ToggleGroupSlot, ToggleGroupState } from "./types.js";

export const contract = {
	kind: "toggle-group",
	ariaStateProvider: "coldlight",

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
				role: "group",
				required: [],
				optional: ["aria-label", "aria-orientation"],
			},
		},
		item: {
			element: "button",
			children: "snippet",
			aria: {
				role: "button",
				required: ["aria-pressed"],
				optional: ["aria-disabled"],
			},
		},
	},

	// ─── State ───────────────────────────────────────────────────────────────
	states: {
		shared: ["focused", "focus-visible", "hover", "disabled"],
		specific: ["pressed"],
	},

	slotStates: {
		root: [],
		item: ["pressed", "focused", "focus-visible", "hover", "disabled"],
	},

	slotActions: {
		root: [],
		item: ["toggle"],
	},

	// ─── ARIA ─────────────────────────────────────────────────────────────────
	aria: {
		role: "group",
		requiredAttrs: [],
		optionalAttrs: ["aria-label", "aria-orientation"],
	},

	// ─── Keyboard ─────────────────────────────────────────────────────────────
	keyboard: ["ArrowLeft", "ArrowRight", "Enter", "Space"],

	// ─── Behavior ─────────────────────────────────────────────────────────────
	focusStrategy: "roving",
	compound: true,
	orientation: "horizontal",
} as const satisfies PrimitiveContract<"toggle-group", ToggleGroupSlot, ToggleGroupState>;
