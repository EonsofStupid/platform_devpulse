/**
 * @file api/adapters/meltui/_internal/spatialmenu/_transport/factory.ts
 * @package @devpulse/coldlight
 *
 * Creates a ColdLight spatial-menu transport from melt v0.44 SpatialMenu.
 * Maps melt SpatialMenu getters → ColdLight slot vocabulary.
 *
 * Slot mapping:
 *   melt spatialmenu.root  → slots.root  (tabindex, onkeydown, data-melt-*)
 *   melt spatialmenu.input → slots.input (onkeydown, data-melt-*)
 *
 * Item mapping:
 *   melt spatialmenu.getItem(value) → getItem(value) → { attrs, value, highlighted, disabled }
 */

import type { SlotAttrs } from "$lib/design/api/adapters/coldlight/_internal/_transport/types.js";
import { createMeltSpatialMenu } from "../factory.js";
import type {
	SpatialMenuTransport,
	SpatialMenuTransportConfig,
	SpatialMenuTransportItem,
} from "./types.js";

/**
 * Create a ColdLight spatial-menu transport wrapping melt v0.44 SpatialMenu.
 *
 * Usage in component:
 * ```svelte
 * const transport = createSpatialMenuTransport<string>({ onSelect: (v) => pick(v) });
 *
 * <div {...transport.slots.root}>
 *   {#each items as item}
 *     {@const menuItem = transport.getItem(item.value)}
 *     <button {...menuItem.attrs}>{item.label}</button>
 *   {/each}
 * </div>
 * ```
 */
export function createSpatialMenuTransport<T>(
	config?: SpatialMenuTransportConfig<T>,
): SpatialMenuTransport<T> {
	const menu = createMeltSpatialMenu<T>({
		highlighted: config?.highlighted,
		onHighlightChange: config?.onHighlightChange,
		onSelect: config?.onSelect,
		wrap: config?.wrap,
		scrollBehavior: config?.scrollBehavior,
		toleranceCol: config?.toleranceCol,
		toleranceRow: config?.toleranceRow,
		crossAxis: config?.crossAxis,
	});

	return {
		slots: {
			get root(): SlotAttrs {
				return menu.root as unknown as SlotAttrs;
			},
			get input(): SlotAttrs {
				return menu.input as unknown as SlotAttrs;
			},
		},
		states: {
			get highlighted(): T | null {
				return menu.highlighted;
			},
			set highlighted(v: T | null) {
				menu.highlighted = v;
			},
			get selectionMode(): "keyboard" | "mouse" {
				return menu.selectionMode;
			},
		},
		getItem(
			value: T,
			options?: { onSelect?: () => void; disabled?: boolean },
		): SpatialMenuTransportItem<T> {
			const item = menu.getItem(value, options);
			return {
				get attrs(): SlotAttrs {
					return item.attrs as unknown as SlotAttrs;
				},
				get value() {
					return item.value;
				},
				get highlighted() {
					return item.highlighted;
				},
				get disabled() {
					return item.disabled;
				},
			};
		},
	};
}
