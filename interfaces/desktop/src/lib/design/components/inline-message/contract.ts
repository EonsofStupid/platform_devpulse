/**
 * @file InlineMessage Component Contract
 * @kind inline-message
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * InlineMessage uses role="status" with aria-live="polite" for inline feedback.
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "inline-message",
	description:
		"Inline feedback message with role='status' and aria-live='polite'. Used for form validation, help text, and contextual status messages. Tones: info, success, warning, error, help.",

	slots: {
		required: ["root"],
		optional: ["icon"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "div",
			aria: {
				role: "status",
				required: [],
				optional: [
					{ attr: "aria-live", valueType: "aria-live" },
				],
			},
			data: {
				kind: "inline-message",
				slot: "root",
				states: [],
			},
		},
		icon: {
			name: "icon",
			element: "span",
			aria: {
				required: [],
				optional: [{ attr: "aria-hidden", valueType: "aria-hidden" }],
			},
			data: {
				kind: "inline-message",
				slot: "icon",
				states: [],
			},
		},
	},

	accessibleName: {
		required: false,
		sources: ["content"],
	},

	focus: {
		strategy: "none",
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
		editable: false,
		expandable: false,
	},

	primitiveKind: "inline-message",
} as const satisfies ComponentContract;
