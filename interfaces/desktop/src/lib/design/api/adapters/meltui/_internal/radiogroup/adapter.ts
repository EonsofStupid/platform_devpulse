/**
 * @file api/adapters/meltui/_internal/radiogroup/adapter.ts
 * @package @devpulse/coldlight
 *
 * MeltUI RadioGroup adapter — wraps the MeltUI RadioGroup builder into AdapterResult.
 *
 * RadioGroup is a compound component: root and label slots are static, but
 * item-level slots are parameterized via getItem(value).
 * We expose getItem() through context so compound components can access it.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { createMeltRadioGroup, type MeltRadioGroupConfig } from "./factory.js";

export function createAdapter(props?: Record<string, unknown>): AdapterResult {
	const builder = createMeltRadioGroup(props as MeltRadioGroupConfig);

	return {
		states: {
			disabled: {
				get current() {
					return builder.disabled;
				},
				set current(_v: boolean) {
					// disabled is read-only on MeltUI RadioGroup (set via config)
				},
			},
		},
		attrs: {
			root: {
				get "data-melt-radio-group-root"() {
					return builder.root["data-melt-radio-group-root"];
				},
				get id() {
					return builder.root.id;
				},
				get role() {
					return builder.root.role;
				},
				get "aria-required"() {
					return String(builder.root["aria-required"]);
				},
				get "aria-labelledby"() {
					return builder.root["aria-labelledby"];
				},
				get "data-orientation"() {
					return builder.root["data-orientation"];
				},
				get "data-disabled"() {
					return builder.root["data-disabled"] === true ? "" : undefined;
				},
				get "data-value"() {
					return builder.root["data-value"];
				},
			},
			label: {
				get "data-melt-radio-group-label"() {
					return builder.label["data-melt-radio-group-label"];
				},
				get id() {
					return builder.label.id;
				},
				get for() {
					return builder.label.for;
				},
				get "data-orientation"() {
					return builder.label["data-orientation"];
				},
				get "data-disabled"() {
					return builder.label["data-disabled"] === true ? "" : undefined;
				},
				get "data-value"() {
					return builder.label["data-value"];
				},
			},
			hiddenInput: {
				get "data-melt-radio-group-hidden-input"() {
					return builder.hiddenInput["data-melt-radio-group-hidden-input"];
				},
				get disabled() {
					return String(builder.hiddenInput.disabled);
				},
				get required() {
					return String(builder.hiddenInput.required);
				},
				get hidden() {
					return String(builder.hiddenInput.hidden);
				},
				get "aria-hidden"() {
					return String(builder.hiddenInput["aria-hidden"]);
				},
				get tabindex() {
					return String(builder.hiddenInput.tabindex);
				},
				get value() {
					return builder.hiddenInput.value;
				},
				get name() {
					return builder.hiddenInput.name;
				},
			},
		},
		handlers: {
			root: {},
			label: {
				get onclick() {
					return builder.label.onclick as (e: Event) => void;
				},
			},
			hiddenInput: {},
		},
		context: {
			/**
			 * Returns a RadioItem with attrs and handlers for a specific value.
			 * Each item must be accessed via getItem(value).
			 */
			getItem(value: string) {
				const item = builder.getItem(value);

				return {
					/** Reactive state for this item */
					states: {
						checked: {
							get current() {
								return item.checked;
							},
							set current(_v: boolean) {
								// checked is controlled by selection, not set directly
							},
						},
					},
					/** Attribute record for this item */
					attrs: {
						get "data-melt-radio-group-item"() {
							return item.attrs["data-melt-radio-group-item"];
						},
						get "data-value"() {
							return item.attrs["data-value"];
						},
						get "data-state"() {
							return item.attrs["data-state"];
						},
						get "aria-checked"() {
							return String(item.attrs["aria-checked"]);
						},
						get role() {
							return item.attrs.role;
						},
						get tabindex() {
							return String(item.attrs.tabindex);
						},
					},
					/** Event handler record for this item */
					handlers: {
						get onclick() {
							return item.attrs.onclick;
						},
						get onkeydown() {
							return item.attrs.onkeydown;
						},
					},
				};
			},

			/** Select a specific item by value */
			select: (value: string) => builder.select(value),

			/** Direct access to value for controlled scenarios */
			get value() {
				return builder.value;
			},
			set value(v: string) {
				builder.value = v;
			},
		},
	};
}
