/**
 * @file Stat Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Stat builder into the universal AdapterResult.
 * Stat is a display-only grouped component — no handlers, no interactive states.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { Stat } from "./factory.svelte.js";
import type { StatProps } from "./types.js";

/**
 * Create a Stat adapter returning the universal AdapterResult.
 *
 * @param props - Stat configuration (label)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: StatProps): AdapterResult {
	const builder = new Stat(props);

	return {
		states: {},

		attrs: {
			root: {
				get "data-cl-stat-root"() { return ""; },
				get id() { return builder.ids.root; },
				get role() { return "group"; },
				get "aria-label"() { return builder.label || undefined; },
				get "aria-labelledby"() { return builder.label ? undefined : builder.ids.label; },
			},
			label: {
				get "data-cl-stat-label"() { return ""; },
				get id() { return builder.ids.label; },
			},
			value: {
				get "data-cl-stat-value"() { return ""; },
				get id() { return builder.ids.value; },
			},
			helptext: {
				get "data-cl-stat-helptext"() { return ""; },
				get id() { return builder.ids.helptext; },
			},
		},

		handlers: {
			root: {},
			label: {},
			value: {},
			helptext: {},
		},
	};
}
