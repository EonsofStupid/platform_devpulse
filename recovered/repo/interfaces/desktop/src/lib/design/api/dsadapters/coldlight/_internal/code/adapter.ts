/**
 * @file Code Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Code builder into the universal AdapterResult.
 * Components call resolveAdapter(CodeSchema) and get back
 * { states, attrs, handlers, context }. They never see the builder.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { Code } from "./factory.js";
import type { CodeProps } from "./types.js";

/**
 * Create a Code adapter returning the universal AdapterResult.
 *
 * @param props - Code configuration (currently none; display-only primitive)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: CodeProps): AdapterResult {
	const builder = new Code(props);

	return {
		states: {},

		attrs: {
			root: {
				get "data-cl-code-root"() { return ""; },
				get id() { return builder.ids.root; },
			},
		},

		handlers: {},
	};
}
