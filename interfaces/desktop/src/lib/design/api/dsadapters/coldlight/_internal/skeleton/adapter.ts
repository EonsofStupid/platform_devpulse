/**
 * @file Skeleton Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Skeleton builder into the universal AdapterResult.
 * Components call resolveAdapter(SkeletonSchema) and get back
 * { states, attrs, handlers }. They never see the builder.
 *
 * Skeletons are non-interactive — no handlers.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { Skeleton } from "./factory.js";
import type { SkeletonProps } from "./types.js";

/**
 * Create a Skeleton adapter returning the universal AdapterResult.
 *
 * @param props - Skeleton configuration (loading, aria-label, onLoadingChange)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: SkeletonProps): AdapterResult {
	const builder = new Skeleton(props);

	return {
		states: {
			loading: {
				get current() { return builder.loading; },
				set current(_v: boolean) { /* builder manages internally */ },
			},
		},

		attrs: {
			root: {
				get "data-cl-skeleton-root"() { return ""; },
				get id() { return builder.ids.root; },
				get role() { return "status" as const; },
				get "aria-busy"() { return builder.loading ? "true" : "false"; },
				get "aria-label"() { return builder.root["aria-label"] as string; },
				get "data-state"() { return builder.loading ? "loading" : "loaded"; },
			},
		},

		handlers: {},
	};
}
