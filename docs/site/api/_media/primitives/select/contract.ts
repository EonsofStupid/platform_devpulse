/**
 * @file primitives/select/contract.ts
 * @kind select
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Select PrimitiveContract — SSOT declaration for the select primitive.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "meltui"
 *   MeltUI adapter handles ARIA via transport chain.
 *   Complex compound widget with activedescendant focus management.
 *   3-folder parity enforced by scanner: primitives/select/ + api/adapters/meltui/_internal/select/
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { SelectSlot, SelectState } from "./types.js";

export const contract = {
	kind: "select",
	ariaStateProvider: "meltui",

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		required: ["trigger", "content", "option"],
		optional: ["label"],
		forbidden: [],
	},

	slotSpec: {
		trigger: {
			element: "button",
			children: "snippet",
			aria: {
				role: "combobox",
				required: ["aria-expanded", "aria-haspopup"],
				optional: ["aria-label", "aria-labelledby", "aria-disabled", "aria-controls"],
			},
		},
		content: {
			element: "div",
			children: "snippet",
			aria: {
				role: "listbox",
				required: [],
				optional: ["aria-label", "aria-labelledby"],
			},
		},
		option: {
			element: "div",
			children: "snippet",
			aria: {
				role: "option",
				required: ["aria-selected"],
				optional: ["aria-disabled"],
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
		shared: ["focused", "focus-visible", "hover", "disabled", "selected"],
		specific: ["open", "closed"],
	},

	slotStates: {
		trigger: ["open", "focused", "focus-visible", "hover", "disabled"],
		content: ["open", "closed"],
		option: ["selected", "focused", "hover", "disabled"],
		label: ["disabled"],
	},

	slotActions: {
		trigger: ["open", "close", "toggle"],
		content: [],
		option: ["select"],
		label: [],
	},

	// ─── ARIA ─────────────────────────────────────────────────────────────────
	aria: {
		role: "listbox",
		requiredAttrs: [],
		optionalAttrs: ["aria-label", "aria-labelledby", "aria-multiselectable"],
	},

	// ─── Keyboard (WAI-ARIA APG: Listbox) ─────────────────────────────────────
	// ArrowDown: open listbox / move to next option
	// ArrowUp: open listbox / move to previous option
	// Home: move to first option
	// End: move to last option
	// Enter/Space: select focused option
	// Escape: close listbox
	// Tab: accept and move focus
	keyboard: ["ArrowDown", "ArrowUp", "Home", "End", "Enter", "Space", "Escape", "Tab"],

	// ─── Behavior ─────────────────────────────────────────────────────────────
	focusStrategy: "activedescendant",
	compound: true,
} as const satisfies PrimitiveContract<"select", SelectSlot, SelectState>;
