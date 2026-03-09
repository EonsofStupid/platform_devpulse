/**
 * @file Separator Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Separator builder into the universal AdapterResult.
 * Components call resolveAdapter(SeparatorSchema) and get back
 * { states, attrs, handlers }. They never see the builder.
 *
 * Separators are non-interactive structural elements — no handlers.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { Separator } from "./factory.svelte.js";
import type { SeparatorProps } from "./types.js";

/**
 * Create a Separator adapter returning the universal AdapterResult.
 *
 * @param props - Separator configuration (orientation, decorative)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: SeparatorProps): AdapterResult {
	const builder = new Separator(props);

	return {
		states: {
			decorative: {
				get current() { return builder.decorative; },
				set current(_v: boolean) { /* builder manages internally */ },
			},
		},

		attrs: {
			root: {
				get "data-cl-separator-root"() { return ""; },
				get id() { return builder.ids.root; },
				get role() { return builder.decorative ? "none" as const : "separator" as const; },
				get "aria-hidden"() { return builder.decorative ? "true" as const : undefined; },
				get "aria-orientation"() { return builder.decorative ? undefined : builder.orientation; },
				get "data-orientation"() { return builder.orientation; },
			},
		},

		handlers: {},
	};
}
