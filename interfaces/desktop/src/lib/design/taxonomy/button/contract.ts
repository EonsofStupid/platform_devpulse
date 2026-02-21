/**
 * @file taxonomy/button/contract.ts
 * @package @devpulse/coldlight
 *
 * Button PrimitiveContract — the SSOT declaration for what the button primitive is.
 *
 * ariaStateProvider: "coldlight" — ColdLight owns ARIA directly.
 * No adapter. Native <button> semantics. WAI-ARIA APG: Button Pattern.
 *
 * Reference: https://www.w3.org/WAI/ARIA/apg/patterns/button/
 */

import type { PrimitiveContract } from "../kinds/primitives/types.js";
import type { ButtonSlot, ButtonState } from "./types.js";

export const contract = {
	kind: "button",
	ariaStateProvider: "coldlight",

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		required: ["root"],
		optional: ["icon", "label"],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "button",
			children: "snippet",
			aria: {
				role: "button",
				required: [],
				optional: ["aria-label", "aria-describedby", "aria-pressed", "aria-disabled", "aria-busy"],
			},
		},
		icon: {
			element: "span",
			children: "snippet",
			aria: {
				required: [],
				optional: ["aria-hidden"],
			},
		},
		label: {
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
		specific: ["pressed", "loading", "busy", "active"],
	},

	slotStates: {
		root: ["focused", "focus-visible", "hover", "active", "disabled", "pressed", "loading", "busy"],
		icon: [],
		label: [],
	},

	slotActions: {
		root: ["submit"],
		icon: [],
		label: [],
	},

	// ─── ARIA ─────────────────────────────────────────────────────────────────
	aria: {
		role: "button",
		requiredAttrs: [],
		optionalAttrs: [
			"aria-label",
			"aria-describedby",
			"aria-pressed",
			"aria-disabled",
			"aria-busy",
		],
	},

	// ─── Keyboard (WAI-ARIA APG: Button) ─────────────────────────────────────
	// Enter: activates the button
	// Space: activates the button
	keyboard: ["Enter", "Space"],

	// ─── Behavior ─────────────────────────────────────────────────────────────
	focusStrategy: "none",
	compound: false,
} as const satisfies PrimitiveContract<"button", ButtonSlot, ButtonState>;
