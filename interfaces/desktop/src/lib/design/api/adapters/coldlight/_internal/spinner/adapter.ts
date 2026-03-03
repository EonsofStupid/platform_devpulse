/**
 * @file Spinner Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Spinner builder into the universal AdapterResult.
 * Spinner is a non-interactive status indicator — no handlers.
 * Active state drives visibility in the accessibility tree.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { Spinner } from "./factory.js";
import type { SpinnerProps } from "./types.js";

/**
 * Create a Spinner adapter returning the universal AdapterResult.
 *
 * @param props - Spinner configuration (active, aria-label)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: SpinnerProps): AdapterResult {
	const builder = new Spinner(props);

	return {
		states: {
			active: {
				get current() { return builder.active; },
				set current(_v: boolean) { /* builder manages internally via Synced */ },
			},
		},

		attrs: {
			root: {
				get "data-cl-spinner-root"() { return ""; },
				get id() { return builder.ids.root; },
				get role() { return "status"; },
				get "aria-label"() { return builder.active ? "Loading" : undefined; },
				get "aria-hidden"() { return builder.active ? undefined : "true"; },
				get "data-state"() { return builder.active ? "active" : "inactive"; },
			},
		},

		handlers: {
			root: {},
		},
	};
}
