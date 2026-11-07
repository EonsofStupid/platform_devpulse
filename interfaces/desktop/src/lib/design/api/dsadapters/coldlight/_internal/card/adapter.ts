/**
 * @file Card Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Card builder into the universal AdapterResult.
 * Components call resolveAdapter(CardSchema) and get back
 * { states, attrs, handlers, context }. They never see the builder.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { Card } from "./factory.svelte.js";
import type { CardProps } from "./types.js";

/**
 * Create a Card adapter returning the universal AdapterResult.
 *
 * @param props - Card configuration (label, labelledBy)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: CardProps): AdapterResult {
	const builder = new Card(props);

	return {
		states: {},

		attrs: {
			root: {
				get "data-cl-card-root"() { return ""; },
				get id() { return builder.ids.root; },
				get role() { return "group" as const; },
				get "aria-label"() { return builder.label; },
				get "aria-labelledby"() { return builder.labelledBy; },
			},
			header: {
				get "data-cl-card-header"() { return ""; },
				get id() { return builder.ids.header; },
			},
			content: {
				get "data-cl-card-content"() { return ""; },
				get id() { return builder.ids.content; },
			},
			footer: {
				get "data-cl-card-footer"() { return ""; },
				get id() { return builder.ids.footer; },
			},
		},

		handlers: {},
	};
}
