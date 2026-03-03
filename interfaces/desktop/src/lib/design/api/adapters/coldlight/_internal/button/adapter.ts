/**
 * @file Button Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Button builder into the universal AdapterResult.
 * Components call resolveAdapter(ButtonSchema) and get back
 * { states, attrs, handlers, context }. They never see the builder.
 *
 * IMPORTANT: All attrs use per-property getters to preserve Svelte 5
 * fine-grained reactivity. Each property access re-evaluates the builder
 * state, so $state reads are tracked in template/derived expressions.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { Button } from "./factory.js";
import type { ButtonProps } from "./types.js";

/**
 * Create a Button adapter returning the universal AdapterResult.
 *
 * @param props - Button configuration (disabled, pressed, loading, expanded)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: ButtonProps): AdapterResult {
	const builder = new Button(props);

	return {
		states: {
			disabled: {
				get current() { return builder.disabled; },
				set current(_v: boolean) { /* builder manages internally via Synced */ },
			},
			pressed: {
				get current() { return builder.pressed ?? false; },
				set current(v: boolean) {
					if (v) builder.press();
					else builder.unpress();
				},
			},
			loading: {
				get current() { return builder.loading; },
				set current(_v: boolean) { /* builder manages internally via Synced */ },
			},
			expanded: {
				get current() { return builder.expanded ?? false; },
				set current(_v: boolean) { /* builder manages internally via Synced */ },
			},
		},

		attrs: {
			root: {
				get "data-cl-button-root"() { return ""; },
				get id() { return builder.ids.root; },
				get type() { return builder.type; },
				get role() { return "button"; },
				get "aria-disabled"() { return builder.isDisabled ? "true" : undefined; },
				get "aria-pressed"() { return builder.pressed !== undefined ? String(builder.pressed) : undefined; },
				get "aria-expanded"() { return builder.expanded !== undefined ? String(builder.expanded) : undefined; },
				get "aria-busy"() { return builder.loading ? "true" : undefined; },
				get "data-disabled"() { return builder.isDisabled ? "" : undefined; },
				get "data-loading"() { return builder.loading ? "" : undefined; },
				get "data-state"() {
					return builder.isToggle
						? builder.pressed ? "on" : "off"
						: undefined;
				},
			},
		},

		handlers: {
			root: {
				click: (e: Event) => {
					if (builder.isDisabled) {
						e.preventDefault();
						return;
					}
					if (builder.isToggle) {
						builder.toggle();
					}
				},
				keydown: (e: Event) => {
					if (builder.isDisabled) return;
					const ke = e as KeyboardEvent;
					if (ke.key === " " || ke.key === "Enter") {
						ke.preventDefault();
						if (builder.isToggle) {
							builder.toggle();
						}
						(ke.currentTarget as HTMLElement).click();
					}
				},
			},
		},
	};
}
