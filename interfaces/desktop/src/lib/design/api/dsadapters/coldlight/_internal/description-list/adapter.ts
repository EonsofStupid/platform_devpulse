/**
 * @file DescriptionList Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight DescriptionList builder into the universal AdapterResult.
 * Components call resolveAdapter(DescriptionListSchema) and get back
 * { states, attrs, handlers }. They never see the builder.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { DescriptionList } from "./factory.svelte.js";
import type { DescriptionListProps } from "./types.js";

/**
 * Create a DescriptionList adapter returning the universal AdapterResult.
 *
 * @param props - DescriptionList configuration (label)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: DescriptionListProps): AdapterResult {
	const builder = new DescriptionList(props);

	return {
		states: {},

		attrs: {
			root: {
				get "data-cl-description-list-root"() { return ""; },
				get id() { return builder.ids.root; },
				get "aria-label"() { return builder.label; },
			},
			item: {
				get "data-cl-description-list-item"() { return ""; },
			},
			term: {
				get "data-cl-description-list-term"() { return ""; },
			},
			details: {
				get "data-cl-description-list-details"() { return ""; },
			},
		},

		handlers: {
			root: {},
			item: {},
			term: {},
			details: {},
		},
	};
}
