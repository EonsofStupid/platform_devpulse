/**
 * @file NavItem Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight NavItem builder into the universal AdapterResult.
 * Components call resolveAdapter(NavItemSchema) and get back
 * { states, attrs, handlers }. They never see the builder.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { NavItem } from "./factory.js";
import type { NavItemProps } from "./types.js";

/**
 * Create a NavItem adapter returning the universal AdapterResult.
 *
 * @param props - NavItem configuration (active, disabled, href)
 * @returns Universal AdapterResult — states, attrs, handlers
 */
export function createAdapter(props?: NavItemProps): AdapterResult {
	const builder = new NavItem(props);

	return {
		states: {
			active: {
				get current() { return builder.active; },
				set current(_v: boolean) { /* builder manages internally */ },
			},
			disabled: {
				get current() { return builder.disabled; },
				set current(_v: boolean) { /* builder manages internally */ },
			},
		},

		attrs: {
			root: {
				get "data-cl-nav-item-root"() { return ""; },
				get id() { return builder.ids.root; },
				get href() { return builder.href || undefined; },
				get "aria-current"() { return builder.active ? "page" : undefined; },
				get "aria-disabled"() { return builder.disabled ? "true" : undefined; },
				get "data-active"() { return builder.active ? "" : undefined; },
				get "data-disabled"() { return builder.disabled ? "" : undefined; },
			},
		},

		handlers: {},
	};
}
