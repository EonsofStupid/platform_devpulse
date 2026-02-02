/**
 * @file Combobox Taxonomy Contract
 * @description ColdLight SSOT contract for the combobox primitive.
 *
 * ariaStateProvider: "meltui" — createCombobox provides ARIA roles, keyboard nav, and filtering.
 * 3-folder parity: taxonomy + adapter + primitive.
 *
 * WAI-ARIA: Combobox pattern. role="combobox" on input, role="listbox" on content.
 * Keyboard: ArrowUp/Down to navigate, Enter to select, Escape to close.
 * Root is renderless (fragment). Input is self-closing.
 */

import type { PrimitiveContract } from "../../../types.js";
import { comboboxSlotStates, type ComboboxSlot, type ComboboxState } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** Combobox primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"combobox", ComboboxSlot, ComboboxState> = {
	kind: "combobox",
	ariaStateProvider: "meltui",
	slots: {
		required: ["root", "input", "content"],
		optional: ["trigger", "item", "group", "empty"],
		forbidden: [],
	},
	slotSpec: {
		root: {
			element: "fragment",
			children: "renderless",
			aria: { required: [], optional: [] },
		},
		input: {
			element: "input",
			children: "self-closing",
			aria: { role: "combobox", required: ["aria-expanded", "aria-controls"], optional: ["aria-label", "aria-autocomplete", "aria-activedescendant"] },
		},
		trigger: {
			element: "button",
			children: "snippet",
			aria: { role: "button", required: [], optional: ["aria-label"] },
		},
		content: {
			element: "div",
			children: "snippet",
			aria: { role: "listbox", required: [], optional: ["aria-label"] },
		},
		item: {
			element: "div",
			children: "snippet",
			aria: { role: "option", required: [], optional: ["aria-selected", "aria-disabled"] },
		},
		group: {
			element: "div",
			children: "snippet",
			aria: { role: "group", required: [], optional: ["aria-label", "aria-labelledby"] },
		},
		empty: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
	},
	states: {
		shared: ["hover", "active", "focused", "focus-visible", "disabled"],
		specific: ["open", "closed", "selected", "checked"],
	},
	slotStates: comboboxSlotStates,
	slotActions: {
		root: [],
		input: [],
		trigger: ["open", "close", "toggle"],
		content: [],
		item: ["select"],
		group: [],
		empty: [],
	},
	aria: {
		role: "combobox",
		requiredAttrs: ["aria-expanded", "aria-controls"],
		optionalAttrs: ["aria-label", "aria-autocomplete", "aria-activedescendant", "aria-selected", "aria-disabled", "aria-haspopup"],
	},
	keyboard: ["ArrowUp", "ArrowDown", "Enter", "Escape", "Home", "End"],
	focusStrategy: "activedescendant",
	compound: true,
};
