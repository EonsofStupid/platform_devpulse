/**
 * @file ColorField Component Contract
 * @kind color-field
 * @layer components
 *
 * Text input for editing color values. Form field with validation.
 * Compound: Root, Label, Input, Description, ErrorMessage.
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "color-field",
	description:
		"Text input for color values — hex or per-channel editing. Form field with label, description, validation, error message. Controlled/uncontrolled.",

	slots: {
		required: ["root", "input"],
		optional: ["label", "description", "errorMessage"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "div",
			aria: { required: [], optional: [] },
			data: { kind: "color-field", slot: "root", states: [] },
		},
		label: {
			name: "label",
			element: "label",
			aria: { required: [], optional: [] },
			data: { kind: "color-field", slot: "label", states: [] },
		},
		input: {
			name: "input",
			element: "input",
			aria: {
				required: [],
				optional: [
					{ attr: "aria-invalid", valueType: "aria-invalid" },
					{ attr: "aria-labelledby", valueType: "aria-labelledby" },
					{ attr: "aria-describedby", valueType: "aria-describedby" },
					{ attr: "aria-errormessage", valueType: "aria-errormessage" },
				],
			},
			data: { kind: "color-field", slot: "input", states: [] },
		},
		description: {
			name: "description",
			element: "p",
			aria: { required: [], optional: [] },
			data: { kind: "color-field", slot: "description", states: [] },
		},
		errorMessage: {
			name: "errorMessage",
			element: "p",
			aria: {
				role: "alert",
				required: [],
				optional: [],
			},
			data: { kind: "color-field", slot: "error-message", states: [] },
		},
	},

	accessibleName: {
		required: true,
		sources: ["aria-label", "aria-labelledby"],
		defaultSlot: "label",
	},

	focus: {
		strategy: "direct",
	},

	keyboard: {
		global: [],
	},

	states: {
		all: [],
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: true,
		expandable: false,
	},

	primitiveKind: "color-field",
} as const satisfies ComponentContract;
