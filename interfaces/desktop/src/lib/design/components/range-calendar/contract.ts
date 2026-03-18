/**
 * @file RangeCalendar Component Contract
 * @kind range-calendar
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * Compound component: root, header, grid, cell.
 * ColdLight-owned ARIA — renders grid pattern with range semantics.
 *
 * Pattern: WAI-ARIA APG Grid Pattern with range selection
 * Reference: https://www.w3.org/WAI/ARIA/apg/patterns/grid/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * RangeCalendar component contract — compile-time enforced.
 *
 * Compound: root → header (nav + heading) + grid → cell[]
 * Adds range-start, range-end, in-range states beyond single calendar.
 */
export const contract = {
	kind: "range-calendar",
	description:
		"Date range selection calendar with start/end highlighting. ColdLight-owned ARIA with grid pattern, roving tabindex, and range state tracking for hover preview.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/grid/",

	slots: {
		required: ["root", "header", "grid", "cell"],
		optional: ["heading", "prev-button", "next-button"],
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
				kind: "range-calendar",
				slot: "root",
				states: ["disabled"],
			},
		},
		header: {
			name: "header",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "range-calendar",
				slot: "header",
				states: [],
			},
		},
		heading: {
			name: "heading",
			element: "div",
			aria: {
				required: [],
				optional: [{ attr: "aria-live", valueType: "aria-live" }],
			},
			data: {
				kind: "range-calendar",
				slot: "heading",
				states: [],
			},
		},
		grid: {
			name: "grid",
			element: "table",
			aria: {
				role: "grid",
				required: [],
				optional: [
					{ attr: "aria-labelledby", valueType: "aria-labelledby" },
					{ attr: "aria-readonly", valueType: "aria-readonly" },
					{ attr: "aria-multiselectable", valueType: "aria-multiselectable" },
				],
			},
			data: {
				kind: "range-calendar",
				slot: "grid",
				states: [],
			},
		},
		cell: {
			name: "cell",
			element: "button",
			aria: {
				role: "gridcell",
				required: [],
				optional: [
					{ attr: "aria-selected", valueType: "aria-selected" },
					{ attr: "aria-disabled", valueType: "aria-disabled" },
					{ attr: "aria-current", valueType: "aria-current" },
				],
			},
			data: {
				kind: "range-calendar",
				slot: "cell",
				states: [
					"range-start",
					"range-end",
					"in-range",
					"selected",
					"today",
					"disabled",
					"outside-month",
				],
			},
			keyboard: [
				{ key: "ArrowUp", action: "prev-week", description: "Move to same day previous week" },
				{ key: "ArrowDown", action: "next-week", description: "Move to same day next week" },
				{ key: "ArrowLeft", action: "prev-day", description: "Move to previous day" },
				{ key: "ArrowRight", action: "next-day", description: "Move to next day" },
				{ key: "Home", action: "start-of-week", description: "Move to start of week" },
				{ key: "End", action: "end-of-week", description: "Move to end of week" },
				{ key: "PageUp", action: "prev-month", description: "Move to previous month" },
				{ key: "PageDown", action: "next-month", description: "Move to next month" },
				{ key: "Enter", action: "select", description: "Select or extend range" },
				{ key: "Space", action: "select", description: "Select or extend range" },
			],
		},
		"prev-button": {
			name: "prev-button",
			element: "button",
			aria: {
				role: "button",
				required: [],
				optional: [
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-disabled", valueType: "aria-disabled" },
				],
			},
			data: {
				kind: "range-calendar",
				slot: "prev-button",
				states: ["disabled"],
			},
			keyboard: [
				{ key: "Enter", action: "prev-month", description: "Navigate to previous month" },
				{ key: "Space", action: "prev-month", description: "Navigate to previous month" },
			],
		},
		"next-button": {
			name: "next-button",
			element: "button",
			aria: {
				role: "button",
				required: [],
				optional: [
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-disabled", valueType: "aria-disabled" },
				],
			},
			data: {
				kind: "range-calendar",
				slot: "next-button",
				states: ["disabled"],
			},
			keyboard: [
				{ key: "Enter", action: "next-month", description: "Navigate to next month" },
				{ key: "Space", action: "next-month", description: "Navigate to next month" },
			],
		},
	},

	accessibleName: {
		required: true,
		sources: ["aria-label", "aria-labelledby"],
		defaultSlot: "heading",
	},

	focus: {
		strategy: "roving",
		initialFocus: "cell",
	},

	keyboard: {
		global: [
			{ key: "ArrowUp", action: "prev-week", description: "Move to same day previous week" },
			{ key: "ArrowDown", action: "next-week", description: "Move to same day next week" },
			{ key: "ArrowLeft", action: "prev-day", description: "Move to previous day" },
			{ key: "ArrowRight", action: "next-day", description: "Move to next day" },
			{ key: "Home", action: "start-of-week", description: "Move to start of week" },
			{ key: "End", action: "end-of-week", description: "Move to end of week" },
			{ key: "PageUp", action: "prev-month", description: "Move to previous month" },
			{ key: "PageDown", action: "next-month", description: "Move to next month" },
		],
	},

	states: {
		primary: "selected",
		all: ["range-start", "range-end", "in-range", "selected", "today", "disabled", "outside-month"],
		ariaMapping: {
			selected: "aria-selected",
			disabled: "aria-disabled",
			today: "aria-current",
		},
	},

	interactions: {
		modal: false,
		selectable: true,
		editable: false,
		expandable: false,
	},

	primitiveKind: "range-calendar",
} as const satisfies ComponentContract;
