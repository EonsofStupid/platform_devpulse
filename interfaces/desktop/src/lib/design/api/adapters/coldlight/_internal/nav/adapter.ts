/**
 * @file Nav Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Nav builder into the universal AdapterResult.
 * Components call resolveAdapter(NavSchema) and get back
 * { states, attrs, handlers }. They never see the builder.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { Nav } from "./factory.js";
import type { NavProps } from "./types.js";

/**
 * Create a Nav adapter returning the universal AdapterResult.
 *
 * @param props - Nav configuration (label)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: NavProps): AdapterResult {
	const builder = new Nav(props);

	return {
		states: {},

		attrs: {
			root: {
				get "data-cl-nav-root"() { return ""; },
				get id() { return builder.ids.root; },
				get role() { return "navigation" as const; },
				get "aria-label"() { return builder.label || undefined; },
			},
		},

		handlers: {},
	};
}
