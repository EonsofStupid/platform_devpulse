/**
 * @file primitives/combobox/contract.ts
 * @kind combobox
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Combobox PrimitiveContract — SSOT declaration for the combobox primitive.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "meltui"
 *   MeltUI adapter handles ARIA via transport chain.
 *   Complex compound widget with activedescendant focus management.
 *   3-folder parity enforced by scanner: primitives/combobox/ + api/adapters/meltui/_internal/combobox/
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { ComboboxSlot, ComboboxState } from "./types.js";

export const contract = {
	kind: "combobox",
	ariaStateProvider: "meltui",

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		required: ["input", "trigger", "content", "option"],
		optional: ["label"],
		forbidden: [],
	},

	slotSpec: {
		input: {
			element: "input",
			children: "self-closing",
			aria: {
				role: "combobox",
				required: ["aria-expanded", "aria-controls", "aria-autocomplete"],
				optional: ["aria-activedescendant", "aria-label", "aria-labelledby", "aria-describedby", "aria-invalid", "aria-required"],
			},
		},
		trigger: {
			element: "button",
			children: "snippet",
			aria: {
				role: "button",
				required: [],
				optional: ["aria-label"],
			},
		},
		content: {
			element: "div",
			children: "snippet",
			aria: {
				role: "listbox",
				required: [],
				optional: ["aria-label"],
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
			element: "label",
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
		input: ["focused", "focus-visible", "disabled"],
		trigger: ["open", "focused", "hover"],
		content: ["open", "closed"],
		option: ["selected", "focused", "hover", "disabled"],
		label: ["disabled"],
	},

	slotActions: {
		input: ["open", "close", "filter"],
		trigger: ["toggle"],
		content: [],
		option: ["select"],
		label: [],
	},

	// ─── ARIA ─────────────────────────────────────────────────────────────────
	aria: {
		role: "combobox",
		requiredAttrs: ["aria-expanded"],
		optionalAttrs: ["aria-autocomplete", "aria-activedescendant", "aria-label", "aria-labelledby"],
	},

	// ─── Keyboard (WAI-ARIA APG: Combobox) ────────────────────────────────────
	// ArrowDown: open listbox / move to next option
	// ArrowUp: open listbox / move to previous option
	// Home: move to first option
	// End: move to last option
	// Enter: accept focused option
	// Escape: close listbox
	// Tab: accept and move focus
	keyboard: ["ArrowDown", "ArrowUp", "Home", "End", "Enter", "Escape", "Tab"],

	// ─── Behavior ─────────────────────────────────────────────────────────────
	focusStrategy: "activedescendant",
	compound: true,
} as const satisfies PrimitiveContract<"combobox", ComboboxSlot, ComboboxState>;
