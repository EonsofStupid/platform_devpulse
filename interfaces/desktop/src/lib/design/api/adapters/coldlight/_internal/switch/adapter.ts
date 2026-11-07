/**
 * @file Switch Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Switch builder into the universal AdapterResult.
 * Switch is a fully interactive toggle widget — checked/unchecked state,
 * click and keyboard handlers on root, label click-to-toggle.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { Switch } from "./factory.js";
import type { SwitchProps } from "./types.js";

/**
 * Create a Switch adapter returning the universal AdapterResult.
 *
 * @param props - Switch configuration (checked, disabled, required, aria-*)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: SwitchProps): AdapterResult {
	const builder = new Switch(props);

	return {
		states: {
			checked: {
				get current() { return builder.checked; },
				set current(v: boolean) { builder.checked = v; },
			},
			disabled: {
				get current() { return builder.disabled; },
				set current(_v: boolean) { /* builder manages internally via Synced */ },
			},
			required: {
				get current() { return builder.required; },
				set current(_v: boolean) { /* builder manages internally via Synced */ },
			},
		},

		attrs: {
			root: {
				get "data-cl-switch-root"() { return ""; },
				get id() { return builder.ids.root; },
				get role() { return "switch"; },
				get type() { return "button"; },
				get "aria-checked"() { return String(builder.checked); },
				get "aria-disabled"() { return builder.disabled ? "true" : undefined; },
				get "aria-required"() { return builder.required ? "true" : undefined; },
				get "data-state"() { return builder.checked ? "checked" : "unchecked"; },
				get "data-disabled"() { return builder.disabled ? "" : undefined; },
				get tabindex() { return "0"; },
			},
			thumb: {
				get "data-cl-switch-thumb"() { return ""; },
				get id() { return builder.ids.thumb; },
				get "aria-hidden"() { return "true"; },
				get "data-state"() { return builder.checked ? "checked" : "unchecked"; },
			},
			label: {
				get "data-cl-switch-label"() { return ""; },
				get id() { return builder.ids.label; },
				get "data-disabled"() { return builder.disabled ? "" : undefined; },
			},
		},

		handlers: {
			root: {
				click: (_e: Event) => {
					if (!builder.disabled) builder.toggle();
				},
				keydown: (e: Event) => {
					if (builder.disabled) return;
					const ke = e as KeyboardEvent;
					if (ke.key === " " || ke.key === "Enter") {
						ke.preventDefault();
						builder.toggle();
					}
				},
			},
			thumb: {},
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
