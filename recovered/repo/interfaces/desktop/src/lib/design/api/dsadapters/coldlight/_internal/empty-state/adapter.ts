/**
 * @file EmptyState Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight EmptyState builder into the universal AdapterResult.
 * Components call resolveAdapter(EmptyStateSchema) and get back
 * { states, attrs, handlers }. They never see the builder.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { EmptyState } from "./factory.svelte.js";
import type { EmptyStateProps } from "./types.js";

/**
 * Create an EmptyState adapter returning the universal AdapterResult.
 *
 * @param props - EmptyState configuration (label)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: EmptyStateProps): AdapterResult {
	const builder = new EmptyState(props);

	return {
		states: {},

		attrs: {
			root: {
				get "data-cl-empty-state-root"() { return ""; },
				get id() { return builder.ids.root; },
				get role() { return "status" as const; },
				get "aria-label"() { return builder.label || undefined; },
			},
			icon: {
				get "data-cl-empty-state-icon"() { return ""; },
				get id() { return builder.ids.icon; },
				get role() { return "presentation" as const; },
				get "aria-hidden"() { return "true" as const; },
			},
			title: {
				get "data-cl-empty-state-title"() { return ""; },
				get id() { return builder.ids.title; },
			},
			description: {
				get "data-cl-empty-state-description"() { return ""; },
				get id() { return builder.ids.description; },
			},
			action: {
				get "data-cl-empty-state-action"() { return ""; },
				get id() { return builder.ids.action; },
			},
		},

		handlers: {
			root: {},
			icon: {},
			title: {},
			description: {},
			action: {},
		},
	};
}
