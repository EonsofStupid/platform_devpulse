/**
 * @file DropdownMenu Taxonomy Contract
 * @description ColdLight SSOT contract for the dropdown-menu primitive.
 *
 * ariaStateProvider: "coldlight" — createDropdownMenu provides ARIA roles, keyboard nav, and dismiss behavior.
 * 2-folder parity: taxonomy + primitive.
 *
 * Reference: W3C WAI-ARIA APG Menu Button Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/
 *
 * WAI-ARIA: role="menu" with menuitem, menuitemcheckbox, menuitemradio children.
 * Supports nested submenus, checkbox items, radio groups, and separators.
 * Roving tabindex for keyboard navigation between items.
 */

import { type PrimitiveContract, parseContract } from "../../../primitive/contract.js";
import { dropdownMenuSlotStates } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/**
 * DropdownMenu primitive contract — ColdLight SSOT
 *
 * Validated at import time via Zod. Invalid contracts fail hard.
 */
const rawContract = {
	kind: "dropdown-menu",
	ariaStateProvider: "coldlight",

	// ═══ SLOTS ═══════════════════════════════════════════════════════════════
	slots: {
		required: ["root", "trigger", "content"],
		optional: [
			"group",
			"item",
			"checkbox-item",
			"radio-group",
			"radio-item",
			"label",
			"separator",
			"sub",
			"sub-trigger",
			"sub-content",
		],
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
			aria: {
				role: "button",
				required: ["aria-haspopup", "aria-expanded"],
				optional: ["aria-controls", "aria-label"],
			},
		},
		content: {
			element: "div",
			children: "snippet",
			aria: {
				role: "menu",
				required: ["aria-labelledby"],
				optional: ["aria-label", "aria-orientation"],
			},
		},
		group: {
			element: "div",
			children: "snippet",
			aria: {
				role: "group",
				required: [],
				optional: ["aria-label", "aria-labelledby"],
			},
		},
		item: {
			element: "div",
			children: "snippet",
			aria: {
				role: "menuitem",
				required: [],
				optional: ["aria-label", "aria-disabled"],
			},
		},
		"checkbox-item": {
			element: "div",
			children: "snippet",
			aria: {
				role: "menuitemcheckbox",
				required: ["aria-checked"],
				optional: ["aria-label", "aria-disabled"],
			},
		},
		"radio-group": {
			element: "div",
			children: "snippet",
			aria: {
				role: "group",
				required: [],
				optional: ["aria-label"],
			},
		},
		"radio-item": {
			element: "div",
			children: "snippet",
			aria: {
				role: "menuitemradio",
				required: ["aria-checked"],
				optional: ["aria-label", "aria-disabled"],
			},
		},
		label: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
		separator: {
			element: "div",
			children: "snippet",
			aria: { role: "separator", required: [], optional: ["aria-orientation"] },
		},
		sub: {
			element: "fragment",
			children: "renderless",
			aria: { required: [], optional: [] },
		},
		"sub-trigger": {
			element: "div",
			children: "snippet",
			aria: {
				role: "menuitem",
				required: ["aria-haspopup", "aria-expanded"],
				optional: ["aria-label", "aria-disabled"],
			},
		},
		"sub-content": {
			element: "div",
			children: "snippet",
			aria: {
				role: "menu",
				required: ["aria-labelledby"],
				optional: ["aria-label"],
			},
		},
	},

	// ═══ SLOT RELATIONSHIPS (APG requirement) ════════════════════════════════
	slotRelationships: [
		// trigger aria-controls → content (menu)
		{ sourceSlot: "trigger", attribute: "aria-controls", targetSlot: "content", required: false },
		// content aria-labelledby → trigger
		{ sourceSlot: "content", attribute: "aria-labelledby", targetSlot: "trigger", required: true },
		// sub-trigger aria-controls → sub-content
		{
			sourceSlot: "sub-trigger",
			attribute: "aria-controls",
			targetSlot: "sub-content",
			required: false,
		},
		// sub-content aria-labelledby → sub-trigger
		{
			sourceSlot: "sub-content",
			attribute: "aria-labelledby",
			targetSlot: "sub-trigger",
			required: true,
		},
	],

	// ═══ STATE ═══════════════════════════════════════════════════════════════
	states: {
		shared: ["hover", "active", "focused", "focus-visible", "disabled"],
		specific: ["open", "closed", "checked", "indeterminate"],
	},
	slotStates: dropdownMenuSlotStates,
	slotActions: {
		root: [],
		trigger: ["open", "close", "toggle"],
		content: [],
		group: [],
		item: ["select"],
		"checkbox-item": ["check", "uncheck", "toggle"],
		"radio-group": [],
		"radio-item": ["select"],
		label: [],
		separator: [],
		sub: [],
		"sub-trigger": ["open", "close"],
		"sub-content": [],
	},

	// ═══ ARIA ════════════════════════════════════════════════════════════════
	aria: {
		role: "menu",
		requiredAttrs: [],
		optionalAttrs: [
			"aria-label",
			"aria-labelledby",
			"aria-orientation",
			"aria-haspopup",
			"aria-expanded",
			"aria-controls",
			"aria-checked",
			"aria-disabled",
		],
	},

	// ═══ KEYBOARD (Legacy flat array) ════════════════════════════════════════
	keyboard: [
		"ArrowUp",
		"ArrowDown",
		"ArrowLeft",
		"ArrowRight",
		"Enter",
		"Space",
		"Escape",
		"Home",
		"End",
		"Tab",
	],

	// ═══ KEYBOARD MAP (APG-compliant context-aware) ══════════════════════════
	keyboardMap: [
		// Trigger - opening the menu
		{
			orientation: "vertical",
			focusLocation: "trigger",
			key: "Enter",
			action: "open",
			required: true,
		},
		{
			orientation: "vertical",
			focusLocation: "trigger",
			key: "Space",
			action: "open",
			required: true,
		},
		{
			orientation: "vertical",
			focusLocation: "trigger",
			key: "ArrowDown",
			action: "open",
			required: true,
		},
		{
			orientation: "vertical",
			focusLocation: "trigger",
			key: "ArrowUp",
			action: "open",
			required: true,
		},
		// Menu - navigation
		{
			orientation: "vertical",
			focusLocation: "content",
			key: "ArrowDown",
			action: "next-item",
			required: true,
		},
		{
			orientation: "vertical",
			focusLocation: "content",
			key: "ArrowUp",
			action: "prev-item",
			required: true,
		},
		{
			orientation: "vertical",
			focusLocation: "content",
			key: "Home",
			action: "first-item",
			required: true,
		},
		{
			orientation: "vertical",
			focusLocation: "content",
			key: "End",
			action: "last-item",
			required: true,
		},
		// Menu - activation
		{
			orientation: "both",
			focusLocation: "content",
			key: "Enter",
			action: "activate",
			required: true,
		},
		{
			orientation: "both",
			focusLocation: "content",
			key: "Space",
			action: "activate",
			required: true,
		},
		// Menu - dismissal
		{
			orientation: "both",
			focusLocation: "content",
			key: "Escape",
			action: "close",
			required: true,
		},
		{ orientation: "both", focusLocation: "content", key: "Tab", action: "close", required: true },
		// Submenu - open/close with arrows
		{
			orientation: "vertical",
			focusLocation: "sub-trigger",
			key: "ArrowRight",
			action: "open",
			required: true,
		},
		{
			orientation: "vertical",
			focusLocation: "sub-content",
			key: "ArrowLeft",
			action: "close",
			required: true,
		},
	],

	// ═══ FOCUS (Legacy) ══════════════════════════════════════════════════════
	focusStrategy: "roving",

	// ═══ FOCUS (Detailed spec) ═══════════════════════════════════════════════
	focus: {
		strategy: "roving", // Focus moves between menu items
		onOpen: "first-focusable", // Focus first item when menu opens
		onEscape: "return-to-trigger",
		wrapAround: true, // Arrow keys wrap from last to first
	},

	// ═══ BEHAVIOR ════════════════════════════════════════════════════════════
	compound: true,
	orientation: "vertical",
	dismissBehavior: { escape: true, outsideClick: true },
} as const;

// ═══ VALIDATION ══════════════════════════════════════════════════════════════
// This runs at import time. Invalid contract = build fails.
export const contract: PrimitiveContract = parseContract(rawContract);
