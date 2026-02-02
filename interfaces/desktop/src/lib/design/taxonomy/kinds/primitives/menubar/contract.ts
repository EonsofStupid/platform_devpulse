/**
 * @file Menubar Taxonomy Contract
 * @description ColdLight SSOT contract for the menubar primitive.
 *
 * ariaStateProvider: "meltui" — createMenubar provides roving tabindex + menu management.
 * 3-folder parity: taxonomy + primitive + adapter.
 *
 * WAI-ARIA: role="menubar" container with nested menu triggers, items,
 * checkbox items, radio groups, submenus, and separators.
 * Roving tabindex for keyboard navigation between top-level triggers.
 */

import type { PrimitiveContract } from "../../../types.js";
import { menubarSlotStates, type MenubarSlot, type MenubarState } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** Menubar primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"menubar", MenubarSlot, MenubarState> = {
	kind: "menubar",
	ariaStateProvider: "meltui",
	slots: {
		required: ["root", "menu", "trigger", "content"],
		optional: ["group", "item", "checkbox-item", "radio-group", "radio-item", "label", "separator", "sub", "sub-trigger", "sub-content"],
		forbidden: [],
	},
	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: { role: "menubar", required: [], optional: ["aria-label", "aria-orientation"] },
		},
		menu: {
			element: "fragment",
			children: "renderless",
			aria: { required: [], optional: [] },
		},
		trigger: {
			element: "button",
			children: "snippet",
			aria: { role: "menuitem", required: ["aria-haspopup", "aria-expanded"], optional: ["aria-controls", "aria-label"] },
		},
		content: {
			element: "div",
			children: "snippet",
			aria: { role: "menu", required: ["aria-labelledby"], optional: ["aria-label"] },
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
	slotStates: menubarSlotStates,
	slotActions: {
		root: [],
		menu: [],
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
		role: "menubar",
		requiredAttrs: [],
		optionalAttrs: [
			"aria-label",
			"aria-orientation",
			"aria-labelledby",
			"aria-haspopup",
			"aria-expanded",
			"aria-controls",
			"aria-checked",
			"aria-disabled",
		],
	},
	keyboard: ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", "Space", "Escape", "Home", "End"],
	focusStrategy: "roving",
	compound: true,
	orientation: "horizontal",
	dismissBehavior: { escape: true, outsideClick: true },
};
