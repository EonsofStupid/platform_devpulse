import { definePrimitive } from "../../schema/index.js";

export const tableSpec = definePrimitive({
	kind: "table",
	label: "Table",
	description: "A data table with native HTML table semantics for structured content.",
	category: "display",
	behaviorHook: "useTable",
	compound: true,
	a11y: {
		slots: {
			root: {
				element: "table",
				role: null,
				ariaAttrs: ["aria-label", "aria-labelledby"],
				description: "The table element with native table semantics",
			},
			header: {
				element: "thead",
				role: null,
				ariaAttrs: [],
				description: "Table header section containing column headers",
			},
			body: {
				element: "tbody",
				role: null,
				ariaAttrs: [],
				description: "Table body section containing data rows",
			},
			row: {
				element: "tr",
				role: null,
				ariaAttrs: ["aria-selected"],
				description: "A single row in the table",
			},
			cell: {
				element: "td",
				role: null,
				ariaAttrs: [],
				description: "A data cell within a table row",
			},
			"column-header": {
				element: "th",
				role: null,
				ariaAttrs: ["aria-sort"],
				description: "A column header cell with optional sort indicator",
			},
		},
		keyboard: [],
		focusStrategy: "none",
	},
});
