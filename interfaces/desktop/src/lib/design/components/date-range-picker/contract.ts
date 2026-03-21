import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "date-range-picker",
	description:
		"Two DateFields (start/end) + RangeCalendar popover. Range selection, presets, inline mode. Controlled/uncontrolled value and popover.",

	slots: {
		required: ["root"],
		optional: ["field", "trigger", "content", "calendar", "label", "description", "errorMessage", "presetTrigger"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "div",
			aria: { role: "group", required: [], optional: [{ attr: "aria-labelledby", valueType: "aria-labelledby" }] },
			data: { kind: "date-range-picker", slot: "root", states: [] },
		},
		field: {
			name: "field",
			element: "div",
			aria: { role: "group", required: [], optional: [{ attr: "aria-label", valueType: "aria-label" }] },
			data: { kind: "date-range-picker", slot: "field", states: [] },
		},
		trigger: {
			name: "trigger",
			element: "button",
			aria: {
				required: [{ attr: "aria-haspopup", valueType: "aria-haspopup" }, { attr: "aria-expanded", valueType: "aria-expanded" }],
				optional: [{ attr: "aria-controls", valueType: "aria-controls" }],
			},
			data: { kind: "date-range-picker", slot: "trigger", states: ["open", "closed"] },
		},
		content: {
			name: "content",
			element: "div",
			aria: { role: "dialog", required: [], optional: [{ attr: "aria-modal", valueType: "aria-modal" }] },
			data: { kind: "date-range-picker", slot: "content", states: ["open", "closed"] },
		},
		calendar: {
			name: "calendar", element: "div", aria: { required: [], optional: [] },
			data: { kind: "date-range-picker", slot: "calendar", states: [] },
		},
		label: {
			name: "label", element: "label", aria: { required: [], optional: [] },
			data: { kind: "date-range-picker", slot: "label", states: [] },
		},
		description: {
			name: "description", element: "p", aria: { required: [], optional: [] },
			data: { kind: "date-range-picker", slot: "description", states: [] },
		},
		errorMessage: {
			name: "errorMessage", element: "p", aria: { role: "alert", required: [], optional: [] },
			data: { kind: "date-range-picker", slot: "error-message", states: [] },
		},
		presetTrigger: {
			name: "presetTrigger", element: "button", aria: { required: [], optional: [] },
			data: { kind: "date-range-picker", slot: "preset-trigger", states: [] },
		},
	},

	accessibleName: { required: false, sources: ["aria-label", "aria-labelledby"], defaultSlot: "label" },
	focus: { strategy: "direct" },
	keyboard: { global: [{ key: "Escape", action: "closePopover", description: "Close calendar popover" }] },
	states: { all: ["open", "closed"] },
	interactions: { modal: false, selectable: false, editable: true, expandable: true },
	primitiveKind: "date-range-picker",
} as const satisfies ComponentContract;
