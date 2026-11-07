/**
 * @file InlineMessage Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight InlineMessage builder into the universal AdapterResult.
 * Components call resolveAdapter(InlineMessageSchema) and get back
 * { states, attrs, handlers }. They never see the builder.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { InlineMessage } from "./factory.js";
import type { InlineMessageProps } from "./types.js";

/**
 * Create an InlineMessage adapter returning the universal AdapterResult.
 *
 * @param props - InlineMessage configuration (aria-live politeness)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: InlineMessageProps): AdapterResult {
	const builder = new InlineMessage(props);

	return {
		states: {},

		attrs: {
			root: {
				get "data-cl-inline-message-root"() { return ""; },
				get id() { return builder.ids.root; },
				get role() { return "status" as const; },
				get "aria-live"() { return builder.root["aria-live"]; },
			},
			icon: {
				get "data-cl-inline-message-icon"() { return ""; },
				get id() { return builder.ids.icon; },
				get "aria-hidden"() { return "true" as const; },
			},
		},

		handlers: {
			root: {},
			icon: {},
		},
	};
}
