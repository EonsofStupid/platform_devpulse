/**
 * @file Menubar Taxonomy Contract
 * @description ColdLight SSOT contract for the menubar primitive.
 *
 * ariaStateProvider: "coldlight" — createMenubar provides roving tabindex + menu management.
 * 3-folder parity: taxonomy + primitive + adapter.
 *
 * Reference: W3C WAI-ARIA APG Menubar Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/menubar/
 *
 * WAI-ARIA: role="menubar" container with nested menu triggers, items,
 * checkbox items, radio groups, submenus, and separators.
 */

import { type PrimitiveContract, parseContract } from "../../../primitive/contract.js";
import { menubarSlotStates } from "./types.js";

const rawContract = {
	kind: "menubar",
	ariaStateProvider: "coldlight",
	slots: {
		required: ["root", "menu", "trigger", "content"],
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
			aria: {
				role: "menuitem",
				required: ["aria-haspopup", "aria-expanded"],
				optional: ["aria-controls", "aria-label"],
			},
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
			aria: {
				role: "menuitemcheckbox",
				required: ["aria-checked"],
				optional: ["aria-label", "aria-disabled"],
			},
		},
		"radio-group": {
			element: "div",
			children: "snippet",
			aria: { role: "group", required: [], optional: ["aria-label"] },
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
			aria: {
				role: "menuitem",
				required: ["aria-haspopup", "aria-expanded"],
				optional: ["aria-label", "aria-disabled"],
			},
		},
		"sub-content": {
			element: "div",
			children: "snippet",
			aria: { role: "menu", required: ["aria-labelledby"], optional: ["aria-label"] },
		},
	},
	slotRelationships: [
		{ sourceSlot: "trigger", attribute: "aria-controls", targetSlot: "content", required: false },
		{ sourceSlot: "content", attribute: "aria-labelledby", targetSlot: "trigger", required: true },
		{
			sourceSlot: "sub-trigger",
			attribute: "aria-controls",
			targetSlot: "sub-content",
			required: false,
		},
		{
			sourceSlot: "sub-content",
			attribute: "aria-labelledby",
			targetSlot: "sub-trigger",
			required: true,
		},
	],
	states: {
		shared: ["hover", "active", "focused", "focus-visible", "disabled"],
		specific: ["open", "closed", "checked", "indeterminate"],
	},
	slotStates: menubarSlotStates,
	slotActions: {
		root: [],
		menu: [],
		trigger: ["open", "close"],
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
	],
	keyboardMap: [
		// Menubar level navigation
		{
			orientation: "horizontal",
			focusLocation: "trigger",
			key: "ArrowRight",
			action: "next-item",
			required: true,
		},
		{
			orientation: "horizontal",
			focusLocation: "trigger",
			key: "ArrowLeft",
			action: "prev-item",
			required: true,
		},
		{
			orientation: "horizontal",
			focusLocation: "trigger",
			key: "Home",
			action: "first-item",
			required: true,
		},
		{
			orientation: "horizontal",
			focusLocation: "trigger",
			key: "End",
			action: "last-item",
			required: true,
		},
		// Open menu
		{
			orientation: "horizontal",
			focusLocation: "trigger",
			key: "ArrowDown",
			action: "open",
			required: true,
		},
		{
			orientation: "horizontal",
			focusLocation: "trigger",
			key: "Enter",
			action: "open",
			required: true,
		},
		{
			orientation: "horizontal",
			focusLocation: "trigger",
			key: "Space",
			action: "open",
			required: true,
		},
		// Within menu
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
			orientation: "both",
			focusLocation: "content",
			key: "Enter",
			action: "activate",
			required: true,
		},
		{
			orientation: "both",
			focusLocation: "content",
			key: "Escape",
			action: "close",
			required: true,
		},
		// Submenu
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
	focusStrategy: "roving",
	focus: {
		strategy: "roving",
		wrapAround: true,
	},
	compound: true,
	orientation: "horizontal",
	dismissBehavior: { escape: true, outsideClick: true },
} as const;

export const contract: PrimitiveContract = parseContract(rawContract);
