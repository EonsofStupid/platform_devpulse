/**
 * @file Accordion Component Contract
 * @kind accordion
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 *
 * Accordion is a compound behavioral component with real ARIA:
 * aria-expanded, aria-controls, aria-labelledby, keyboard navigation.
 * Primitive hook provides all behavior via useAccordion().
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "accordion",
	description:
		"Compound behavioral component with collapsible sections. ARIA via useAccordion() hook — aria-expanded, aria-controls, aria-labelledby, keyboard navigation (up/down/home/end). Single or multiple expand modes.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/accordion/",

	slots: {
		required: ["root", "item", "trigger", "content"],
		optional: ["indicator"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "div",
			aria: { required: [], optional: [] },
			data: { kind: "accordion", slot: "root", states: [] },
		},
		item: {
			name: "item",
			element: "div",
			aria: { required: [], optional: [] },
			data: { kind: "accordion", slot: "item", states: ["open", "closed"] },
		},
		trigger: {
			name: "trigger",
			element: "button",
			aria: {
				required: [
					{ attr: "aria-expanded", valueType: "aria-expanded" },
					{ attr: "aria-controls", valueType: "aria-controls" },
				],
				optional: [
					{ attr: "aria-disabled", valueType: "aria-disabled" },
				],
			},
			data: { kind: "accordion", slot: "trigger", states: ["open", "closed"] },
		},
		content: {
			name: "content",
			element: "div",
			aria: {
				role: "region",
				required: [
					{ attr: "aria-labelledby", valueType: "aria-labelledby" },
				],
				optional: [],
			},
			data: { kind: "accordion", slot: "content", states: ["open", "closed"] },
		},
		indicator: {
			name: "indicator",
			element: "span",
			aria: { required: [], optional: [] },
			data: { kind: "accordion", slot: "indicator", states: ["open", "closed"] },
		},
	},

	accessibleName: {
		required: false,
		sources: ["aria-label"],
	},

	focus: {
		strategy: "roving",
	},

	keyboard: {
		global: [
			{ key: "ArrowDown", action: "focusNext", description: "Move focus to next trigger" },
			{ key: "ArrowUp", action: "focusPrev", description: "Move focus to previous trigger" },
			{ key: "Home", action: "focusFirst", description: "Move focus to first trigger" },
			{ key: "End", action: "focusLast", description: "Move focus to last trigger" },
			{ key: "Enter", action: "toggle", description: "Toggle focused item" },
			{ key: "Space", action: "toggle", description: "Toggle focused item" },
		],
	},

	states: {
		all: ["open", "closed"],
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: false,
		expandable: true,
	},

	primitiveKind: "accordion",
} as const satisfies ComponentContract;
