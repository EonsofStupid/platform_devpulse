/**
 * @file Table Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Table builder into the universal AdapterResult.
 * Table is a display component — no handlers, no interactive states.
 * Uses getRow(), getCell(), getHeadCell(sort) for parameterized slots.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { Table } from "./factory.js";
import type { TableProps, AriaSort } from "./types.js";

/**
 * Create a Table adapter returning the universal AdapterResult.
 *
 * @param props - Table configuration (label, labelledBy, describedBy)
 * @returns Universal AdapterResult — states, attrs, handlers, context
 */
export function createAdapter(props?: TableProps): AdapterResult {
	const builder = new Table(props);

	return {
		states: {},

		attrs: {
			root: {
				get "data-cl-table-root"() { return ""; },
				get id() { return builder.ids.root; },
				get role() { return "table"; },
				get "aria-label"() { return builder.label; },
				get "aria-labelledby"() { return builder.labelledBy; },
				get "aria-describedby"() { return builder.describedBy; },
			},
			header: {
				get "data-cl-table-header"() { return ""; },
				get id() { return builder.ids.header; },
			},
			body: {
				get "data-cl-table-body"() { return ""; },
				get id() { return builder.ids.body; },
			},
			caption: {
				get "data-cl-table-caption"() { return ""; },
				get id() { return builder.ids.caption; },
			},
		},

		handlers: {
			root: {},
			header: {},
			body: {},
			caption: {},
		},

		context: {
			getRow: () => builder.getRow(),
			getCell: () => builder.getCell(),
			getHeadCell: (sort?: AriaSort) => builder.getHeadCell(sort),
		},
	};
}
