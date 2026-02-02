/**
 * @file DropdownMenu Taxonomy Contract
 * @description ColdLight SSOT contract for the dropdown-menu primitive.
 *
 * ariaStateProvider: "meltui" — createDropdownMenu provides ARIA roles, keyboard nav, and dismiss behavior.
 * 2-folder parity: taxonomy + primitive.
 *
 * WAI-ARIA: role="menu" with menuitem, menuitemcheckbox, menuitemradio children.
 * Supports nested submenus, checkbox items, radio groups, and separators.
 * Roving tabindex for keyboard navigation between items.
 */

import type { PrimitiveContract } from "../../../types.js";
import { dropdownMenuSlotStates, type DropdownMenuSlot, type DropdownMenuState } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** DropdownMenu primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"dropdown-menu", DropdownMenuSlot, DropdownMenuState> = {
	kind: "dropdown-menu",
	ariaStateProvider: "meltui",
	slots: {
		required: ["root", "trigger", "content"],
		optional: ["group", "item", "checkbox-item", "radio-group", "radio-item", "label", "separator", "sub", "sub-trigger", "sub-content"],
		forbidden: [],
	},
	slotSpec: {
		root: {
			element: "fragment",
			children: "renderless",
			aria: { required: [], optional: [] },
		},
		trigger: {
			element: "button",
			children: "snippet",
			aria: { role: "button", required: ["aria-haspopup", "aria-expanded"], optional: ["aria-controls", "aria-label"] },
		},
		content: {
			element: "div",
			children: "snippet",
			aria: { role: "menu", required: ["aria-labelledby"], optional: ["aria-label", "aria-orientation"] },
		},
		group: {
			element: "div",
			children: "snippet",
			aria: { role: "group", required: [], optional: ["aria-label"] },
		},
		item: {
			element: "div",
			children: "snippet",
			aria: { role: "menuitem", required: [], optional: ["aria-label", "aria-disabled"] },
		},
		"checkbox-item": {
			element: "div",
			children: "snippet",
			aria: { role: "menuitemcheckbox", required: ["aria-checked"], optional: ["aria-label", "aria-disabled"] },
		},
		"radio-group": {
			element: "div",
			children: "snippet",
			aria: { role: "group", required: [], optional: ["aria-label"] },
		},
		"radio-item": {
			element: "div",
			children: "snippet",
			aria: { role: "menuitemradio", required: ["aria-checked"], optional: ["aria-label", "aria-disabled"] },
		},
		label: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
		separator: {
			element: "div",
			children: "snippet",
			aria: { role: "separator", required: [], optional: [] },
		},
		sub: {
			element: "fragment",
			children: "renderless",
			aria: { required: [], optional: [] },
		},
		"sub-trigger": {
			element: "div",
			children: "snippet",
			aria: { role: "menuitem", required: ["aria-haspopup", "aria-expanded"], optional: ["aria-label", "aria-disabled"] },
		},
		"sub-content": {
			element: "div",
			children: "snippet",
			aria: { role: "menu", required: ["aria-labelledby"], optional: ["aria-label"] },
		},
	},
	states: {
		shared: ["hover", "active", "focused", "focus-visible", "disabled"],
		specific: ["open", "closed", "checked", "indeterminate"],
	},
	slotStates: dropdownMenuSlotStates,
	slotActions: {
		root: [],
		trigger: ["open"],
		content: [],
		group: [],
		item: ["select"],
		"checkbox-item": ["check", "uncheck"],
		"radio-group": [],
		"radio-item": ["select"],
		label: [],
		separator: [],
		sub: [],
		"sub-trigger": ["open"],
		"sub-content": [],
	},
	aria: {
		role: "menu",
		requiredAttrs: [],
		optionalAttrs: ["aria-label", "aria-labelledby", "aria-orientation", "aria-haspopup", "aria-expanded", "aria-controls", "aria-checked", "aria-disabled"],
	},
	keyboard: ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", "Space", "Escape", "Home", "End"],
	focusStrategy: "roving",
	compound: true,
	orientation: "vertical",
	dismissBehavior: { escape: true, outsideClick: true },
};
