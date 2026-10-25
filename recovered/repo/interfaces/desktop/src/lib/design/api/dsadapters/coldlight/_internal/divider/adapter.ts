/**
 * @file Divider Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Divider builder into the universal AdapterResult.
 * Components call resolveAdapter(DividerSchema) and get back
 * { states, attrs, handlers }. They never see the builder.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { Divider } from "./factory.svelte.js";
import type { DividerProps } from "./types.js";

/**
 * Create a Divider adapter returning the universal AdapterResult.
 *
 * @param props - Divider configuration (orientation, decorative)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: DividerProps): AdapterResult {
	const builder = new Divider(props);

	return {
		states: {
			decorative: {
				get current() { return builder.decorative; },
				set current(_v: boolean) { /* builder manages internally */ },
			},
		},

		attrs: {
			root: {
				get "data-cl-divider-root"() { return ""; },
				get id() { return builder.ids.root; },
				get role() { return builder.decorative ? "none" : "separator"; },
				get "aria-hidden"() { return builder.decorative ? "true" : undefined; },
				get "aria-orientation"() { return builder.decorative ? undefined : builder.orientation; },
				get "data-orientation"() { return builder.orientation; },
			},
		},

		handlers: {
			root: {},
		},
	};
}
