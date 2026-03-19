/**
 * @file Dialog Component Contract
 * @kind dialog
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * Compound component: trigger, overlay, content, title, description, close,
 * header, footer, portal slots.
 *
 * Pattern: WAI-ARIA APG Dialog (Modal) Pattern
 * Reference: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * Dialog component contract — compile-time enforced.
 *
 * `satisfies ComponentContract` validates shape at compile time.
 * Slot contracts are inlined for full static analysis.
 */
export const contract = {
	kind: "dialog",
	description:
		"Modal dialog overlay for focused interaction. Uses native <dialog> element with role='dialog', aria-modal, and focus trap. ColdLight-owned ARIA — no MeltUI dependency.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",

	slots: {
		required: ["trigger", "content", "overlay"],
		optional: ["title", "description", "close", "header", "footer", "portal"],
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
				kind: "dialog",
				slot: "trigger",
				states: ["open", "closed"],
			},
			keyboard: [
				{ key: "Enter", action: "open", description: "Open dialog" },
				{ key: "Space", action: "open", description: "Open dialog" },
			],
		},
		content: {
			name: "content",
			element: "dialog",
			aria: {
				role: "dialog",
				required: [{ attr: "aria-modal", valueType: "aria-modal" }],
				optional: [
					{ attr: "aria-labelledby", valueType: "aria-labelledby" },
					{ attr: "aria-describedby", valueType: "aria-describedby" },
				],
				relationships: [
					{ attr: "aria-labelledby", targetSlot: "title", required: false },
					{ attr: "aria-describedby", targetSlot: "description", required: false },
				],
			},
			data: {
				kind: "dialog",
				slot: "content",
				states: ["open", "closed"],
			},
			keyboard: [
				{ key: "Escape", action: "close", description: "Close dialog" },
				{ key: "Tab", action: "exit", description: "Cycle focus within trap" },
			],
		},
		overlay: {
			name: "overlay",
			element: "div",
			aria: {
				required: [{ attr: "aria-hidden", valueType: "aria-hidden" }],
				optional: [],
			},
			data: {
				kind: "dialog",
				slot: "overlay",
				states: ["open", "closed"],
			},
		},
		title: {
			name: "title",
			element: "h2",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "dialog",
				slot: "title",
				states: [],
			},
		},
		description: {
			name: "description",
			element: "p",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "dialog",
				slot: "description",
				states: [],
			},
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
				kind: "dialog",
				slot: "close",
				states: [],
			},
			keyboard: [
				{ key: "Enter", action: "close", description: "Close dialog" },
				{ key: "Space", action: "close", description: "Close dialog" },
			],
		},
		header: {
			name: "header",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "dialog",
				slot: "header",
				states: [],
			},
		},
		footer: {
			name: "footer",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "dialog",
				slot: "footer",
				states: [],
			},
		},
		portal: {
			name: "portal",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "dialog",
				slot: "portal",
				states: [],
			},
		},
	},

	accessibleName: {
		required: true,
		sources: ["aria-label", "aria-labelledby"],
		defaultSlot: "title",
	},

	focus: {
		strategy: "trap",
		initialFocus: "content",
		returnFocus: "trigger",
		trapContainer: "content",
	},

	keyboard: {
		global: [{ key: "Escape", action: "close", description: "Close dialog" }],
	},

	states: {
		primary: "open",
		all: ["open", "closed"],
		ariaMapping: {
			open: "aria-expanded",
		},
	},

	interactions: {
		modal: true,
		selectable: false,
		editable: false,
		expandable: false,
	},

	primitiveKind: "dialog",
} as const satisfies ComponentContract;
