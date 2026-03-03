/**
 * @file List Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight List builder into the universal AdapterResult.
 * Components call resolveAdapter(ListSchema) and get back
 * { states, attrs, handlers }. They never see the builder.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { List } from "./factory.js";
import type { ListProps } from "./types.js";

/**
 * Create a List adapter returning the universal AdapterResult.
 *
 * @param props - List configuration (label)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: ListProps): AdapterResult {
	const builder = new List(props);

	return {
		states: {},

		attrs: {
			root: {
				get "data-cl-list-root"() { return ""; },
				get id() { return builder.ids.root; },
				get role() { return "list" as const; },
				get "aria-label"() { return builder.label; },
			},
			item: {
				get "data-cl-list-item"() { return ""; },
			},
		},

		handlers: {},
	};
}
