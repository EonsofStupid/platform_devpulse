/**
 * @file Spacer Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Spacer builder into the universal AdapterResult.
 * Spacer is purely decorative — no states, no handlers, just aria-hidden.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { Spacer } from "./factory.js";
import type { SpacerProps } from "./types.js";

/**
 * Create a Spacer adapter returning the universal AdapterResult.
 *
 * @param props - Spacer configuration (currently none; reserved for future use)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: SpacerProps): AdapterResult {
	const builder = new Spacer(props);

	return {
		states: {},

		attrs: {
			root: {
				get "data-cl-spacer-root"() { return ""; },
				get id() { return builder.ids.root; },
				get "aria-hidden"() { return "true" as const; },
			},
		},

		handlers: {
			root: {},
		},
	};
}
