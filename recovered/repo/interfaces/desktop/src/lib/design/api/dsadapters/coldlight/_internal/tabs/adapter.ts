/**
 * @file Tabs Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Tabs builder (tabs.svelte.ts) into the universal AdapterResult.
 * Tabs uses parameterized getTrigger(value) and getContent(value) for
 * per-tab attributes. The adapter exposes static slots and context methods.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { ColdLightTabs, type ColdLightTabsConfig } from "./tabs.svelte.js";

/**
 * Create a Tabs adapter returning the universal AdapterResult.
 *
 * @param props - Tabs configuration (value, onValueChange, orientation, activateOnFocus, loop)
 * @returns Universal AdapterResult — states, attrs, handlers, context
 */
export function createAdapter(props?: Record<string, unknown>): AdapterResult {
	const builder = new ColdLightTabs(props as ColdLightTabsConfig);

	return {
		states: {},

		attrs: {
			root: {
				get "data-orientation"() { return builder.orientation; },
			},
			list: {
				get role() { return "tablist"; },
				get "aria-orientation"() { return builder.orientation; },
				get "data-orientation"() { return builder.orientation; },
			},
		},

		handlers: {
			root: {},
			list: {},
		},

		context: {
			getTrigger: (tabValue: string, disabled?: boolean) => builder.getTrigger(tabValue, disabled),
			getContent: (tabValue: string) => builder.getContent(tabValue),
			get value() { return builder.value; },
			set value(v: string) { builder.value = v; },
		},
	};
}
