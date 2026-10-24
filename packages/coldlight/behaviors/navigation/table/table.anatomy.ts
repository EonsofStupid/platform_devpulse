import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Table anatomy — structured data display with rows and columns.
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/table/
 *
 * A table displays structured data in rows and columns. Column headers
 * provide context for cell data. Supports sorting, row selection, and
 * sticky headers. For 2D item selection without tabular structure, use GridList.
 *
 * Keyboard:
 * - Tab: move to/from table
 * - ArrowKeys: navigate between cells (when using grid role)
 * - Space: toggle row selection (when selectable)
 */
export const tableAnatomy = createAnatomy("table", {
	root: {
		description:
			"Table container. Uses native <table> element or role='table'. Provides the structural context for all table content.",
		element: "table",
		required: true,
		aria: {
			role: "table",
			conditional: ["aria-label", "aria-labelledby", "aria-rowcount", "aria-colcount"],
		},
		accepts: ["structural"],
	},
	header: {
		description: "Table header section containing column headers. Uses <thead> element.",
		element: "thead",
		required: true,
		accepts: ["structural"],
	},
	body: {
		description: "Table body containing data rows. Uses <tbody> element.",
		element: "tbody",
		required: true,
		accepts: ["structural"],
	},
	row: {
		description:
			"Table row containing cells. Uses <tr> element. When selectable, tracks aria-selected state.",
		element: "tr",
		required: true,
		aria: {
			role: "row",
			conditional: ["aria-selected", "aria-rowindex"],
		},
		accepts: ["structural"],
		stateAttrs: ["data-selected"],
		repeatable: true,
	},
	cell: {
		description: "Data cell within a row. Uses <td> element. aria-colindex for virtual scrolling.",
		element: "td",
		required: true,
		aria: {
			role: "cell",
			conditional: ["aria-colindex"],
		},
		accepts: ["any"],
		repeatable: true,
	},
	"column-header": {
		description:
			"Column header cell. Uses <th> with scope='col'. When sortable, uses aria-sort to indicate sort direction (ascending, descending, none).",
		element: "th",
		required: true,
		aria: {
			role: "columnheader",
			conditional: ["aria-sort", "aria-colindex"],
		},
		accepts: ["text", "interactive"],
		stateAttrs: ["data-sorted"],
		keyboard: {
			activates: ["Space", "Enter"],
			focusable: true,
		},
		repeatable: true,
	},
});
