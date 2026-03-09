/**
 * @file FormField Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight FormField builder into the universal AdapterResult.
 * Components call resolveAdapter(FormFieldSchema) and get back
 * { states, attrs, handlers }. They never see the builder.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { FormField } from "./factory.svelte.js";
import type { FormFieldProps } from "./types.js";

/**
 * Create a FormField adapter returning the universal AdapterResult.
 *
 * @param props - FormField configuration (invalid, required, disabled, error)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: FormFieldProps): AdapterResult {
	const builder = new FormField(props);

	return {
		states: {
			invalid: {
				get current() { return builder.invalid; },
				set current(_v: boolean) { /* builder manages internally */ },
			},
			required: {
				get current() { return builder.required; },
				set current(_v: boolean) { /* builder manages internally */ },
			},
			disabled: {
				get current() { return builder.disabled; },
				set current(_v: boolean) { /* builder manages internally */ },
			},
		},

		attrs: {
			root: {
				get "data-cl-form-field-root"() { return ""; },
				get id() { return builder.ids.root; },
				get role() { return "group" as const; },
				get "aria-labelledby"() { return builder.ids.label; },
				get "data-invalid"() { return builder.invalid ? "" : undefined; },
				get "data-required"() { return builder.required ? "" : undefined; },
				get "data-disabled"() { return builder.disabled ? "" : undefined; },
			},
			label: {
				get "data-cl-form-field-label"() { return ""; },
				get id() { return builder.ids.label; },
				get for() { return builder.ids.control; },
				get "data-required"() { return builder.required ? "" : undefined; },
				get "data-disabled"() { return builder.disabled ? "" : undefined; },
			},
			control: {
				get "data-cl-form-field-control"() { return ""; },
				get id() { return builder.ids.control; },
				get "aria-invalid"() { return builder.invalid ? "true" : undefined; },
				get "aria-required"() { return builder.required ? "true" : undefined; },
				get "aria-disabled"() { return builder.disabled ? "true" : undefined; },
				get "data-invalid"() { return builder.invalid ? "" : undefined; },
				get "data-required"() { return builder.required ? "" : undefined; },
				get "data-disabled"() { return builder.disabled ? "" : undefined; },
			},
			description: {
				get "data-cl-form-field-description"() { return ""; },
				get id() { return builder.ids.description; },
			},
			error: {
				get "data-cl-form-field-error"() { return ""; },
				get id() { return builder.ids.error; },
				get role() { return "alert" as const; },
				get "aria-live"() { return "polite" as const; },
				get "data-invalid"() { return builder.invalid ? "" : undefined; },
			},
		},

		handlers: {
			root: {},
			label: {},
			control: {},
			description: {},
			error: {},
		},
	};
}
