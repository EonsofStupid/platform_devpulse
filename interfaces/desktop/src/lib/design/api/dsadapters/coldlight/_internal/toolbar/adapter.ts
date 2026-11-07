/**
 * @file Toolbar Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Toolbar builder into the universal AdapterResult.
 * Toolbar uses getItem(value) for per-item attributes with roving tabindex,
 * keyboard navigation, and onfocus-based tab management.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { Toolbar } from "./factory.svelte.js";
import type { ToolbarProps } from "./types.js";

/**
 * Create a Toolbar adapter returning the universal AdapterResult.
 *
 * @param props - Toolbar configuration (label, disabled, orientation, loop)
 * @returns Universal AdapterResult — states, attrs, handlers, context
 */
export function createAdapter(props?: ToolbarProps): AdapterResult {
	const builder = new Toolbar(props);

	return {
		states: {
			disabled: {
				get current() { return builder.disabled; },
				set current(_v: boolean) { /* builder manages internally via Synced */ },
			},
		},

		attrs: {
			root: {
				get "data-cl-toolbar-root"() { return ""; },
				get id() { return builder.ids.root; },
				get role() { return "toolbar"; },
				get "aria-orientation"() { return builder.orientation; },
				get "aria-label"() { return builder.root["aria-label" as keyof typeof builder.root] as string | undefined; },
				get "data-orientation"() { return builder.orientation; },
				get "data-disabled"() { return builder.disabled ? "" : undefined; },
			},
		},

		handlers: {
			root: {},
		},

		context: {
			getItem: (value: string, itemDisabled?: boolean) => builder.getItem(value, itemDisabled),
		},
	};
}
