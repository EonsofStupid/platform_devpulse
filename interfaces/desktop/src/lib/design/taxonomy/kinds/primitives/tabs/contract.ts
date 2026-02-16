/**
 * @file Tabs Taxonomy Contract
 * @description ColdLight SSOT contract for the tabs primitive.
 *
 * ariaStateProvider: "coldlight" — dsAdapter provides ARIA + state machinery.
 * 3-folder parity: taxonomy + adapter + primitive.
 *
 * Reference: W3C WAI-ARIA APG Tabs Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 *
 * CRITICAL: MeltUI tabs trigger/content are parameterized builders.
 * trigger(value) and content(value) return stores, unlike dialog where
 * all elements are direct stores. This affects primitive implementation.
 */

import { type PrimitiveContract, parseContract } from "../../../primitive/contract.js";
import { tabsSlotStates } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/**
 * Tabs primitive contract — ColdLight SSOT
 *
 * Validated at import time via Zod. Invalid contracts fail hard.
 */
const rawContract = {
	kind: "tabs",
	ariaStateProvider: "coldlight",

	// ═══ SLOTS ═══════════════════════════════════════════════════════════════
	slots: {
		required: ["root", "list", "trigger", "content"],
		optional: [],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
		list: {
			element: "div",
			children: "snippet",
			aria: {
				role: "tablist",
				required: ["aria-orientation"],
				optional: ["aria-label", "aria-labelledby"],
			},
		},
		trigger: {
			element: "button",
			children: "snippet",
			aria: {
				role: "tab",
				required: ["aria-selected", "aria-controls"],
				optional: ["aria-disabled"],
			},
		},
		content: {
			element: "div",
			children: "snippet",
			aria: {
				role: "tabpanel",
				required: ["aria-labelledby"],
				optional: ["aria-hidden"],
			},
		},
	},

	// ═══ SLOT RELATIONSHIPS (APG requirement) ════════════════════════════════
	slotRelationships: [
		// trigger aria-controls → content (required per APG)
		{ sourceSlot: "trigger", attribute: "aria-controls", targetSlot: "content", required: true },
		// content aria-labelledby → trigger (required per APG)
		{ sourceSlot: "content", attribute: "aria-labelledby", targetSlot: "trigger", required: true },
	],

	// ═══ STATE ═══════════════════════════════════════════════════════════════
	states: {
		shared: ["focused", "focus-visible", "focus-within", "hover", "active", "disabled"],
		specific: ["hidden", "visible", "selected"],
	},
	slotStates: tabsSlotStates,
	slotActions: {
		root: [],
		list: [],
		trigger: ["select"],
		content: [],
	},

	// ═══ ARIA ════════════════════════════════════════════════════════════════
	aria: {
		role: "tablist",
		requiredAttrs: ["aria-orientation"],
		optionalAttrs: [
			"aria-label",
			"aria-labelledby",
			"aria-disabled",
			"aria-describedby",
			"aria-selected",
			"aria-controls",
		],
	},

	// ═══ KEYBOARD (Legacy flat array) ════════════════════════════════════════
	keyboard: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "Enter", "Space"],

	// ═══ KEYBOARD MAP (APG-compliant context-aware) ══════════════════════════
	keyboardMap: [
		// Horizontal orientation (default)
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
		// Vertical orientation
		{
			orientation: "vertical",
			focusLocation: "trigger",
			key: "ArrowDown",
			action: "next-item",
			required: true,
		},
		{
			orientation: "vertical",
			focusLocation: "trigger",
			key: "ArrowUp",
			action: "prev-item",
			required: true,
		},
		// Both orientations
		{
			orientation: "both",
			focusLocation: "trigger",
			key: "Home",
			action: "first-item",
			required: true,
		},
		{
			orientation: "both",
			focusLocation: "trigger",
			key: "End",
			action: "last-item",
			required: true,
		},
		// Manual activation (when selectionFollowsFocus is false)
		{
			orientation: "both",
			focusLocation: "trigger",
			key: "Enter",
			action: "activate",
			required: false,
		},
		{
			orientation: "both",
			focusLocation: "trigger",
			key: "Space",
			action: "activate",
			required: false,
		},
	],

	// ═══ FOCUS (Legacy) ══════════════════════════════════════════════════════
	focusStrategy: "roving",

	// ═══ FOCUS (Detailed spec) ═══════════════════════════════════════════════
	focus: {
		strategy: "roving",
		tabBehavior: "exit-on-boundary", // Tab exits tablist, doesn't cycle
		wrapAround: true, // Arrow keys wrap from last to first
	},

	// ═══ SELECTION MODEL (APG) ═══════════════════════════════════════════════
	selection: {
		type: "single",
		selectionFollowsFocus: true, // APG: "automatic activation" mode
	},

	// ═══ BEHAVIOR ════════════════════════════════════════════════════════════
	compound: true,
	orientation: "horizontal",
} as const;

// ═══ VALIDATION ══════════════════════════════════════════════════════════════
// This runs at import time. Invalid contract = build fails.
export const contract: PrimitiveContract = parseContract(rawContract);
