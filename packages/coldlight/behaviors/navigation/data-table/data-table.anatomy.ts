import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Data table anatomy — enhanced table with sorting, filtering, pagination.
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/table/
 */
export const dataTableAnatomy = createAnatomy("data-table", {
	root: {
		description: "Data table wrapper containing toolbar and table.",
		element: "div",
		required: true,
		accepts: ["structural"],
	},
	toolbar: {
		description:
			"Controls above the table — search, filters, bulk actions, column visibility toggles.",
		element: "div",
		required: false,
		aria: { role: "toolbar", conditional: ["aria-label"] },
		accepts: ["interactive"],
	},
	table: {
		description: "The data table element. Uses native <table> or role='table'.",
		element: "table",
		required: true,
		aria: {
			role: "table",
			conditional: ["aria-label", "aria-labelledby", "aria-rowcount", "aria-colcount"],
		},
		accepts: ["structural"],
	},
	header: {
		description: "Table header section containing sortable column headers.",
		element: "thead",
		required: true,
		accepts: ["structural"],
	},
	body: {
		description: "Table body containing data rows.",
		element: "tbody",
		required: true,
		accepts: ["structural"],
	},
	row: {
		description:
			"Data row. When selectable, tracks aria-selected. When expandable, tracks aria-expanded.",
		element: "tr",
		required: true,
		aria: { role: "row", conditional: ["aria-selected", "aria-expanded", "aria-rowindex"] },
		accepts: ["structural"],
		stateAttrs: ["data-selected", "data-expanded"],
		repeatable: true,
	},
	cell: {
		description: "Data cell within a row.",
		element: "td",
		required: true,
		aria: { role: "cell", conditional: ["aria-colindex"] },
		accepts: ["any"],
		repeatable: true,
	},
	"column-header": {
		description: "Sortable column header. aria-sort indicates current sort direction.",
		element: "th",
		required: true,
		aria: { role: "columnheader", conditional: ["aria-sort", "aria-colindex"] },
		accepts: ["text", "interactive"],
		stateAttrs: ["data-sorted"],
		keyboard: { activates: ["Space", "Enter"], focusable: true },
		repeatable: true,
	},
	pagination: {
		description: "Pagination controls below the table.",
		element: "nav",
		required: false,
		aria: { required: ["aria-label"] },
		accepts: ["interactive"],
	},
});
