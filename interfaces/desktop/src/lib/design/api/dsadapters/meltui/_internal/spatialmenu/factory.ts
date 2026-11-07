/**
 * @file api/adapters/meltui/_internal/spatialmenu/factory.ts
 * @package @devpulse/coldlight
 *
 * MeltUI SpatialMenu Factory — ONLY file that imports from `melt` for spatial-menu.
 * Wraps melt v0.44 SpatialMenu class (class-based builder API).
 *
 * ColdLight cloaks this entirely. Consumers NEVER import from melt or this file.
 * All access is via the transport layer (_transport/).
 *
 * SpatialMenu provides 2D spatial keyboard navigation for grid-like layouts
 * (e.g., emoji pickers, icon grids, card grids). Arrow keys navigate based on
 * actual DOM positions, not DOM order.
 */

import { SpatialMenu, type SpatialMenuProps } from "melt/builders";

export type MeltSpatialMenuInstance<T> = SpatialMenu<T>;
export type MeltSpatialMenuConfig<T> = SpatialMenuProps<T>;

/**
 * Create a MeltUI SpatialMenu instance.
 * This is the ONLY place `SpatialMenu` from `melt/builders` is instantiated.
 */
export function createMeltSpatialMenu<T>(
	config?: MeltSpatialMenuConfig<T>,
): MeltSpatialMenuInstance<T> {
	return new SpatialMenu<T>(config);
}
