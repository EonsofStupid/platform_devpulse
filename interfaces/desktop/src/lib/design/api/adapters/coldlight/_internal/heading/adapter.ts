/**
 * @file Heading Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Heading builder into the universal AdapterResult.
 * Components call resolveAdapter(HeadingSchema) and get back
 * { states, attrs, handlers }. They never see the builder.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { Heading } from "./factory.js";
import type { HeadingProps } from "./types.js";

/**
 * Create a Heading adapter returning the universal AdapterResult.
 *
 * @param props - Heading configuration (level)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: HeadingProps): AdapterResult {
	const builder = new Heading(props);

	return {
		states: {},

		attrs: {
			root: {
				get "data-cl-heading-root"() { return ""; },
				get id() { return builder.ids.root; },
				get role() { return "heading" as const; },
				get "aria-level"() { return String(builder.level); },
			},
		},

		handlers: {
			root: {},
		},
	};
}
