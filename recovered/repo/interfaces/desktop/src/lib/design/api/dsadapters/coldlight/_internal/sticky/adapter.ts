/**
 * @file Sticky Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Sticky builder into the universal AdapterResult.
 * Sticky is a layout-only builder — no ARIA, no states, no handlers.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { Sticky } from "./factory.js";
import type { StickyProps } from "./types.js";

/**
 * Create a Sticky adapter returning the universal AdapterResult.
 *
 * @param props - Sticky configuration (currently none; reserved for future use)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: StickyProps): AdapterResult {
	const builder = new Sticky(props);

	return {
		states: {},

		attrs: {
			root: {
				get "data-cl-sticky-root"() { return ""; },
				get id() { return builder.ids.root; },
			},
		},

		handlers: {
			root: {},
		},
	};
}
