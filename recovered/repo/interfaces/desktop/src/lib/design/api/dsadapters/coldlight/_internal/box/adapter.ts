/**
 * @file Box Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Box builder into the universal AdapterResult.
 * Components call resolveAdapter(BoxSchema) and get back
 * { states, attrs, handlers, context }. They never see the builder.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { Box } from "./factory.js";
import type { BoxProps } from "./types.js";

/**
 * Create a Box adapter returning the universal AdapterResult.
 *
 * @param props - Box configuration (currently none; reserved for future use)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: BoxProps): AdapterResult {
	const builder = new Box(props);

	return {
		states: {},

		attrs: {
			root: {
				get "data-cl-box-root"() { return ""; },
				get id() { return builder.ids.root; },
			},
		},

		handlers: {},
	};
}
