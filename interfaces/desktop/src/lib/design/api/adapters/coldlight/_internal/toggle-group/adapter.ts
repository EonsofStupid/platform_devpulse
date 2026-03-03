/**
 * @file ToggleGroup Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight ToggleGroup builder into the universal AdapterResult.
 * ToggleGroup uses getItem(value) for per-item attributes with aria-pressed,
 * roving tabindex, and keyboard navigation. Supports single and multi-select.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { ToggleGroup } from "./factory.js";
import type { ToggleGroupProps } from "./types.js";

/**
 * Create a ToggleGroup adapter returning the universal AdapterResult.
 *
 * @param props - ToggleGroup configuration (value, multiple, disabled, orientation, loop)
 * @returns Universal AdapterResult — states, attrs, handlers, context
 */
export function createAdapter(props?: Record<string, unknown>): AdapterResult {
	const builder = new ToggleGroup(props as ToggleGroupProps);

	return {
		states: {
			disabled: {
				get current() { return builder.disabled; },
				set current(_v: boolean) { /* builder manages internally via Synced */ },
			},
		},

		attrs: {
			root: {
				get "data-cl-toggle-group-root"() { return ""; },
				get id() { return builder.ids.root; },
				get role() { return "group"; },
				get "aria-orientation"() { return builder.orientation; },
				get "data-orientation"() { return builder.orientation; },
				get "data-disabled"() { return builder.disabled ? "" : undefined; },
			},
		},

		handlers: {
			root: {},
		},

		context: {
			getItem: (value: string, itemDisabled?: boolean) => builder.getItem(value, itemDisabled),
			isSelected: (value: string) => builder.isSelected(value),
			select: (value: string) => builder.select(value),
			deselect: (value: string) => builder.deselect(value),
		},
	};
}
