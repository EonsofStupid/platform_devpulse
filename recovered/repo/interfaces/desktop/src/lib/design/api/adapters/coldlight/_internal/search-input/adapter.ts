/**
 * @file SearchInput Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight SearchInput builder into the universal AdapterResult.
 * Components call resolveAdapter(SearchInputSchema) and get back
 * { states, attrs, handlers }. They never see the builder.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { SearchInput } from "./factory.js";
import type { SearchInputProps } from "./types.js";

/**
 * Create a SearchInput adapter returning the universal AdapterResult.
 *
 * @param props - SearchInput configuration (value, disabled, placeholder, onClear)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: SearchInputProps): AdapterResult {
	const builder = new SearchInput(props);

	return {
		states: {
			disabled: {
				get current() { return builder.disabled; },
				set current(_v: boolean) { /* builder manages internally */ },
			},
		},

		attrs: {
			root: {
				get "data-cl-search-input-root"() { return ""; },
				get id() { return builder.ids.root; },
				get role() { return "search" as const; },
				get "aria-label"() { return builder.root["aria-label"] as string; },
				get "data-disabled"() { return builder.disabled ? "" : undefined; },
				get "data-has-value"() { return builder.hasValue ? "" : undefined; },
			},
			input: {
				get "data-cl-search-input-input"() { return ""; },
				get id() { return builder.ids.input; },
				get role() { return "searchbox" as const; },
				get type() { return "search" as const; },
				get "aria-label"() { return builder.input["aria-label"] as string; },
				get "aria-describedby"() { return builder.input["aria-describedby"] as string | undefined; },
				get "aria-disabled"() { return builder.disabled ? "true" : undefined; },
				get "data-disabled"() { return builder.disabled ? "" : undefined; },
			},
			icon: {
				get "data-cl-search-input-icon"() { return ""; },
				get id() { return builder.ids.icon; },
				get "aria-hidden"() { return "true" as const; },
			},
			clear: {
				get "data-cl-search-input-clear"() { return ""; },
				get id() { return builder.ids.clear; },
				get type() { return "button" as const; },
				get "aria-label"() { return "Clear search"; },
				get "aria-disabled"() { return (builder.disabled || !builder.hasValue) ? "true" : undefined; },
				get "data-disabled"() { return (builder.disabled || !builder.hasValue) ? "" : undefined; },
				get "data-visible"() { return builder.hasValue ? "" : undefined; },
			},
		},

		handlers: {
			input: {
				input: (e: Event) => {
					const target = e.target as HTMLInputElement;
					builder.value = target.value;
				},
				keydown: (e: Event) => {
					if (builder.disabled) return;
					const ke = e as KeyboardEvent;
					if (ke.key === "Escape" && builder.hasValue) {
						ke.preventDefault();
						builder.clearValue();
					}
				},
			},
			clear: {
				click: () => {
					if (builder.disabled) return;
					builder.clearValue();
				},
			},
		},
	};
}
