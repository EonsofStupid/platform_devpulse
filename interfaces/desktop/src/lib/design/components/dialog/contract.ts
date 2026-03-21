/**
 * @file Dialog Component Contract
 * @kind dialog
 * @layer components
 *
 * Modal overlay dialog with focus trap, scroll lock, dismiss.
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "dialog",
	description:
		"Modal overlay dialog with focus trap, scroll lock, escape dismiss. Uses native <dialog> showModal(). Compound: trigger, overlay, content, header, title, description, footer, close.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",

	slots: {
		required: ["content"],
		optional: ["trigger", "overlay", "header", "title", "description", "footer", "close"],
	},

	slotContracts: {
		trigger: {
			name: "trigger",
			element: "button",
			aria: {
				required: [
					{ attr: "aria-haspopup", valueType: "aria-haspopup" },
					{ attr: "aria-expanded", valueType: "aria-expanded" },
					{ attr: "aria-controls", valueType: "aria-controls" },
				],
				optional: [],
			},
			data: { kind: "dialog", slot: "trigger", states: ["open", "closed"] },
		},
		overlay: {
			name: "overlay",
			element: "div",
			aria: { required: [], optional: [] },
			data: { kind: "dialog", slot: "overlay", states: ["open", "closed"] },
		},
		content: {
			name: "content",
			element: "dialog",
			aria: {
				role: "dialog",
				required: [
					{ attr: "aria-modal", valueType: "aria-modal" },
					{ attr: "aria-labelledby", valueType: "aria-labelledby" },
				],
				optional: [
					{ attr: "aria-describedby", valueType: "aria-describedby" },
				],
			},
			data: { kind: "dialog", slot: "content", states: ["open", "closed"] },
		},
		header: {
			name: "header",
			element: "div",
			aria: { required: [], optional: [] },
			data: { kind: "dialog", slot: "header", states: [] },
		},
		title: {
			name: "title",
			element: "h2",
			aria: { required: [], optional: [] },
			data: { kind: "dialog", slot: "title", states: [] },
		},
		description: {
			name: "description",
			element: "p",
			aria: { required: [], optional: [] },
			data: { kind: "dialog", slot: "description", states: [] },
		},
		footer: {
			name: "footer",
			element: "div",
			aria: { required: [], optional: [] },
			data: { kind: "dialog", slot: "footer", states: [] },
		},
		close: {
			name: "close",
			element: "button",
			aria: { required: [], optional: [] },
			data: { kind: "dialog", slot: "close", states: [] },
		},
	},

	accessibleName: {
		required: true,
		sources: ["aria-labelledby", "aria-label"],
		defaultSlot: "title",
	},

	focus: {
		strategy: "trap",
		initialFocus: "content",
		returnFocus: "trigger",
		trapContainer: "content",
	},

	keyboard: {
		global: [
			{ key: "Escape", action: "close", description: "Close the dialog" },
			{ key: "Tab", action: "focusNext", description: "Move focus within trap" },
		],
	},

	states: {
		all: ["open", "closed"],
	},

	interactions: {
		modal: true,
		selectable: false,
		editable: false,
		expandable: false,
	},

	primitiveKind: "dialog",
} as const satisfies ComponentContract;
