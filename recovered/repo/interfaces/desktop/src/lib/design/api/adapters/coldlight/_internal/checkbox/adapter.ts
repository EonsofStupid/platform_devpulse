/**
 * @file Checkbox Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Checkbox builder into the universal AdapterResult.
 * Components call resolveAdapter(CheckboxSchema) and get back
 * { states, attrs, handlers, context }. They never see the builder.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { Checkbox } from "./factory.js";
import type { CheckboxProps } from "./types.js";

/**
 * Compute the aria-checked string from builder state.
 */
function getAriaChecked(builder: Checkbox): string {
	if (builder.indeterminate) return "mixed";
	return builder.checked ? "true" : "false";
}

/**
 * Compute the data-state string from builder state.
 */
function getDataState(builder: Checkbox): string {
	if (builder.indeterminate) return "indeterminate";
	return builder.checked ? "checked" : "unchecked";
}

/**
 * Create a Checkbox adapter returning the universal AdapterResult.
 *
 * @param props - Checkbox configuration (checked, indeterminate, disabled, required, aria-*)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: CheckboxProps): AdapterResult {
	const builder = new Checkbox(props);

	return {
		states: {
			checked: {
				get current() { return builder.checked; },
				set current(v: boolean) { builder.checked = v; },
			},
			indeterminate: {
				get current() { return builder.indeterminate; },
				set current(_v: boolean) { /* builder manages internally */ },
			},
			disabled: {
				get current() { return builder.disabled; },
				set current(_v: boolean) { /* builder manages internally */ },
			},
			required: {
				get current() { return builder.required; },
				set current(_v: boolean) { /* builder manages internally */ },
			},
		},

		attrs: {
			root: {
				get "data-cl-checkbox-root"() { return ""; },
				get id() { return builder.ids.root; },
				get role() { return "checkbox" as const; },
				get type() { return "button" as const; },
				get "aria-checked"() { return getAriaChecked(builder); },
				get "aria-disabled"() { return builder.disabled ? "true" : undefined; },
				get "aria-required"() { return builder.required ? "true" : undefined; },
				get "data-state"() { return getDataState(builder); },
				get "data-disabled"() { return builder.disabled ? "" : undefined; },
				get tabindex() { return "0"; },
			},
			indicator: {
				get "data-cl-checkbox-indicator"() { return ""; },
				get id() { return builder.ids.indicator; },
				get "aria-hidden"() { return "true" as const; },
				get "data-state"() { return getDataState(builder); },
			},
			label: {
				get "data-cl-checkbox-label"() { return ""; },
				get id() { return builder.ids.label; },
				get "data-disabled"() { return builder.disabled ? "" : undefined; },
			},
		},

		handlers: {
			root: {
				click: (_e: Event) => {
					if (!builder.disabled) {
						builder.toggle();
					}
				},
				keydown: (e: Event) => {
					if (builder.disabled) return;
					const ke = e as KeyboardEvent;
					if (ke.key === " ") {
						ke.preventDefault();
						builder.toggle();
					}
				},
			},
			label: {
				click: (_e: Event) => {
					if (builder.disabled) return;
					const rootEl = document.getElementById(builder.ids.root);
					rootEl?.click();
					rootEl?.focus();
				},
			},
		},
	};
}
