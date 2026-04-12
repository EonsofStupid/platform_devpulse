import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Calendar anatomy — date grid with month navigation and keyboard-driven cell selection.
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/grid/
 *           https://www.w3.org/WAI/ARIA/apg/patterns/datepicker-dialog/
 *
 * Composition: root (role=group) → header (month title + nav buttons) →
 * grid (role=grid) → rows of gridcell buttons, one per day. The grid
 * uses a roving tabindex — only the focused date is tabbable, arrow
 * keys move focus without tabbing.
 *
 * Keyboard on the grid:
 * - ArrowLeft / ArrowRight: ±1 day
 * - ArrowUp / ArrowDown: ±1 week
 * - PageUp / PageDown: ±1 month
 * - Shift+PageUp / Shift+PageDown: ±1 year
 * - Home / End: first / last day of week
 * - Enter / Space: select focused date
 */
export const calendarAnatomy = createAnatomy("calendar", {
	root: {
		description:
			"Outer container grouping header and grid. Exposes role=group with aria-labelledby pointing at the month heading so screen readers announce the control collectively.",
		element: "div",
		required: true,
		accepts: ["structural"],
		stateAttrs: ["data-disabled", "data-read-only", "data-invalid"],
		aria: {
			role: "group",
			required: ["aria-labelledby"],
			conditional: ["aria-disabled", "aria-readonly", "aria-invalid"],
		},
	},
	header: {
		description: "Wraps the month heading and prev/next navigation buttons. Layout-only.",
		element: "div",
		required: true,
		accepts: ["structural", "any"],
	},
	heading: {
		description:
			"Live-updating heading that announces the displayed month and year. Must carry aria-live=polite so keyboard users hear the change when navigating across month boundaries.",
		element: "div",
		required: true,
		accepts: ["text"],
	},
	prevButton: {
		description: "Button that moves the grid backward by one month.",
		element: "button",
		required: true,
		accepts: ["text", "media"],
		stateAttrs: ["data-disabled"],
		aria: { role: "button", required: ["aria-label"] },
		keyboard: { focusable: true, navigates: ["Enter", "Space"] },
	},
	nextButton: {
		description: "Button that moves the grid forward by one month.",
		element: "button",
		required: true,
		accepts: ["text", "media"],
		stateAttrs: ["data-disabled"],
		aria: { role: "button", required: ["aria-label"] },
		keyboard: { focusable: true, navigates: ["Enter", "Space"] },
	},
	grid: {
		description:
			"Tabular grid of date cells. Uses role=grid with aria-labelledby pointing at the heading.",
		element: "table",
		required: true,
		accepts: ["structural"],
		stateAttrs: ["data-disabled"],
		aria: { role: "grid", required: ["aria-labelledby"] },
	},
	columnHeader: {
		description:
			"Day-of-week header row cell. Uses scope=col and a two-letter abbreviation for compact layouts.",
		element: "th",
		required: true,
		accepts: ["text"],
	},
	cell: {
		description:
			"Individual day button inside the grid. Roving-tabindex: only the focused cell has tabindex=0, every other cell has tabindex=-1. Announces selection state via aria-selected and current-day state via aria-current.",
		element: "button",
		required: true,
		accepts: ["text"],
		stateAttrs: [
			"data-selected",
			"data-today",
			"data-disabled",
			"data-outside-month",
			"data-focused",
		],
		aria: {
			role: "gridcell",
			required: ["aria-selected"],
			conditional: ["aria-disabled", "aria-current"],
		},
		keyboard: {
			focusable: true,
			navigates: [
				"ArrowLeft",
				"ArrowRight",
				"ArrowUp",
				"ArrowDown",
				"PageUp",
				"PageDown",
				"Home",
				"End",
				"Enter",
				"Space",
			],
		},
	},
});
