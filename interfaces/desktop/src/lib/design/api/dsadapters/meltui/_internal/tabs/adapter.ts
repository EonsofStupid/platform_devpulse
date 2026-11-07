/**
 * @file api/adapters/meltui/_internal/tabs/adapter.ts
 * @package @devpulse/coldlight
 *
 * MeltUI Tabs adapter — wraps the MeltUI Tabs builder into AdapterResult.
 *
 * Tabs is a compound component: triggerList is a static slot, but individual
 * triggers and content panels are parameterized via getTrigger(value) and
 * getContent(value). We expose both through context.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { createMeltTabs, type MeltTabsConfig } from "./factory.js";

export function createAdapter(props?: Record<string, unknown>): AdapterResult {
	const builder = createMeltTabs(props as MeltTabsConfig);

	return {
		states: {
			value: {
				get current() {
					return builder.value !== "";
				},
				set current(_v: boolean) {
					// value is string-based; use context.value for direct access
				},
			},
		},
		attrs: {
			triggerList: {
				get "data-melt-tabs-trigger-list"() {
					return builder.triggerList["data-melt-tabs-trigger-list"];
				},
				get role() {
					return builder.triggerList.role;
				},
				get "aria-orientation"() {
					return builder.triggerList["aria-orientation"];
				},
				get "data-orientation"() {
					return builder.triggerList["data-orientation"];
				},
			},
		},
		handlers: {
			triggerList: {},
		},
		context: {
			/**
			 * Returns trigger attrs and handlers for a specific tab value.
			 * Each trigger must be accessed via getTrigger(value).
			 */
			getTrigger(value: string) {
				const trigger = builder.getTrigger(value);

				return {
					attrs: {
						get "data-melt-tabs-trigger"() {
							return trigger["data-melt-tabs-trigger"];
						},
						get "data-active"() {
							return trigger["data-active"];
						},
						get tabindex() {
							return String(trigger.tabindex);
						},
						get role() {
							return trigger.role;
						},
						get "aria-selected"() {
							return String(trigger["aria-selected"]);
						},
						get "aria-controls"() {
							return trigger["aria-controls"];
						},
						get "data-orientation"() {
							return trigger["data-orientation"];
						},
						get id() {
							return trigger.id;
						},
					},
					handlers: {
						get onclick() {
							return trigger.onclick;
						},
						get onkeydown() {
							return trigger.onkeydown;
						},
					},
				};
			},

			/**
			 * Returns content attrs for a specific tab value.
			 * Each content panel must be accessed via getContent(value).
			 */
			getContent(value: string) {
				const content = builder.getContent(value);

				return {
					attrs: {
						get "data-melt-tabs-content"() {
							return content["data-melt-tabs-content"];
						},
						get hidden() {
							return content.hidden ? "" : undefined;
						},
						get "data-active"() {
							return content["data-active"];
						},
						get role() {
							return content.role;
						},
						get id() {
							return content.id;
						},
						get "aria-labelledby"() {
							return content["aria-labelledby"];
						},
						get "data-orientation"() {
							return content["data-orientation"];
						},
					},
					handlers: {},
				};
			},

			/** Direct access to the active tab value for controlled scenarios */
			get value() {
				return builder.value;
			},
			set value(v: string) {
				builder.value = v;
			},

			/** Read-only configuration */
			get orientation() {
				return builder.orientation;
			},
			get loop() {
				return builder.loop;
			},
		},
	};
}
