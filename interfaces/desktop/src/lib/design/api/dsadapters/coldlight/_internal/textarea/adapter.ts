/**
 * @file Textarea Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Textarea builder into the universal AdapterResult.
 * Textarea provides native multiline text input with validation state
 * support and oninput value syncing.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { Textarea } from "./factory.svelte.js";
import type { TextareaProps } from "./types.js";

/**
 * Create a Textarea adapter returning the universal AdapterResult.
 *
 * @param props - Textarea configuration (value, disabled, readonly, required, invalid, rows, etc.)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: TextareaProps): AdapterResult {
	const builder = new Textarea(props);

	return {
		states: {
			disabled: {
				get current() { return builder.disabled; },
				set current(_v: boolean) { /* builder manages internally via Synced */ },
			},
			readonly: {
				get current() { return builder.readOnly; },
				set current(_v: boolean) { /* builder manages internally via Synced */ },
			},
			required: {
				get current() { return builder.required; },
				set current(_v: boolean) { /* builder manages internally via Synced */ },
			},
			invalid: {
				get current() { return builder.invalid; },
				set current(_v: boolean) { /* builder manages internally via Synced */ },
			},
		},

		attrs: {
			root: {
				get "data-cl-textarea-root"() { return ""; },
				get id() { return builder.ids.root; },
				get "aria-multiline"() { return "true"; },
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
					const target = e.target as HTMLTextAreaElement;
					builder.value = target.value;
				},
			},
		},
	};
}
