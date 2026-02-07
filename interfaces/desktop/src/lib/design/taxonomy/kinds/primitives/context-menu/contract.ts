/**
 * @file ContextMenu Taxonomy Contract
 * @description ColdLight SSOT contract for the context-menu primitive.
 *
 * ariaStateProvider: "coldlight" — dsAdapter provides ARIA + state.
 * 3-folder parity: taxonomy + adapter + primitive.
 *
 * Reference: W3C WAI-ARIA APG Menu Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/menu/
 *
 * WAI-ARIA: role="menu" with menuitem, menuitemcheckbox, menuitemradio children.
 * Triggered by right-click (contextmenu event) on trigger area.
 */

import { type PrimitiveContract, parseContract } from "../../../schema.js";
import { contextMenuSlotStates } from "./types.js";

const rawContract = {
	kind: "context-menu",
	ariaStateProvider: "coldlight",
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
		root: { element: "fragment", children: "renderless", aria: { required: [], optional: [] } },
		trigger: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: ["aria-label"] },
		},
		content: {
			element: "div",
			children: "snippet",
			aria: {
				role: "menu",
				required: [],
				optional: ["aria-label", "aria-labelledby", "aria-orientation"],
			},
		},
		group: {
			element: "div",
			children: "snippet",
			aria: { role: "group", required: [], optional: ["aria-labelledby"] },
		},
		item: {
			element: "div",
			children: "snippet",
			aria: { role: "menuitem", required: [], optional: ["aria-disabled"] },
		},
		"checkbox-item": {
			element: "div",
			children: "snippet",
			aria: { role: "menuitemcheckbox", required: ["aria-checked"], optional: ["aria-disabled"] },
		},
		"radio-group": {
			element: "div",
			children: "snippet",
			aria: { role: "group", required: [], optional: ["aria-labelledby"] },
		},
		"radio-item": {
			element: "div",
			children: "snippet",
			aria: { role: "menuitemradio", required: ["aria-checked"], optional: ["aria-disabled"] },
		},
		label: { element: "div", children: "snippet", aria: { required: [], optional: [] } },
		separator: {
			element: "div",
			children: "snippet",
			aria: { role: "separator", required: [], optional: [] },
		},
		sub: { element: "fragment", children: "renderless", aria: { required: [], optional: [] } },
		"sub-trigger": {
			element: "div",
			children: "snippet",
			aria: {
				role: "menuitem",
				required: ["aria-haspopup", "aria-expanded"],
				optional: ["aria-disabled"],
			},
		},
		"sub-content": {
			element: "div",
			children: "snippet",
			aria: { role: "menu", required: [], optional: ["aria-label", "aria-labelledby"] },
		},
	},
	states: {
		shared: ["open", "closed", "hover", "active", "focused", "focus-visible", "disabled"],
		specific: ["checked", "indeterminate"],
	},
	slotStates: contextMenuSlotStates,
	slotActions: {
		root: [],
		trigger: [],
		content: [],
		group: [],
		item: ["select"],
		"checkbox-item": ["check", "uncheck", "toggle"],
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
		{
			orientation: "both",
			focusLocation: "content",
			key: "Escape",
			action: "close",
			required: true,
		},
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
		onOpen: "first-focusable",
		wrapAround: true,
	},
	compound: true,
	orientation: "vertical",
	dismissBehavior: { escape: true, outsideClick: true },
} as const;

export const contract: PrimitiveContract = parseContract(rawContract);
