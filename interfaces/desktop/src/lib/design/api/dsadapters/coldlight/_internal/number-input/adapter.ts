/**
 * @file NumberInput Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight NumberInput builder into the universal AdapterResult.
 * Components call resolveAdapter(NumberInputSchema) and get back
 * { states, attrs, handlers }. They never see the builder.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { NumberInput } from "./factory.svelte.js";
import type { NumberInputProps } from "./types.js";

/**
 * Create a NumberInput adapter returning the universal AdapterResult.
 *
 * @param props - NumberInput configuration (value, min, max, step, disabled, etc.)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: NumberInputProps): AdapterResult {
	const builder = new NumberInput(props);

	return {
		states: {
			disabled: {
				get current() { return builder.disabled; },
				set current(_v: boolean) { /* builder manages internally */ },
			},
		},

		attrs: {
			root: {
				get "data-cl-number-input-root"() { return ""; },
				get id() { return builder.ids.root; },
				get role() { return "group" as const; },
				get "aria-label"() { return builder.root["aria-label"]; },
				get "data-disabled"() { return builder.disabled ? "" : undefined; },
			},
			input: {
				get "data-cl-number-input-input"() { return ""; },
				get id() { return builder.ids.input; },
				get role() { return "spinbutton" as const; },
				get type() { return "text" as const; },
				get inputmode() { return "numeric" as const; },
				get "aria-valuenow"() { return String(builder.value); },
				get "aria-valuemin"() { return builder.min === -Infinity ? undefined : String(builder.min); },
				get "aria-valuemax"() { return builder.max === Infinity ? undefined : String(builder.max); },
				get "aria-disabled"() { return builder.disabled ? "true" : undefined; },
				get "aria-readonly"() { return builder.readOnly ? "true" : undefined; },
				get "aria-required"() { return builder.required ? "true" : undefined; },
				get "data-disabled"() { return builder.disabled ? "" : undefined; },
			},
			increment: {
				get "data-cl-number-input-increment"() { return ""; },
				get id() { return builder.ids.increment; },
				get type() { return "button" as const; },
				get "aria-label"() { return "Increase value"; },
				get "aria-disabled"() { return (builder.disabled || builder.readOnly || !builder.canIncrement) ? "true" : undefined; },
				get "data-disabled"() { return (builder.disabled || builder.readOnly || !builder.canIncrement) ? "" : undefined; },
			},
			decrement: {
				get "data-cl-number-input-decrement"() { return ""; },
				get id() { return builder.ids.decrement; },
				get type() { return "button" as const; },
				get "aria-label"() { return "Decrease value"; },
				get "aria-disabled"() { return (builder.disabled || builder.readOnly || !builder.canDecrement) ? "true" : undefined; },
				get "data-disabled"() { return (builder.disabled || builder.readOnly || !builder.canDecrement) ? "" : undefined; },
			},
		},

		handlers: {
			input: {
				input: (e: Event) => {
					const target = e.target as HTMLInputElement;
					const parsed = parseFloat(target.value);
					if (!Number.isNaN(parsed)) {
						builder.value = parsed;
					}
				},
				keydown: (e: Event) => {
					if (builder.disabled || builder.readOnly) return;
					const ke = e as KeyboardEvent;
					if (ke.key === "ArrowUp") {
						ke.preventDefault();
						builder.incrementValue();
					} else if (ke.key === "ArrowDown") {
						ke.preventDefault();
						builder.decrementValue();
					} else if (ke.key === "Home") {
						ke.preventDefault();
						if (builder.min !== -Infinity) {
							builder.value = builder.min;
						}
					} else if (ke.key === "End") {
						ke.preventDefault();
						if (builder.max !== Infinity) {
							builder.value = builder.max;
						}
					}
				},
			},
			increment: {
				click: () => {
					builder.incrementValue();
				},
			},
			decrement: {
				click: () => {
					builder.decrementValue();
				},
			},
		},
	};
}
