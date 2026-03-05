/**
 * @file Prose Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Prose builder into the universal AdapterResult.
 * Components call resolveAdapter(ProseSchema) and get back
 * { states, attrs, handlers }. They never see the builder.
 *
 * Prose is a display-only primitive — no states, no handlers.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { Prose } from "./factory.js";
import type { ProseProps } from "./types.js";

/**
 * Create a Prose adapter returning the universal AdapterResult.
 *
 * @param props - Prose configuration (none — display-only primitive)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: ProseProps): AdapterResult {
	const builder = new Prose(props);

	return {
		states: {},

		attrs: {
			root: {
				get "data-cl-prose-root"() { return ""; },
				get id() { return builder.ids.root; },
			},
		},

		handlers: {},
	};
}
