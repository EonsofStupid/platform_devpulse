import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "color-swatch-picker",
	description:
		"Selectable grid of color swatches. role='listbox' with role='option' items. Keyboard arrow navigation, Enter/Space to select.",

	slots: {
		required: ["root"],
		optional: ["item"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "div",
			aria: {
				role: "listbox",
				required: [],
				optional: [{ attr: "aria-label", valueType: "aria-label" }],
			},
			data: { kind: "color-swatch-picker", slot: "root", states: [] },
		},
		item: {
			name: "item",
			element: "div",
			aria: {
				role: "option",
				required: [{ attr: "aria-selected", valueType: "aria-selected" }],
				optional: [],
			},
			data: { kind: "color-swatch-picker", slot: "item", states: [] },
		},
	},

	accessibleName: {
		required: true,
		sources: ["aria-label"],
	},

	focus: { strategy: "roving" },

	keyboard: {
		global: [
			{ key: "ArrowRight", action: "focusNext", description: "Focus next swatch" },
			{ key: "ArrowLeft", action: "focusPrev", description: "Focus previous swatch" },
			{ key: "ArrowDown", action: "focusNextRow", description: "Focus swatch below" },
			{ key: "ArrowUp", action: "focusPrevRow", description: "Focus swatch above" },
			{ key: "Enter", action: "select", description: "Select focused swatch" },
			{ key: "Space", action: "select", description: "Select focused swatch" },
		],
	},

	states: { all: [] },

	interactions: {
		modal: false,
		selectable: true,
		editable: false,
		expandable: false,
	},

	primitiveKind: "color-swatch-picker",
} as const satisfies ComponentContract;
