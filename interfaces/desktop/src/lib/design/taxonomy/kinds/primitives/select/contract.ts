/**
 * @file Select Taxonomy Contract
 * @description ColdLight SSOT contract for the select primitive.
 *
 * ariaStateProvider: "meltui" — dsAdapter (createSelect) provides ARIA + state.
 * 3-folder parity: taxonomy + adapter + primitive.
 * Dropdown selection with listbox keyboard navigation and type-ahead.
 */

import type { PrimitiveContract } from "../../../types.js";
import { selectSlotStates, type SelectSlot, type SelectState } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** Select primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"select", SelectSlot, SelectState> = {
	kind: "select",
	ariaStateProvider: "meltui",
	slots: {
		required: ["root", "trigger", "content", "item"],
		optional: ["value", "viewport", "item-text", "group", "label", "separator"],
		forbidden: [],
	},
	slotSpec: {
		root: { element: "fragment", children: "renderless", aria: { required: [], optional: [] } },
		trigger: { element: "button", children: "snippet", aria: { role: "combobox", required: ["aria-expanded", "aria-haspopup", "aria-controls"], optional: ["aria-label", "aria-labelledby", "aria-disabled", "aria-autocomplete", "aria-activedescendant"] } },
		value: { element: "span", children: "snippet", aria: { required: [], optional: [] } },
		content: { element: "div", children: "snippet", aria: { role: "listbox", required: [], optional: ["aria-label", "aria-labelledby", "aria-multiselectable"] } },
		viewport: { element: "div", children: "snippet", aria: { required: [], optional: [] } },
		item: { element: "div", children: "snippet", aria: { role: "option", required: ["aria-selected"], optional: ["aria-disabled"] } },
		"item-text": { element: "span", children: "snippet", aria: { required: [], optional: [] } },
		group: { element: "div", children: "snippet", aria: { role: "group", required: [], optional: ["aria-labelledby"] } },
		label: { element: "div", children: "snippet", aria: { required: [], optional: [] } },
		separator: { element: "div", children: "snippet", aria: { role: "separator", required: [], optional: [] } },
	},
	states: {
		shared: ["focused", "focus-visible", "focus-within", "hover", "active", "disabled"],
		specific: ["open", "selected", "hidden", "visible"],
	},
	slotStates: selectSlotStates,
	slotActions: {
		root: [],
		trigger: ["open"],
		value: [],
		content: [],
		viewport: [],
		item: ["select"],
		"item-text": [],
		group: [],
		label: [],
		separator: [],
	},
	aria: {
		role: "listbox",
		requiredAttrs: ["aria-expanded", "aria-selected", "aria-controls"],
		optionalAttrs: [
			"aria-activedescendant",
			"aria-label",
			"aria-labelledby",
			"aria-disabled",
			"aria-describedby",
			"aria-orientation",
		],
	},
	keyboard: ["ArrowUp", "ArrowDown", "Enter", "Space", "Escape", "Home", "End"],
	focusStrategy: "activedescendant",
	compound: true,
	orientation: "vertical",
	dismissBehavior: { escape: true, outsideClick: true },
};
