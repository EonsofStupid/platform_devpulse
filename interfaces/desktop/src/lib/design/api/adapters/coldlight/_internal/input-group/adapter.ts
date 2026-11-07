/**
 * @file InputGroup Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight InputGroup builder into the universal AdapterResult.
 * Components call resolveAdapter(InputGroupSchema) and get back
 * { states, attrs, handlers }. They never see the builder.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { InputGroup } from "./factory.js";
import type { InputGroupProps } from "./types.js";

/**
 * Create an InputGroup adapter returning the universal AdapterResult.
 *
 * @param props - InputGroup configuration (disabled, aria-label, aria-labelledby)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: InputGroupProps): AdapterResult {
	const builder = new InputGroup(props);

	return {
		states: {
			disabled: {
				get current() { return builder.disabled; },
				set current(_v: boolean) { /* builder manages internally */ },
			},
		},

		attrs: {
			root: {
				get "data-cl-input-group-root"() { return ""; },
				get id() { return builder.ids.root; },
				get role() { return "group" as const; },
				get "aria-label"() { return builder.root["aria-label"]; },
				get "aria-labelledby"() { return builder.root["aria-labelledby"]; },
				get "data-disabled"() { return builder.disabled ? "" : undefined; },
			},
			prefix: {
				get "data-cl-input-group-prefix"() { return ""; },
				get id() { return builder.ids.prefix; },
			},
			input: {
				get "data-cl-input-group-input"() { return ""; },
				get id() { return builder.ids.input; },
				get "data-disabled"() { return builder.disabled ? "" : undefined; },
			},
			suffix: {
				get "data-cl-input-group-suffix"() { return ""; },
				get id() { return builder.ids.suffix; },
			},
		},

		handlers: {
			root: {},
			prefix: {},
			input: {},
			suffix: {},
		},
	};
}
