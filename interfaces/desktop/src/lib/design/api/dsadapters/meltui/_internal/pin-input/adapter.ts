/**
 * @file api/adapters/meltui/_internal/pininput/adapter.ts
 * @package @devpulse/coldlight
 *
 * MeltUI PinInput adapter — wraps the MeltUI PinInput builder into AdapterResult.
 *
 * PinInput has a root slot and an array of input slots (one per digit).
 * The inputs array is exposed via context since it is index-based.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { createMeltPinInput, type MeltPinInputConfig } from "./factory.js";

export function createAdapter(props?: Record<string, unknown>): AdapterResult {
	const builder = createMeltPinInput(props as MeltPinInputConfig);

	return {
		states: {
			disabled: {
				get current() {
					return builder.disabled;
				},
				set current(_v: boolean) {
					// disabled is read-only on MeltUI PinInput (set via config)
				},
			},
			filled: {
				get current() {
					return builder.isFilled;
				},
				set current(_v: boolean) {
					// isFilled is read-only (derived from value)
				},
			},
		},
		attrs: {
			root: {
				get "data-melt-pin-input-root"() {
					return builder.root["data-melt-pin-input-root"];
				},
				get id() {
					return builder.root.id;
				},
				get "data-complete"() {
					return builder.root["data-complete"];
				},
			},
			// Individual input attrs are per-index; use context.getInput(index)
			input: {},
		},
		handlers: {
			root: {},
			input: {},
		},
		context: {
			/**
			 * Returns the full array of input slot attribute/handler objects.
			 * Each entry contains attrs and handlers for one input element.
			 */
			get inputs() {
				return builder.inputs.map((input, index) => ({
					attrs: {
						get "data-melt-pin-input-input"() {
							return input["data-melt-pin-input-input"];
						},
						get placeholder() {
							return input.placeholder;
						},
						get disabled() {
							return input.disabled === true ? "" : undefined;
						},
						get type() {
							return input.type;
						},
						get "data-filled"() {
							return input["data-filled"];
						},
						get tabindex() {
							return input.tabindex?.toString();
						},
						get inputmode() {
							return input.inputmode;
						},
						get style() {
							return input.style;
						},
					},
					handlers: {
						get onkeydown() {
							return input.onkeydown as unknown as (e: Event) => void;
						},
						get onpointerdown() {
							return input.onpointerdown;
						},
						get onpointerup() {
							return input.onpointerup;
						},
						get oninput() {
							return input.oninput;
						},
						get onfocus() {
							return input.onfocus as unknown as (e: Event) => void;
						},
						get onblur() {
							return input.onblur as unknown as (e: Event) => void;
						},
						get onpaste() {
							return input.onpaste as unknown as (e: Event) => void;
						},
					},
					index,
				}));
			},

			/** Direct access to value */
			get value() {
				return builder.value;
			},
			set value(v: string) {
				builder.value = v;
			},

			/** Max length (number of digits) */
			get maxLength() {
				return builder.maxLength;
			},
		},
	};
}
