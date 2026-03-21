import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "date-picker",
	description:
		"Combines DateField segmented input + Calendar popover. Controlled/uncontrolled value and popover state. Validation, form integration, granularity, locale.",

	slots: {
		required: ["root"],
		optional: ["field", "trigger", "content", "calendar", "label", "description", "errorMessage"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "div",
			aria: {
				role: "group",
				required: [],
				optional: [
					{ attr: "aria-labelledby", valueType: "aria-labelledby" },
					{ attr: "aria-describedby", valueType: "aria-describedby" },
				],
			},
			data: { kind: "date-picker", slot: "root", states: [] },
		},
		field: {
			name: "field",
			element: "div",
			aria: { role: "group", required: [], optional: [] },
			data: { kind: "date-picker", slot: "field", states: [] },
		},
		trigger: {
			name: "trigger",
			element: "button",
			aria: {
				required: [
					{ attr: "aria-haspopup", valueType: "aria-haspopup" },
					{ attr: "aria-expanded", valueType: "aria-expanded" },
				],
				optional: [{ attr: "aria-controls", valueType: "aria-controls" }],
			},
			data: { kind: "date-picker", slot: "trigger", states: ["open", "closed"] },
		},
		content: {
			name: "content",
			element: "div",
			aria: {
				role: "dialog",
				required: [{ attr: "aria-modal", valueType: "aria-modal" }],
				optional: [{ attr: "aria-label", valueType: "aria-label" }],
			},
			data: { kind: "date-picker", slot: "content", states: ["open", "closed"] },
		},
		calendar: {
			name: "calendar",
			element: "div",
			aria: { required: [], optional: [] },
			data: { kind: "date-picker", slot: "calendar", states: [] },
		},
		label: {
			name: "label",
			element: "label",
			aria: { required: [], optional: [] },
			data: { kind: "date-picker", slot: "label", states: [] },
		},
		description: {
			name: "description",
			element: "p",
			aria: { required: [], optional: [] },
			data: { kind: "date-picker", slot: "description", states: [] },
		},
		errorMessage: {
			name: "errorMessage",
			element: "p",
			aria: { role: "alert", required: [], optional: [] },
			data: { kind: "date-picker", slot: "error-message", states: [] },
		},
	},

	accessibleName: {
		required: false,
		sources: ["aria-label", "aria-labelledby"],
		defaultSlot: "label",
	},

	focus: { strategy: "direct" },

	keyboard: {
		global: [
			{ key: "Escape", action: "closePopover", description: "Close calendar popover" },
			{ key: "ArrowDown", action: "openPopover", description: "Open calendar popover" },
		],
	},

	states: { all: ["open", "closed"] },

	interactions: {
		modal: false,
		selectable: false,
		editable: true,
		expandable: true,
	},

	primitiveKind: "date-picker",
} as const satisfies ComponentContract;
