/**
 * @file Grid Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Grid builder into the universal AdapterResult.
 * Components call resolveAdapter(GridSchema) and get back
 * { states, attrs, handlers }. They never see the builder.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { Grid } from "./factory.js";
import type { GridProps } from "./types.js";

/**
 * Create a Grid adapter returning the universal AdapterResult.
 *
 * @param props - Grid configuration (reserved for future use)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: GridProps): AdapterResult {
	const builder = new Grid(props);

	return {
		states: {},

		attrs: {
			root: {
				get "data-cl-grid-root"() { return ""; },
				get id() { return builder.ids.root; },
			},
		},

		handlers: {
			root: {},
		},
	};
}
