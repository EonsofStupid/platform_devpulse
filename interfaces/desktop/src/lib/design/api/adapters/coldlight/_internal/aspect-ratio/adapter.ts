/**
 * @file AspectRatio Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight AspectRatio builder into the universal AdapterResult.
 * Components call resolveAdapter(AspectRatioSchema) and get back
 * { states, attrs, handlers, context }. They never see the builder.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { AspectRatio } from "./factory.js";
import type { AspectRatioProps } from "./types.js";

/**
 * Create an AspectRatio adapter returning the universal AdapterResult.
 *
 * @param props - AspectRatio configuration (ratio)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: AspectRatioProps): AdapterResult {
	const builder = new AspectRatio(props);

	return {
		states: {},

		attrs: {
			root: {
				get "data-cl-aspect-ratio-root"() { return ""; },
				get id() { return builder.ids.root; },
				get role() { return "none" as const; },
				get style() { return `aspect-ratio: ${builder.ratio};`; },
			},
		},

		handlers: {},
	};
}
