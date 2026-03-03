/**
 * @file api/adapters/meltui/_internal/toggle/adapter.ts
 * @package @devpulse/coldlight
 *
 * MeltUI Toggle adapter — wraps the MeltUI Toggle builder into AdapterResult.
 *
 * Toggle has two static slots: trigger (the pressable button) and hiddenInput
 * (for form submission). The trigger carries aria-pressed state.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { createMeltToggle, type MeltToggleConfig } from "./factory.js";

export function createAdapter(props?: Record<string, unknown>): AdapterResult {
	const builder = createMeltToggle(props as MeltToggleConfig);

	return {
		states: {
			pressed: {
				get current() {
					return builder.value;
				},
				set current(v: boolean) {
					builder.value = v;
				},
			},
			disabled: {
				get current() {
					return builder.disabled;
				},
				set current(_v: boolean) {
					// disabled is read-only on MeltUI Toggle (set via config)
				},
			},
		},
		attrs: {
			trigger: {
				get "data-melt-toggle-trigger"() {
					return builder.trigger["data-melt-toggle-trigger"];
				},
				get "data-checked"() {
					return builder.trigger["data-checked"];
				},
				get "aria-pressed"() {
					return String(builder.trigger["aria-pressed"]);
				},
				get disabled() {
					return builder.trigger.disabled === true ? "" : undefined;
				},
			},
			hiddenInput: {
				get "data-melt-toggle-hidden-input"() {
					return builder.hiddenInput["data-melt-toggle-hidden-input"];
				},
				get type() {
					return builder.hiddenInput.type;
				},
				get value() {
					return builder.hiddenInput.value;
				},
			},
		},
		handlers: {
			trigger: {
				get onclick() {
					return builder.trigger.onclick;
				},
			},
			hiddenInput: {},
		},
		context: {
			/** Direct access to the boolean value for controlled scenarios */
			get value() {
				return builder.value;
			},
			set value(v: boolean) {
				builder.value = v;
			},
		},
	};
}
