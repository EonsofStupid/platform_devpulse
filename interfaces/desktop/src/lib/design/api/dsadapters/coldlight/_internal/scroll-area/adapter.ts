/**
 * @file ScrollArea Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight ScrollArea builder into the universal AdapterResult.
 * Components call resolveAdapter(ScrollAreaSchema) and get back
 * { states, attrs, handlers }. They never see the builder.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { ScrollArea } from "./factory.svelte.js";
import type { ScrollAreaProps } from "./types.js";

/**
 * Create a ScrollArea adapter returning the universal AdapterResult.
 *
 * @param props - ScrollArea configuration (label, orientation)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: ScrollAreaProps): AdapterResult {
	const builder = new ScrollArea(props);

	return {
		states: {},

		attrs: {
			root: {
				get "data-cl-scroll-area-root"() { return ""; },
				get id() { return builder.ids.root; },
				get "data-orientation"() { return builder.orientation; },
			},
			viewport: {
				get "data-cl-scroll-area-viewport"() { return ""; },
				get id() { return builder.ids.viewport; },
				get role() { return "region" as const; },
				get "aria-label"() { return builder.viewport["aria-label"]; },
			},
			scrollbar: {
				get "data-cl-scroll-area-scrollbar"() { return ""; },
				get id() { return builder.ids.scrollbar; },
				get role() { return "scrollbar" as const; },
				get "aria-controls"() { return builder.ids.viewport; },
				get "aria-orientation"() { return builder.orientation; },
				get "aria-valuemin"() { return "0"; },
				get "aria-valuemax"() { return "100"; },
				get "aria-valuenow"() { return "0"; },
				get "data-orientation"() { return builder.orientation; },
			},
			thumb: {
				get "data-cl-scroll-area-thumb"() { return ""; },
				get id() { return builder.ids.thumb; },
				get "data-orientation"() { return builder.orientation; },
			},
		},

		handlers: {},
	};
}
