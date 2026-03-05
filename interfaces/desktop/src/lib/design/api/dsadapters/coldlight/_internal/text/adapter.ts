/**
 * @file Text Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Text builder into the universal AdapterResult.
 * Text is a presentational typography wrapper — no states, no handlers.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { Text } from "./factory.js";
import type { TextProps } from "./types.js";

/**
 * Create a Text adapter returning the universal AdapterResult.
 *
 * @param props - Text configuration (currently none; reserved for future use)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: TextProps): AdapterResult {
	const builder = new Text(props);

	return {
		states: {},

		attrs: {
			root: {
				get "data-cl-text-root"() { return ""; },
				get id() { return builder.ids.root; },
				get role() { return "none"; },
			},
		},

		handlers: {
			root: {},
		},
	};
}
