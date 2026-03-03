/**
 * @file api/adapters/meltui/_internal/progress/adapter.ts
 * @package @devpulse/coldlight
 *
 * MeltUI Progress adapter — wraps the MeltUI Progress builder into AdapterResult.
 *
 * Progress has two slots: root (the progressbar container with ARIA attrs)
 * and progress (the visual fill indicator with CSS custom properties).
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { createMeltProgress, type MeltProgressConfig } from "./factory.js";

export function createAdapter(props?: Record<string, unknown>): AdapterResult {
	const builder = createMeltProgress(props as MeltProgressConfig);

	return {
		states: {
			indeterminate: {
				get current() {
					return builder.value === 0 && builder.root["data-state"] === "indeterminate";
				},
				set current(_v: boolean) {
					// indeterminate is derived from value state
				},
			},
			complete: {
				get current() {
					return builder.value >= builder.max;
				},
				set current(_v: boolean) {
					// complete is derived from value/max
				},
			},
		},
		attrs: {
			root: {
				get "data-melt-progress-root"() {
					return builder.root["data-melt-progress-root"];
				},
				get role() {
					return builder.root.role;
				},
				get "aria-valuemin"() {
					return builder.root["aria-valuemin"]?.toString();
				},
				get "aria-valuemax"() {
					return builder.root["aria-valuemax"]?.toString();
				},
				get "aria-valuenow"() {
					return builder.root["aria-valuenow"]?.toString();
				},
				get value() {
					return builder.root.value?.toString();
				},
				get max() {
					return builder.root.max?.toString();
				},
				get "data-value"() {
					return builder.root["data-value"]?.toString();
				},
				get "data-state"() {
					return builder.root["data-state"];
				},
				get "data-max"() {
					return builder.root["data-max"]?.toString();
				},
			},
			progress: {
				get "data-melt-progress-progress"() {
					return builder.progress["data-melt-progress-progress"];
				},
				get style() {
					return builder.progress.style;
				},
			},
		},
		handlers: {
			root: {},
			progress: {},
		},
		context: {
			/** Direct access to value for programmatic control */
			get value() {
				return builder.value;
			},
			set value(v: number) {
				builder.value = v;
			},
			/** Maximum value */
			get max() {
				return builder.max;
			},
		},
	};
}
