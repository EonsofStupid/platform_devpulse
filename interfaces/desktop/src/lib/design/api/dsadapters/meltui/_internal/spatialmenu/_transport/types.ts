/**
 * @file api/adapters/meltui/_internal/spatialmenu/_transport/types.ts
 * @package @devpulse/coldlight
 *
 * Typed transport interface for the MeltUI spatial-menu adapter.
 * Maps melt v0.44 SpatialMenu API → ColdLight slot vocabulary.
 *
 * Slots managed by melt: root, input
 * Items: created dynamically via `getItem(value)` — each item has its own attrs
 *
 * SpatialMenu provides 2D spatial keyboard navigation for grid-like layouts.
 * Arrow keys navigate based on actual DOM positions (bounding rects), not DOM order.
 *
 * The `refs` object is empty — melt SpatialMenu uses symbol-keyed attachment
 * functions embedded in the slot attrs (auto-registers via spread).
 */

import type { Attachment } from "svelte/attachments";
import type {
	SlotAttrs,
	TransportAdapter,
} from "$lib/design/api/dsadapters/coldlight/_internal/_transport/types.js";

// =============================================================================
// TRANSPORT STATES
// =============================================================================

export interface SpatialMenuTransportStates<T> {
	/** The currently highlighted item value, or null if none. */
	highlighted: T | null;
	/** Current selection mode: "keyboard" or "mouse". */
	selectionMode: "keyboard" | "mouse";
}

// =============================================================================
// TRANSPORT ITEM
// =============================================================================

export interface SpatialMenuTransportItem<T> {
	/** Spread attributes for this item element. */
	readonly attrs: SlotAttrs;
	/** The item's value. */
	readonly value: T;
	/** Whether this item is currently highlighted. */
	readonly highlighted: boolean;
	/** Whether this item is disabled. */
	readonly disabled: boolean;
}

// =============================================================================
// TRANSPORT CONFIG
// =============================================================================

export interface SpatialMenuTransportConfig<T> {
	/** Initial highlighted value. Pass a getter for controlled mode. */
	highlighted?: T | null | (() => T | null | undefined);
	/** Called when the highlighted value changes. */
	onHighlightChange?: (highlighted: T | null) => void;
	/** Called when an item is selected (clicked or Enter). */
	onSelect?: (value: T) => void;
	/** Whether navigation wraps around at edges. @default false */
	wrap?: boolean | (() => boolean);
	/** Scroll behavior when highlighting via keyboard. @default "smooth" */
	scrollBehavior?: "smooth" | "instant" | "auto" | null | (() => "smooth" | "instant" | "auto" | null);
	/** Column tolerance in px for same-column detection. @default 16 */
	toleranceCol?: number | null | (() => number | null);
	/** Row tolerance in px for same-row detection. @default 16 */
	toleranceRow?: number | null | (() => number | null);
	/** Whether arrow keys navigate cross-axis when no item on current axis. @default true */
	crossAxis?: boolean | (() => boolean);
}

// =============================================================================
// TRANSPORT ADAPTER
// =============================================================================

/**
 * ColdLight spatial-menu transport — the public contract for the melt spatial-menu adapter.
 *
 * Slots (melt-managed): root, input
 * States: highlighted, selectionMode
 * Items: created dynamically via `getItem(value)` — each returns typed attrs
 */
export type SpatialMenuTransport<T> = TransportAdapter<
	"root" | "input",
	SpatialMenuTransportStates<T>
> & {
	/** Static slot attrs for root and input elements */
	readonly slots: {
		readonly root: SlotAttrs;
		readonly input: SlotAttrs;
	};
	/** Create a spatial menu item with typed attrs. */
	getItem(value: T, options?: { onSelect?: () => void; disabled?: boolean }): SpatialMenuTransportItem<T>;
};
