/**
 * @file Dialog Taxonomy Contract
 * @description ColdLight SSOT contract for the dialog primitive.
 *
 * ariaStateProvider: "coldlight" — dsAdapter provides ARIA + state machinery.
 * 3-folder parity: taxonomy + adapter + primitive.
 *
 * Reference: W3C WAI-ARIA APG Modal Dialog Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 */

import { type PrimitiveContract, parseContract } from "../../../schema.js";
import { dialogSlotStates } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/**
 * Dialog primitive contract — ColdLight SSOT
 *
 * Validated at import time via Zod. Invalid contracts fail hard.
 */
const rawContract = {
	kind: "dialog",
	ariaStateProvider: "coldlight",

	// ═══ SLOTS ═══════════════════════════════════════════════════════════════
	slots: {
		required: ["root", "content"],
		optional: ["trigger", "portal", "overlay", "title", "description", "close"],
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
		portal: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
		overlay: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: ["aria-hidden"] },
		},
		content: {
			element: "div",
			children: "snippet",
			aria: {
				role: "dialog",
				required: ["aria-modal", "aria-labelledby"],
				optional: ["aria-label", "aria-describedby"],
			},
		},
		title: {
			element: "h2",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
		description: {
			element: "p",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
		close: {
			element: "button",
			children: "snippet",
			aria: { role: "button", required: [], optional: ["aria-label"] },
		},
	},

	// ═══ SLOT RELATIONSHIPS (NEW - APG requirement) ══════════════════════════
	slotRelationships: [
		// trigger aria-controls → content (when trigger present)
		{ sourceSlot: "trigger", attribute: "aria-controls", targetSlot: "content", required: false },
		// content aria-labelledby → title (required per APG)
		{ sourceSlot: "content", attribute: "aria-labelledby", targetSlot: "title", required: true },
		// content aria-describedby → description (optional)
		{
			sourceSlot: "content",
			attribute: "aria-describedby",
			targetSlot: "description",
			required: false,
		},
	],

	// ═══ STATE ═══════════════════════════════════════════════════════════════
	states: {
		shared: ["focused", "focus-visible", "focus-within", "hover", "active"],
		specific: ["hidden", "visible", "inert", "open", "entering", "exiting"],
	},
	slotStates: dialogSlotStates,
	slotActions: {
		root: [],
		trigger: ["open"],
		portal: [],
		overlay: ["close"],
		content: [],
		title: [],
		description: [],
		close: ["close"],
	},

	// ═══ ARIA ════════════════════════════════════════════════════════════════
	aria: {
		role: "dialog",
		requiredAttrs: ["aria-modal", "aria-labelledby"],
		optionalAttrs: [
			"aria-label",
			"aria-describedby",
			"aria-hidden",
			"aria-busy",
			"aria-expanded",
			"aria-haspopup",
			"aria-controls",
		],
	},

	// ═══ KEYBOARD (Legacy flat array) ════════════════════════════════════════
	keyboard: ["Escape", "Tab"],

	// ═══ KEYBOARD MAP (NEW - APG-compliant context-aware) ════════════════════
	keyboardMap: [
		// Tab cycles within dialog (focus trap)
		{
			orientation: "both",
			focusLocation: "content",
			key: "Tab",
			action: "next-item",
			required: true,
		},
		// Escape closes dialog
		{
			orientation: "both",
			focusLocation: "content",
			key: "Escape",
			action: "close",
			required: true,
		},
	],

	// ═══ FOCUS (Legacy) ══════════════════════════════════════════════════════
	focusStrategy: "trap",

	// ═══ FOCUS (NEW - detailed spec) ═════════════════════════════════════════
	focus: {
		strategy: "trap",
		onOpen: "first-focusable", // APG: focus moves to element inside dialog
		onEscape: "return-to-trigger", // APG: focus returns to invoking element
		tabBehavior: "cycle-within", // APG: Tab wraps within dialog
	},

	// ═══ BEHAVIOR ════════════════════════════════════════════════════════════
	compound: true,
	dismissBehavior: { escape: true, outsideClick: true },
} as const;

// ═══ VALIDATION ══════════════════════════════════════════════════════════════
// This runs at import time. Invalid contract = build fails.
export const contract: PrimitiveContract = parseContract(rawContract);
