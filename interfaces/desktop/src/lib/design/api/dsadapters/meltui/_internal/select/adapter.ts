/**
 * @file api/adapters/meltui/_internal/select/adapter.ts
 * @package @devpulse/coldlight
 *
 * MeltUI Select adapter — wraps the MeltUI Select builder into AdapterResult.
 *
 * Select is a compound component: label, trigger, and content slots are static,
 * but option-level slots are parameterized via getOption(value, label?).
 * We expose getOption() through context so compound components can access it.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { createMeltSelect, type MeltSelectConfig } from "./factory.js";

export function createAdapter(props?: Record<string, unknown>): AdapterResult {
	const builder = createMeltSelect(props as MeltSelectConfig);

	return {
		states: {
			open: {
				get current() {
					return builder.open;
				},
				set current(v: boolean) {
					builder.open = v;
				},
			},
		},
		attrs: {
			label: {
				get for() {
					return builder.label.for;
				},
			},
			trigger: {
				get "data-melt-select-trigger"() {
					return builder.trigger["data-melt-select-trigger"];
				},
				get id() {
					return builder.trigger.id;
				},
				get role() {
					return builder.trigger.role;
				},
				get "aria-expanded"() {
					return String(builder.trigger["aria-expanded"]);
				},
				get "aria-controls"() {
					return builder.trigger["aria-controls"];
				},
				get "aria-owns"() {
					return builder.trigger["aria-owns"];
				},
				get popovertarget() {
					return builder.trigger.popovertarget;
				},
				get style() {
					return builder.trigger.style;
				},
			},
			content: {
				get "data-melt-select-content"() {
					return builder.content["data-melt-select-content"];
				},
				get id() {
					return builder.content.id;
				},
				get role() {
					return builder.content.role;
				},
				get "aria-expanded"() {
					return String(builder.content["aria-expanded"]);
				},
				get "aria-activedescendant"() {
					return builder.content["aria-activedescendant"];
				},
				get popover() {
					return builder.content.popover;
				},
				get tabindex() {
					return String(builder.content.tabindex);
				},
				get inert() {
					return builder.content.inert ? "" : undefined;
				},
				get "data-open"() {
					return builder.content["data-open"];
				},
				get style() {
					return builder.content.style;
				},
			},
		},
		handlers: {
			label: {
				get onclick() {
					return builder.label.onclick as (e: Event) => void;
				},
			},
			trigger: {
				get onclick() {
					return builder.trigger.onclick as unknown as (e: Event) => void;
				},
				get onkeydown() {
					return builder.trigger.onkeydown as unknown as (e: Event) => void;
				},
				get onfocus() {
					return builder.trigger.onfocus as unknown as (e: Event) => void;
				},
				get onfocusout() {
					return builder.trigger.onfocusout as unknown as (e: Event) => void;
				},
			},
			content: {
				get onkeydown() {
					return builder.content.onkeydown as unknown as (e: Event) => void;
				},
				get onfocus() {
					return builder.content.onfocus as unknown as (e: Event) => void;
				},
				get onfocusout() {
					return builder.content.onfocusout as unknown as (e: Event) => void;
				},
				get ontoggle() {
					return builder.content.ontoggle as unknown as (e: Event) => void;
				},
			},
		},
		context: {
			/**
			 * Returns option attrs and handlers for a specific value.
			 * Each option must be accessed via getOption(value, label?).
			 */
			getOption(value: unknown, label?: string) {
				const option = builder.getOption(value, label);

				return {
					attrs: {
						get "data-melt-select-option"() {
							return option["data-melt-select-option"];
						},
						get "data-value"() {
							return option["data-value"];
						},
						get "data-label"() {
							return option["data-label"];
						},
						get "aria-hidden"() {
							return option["aria-hidden"] === true ? "true" : undefined;
						},
						get "aria-selected"() {
							return String(option["aria-selected"]);
						},
						get "data-highlighted"() {
							return option["data-highlighted"];
						},
						get role() {
							return option.role;
						},
						get tabindex() {
							return String(option.tabindex);
						},
					},
					handlers: {
						get onmouseover() {
							return option.onmouseover;
						},
						get onclick() {
							return option.onclick;
						},
					},
				};
			},

			/** Get the DOM ID for an option */
			getOptionId: (value: unknown) => builder.getOptionId(value),
			/** Get the label for an option value */
			getOptionLabel: (value: unknown) => builder.getOptionLabel(value),
			/** Check if a value is selected */
			isSelected: (value: unknown) => builder.isSelected(value),
			/** Select a value */
			select: (value: unknown) => builder.select(value),

			/** Direct access to value for controlled scenarios */
			get value() {
				return builder.value;
			},
			set value(v) {
				builder.value = v;
			},

			/** Direct access to highlighted for controlled scenarios */
			get highlighted() {
				return builder.highlighted;
			},
			set highlighted(v) {
				builder.highlighted = v;
			},

			/** The current value as a display string */
			get valueAsString() {
				return builder.valueAsString;
			},
		},
	};
}
