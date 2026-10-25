/**
 * @file api/adapters/meltui/_internal/toggle/adapter.ts
 * @package @devpulse/coldlight
 *
 * MeltUI Toggle adapter — wraps the MeltUI Toggle builder into AdapterResult.
 *
 * Toggle has one slot: trigger. The trigger toggles the pressed state,
 * with aria-pressed attribute managed by MeltUI.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import {
	createMeltToggle,
	type MeltToggleConfig,
} from "./factory.js";

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
				get "aria-pressed"() {
					return builder.trigger["aria-pressed"]?.toString();
				},
				get disabled() {
					return builder.trigger.disabled ? "" : undefined;
				},
				get "data-checked"() {
					return builder.trigger["data-checked"];
				},
			},
		},
		handlers: {
			trigger: {
				get onclick() {
					return builder.trigger.onclick;
				},
			},
		},
	};
}
