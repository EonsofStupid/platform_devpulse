/**
 * @file HStack Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight HStack builder into the universal AdapterResult.
 * Components call resolveAdapter(HStackSchema) and get back
 * { states, attrs, handlers }. They never see the builder.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { HStack } from "./factory.js";
import type { HStackProps } from "./types.js";

/**
 * Create an HStack adapter returning the universal AdapterResult.
 *
 * @param props - HStack configuration (reserved for future use)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: HStackProps): AdapterResult {
	const builder = new HStack(props);

	return {
		states: {},

		attrs: {
			root: {
				get "data-cl-hstack-root"() { return ""; },
				get id() { return builder.ids.root; },
			},
		},

		handlers: {
			root: {},
		},
	};
}
