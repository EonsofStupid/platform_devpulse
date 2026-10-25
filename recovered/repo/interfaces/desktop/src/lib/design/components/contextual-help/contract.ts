import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "contextual-help",
	description:
		"Help/info popover triggered by an icon button. Shows contextual information about an adjacent component. Compound: trigger, popover dialog, heading, content, footer.",

	slots: {
		required: ["root", "trigger", "popover"],
		optional: ["heading", "content", "footer"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "div",
			aria: { required: [], optional: [] },
			data: { kind: "contextual-help", slot: "root", states: [] },
		},
		trigger: {
			name: "trigger",
			element: "button",
			aria: {
				required: [
					{ attr: "aria-expanded", valueType: "aria-expanded" },
					{ attr: "aria-controls", valueType: "aria-controls" },
				],
				optional: [{ attr: "aria-label", valueType: "aria-label" }],
			},
			data: { kind: "contextual-help", slot: "trigger", states: ["open", "closed"] },
		},
		popover: {
			name: "popover",
			element: "div",
			aria: {
				role: "dialog",
				required: [{ attr: "aria-labelledby", valueType: "aria-labelledby" }],
				optional: [],
			},
			data: { kind: "contextual-help", slot: "popover", states: ["open", "closed"] },
		},
		heading: {
			name: "heading",
			element: "h3",
			aria: { required: [], optional: [] },
			data: { kind: "contextual-help", slot: "heading", states: [] },
		},
		content: {
			name: "content",
			element: "div",
			aria: { required: [], optional: [] },
			data: { kind: "contextual-help", slot: "content", states: [] },
		},
		footer: {
			name: "footer",
			element: "div",
			aria: { required: [], optional: [] },
			data: { kind: "contextual-help", slot: "footer", states: [] },
		},
	},

	accessibleName: {
		required: true,
		sources: ["aria-label"],
		defaultSlot: "heading",
	},

	focus: { strategy: "none" },
	keyboard: { global: [] },
	states: { all: ["open", "closed"] },

	interactions: {
		modal: false,
		selectable: false,
		editable: false,
		expandable: true,
	},

	primitiveKind: "contextual-help",
} as const satisfies ComponentContract;
