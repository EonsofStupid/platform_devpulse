/**
 * @file api/adapters/meltui/_internal/combobox/adapter.ts
 * @package @devpulse/coldlight
 *
 * MeltUI Combobox adapter — wraps the MeltUI Combobox builder into AdapterResult.
 *
 * Combobox is a compound component with parameterized options via getOption().
 * Static slots: label, input, trigger, content.
 * Parameterized slot: option (via context.getOption).
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { createMeltCombobox, type MeltComboboxConfig } from "./factory.js";

export function createAdapter(props?: Record<string, unknown>): AdapterResult {
	const builder = createMeltCombobox(props as MeltComboboxConfig<unknown>);

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
			highlighted: {
				get current() {
					return builder.highlighted !== null;
				},
				set current(_v: boolean) {
					// highlighted is set via context methods, not a boolean toggle
				},
			},
		},
		attrs: {
			label: {
				get for() {
					return builder.label.for;
				},
			},
			input: {
				get "data-melt-combobox-input"() {
					return builder.input["data-melt-combobox-input"];
				},
				get id() {
					return builder.input.id;
				},
				get role() {
					return builder.input.role;
				},
				get "aria-expanded"() {
					return builder.input["aria-expanded"]?.toString();
				},
				get "aria-controls"() {
					return builder.input["aria-controls"];
				},
				get "aria-owns"() {
					return builder.input["aria-owns"];
				},
				get value() {
					return builder.input.value;
				},
				get popovertarget() {
					return builder.input.popovertarget;
				},
				get style() {
					return builder.input.style;
				},
			},
			trigger: {
				get "data-melt-combobox-trigger"() {
					return builder.trigger["data-melt-combobox-trigger"];
				},
				get id() {
					return builder.trigger.id;
				},
				get style() {
					return builder.trigger.style;
				},
			},
			content: {
				get "data-melt-combobox-content"() {
					return builder.content["data-melt-combobox-content"];
				},
				get id() {
					return builder.content.id;
				},
				get role() {
					return builder.content.role;
				},
				get "aria-expanded"() {
					return builder.content["aria-expanded"]?.toString();
				},
				get "aria-activedescendant"() {
					return builder.content["aria-activedescendant"];
				},
				get popover() {
					return builder.content.popover;
				},
				get tabindex() {
					return builder.content.tabindex?.toString();
				},
				get inert() {
					return builder.content.inert ? "" : undefined;
				},
				get "data-open"() {
					return builder.content["data-open"];
				},
			},
		},
		handlers: {
			label: {
				get onclick() {
					return builder.label.onclick as unknown as (e: Event) => void;
				},
			},
			input: {
				get onclick() {
					return builder.input.onclick as unknown as (e: Event) => void;
				},
				get oninput() {
					return builder.input.oninput;
				},
				get onkeydown() {
					return builder.input.onkeydown as unknown as (e: Event) => void;
				},
				get onfocus() {
					return builder.input.onfocus as unknown as (e: Event) => void;
				},
				get onfocusout() {
					return builder.input.onfocusout as unknown as (e: Event) => void;
				},
			},
			trigger: {
				get onclick() {
					return builder.trigger.onclick as unknown as (e: Event) => void;
				},
				get onfocus() {
					return builder.trigger.onfocus as unknown as (e: Event) => void;
				},
				get onfocusout() {
					return builder.trigger.onfocusout as unknown as (e: Event) => void;
				},
			},
			content: {
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
			 * Returns per-option attrs and handlers for a given value.
			 * @param value The option value
			 * @param label Optional display label
			 * @param onSelect Optional callback when option is selected
			 */
			getOption(value: unknown, label?: string, onSelect?: () => void) {
				const option = builder.getOption(value, label, onSelect);
				return {
					attrs: {
						get id() {
							return option.id;
						},
						get "data-melt-combobox-option"() {
							return option["data-melt-combobox-option"];
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
							return option["aria-selected"]?.toString();
						},
						get "data-highlighted"() {
							return option["data-highlighted"];
						},
						get tabindex() {
							return option.tabindex?.toString();
						},
						get role() {
							return option.role;
						},
					},
					handlers: {
						get onmouseover() {
							return option.onmouseover as unknown as (e: Event) => void;
						},
						get onclick() {
							return option.onclick as unknown as (e: Event) => void;
						},
					},
				};
			},

			/** Check if a value is selected */
			isSelected: (value: unknown) => builder.isSelected(value),
			/** Select a value */
			select: (value: unknown) => builder.select(value),
			/** Highlight a value */
			highlight: (value: unknown) => builder.highlight(value),
			/** Highlight next option */
			highlightNext: () => builder.highlightNext(),
			/** Highlight previous option */
			highlightPrev: () => builder.highlightPrev(),
			/** Highlight first option */
			highlightFirst: () => builder.highlightFirst(),
			/** Highlight last option */
			highlightLast: () => builder.highlightLast(),

			/** Direct access to value */
			get value() {
				return builder.value;
			},
			set value(v) {
				builder.value = v;
			},

			/** Direct access to inputValue */
			get inputValue() {
				return builder.inputValue;
			},
			set inputValue(v: string) {
				builder.inputValue = v;
			},

			/** Direct access to highlighted value */
			get highlighted() {
				return builder.highlighted;
			},
			set highlighted(v) {
				builder.highlighted = v;
			},

			/** String representation of the current value */
			get valueAsString() {
				return builder.valueAsString;
			},

			/** Get the label for a given option value */
			getOptionLabel: (value: unknown) => builder.getOptionLabel(value),
		},
	};
}
