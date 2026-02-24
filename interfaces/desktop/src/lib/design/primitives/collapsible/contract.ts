/**
 * @file primitives/collapsible/contract.ts
 * @kind collapsible
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Collapsible PrimitiveContract — SSOT declaration for the collapsible primitive.
 * Lives WITH the implementation per ColdLight architecture (locked 2026-02-21).
 *
 * ariaStateProvider: "meltui"
 *   MeltUI adapter handles ARIA via transport chain, 3-folder parity enforced.
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { CollapsibleSlot, CollapsibleState } from "./types.js";

export const contract = {
	kind: "collapsible",
	ariaStateProvider: "meltui",

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		required: ["trigger", "content"],
		optional: [],
		forbidden: [],
	},

	slotSpec: {
		trigger: {
			element: "button",
			children: "snippet",
			aria: {
				role: "button",
				required: ["aria-expanded", "aria-controls"],
				optional: ["aria-disabled"],
			},
		},
		content: {
			element: "div",
			children: "snippet",
			aria: {
				role: "region",
				required: [],
				optional: ["aria-labelledby"],
			},
		},
	},

	// ─── State ───────────────────────────────────────────────────────────────
	states: {
		shared: ["focused", "focus-visible", "hover", "disabled"],
		specific: ["open", "closed"],
	},

	slotStates: {
		trigger: ["open", "focused", "focus-visible", "hover", "disabled"],
		content: ["open", "closed"],
	},

	slotActions: {
		trigger: ["toggle"],
		content: [],
	},

	// ─── ARIA ─────────────────────────────────────────────────────────────────
	aria: {
		role: "none",
		requiredAttrs: [],
		optionalAttrs: [],
	},

	// ─── Keyboard (Collapsible: Disclosure pattern) ───────────────────────────
	// Enter: toggles the collapsible
	// Space: toggles the collapsible
	keyboard: ["Enter", "Space"],

	// ─── Behavior ─────────────────────────────────────────────────────────────
	focusStrategy: "none",
	compound: true,
} as const satisfies PrimitiveContract<"collapsible", CollapsibleSlot, CollapsibleState>;
