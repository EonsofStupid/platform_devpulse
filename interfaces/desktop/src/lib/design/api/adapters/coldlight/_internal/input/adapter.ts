/**
 * @file Input Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Input builder into the universal AdapterResult.
 * Components call resolveAdapter(InputSchema) and get back
 * { states, attrs, handlers }. They never see the builder.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { Input } from "./factory.js";
import type { InputProps } from "./types.js";

/**
 * Create an Input adapter returning the universal AdapterResult.
 *
 * @param props - Input configuration (value, disabled, readonly, required, invalid, type, etc.)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: InputProps): AdapterResult {
	const builder = new Input(props);

	return {
		states: {
			disabled: {
				get current() { return builder.disabled; },
				set current(_v: boolean) { /* builder manages internally */ },
			},
			readonly: {
				get current() { return builder.readOnly; },
				set current(_v: boolean) { /* builder manages internally */ },
			},
			required: {
				get current() { return builder.required; },
				set current(_v: boolean) { /* builder manages internally */ },
			},
			invalid: {
				get current() { return builder.invalid; },
				set current(_v: boolean) { /* builder manages internally */ },
			},
		},

		attrs: {
			root: {
				get "data-cl-input-root"() { return ""; },
				get id() { return builder.ids.root; },
				get "aria-invalid"() { return builder.invalid ? "true" : undefined; },
				get "aria-required"() { return builder.required ? "true" : undefined; },
				get "aria-disabled"() { return builder.disabled ? "true" : undefined; },
				get "aria-readonly"() { return builder.readOnly ? "true" : undefined; },
				get "data-disabled"() { return builder.disabled ? "" : undefined; },
				get "data-readonly"() { return builder.readOnly ? "" : undefined; },
				get "data-required"() { return builder.required ? "" : undefined; },
				get "data-invalid"() { return builder.invalid ? "" : undefined; },
				get "data-valid"() { return !builder.invalid ? "" : undefined; },
			},
		},

		handlers: {
			root: {
				input: (e: Event) => {
					const target = e.target as HTMLInputElement;
					builder.value = target.value;
				},
			},
		},
	};
}
