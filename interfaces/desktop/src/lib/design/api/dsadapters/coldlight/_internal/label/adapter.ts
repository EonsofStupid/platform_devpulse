/**
 * @file Label Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Label builder into the universal AdapterResult.
 * Components call resolveAdapter(LabelSchema) and get back
 * { states, attrs, handlers }. They never see the builder.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { Label } from "./factory.js";
import type { LabelProps } from "./types.js";

/**
 * Create a Label adapter returning the universal AdapterResult.
 *
 * @param props - Label configuration (htmlFor, disabled)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: LabelProps): AdapterResult {
	const builder = new Label(props);

	return {
		states: {
			disabled: {
				get current() { return builder.disabled; },
				set current(_v: boolean) { /* builder manages internally */ },
			},
		},

		attrs: {
			root: {
				get "data-cl-label-root"() { return ""; },
				get id() { return builder.ids.root; },
				get for() { return builder.root.for; },
				get "data-disabled"() { return builder.disabled ? "" : undefined; },
			},
		},

		handlers: {
			root: {},
		},
	};
}
