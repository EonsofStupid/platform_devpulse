/**
 * @file Kbd Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Kbd builder into the universal AdapterResult.
 * Components call resolveAdapter(KbdSchema) and get back
 * { states, attrs, handlers }. They never see the builder.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { Kbd } from "./factory.js";
import type { KbdProps } from "./types.js";

/**
 * Create a Kbd adapter returning the universal AdapterResult.
 *
 * @param props - Kbd configuration (display-only, no interactive props)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: KbdProps): AdapterResult {
	const builder = new Kbd(props);

	return {
		states: {},

		attrs: {
			root: {
				get "data-cl-kbd-root"() { return ""; },
				get id() { return builder.ids.root; },
			},
		},

		handlers: {
			root: {},
		},
	};
}
