/**
 * @file Flex Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Flex builder into the universal AdapterResult.
 * Components call resolveAdapter(FlexSchema) and get back
 * { states, attrs, handlers }. They never see the builder.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { Flex } from "./factory.js";
import type { FlexProps } from "./types.js";

/**
 * Create a Flex adapter returning the universal AdapterResult.
 *
 * @param props - Flex configuration (reserved for future use)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: FlexProps): AdapterResult {
	const builder = new Flex(props);

	return {
		states: {},

		attrs: {
			root: {
				get "data-cl-flex-root"() { return ""; },
				get id() { return builder.ids.root; },
			},
		},

		handlers: {
			root: {},
		},
	};
}
