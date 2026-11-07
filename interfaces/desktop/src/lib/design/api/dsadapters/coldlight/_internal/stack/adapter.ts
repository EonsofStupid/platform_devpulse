/**
 * @file Stack Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Stack builder into the universal AdapterResult.
 * Stack is a layout-only builder — no ARIA, no states, no handlers.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { Stack } from "./factory.js";
import type { StackProps } from "./types.js";

/**
 * Create a Stack adapter returning the universal AdapterResult.
 *
 * @param props - Stack configuration (currently none; reserved for future use)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: StackProps): AdapterResult {
	const builder = new Stack(props);

	return {
		states: {},

		attrs: {
			root: {
				get "data-cl-stack-root"() { return ""; },
				get id() { return builder.ids.root; },
			},
		},

		handlers: {
			root: {},
		},
	};
}
