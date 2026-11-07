/**
 * @file api/adapters/meltui/_internal/accordion/adapter.ts
 * @package @devpulse/coldlight
 *
 * MeltUI Accordion adapter — wraps the MeltUI Accordion builder into AdapterResult.
 *
 * Accordion is a compound component: the root slot is static, but item-level
 * slots (heading, trigger, content) are parameterized via getItem().
 * We expose getItem() through context so compound components can access it.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import {
	createMeltAccordion,
	type MeltAccordionConfig,
	type AccordionItemMeta,
} from "./factory.js";

export function createAdapter(props?: Record<string, unknown>): AdapterResult {
	const builder = createMeltAccordion(props as MeltAccordionConfig);

	return {
		states: {
			disabled: {
				get current() {
					return builder.disabled;
				},
				set current(_v: boolean) {
					// disabled is read-only on MeltUI Accordion (set via config)
				},
			},
		},
		attrs: {
			root: {
				get "data-melt-accordion-root"() {
					return builder.root["data-melt-accordion-root"];
				},
				get id() {
					return builder.root.id;
				},
			},
		},
		handlers: {
			root: {},
		},
		context: {
			/**
			 * Returns an AccordionItem with heading, trigger, and content slot attrs/handlers.
			 * Each item must be accessed via getItem({ id, disabled?, headingLevel? }).
			 */
			getItem<Meta extends Record<string, unknown>>(
				itemMeta: AccordionItemMeta<Meta>,
			) {
				const item = builder.getItem(itemMeta);

				return {
					/** Reactive state for this item */
					states: {
						expanded: {
							get current() {
								return item.isExpanded;
							},
							set current(v: boolean) {
								if (v) {
									item.expand();
								} else {
									item.collapse();
								}
							},
						},
						disabled: {
							get current() {
								return item.isDisabled ?? false;
							},
							set current(_v: boolean) {
								// item disabled is read-only (set via itemMeta)
							},
						},
					},
					/** Per-slot attribute records for this item */
					attrs: {
						heading: {
							get "data-melt-accordion-heading"() {
								return item.heading["data-melt-accordion-heading"];
							},
							get role() {
								return item.heading.role;
							},
							get "aria-level"() {
								return item.heading["aria-level"]?.toString();
							},
							get "data-heading-level"() {
								return item.heading["data-heading-level"]?.toString();
							},
						},
						trigger: {
							get "data-melt-accordion-trigger"() {
								return item.trigger["data-melt-accordion-trigger"];
							},
							get disabled() {
								return item.trigger.disabled === true
									? ""
									: undefined;
							},
							get "aria-disabled"() {
								return item.trigger["aria-disabled"]?.toString();
							},
							get "aria-expanded"() {
								return item.trigger["aria-expanded"]?.toString();
							},
							get "data-disabled"() {
								return item.trigger["data-disabled"];
							},
							get "data-value"() {
								return item.trigger["data-value"];
							},
							get "data-state"() {
								return item.trigger["data-state"];
							},
						},
						content: {
							get "data-melt-accordion-content"() {
								return item.trigger["data-melt-accordion-trigger"];
							},
							get "data-state"() {
								return item.content["data-state"];
							},
							get "data-disabled"() {
								return item.content["data-disabled"]?.toString();
							},
							get "data-value"() {
								return item.content["data-value"];
							},
						},
					},
					/** Per-slot event handler records for this item */
					handlers: {
						heading: {},
						trigger: {
							get onclick() {
								return item.trigger.onclick;
							},
							get onkeydown() {
								return item.trigger.onkeydown;
							},
						},
						content: {},
					},
				};
			},

			/** Check if an item is expanded by id */
			isExpanded: (id: string) => builder.isExpanded(id),
			/** Expand an item by id */
			expand: (id: string) => builder.expand(id),
			/** Collapse an item by id */
			collapse: (id: string) => builder.collapse(id),
			/** Toggle an item's expanded state by id */
			toggleExpanded: (id: string) => builder.toggleExpanded(id),

			/** Direct access to value for controlled scenarios */
			get value() {
				return builder.value;
			},
			set value(v) {
				builder.value = v;
			},
		},
	};
}
