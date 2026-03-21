/**
 * @file Collapsible Component Contract
 * @kind collapsible
 * @layer components
 *
 * Disclosure pattern. One trigger toggles one content panel.
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "collapsible",
	description:
		"Disclosure pattern — one trigger toggles one content panel. aria-expanded on trigger, aria-controls pointing to content. Keyboard enter/space to toggle.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/",

	slots: {
		required: ["root", "trigger", "content"],
		optional: ["indicator"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "div",
			aria: { required: [], optional: [] },
			data: { kind: "collapsible", slot: "root", states: ["open", "closed"] },
		},
		trigger: {
			name: "trigger",
			element: "button",
			aria: {
				required: [
					{ attr: "aria-expanded", valueType: "aria-expanded" },
					{ attr: "aria-controls", valueType: "aria-controls" },
				],
				optional: [{ attr: "aria-disabled", valueType: "aria-disabled" }],
			},
			data: { kind: "collapsible", slot: "trigger", states: ["open", "closed"] },
		},
		content: {
			name: "content",
			element: "div",
			aria: {
				role: "region",
				required: [{ attr: "aria-labelledby", valueType: "aria-labelledby" }],
				optional: [],
			},
			data: { kind: "collapsible", slot: "content", states: ["open", "closed"] },
		},
		indicator: {
			name: "indicator",
			element: "span",
			aria: { required: [], optional: [] },
			data: { kind: "collapsible", slot: "indicator", states: ["open", "closed"] },
		},
	},

	accessibleName: {
		required: false,
		sources: ["aria-label"],
	},

	focus: {
		strategy: "none",
	},

	keyboard: {
		global: [
			{ key: "Enter", action: "toggle", description: "Toggle content visibility" },
			{ key: "Space", action: "toggle", description: "Toggle content visibility" },
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

	primitiveKind: "collapsible",
} as const satisfies ComponentContract;
