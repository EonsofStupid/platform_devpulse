/**
 * @file Sheet Component Contract
 * @kind sheet
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * Slide-in panel overlay pattern with focus trap.
 * Reference: W3C WAI-ARIA APG Dialog (Modal) Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * Sheet component contract — compile-time enforced.
 *
 * `satisfies ComponentContract` validates shape at compile time.
 */
export const contract = {
	kind: "sheet",
	description:
		"Slide-in panel overlay (side drawer). Supports left/right/top/bottom sides, focus trapping, Escape dismiss, and outside click close.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",

	slots: {
		required: ["trigger", "content"],
		optional: ["overlay", "close"],
	},

	slotContracts: {
		trigger: {
			name: "trigger",
			element: "button",
			aria: {
				role: "button",
				required: [],
				optional: [
					{ attr: "aria-haspopup", valueType: "aria-haspopup" },
					{ attr: "aria-expanded", valueType: "aria-expanded" },
					{ attr: "aria-controls", valueType: "aria-controls" },
				],
			},
			data: {
				kind: "sheet",
				slot: "trigger",
				states: ["open", "closed", "focused", "focus-visible"],
			},
		},
		overlay: {
			name: "overlay",
			element: "div",
			aria: {
				role: "presentation",
				required: [],
				optional: [{ attr: "aria-hidden", valueType: "aria-hidden" }],
			},
			data: {
				kind: "sheet",
				slot: "overlay",
				states: ["open", "closed"],
			},
		},
		content: {
			name: "content",
			element: "div",
			aria: {
				role: "dialog",
				required: [{ attr: "aria-modal", valueType: "aria-modal" }],
				optional: [
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-labelledby", valueType: "aria-labelledby" },
				],
			},
			data: {
				kind: "sheet",
				slot: "content",
				states: ["open", "closed"],
			},
			keyboard: [
				{ key: "Escape", action: "close", description: "Close the sheet" },
				{ key: "Tab", action: "trap-focus", description: "Trap focus within sheet" },
			],
		},
		close: {
			name: "close",
			element: "button",
			aria: {
				role: "button",
				required: [],
				optional: [{ attr: "aria-label", valueType: "aria-label" }],
			},
			data: {
				kind: "sheet",
				slot: "close",
				states: ["focused", "focus-visible"],
			},
		},
	},

	accessibleName: {
		required: true,
		sources: ["aria-label", "aria-labelledby"],
		defaultSlot: "content",
	},

	focus: {
		strategy: "trap",
		initialFocus: "content",
		returnFocus: "trigger",
		trapContainer: "content",
	},

	keyboard: {
		global: [
			{ key: "Escape", action: "close", description: "Close the sheet" },
			{ key: "Tab", action: "trap-focus", description: "Trap focus within sheet content" },
		],
	},

	states: {
		primary: "open",
		all: ["open", "closed", "focused", "focus-visible"],
		ariaMapping: {
			open: "aria-expanded",
		},
	},

	interactions: {
		modal: true,
		selectable: false,
		editable: false,
		expandable: true,
	},

	primitiveKind: "sheet",
} as const satisfies ComponentContract;
