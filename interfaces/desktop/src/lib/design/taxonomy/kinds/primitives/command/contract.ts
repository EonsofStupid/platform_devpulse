/**
 * @file Command Taxonomy Contract
 * @description ColdLight SSOT contract for the command primitive.
 *
 * ariaStateProvider: "coldlight" — native combobox/listbox pattern with activedescendant focus.
 * 2-folder parity: taxonomy + primitive.
 *
 * WAI-ARIA: role="combobox" root with searchbox input and listbox results.
 * Activedescendant focus for keyboard navigation through filtered items.
 * Supports grouping, empty state, and separator slots.
 */

import type { PrimitiveContract } from "../../../types.js";
import { commandSlotStates, type CommandSlot, type CommandState } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** Command primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"command", CommandSlot, CommandState> = {
	kind: "command",
	ariaStateProvider: "coldlight",
	slots: {
		required: ["root", "input", "list"],
		optional: ["group", "item", "empty", "separator"],
		forbidden: [],
	},
	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: { role: "combobox", required: ["aria-expanded"], optional: ["aria-label", "aria-haspopup"] },
		},
		input: {
			element: "input",
			children: "self-closing",
			aria: { role: "searchbox", required: [], optional: ["aria-label", "aria-autocomplete", "aria-controls", "aria-activedescendant"] },
		},
		list: {
			element: "div",
			children: "snippet",
			aria: { role: "listbox", required: [], optional: ["aria-label"] },
		},
		group: {
			element: "div",
			children: "snippet",
			aria: { role: "group", required: [], optional: ["aria-label", "aria-labelledby"] },
		},
		item: {
			element: "div",
			children: "snippet",
			aria: { role: "option", required: [], optional: ["aria-label", "aria-disabled", "aria-selected"] },
		},
		empty: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
		separator: {
			element: "div",
			children: "snippet",
			aria: { role: "separator", required: [], optional: [] },
		},
	},
	states: {
		shared: ["hover", "active", "focused", "focus-visible", "disabled"],
		specific: ["selected"],
	},
	slotStates: commandSlotStates,
	slotActions: {
		root: [],
		input: [],
		list: [],
		group: [],
		item: ["select"],
		empty: [],
		separator: [],
	},
	aria: {
		role: "combobox",
		requiredAttrs: ["aria-expanded"],
		optionalAttrs: ["aria-label", "aria-haspopup", "aria-autocomplete", "aria-controls", "aria-activedescendant", "aria-selected", "aria-disabled"],
	},
	keyboard: ["ArrowUp", "ArrowDown", "Enter", "Escape", "Home", "End"],
	focusStrategy: "activedescendant",
	compound: true,
};
