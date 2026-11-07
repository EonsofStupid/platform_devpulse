/**
 * @file TableOfContents Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight TableOfContents builder into the universal AdapterResult.
 * TableOfContents tracks the active heading and provides getItem(headingId)
 * for per-entry attributes with aria-current="location".
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { TableOfContents } from "./factory.js";
import type { TableOfContentsProps } from "./types.js";

/**
 * Create a TableOfContents adapter returning the universal AdapterResult.
 *
 * @param props - TableOfContents configuration (label, activeId)
 * @returns Universal AdapterResult — states, attrs, handlers, context
 */
export function createAdapter(props?: TableOfContentsProps): AdapterResult {
	const builder = new TableOfContents(props);

	return {
		states: {},

		attrs: {
			root: {
				get "data-cl-table-of-contents-root"() { return ""; },
				get id() { return builder.ids.root; },
				get role() { return "navigation"; },
				get "aria-label"() { return builder.label; },
			},
			list: {
				get "data-cl-table-of-contents-list"() { return ""; },
				get id() { return builder.ids.list; },
			},
		},

		handlers: {
			root: {},
			list: {},
		},

		context: {
			getItem: (headingId: string) => builder.getItem(headingId),
			get activeId() { return builder.activeId; },
			set activeId(id: string | undefined) { builder.activeId = id; },
		},
	};
}
