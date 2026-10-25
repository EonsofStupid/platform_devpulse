/**
 * @file Accordion Taxonomy Contract
 * @description ColdLight SSOT contract for the accordion primitive.
 *
 * ariaStateProvider: "coldlight" — native HTML handles semantics.
 * 2-folder parity: taxonomy + primitive.
 *
 * Reference: W3C WAI-ARIA APG Accordion Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
 */

import { type PrimitiveContract, parseContract } from "../../../schema.js";
import { accordionSlotStates } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/**
 * Accordion primitive contract — ColdLight SSOT
 *
 * Validated at import time via Zod. Invalid contracts fail hard.
 */
const rawContract = {
	kind: "accordion",
	ariaStateProvider: "coldlight",

	// ═══ SLOTS ═══════════════════════════════════════════════════════════════
	slots: {
		required: ["root", "item", "trigger", "content"],
		optional: ["header"],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "fragment",
			children: "renderless",
			aria: { required: [], optional: [] },
		},
		item: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
		header: {
			element: "h3",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
		trigger: {
			element: "button",
			children: "snippet",
			aria: {
				role: "button",
				required: ["aria-expanded", "aria-controls"],
				optional: ["aria-disabled"],
			},
		},
		content: {
			element: "div",
			children: "snippet",
			aria: {
				role: "region",
				required: ["aria-labelledby"],
				optional: ["aria-hidden"],
			},
		},
	},

	// ═══ SLOT RELATIONSHIPS (APG requirement) ════════════════════════════════
	slotRelationships: [
		// trigger aria-controls → content - REQUIRED per APG
		{ sourceSlot: "trigger", attribute: "aria-controls", targetSlot: "content", required: true },
		// content aria-labelledby → trigger (or header) - REQUIRED per APG
		{ sourceSlot: "content", attribute: "aria-labelledby", targetSlot: "trigger", required: true },
	],

	// ═══ STATE ═══════════════════════════════════════════════════════════════
	states: {
		shared: ["focused", "focus-visible", "hover", "active", "disabled"],
		specific: ["open", "closed"],
	},
	slotStates: accordionSlotStates,
	slotActions: {
		root: [],
		item: [],
		header: [],
		trigger: ["toggle"],
		content: [],
	},

	// ═══ ARIA ════════════════════════════════════════════════════════════════
	aria: {
		role: "group",
		requiredAttrs: [],
		optionalAttrs: [
			"aria-expanded",
			"aria-controls",
			"aria-disabled",
			"aria-labelledby",
			"aria-label",
			"aria-hidden",
		],
	},

	// ═══ KEYBOARD (Legacy flat array) ════════════════════════════════════════
	keyboard: ["Enter", "Space", "ArrowUp", "ArrowDown", "Home", "End"],

	// ═══ KEYBOARD MAP (APG-compliant context-aware) ══════════════════════════
	keyboardMap: [
		// Toggle on trigger
		{
			orientation: "vertical",
			focusLocation: "trigger",
			key: "Enter",
			action: "toggle",
			required: true,
		},
		{
			orientation: "vertical",
			focusLocation: "trigger",
			key: "Space",
			action: "toggle",
			required: true,
		},
		// Navigation between accordion headers
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
		{
			orientation: "vertical",
			focusLocation: "trigger",
			key: "Home",
			action: "first-item",
			required: true,
		},
		{
			orientation: "vertical",
			focusLocation: "trigger",
			key: "End",
			action: "last-item",
			required: true,
		},
	],

	// ═══ FOCUS (Legacy) ══════════════════════════════════════════════════════
	focusStrategy: "roving",

	// ═══ FOCUS (Detailed spec) ═══════════════════════════════════════════════
	focus: {
		strategy: "roving", // Focus moves between triggers
		wrapAround: false, // APG: arrows do NOT wrap (optional per spec)
	},

	// ═══ SELECTION MODEL (APG) ═══════════════════════════════════════════════
	// Note: Accordion uses expand/collapse, not selection
	// But can be configured for single-expand or multi-expand
	expansion: {
		mode: "single", // Only one panel open at a time (can be "multiple")
		collapseOthers: true, // Opening one closes others (when mode is "single")
	},

	// ═══ BEHAVIOR ════════════════════════════════════════════════════════════
	compound: true,
	orientation: "vertical",
} as const;

// ═══ VALIDATION ══════════════════════════════════════════════════════════════
// This runs at import time. Invalid contract = build fails.
export const contract: PrimitiveContract = parseContract(rawContract);
