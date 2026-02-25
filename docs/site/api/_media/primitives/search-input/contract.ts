/**
 * @file primitives/search-input/contract.ts
 * @kind search-input
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Search-input PrimitiveContract — SSOT declaration for the search-input primitive.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight"
 *   ColdLight owns ARIA directly. No adapter.
 *   2-folder parity enforced by scanner: primitives/search-input/ (colocated contract + implementation)
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { SearchInputSlot, SearchInputState } from "./types.js";

export const contract = {
	kind: "search-input",
	ariaStateProvider: "coldlight",

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		required: ["root", "input"],
		optional: ["icon", "clear"],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: {
				role: "search",
				required: [],
				optional: ["aria-label"],
			},
		},
		input: {
			element: "input",
			children: "self-closing",
			aria: {
				role: "searchbox",
				required: [],
				optional: ["aria-label", "aria-describedby"],
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
		clear: {
			element: "button",
			children: "snippet",
			aria: {
				role: "button",
				required: [],
				optional: ["aria-label"],
			},
		},
	},

	// ─── State ───────────────────────────────────────────────────────────────
	states: {
		shared: ["focused", "focus-visible", "hover", "disabled"],
		specific: [],
	},

	slotStates: {
		root: ["focused", "focus-visible", "hover", "disabled"],
		input: ["focused", "focus-visible", "disabled"],
		icon: [],
		clear: ["hover", "focused", "focus-visible"],
	},

	slotActions: {
		root: [],
		input: ["focus", "blur", "filter"],
		icon: [],
		clear: ["dismiss"],
	},

	// ─── ARIA ─────────────────────────────────────────────────────────────────
	aria: {
		role: "search",
		requiredAttrs: [],
		optionalAttrs: ["aria-label"],
	},

	// ─── Keyboard ─────────────────────────────────────────────────────────────
	// Escape clears the search input
	keyboard: ["Escape"],

	// ─── Behavior ─────────────────────────────────────────────────────────────
	focusStrategy: "none",
	compound: true,
} as const satisfies PrimitiveContract<"search-input", SearchInputSlot, SearchInputState>;
