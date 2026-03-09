/**
 * @file Breadcrumb Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Breadcrumb builder into the universal AdapterResult.
 * Components call resolveAdapter(BreadcrumbSchema) and get back
 * { states, attrs, handlers, context }. They never see the builder.
 *
 * Note: The breadcrumb builder also exposes `getLink(isCurrent)` for
 * per-link `aria-current="page"` derivation. This is surfaced via context
 * so compound components can call it.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { Breadcrumb } from "./factory.svelte.js";
import type { BreadcrumbProps } from "./types.js";

/**
 * Create a Breadcrumb adapter returning the universal AdapterResult.
 *
 * @param props - Breadcrumb configuration (label, separator)
 * @returns Universal AdapterResult — states, attrs, handlers, context
 */
export function createAdapter(props?: BreadcrumbProps): AdapterResult {
	const builder = new Breadcrumb(props);

	return {
		states: {},

		attrs: {
			root: {
				get "data-cl-breadcrumb-root"() { return ""; },
				get id() { return builder.ids.root; },
				get role() { return "navigation" as const; },
				get "aria-label"() { return builder.label; },
			},
			list: {
				get "data-cl-breadcrumb-list"() { return ""; },
				get id() { return builder.ids.list; },
			},
			item: {
				get "data-cl-breadcrumb-item"() { return ""; },
			},
			separator: {
				get "data-cl-breadcrumb-separator"() { return ""; },
				get role() { return "presentation" as const; },
				get "aria-hidden"() { return "true" as const; },
			},
			link: {
				get "data-cl-breadcrumb-link"() { return ""; },
			},
		},

		handlers: {},

		context: {
			/** Get link attrs with aria-current for current page indication. */
			getLink: (isCurrent: boolean) => builder.getLink(isCurrent),
		},
	};
}
