/**
 * @file api/adapters/meltui/_internal/slider/adapter.ts
 * @package @devpulse/coldlight
 *
 * MeltUI Slider adapter — wraps the MeltUI Slider builder into AdapterResult.
 *
 * Slider has two static slots: root (the track) and thumb.
 * The root slot carries the ARIA slider role and value attributes.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { createMeltSlider, type MeltSliderConfig } from "./factory.js";

export function createAdapter(props?: Record<string, unknown>): AdapterResult {
	const builder = createMeltSlider(props as MeltSliderConfig);

	return {
		states: {
			value: {
				get current() {
					return builder.value !== 0;
				},
				set current(_v: boolean) {
					// value is numeric; use context.value for direct access
				},
			},
		},
		attrs: {
			root: {
				get "data-melt-slider-root"() {
					return builder.root["data-melt-slider-root"];
				},
				get id() {
					return builder.root.id;
				},
				get role() {
					return builder.root.role;
				},
				get "aria-valuenow"() {
					return String(builder.root["aria-valuenow"]);
				},
				get "aria-valuemin"() {
					return String(builder.root["aria-valuemin"]);
				},
				get "aria-valuemax"() {
					return String(builder.root["aria-valuemax"]);
				},
				get "aria-orientation"() {
					return builder.root["aria-orientation"];
				},
				get "data-orientation"() {
					return builder.root["data-orientation"];
				},
				get "data-dragging"() {
					return builder.root["data-dragging"];
				},
				get "data-value"() {
					return String(builder.root["data-value"]);
				},
				get tabindex() {
					return String(builder.root.tabindex);
				},
				get style() {
					return builder.root.style;
				},
			},
			thumb: {
				get "data-melt-slider-thumb"() {
					return builder.thumb["data-melt-slider-thumb"];
				},
				get id() {
					return builder.thumb.id;
				},
				get "data-dragging"() {
					return builder.thumb["data-dragging"];
				},
				get "data-value"() {
					return String(builder.thumb["data-value"]);
				},
				get "data-orientation"() {
					return builder.thumb["data-orientation"];
				},
				get tabindex() {
					return String(builder.thumb.tabindex);
				},
			},
		},
		handlers: {
			root: {
				get onpointerdown() {
					return builder.root.onpointerdown as (e: Event) => void;
				},
				get onkeydown() {
					return builder.root.onkeydown as (e: Event) => void;
				},
			},
			thumb: {},
		},
		context: {
			/** Direct access to the numeric value */
			get value() {
				return builder.value;
			},
			set value(v: number) {
				builder.value = v;
			},

			/** Min/max/step configuration (read-only) */
			get min() {
				return builder.min;
			},
			get max() {
				return builder.max;
			},
			get step() {
				return builder.step;
			},
			get orientation() {
				return builder.orientation;
			},
		},
	};
}
