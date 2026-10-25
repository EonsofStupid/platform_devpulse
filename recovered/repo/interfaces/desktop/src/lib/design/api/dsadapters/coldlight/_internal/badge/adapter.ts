/**
 * @file Badge Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Badge builder into the universal AdapterResult.
 * Components call resolveAdapter(BadgeSchema) and get back
 * { states, attrs, handlers, context }. They never see the builder.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { Badge } from "./factory.svelte.js";
import type { BadgeProps } from "./types.js";

/**
 * Create a Badge adapter returning the universal AdapterResult.
 *
 * @param props - Badge configuration (decorative, label, variant)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: BadgeProps): AdapterResult {
	const builder = new Badge(props);

	return {
		states: {
			decorative: {
				get current() { return builder.decorative; },
				set current(_v: boolean) { /* builder manages internally */ },
			},
		},

		attrs: {
			root: {
				get "data-cl-badge-root"() { return ""; },
				get id() { return builder.ids.root; },
				get "data-variant"() { return builder.variant; },
				get "aria-hidden"() { return builder.decorative ? "true" : undefined; },
				get role() { return builder.decorative ? undefined : "status"; },
				get "aria-label"() { return !builder.decorative && builder.label ? builder.label : undefined; },
			},
		},

		handlers: {},
	};
}
