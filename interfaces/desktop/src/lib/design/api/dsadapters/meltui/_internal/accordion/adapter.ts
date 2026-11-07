/**
 * @file api/adapters/meltui/_internal/accordion/adapter.ts
 * @package @devpulse/coldlight
 *
 * MeltUI Accordion adapter — wraps the MeltUI Accordion builder into AdapterResult.
 *
 * Accordion is compound: root-level slots (root) + per-item slots (heading, trigger, content).
 * The context property exposes getItem() for sub-components to access their item transport.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import {
	createMeltAccordion,
	type MeltAccordionConfig,
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
			getItem: (meta: { id: string; disabled?: boolean; headingLevel?: number }) => {
				const item = builder.getItem(meta as any);
				return {
					slots: {
						get heading() { return item.heading; },
						get trigger() { return item.trigger; },
						get content() { return item.content; },
					},
					states: {
						get isExpanded() { return item.isExpanded; },
						get isDisabled() { return item.isDisabled; },
					},
					expand: () => item.expand(),
					collapse: () => item.collapse(),
					toggleExpanded: () => item.toggleExpanded(),
				};
			},
			isExpanded: (id: string) => builder.isExpanded(id),
		},
	};
}
