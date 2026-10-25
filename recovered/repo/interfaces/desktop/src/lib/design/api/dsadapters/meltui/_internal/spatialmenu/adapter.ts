/**
 * @file api/adapters/meltui/_internal/spatialmenu/adapter.ts
 * @package @devpulse/coldlight
 *
 * MeltUI SpatialMenu adapter — wraps the MeltUI SpatialMenu builder into AdapterResult.
 *
 * SpatialMenu provides 2D spatial keyboard navigation for grid-like layouts.
 * Root and input are static slots. Items are parameterized via getItem(value).
 * We expose getItem() through context so compound components can access it.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { createMeltSpatialMenu, type MeltSpatialMenuConfig } from "./factory.js";

export function createAdapter(props?: Record<string, unknown>): AdapterResult {
	const builder = createMeltSpatialMenu(props as MeltSpatialMenuConfig<unknown>);

	return {
		states: {
			highlighted: {
				get current() {
					return builder.highlighted !== null;
				},
				set current(_v: boolean) {
					// highlighted is value-based; use context.highlighted for direct access
				},
			},
		},
		attrs: {
			root: {
				get "data-melt-spatial-menu-root"() {
					return builder.root["data-melt-spatial-menu-root"];
				},
				get tabindex() {
					return String(builder.root.tabindex);
				},
			},
			input: {
				get "data-melt-spatial-menu-input"() {
					return builder.input["data-melt-spatial-menu-input"];
				},
			},
		},
		handlers: {
			root: {
				get onkeydown() {
					return builder.root.onkeydown as (e: Event) => void;
				},
			},
			input: {
				get onkeydown() {
					return builder.input.onkeydown as (e: Event) => void;
				},
			},
		},
		context: {
			/**
			 * Returns a SpatialMenuItem with attrs and handlers for a specific value.
			 * Each item must be accessed via getItem(value, options?).
			 */
			getItem(value: unknown, options?: { onSelect?: () => void; disabled?: boolean }) {
				const item = builder.getItem(value, options);

				return {
					/** Attribute record for this item */
					attrs: {
						get "data-melt-spatial-menu-item"() {
							return item.attrs["data-melt-spatial-menu-item"];
						},
						get "data-highlighted"() {
							return item.attrs["data-highlighted"];
						},
						get "data-disabled"() {
							return item.attrs["data-disabled"];
						},
					},
					/** Event handler record for this item */
					handlers: {
						get onmousemove() {
							return item.attrs.onmousemove;
						},
						get onclick() {
							return item.attrs.onclick;
						},
					},
					/** Whether this item is highlighted */
					get highlighted() {
						return item.highlighted;
					},
				};
			},

			/** Direct access to highlighted value for controlled scenarios */
			get highlighted() {
				return builder.highlighted;
			},
			set highlighted(v) {
				builder.highlighted = v;
			},

			/** The current selection mode (keyboard or mouse) */
			get selectionMode() {
				return builder.selectionMode;
			},
		},
	};
}
