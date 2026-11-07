/**
 * @file ColorInput Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight ColorInput builder into the universal AdapterResult.
 * Components call resolveAdapter(ColorInputSchema) and get back
 * { states, attrs, handlers, context }. They never see the builder.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { ColorInput } from "./factory.js";
import type { ColorInputProps } from "./types.js";

/**
 * Create a ColorInput adapter returning the universal AdapterResult.
 *
 * @param props - ColorInput configuration (value, disabled, required, invalid, aria-*)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: ColorInputProps): AdapterResult {
	const builder = new ColorInput(props);

	return {
		states: {
			disabled: {
				get current() { return builder.disabled; },
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
				get "data-cl-color-input-root"() { return ""; },
				get id() { return builder.ids.root; },
				get role() { return "group" as const; },
				get "data-disabled"() { return builder.disabled ? "" : undefined; },
				get "data-invalid"() { return builder.invalid ? "" : undefined; },
			},
			swatch: {
				get "data-cl-color-input-swatch"() { return ""; },
				get id() { return builder.ids.swatch; },
				get role() { return "presentation" as const; },
				get "aria-hidden"() { return "true" as const; },
				get style() { return `background-color: ${builder.value}`; },
			},
			input: {
				get "data-cl-color-input-input"() { return ""; },
				get id() { return builder.ids.input; },
				get type() { return "color" as const; },
				get value() { return builder.value; },
				get disabled() { return builder.disabled ? "true" : undefined; },
				get required() { return builder.required ? "true" : undefined; },
				get "aria-invalid"() { return builder.invalid ? "true" : undefined; },
				get "aria-required"() { return builder.required ? "true" : undefined; },
				get "aria-disabled"() { return builder.disabled ? "true" : undefined; },
				get "data-disabled"() { return builder.disabled ? "" : undefined; },
				get "data-invalid"() { return builder.invalid ? "" : undefined; },
			},
			label: {
				get "data-cl-color-input-label"() { return ""; },
				get id() { return builder.ids.label; },
				get for() { return builder.ids.input; },
			},
		},

		handlers: {
			input: {
				input: (e: Event) => {
					const target = e.target as HTMLInputElement;
					builder.value = target.value;
				},
			},
		},
	};
}
