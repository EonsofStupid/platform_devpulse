/**
 * @file Center Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Center builder into the universal AdapterResult.
 * Components call resolveAdapter(CenterSchema) and get back
 * { states, attrs, handlers, context }. They never see the builder.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { Center } from "./factory.js";
import type { CenterProps } from "./types.js";

/**
 * Create a Center adapter returning the universal AdapterResult.
 *
 * @param props - Center configuration (currently none; reserved for future use)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: CenterProps): AdapterResult {
	const builder = new Center(props);

	return {
		states: {},

		attrs: {
			root: {
				get "data-cl-center-root"() { return ""; },
				get id() { return builder.ids.root; },
			},
		},

		handlers: {},
	};
}
