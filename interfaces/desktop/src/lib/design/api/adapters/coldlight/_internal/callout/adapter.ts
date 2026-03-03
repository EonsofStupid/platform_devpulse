/**
 * @file Callout Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Callout builder into the universal AdapterResult.
 * Components call resolveAdapter(CalloutSchema) and get back
 * { states, attrs, handlers, context }. They never see the builder.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { Callout } from "./factory.js";
import type { CalloutProps } from "./types.js";

/**
 * Create a Callout adapter returning the universal AdapterResult.
 *
 * @param props - Callout configuration (aria-label)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: CalloutProps): AdapterResult {
	const builder = new Callout(props);

	return {
		states: {},

		attrs: {
			root: {
				get "data-cl-callout-root"() { return ""; },
				get id() { return builder.ids.root; },
				get role() { return "note" as const; },
			},
			icon: {
				get "data-cl-callout-icon"() { return ""; },
				get id() { return builder.ids.icon; },
				get "aria-hidden"() { return "true" as const; },
			},
			content: {
				get "data-cl-callout-content"() { return ""; },
				get id() { return builder.ids.content; },
			},
		},

		handlers: {},
	};
}
