/**
 * @file DateRangePicker Component Contract
 * @kind date-range-picker
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * Compound component: root, field, trigger, content, calendar.
 * ColdLight-owned ARIA — combines date-range-field + range-calendar in popover.
 *
 * Pattern: WAI-ARIA APG Dialog (Modal) + Grid
 * Reference: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * DateRangePicker component contract — compile-time enforced.
 *
 * Compound: root → field (start/end segments) + trigger + content (popover) → calendar
 */
export const contract = {
	kind: "date-range-picker",
	description:
		"Combined date range field and range calendar popover for date range selection. ColdLight-owned ARIA with popover dialog, dual spinbutton field segments, and range calendar grid.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",

	slots: {
		required: ["root", "field", "trigger", "content", "calendar"],
		optional: [],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "div",
			aria: {
				role: "group",
				required: [],
				optional: [
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-labelledby", valueType: "aria-labelledby" },
				],
			},
			data: {
				kind: "date-range-picker",
				slot: "root",
				states: ["disabled"],
			},
		},
		field: {
			name: "field",
			element: "div",
			aria: {
				role: "group",
				required: [],
				optional: [
					{ attr: "aria-labelledby", valueType: "aria-labelledby" },
					{ attr: "aria-describedby", valueType: "aria-describedby" },
				],
			},
			data: {
				kind: "date-range-picker",
				slot: "field",
				states: ["focused", "disabled", "invalid"],
			},
		},
		trigger: {
			name: "trigger",
			element: "button",
			aria: {
				role: "button",
				required: [
					{ attr: "aria-haspopup", valueType: "aria-haspopup" },
				],
				optional: [
					{ attr: "aria-expanded", valueType: "aria-expanded" },
					{ attr: "aria-controls", valueType: "aria-controls" },
					{ attr: "aria-label", valueType: "aria-label" },
				],
			},
			data: {
				kind: "date-range-picker",
				slot: "trigger",
				states: ["open", "closed"],
			},
			keyboard: [
				{ key: "Enter", action: "toggle", description: "Toggle range calendar popover" },
				{ key: "Space", action: "toggle", description: "Toggle range calendar popover" },
				{ key: "ArrowDown", action: "open", description: "Open range calendar popover" },
			],
		},
		content: {
			name: "content",
			element: "div",
			aria: {
				role: "dialog",
				required: [
					{ attr: "aria-modal", valueType: "aria-modal" },
				],
				optional: [
					{ attr: "aria-label", valueType: "aria-label" },
				],
			},
			data: {
				kind: "date-range-picker",
				slot: "content",
				states: ["open", "closed"],
			},
			keyboard: [
				{ key: "Escape", action: "close", description: "Close range calendar popover" },
			],
		},
		calendar: {
			name: "calendar",
			element: "div",
			aria: {
				role: "grid",
				required: [],
				optional: [
					{ attr: "aria-labelledby", valueType: "aria-labelledby" },
					{ attr: "aria-multiselectable", valueType: "aria-multiselectable" },
				],
			},
			data: {
				kind: "date-range-picker",
				slot: "calendar",
				states: [],
			},
			keyboard: [
				{ key: "Enter", action: "confirm", description: "Confirm range selection and close" },
			],
		},
	},

	accessibleName: {
		required: false,
		sources: ["aria-label", "aria-labelledby"],
	},

	focus: {
		strategy: "activedescendant",
		initialFocus: "field",
		returnFocus: "trigger",
		trapContainer: "content",
	},

	keyboard: {
		global: [
			{ key: "Escape", action: "close", description: "Close popover" },
			{ key: "Enter", action: "confirm", description: "Confirm range selection" },
			{ key: "ArrowDown", action: "open", description: "Open calendar from trigger" },
		],
	},

	states: {
		primary: "open",
		all: ["open", "closed", "disabled", "invalid", "focused"],
		ariaMapping: {
			open: "aria-expanded",
			disabled: "aria-disabled",
		},
	},

	interactions: {
		modal: true,
		selectable: true,
		editable: true,
		expandable: true,
	},

	primitiveKind: "date-range-picker",
} as const satisfies ComponentContract;
