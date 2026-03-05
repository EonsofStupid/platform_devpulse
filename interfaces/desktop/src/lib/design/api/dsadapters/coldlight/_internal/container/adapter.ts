/**
 * @file Container Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Container builder into the universal AdapterResult.
 * Components call resolveAdapter(ContainerSchema) and get back
 * { states, attrs, handlers, context }. They never see the builder.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { Container } from "./factory.js";
import type { ContainerProps } from "./types.js";

/**
 * Create a Container adapter returning the universal AdapterResult.
 *
 * @param props - Container configuration (currently none; reserved for future use)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: ContainerProps): AdapterResult {
	const builder = new Container(props);

	return {
		states: {},

		attrs: {
			root: {
				get "data-cl-container-root"() { return ""; },
				get id() { return builder.ids.root; },
			},
		},

		handlers: {},
	};
}
