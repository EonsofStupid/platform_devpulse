/**
 * @file Form Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Form builder into the universal AdapterResult.
 * Components call resolveAdapter(FormSchema) and get back
 * { states, attrs, handlers }. They never see the builder.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { Form } from "./factory.svelte.js";
import type { FormProps } from "./types.js";

/**
 * Create a Form adapter returning the universal AdapterResult.
 *
 * @param props - Form configuration (label, disabled, pending, onSubmit, onReset)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: FormProps): AdapterResult {
	const builder = new Form(props);

	return {
		states: {
			disabled: {
				get current() { return builder.disabled; },
				set current(_v: boolean) { /* builder manages internally */ },
			},
			pending: {
				get current() { return builder.pending; },
				set current(v: boolean) { builder.pending = v; },
			},
		},

		attrs: {
			root: {
				get "data-cl-form-root"() { return ""; },
				get id() { return builder.ids.root; },
				get "data-disabled"() { return builder.disabled ? "" : undefined; },
				get "data-state"() { return builder.pending ? "pending" : "idle"; },
				get "aria-busy"() { return builder.pending ? "true" : undefined; },
			},
		},

		handlers: {
			root: {
				submit: (e: Event) => {
					const rootAttrs = builder.root;
					rootAttrs.onsubmit(e as SubmitEvent);
				},
				reset: () => {
					const rootAttrs = builder.root;
					rootAttrs.onreset();
				},
			},
		},
	};
}
