/**
 * @file builders/scroll-area/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight ScrollArea builder — Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * Custom scrollbar container:
 * - Root: outer container
 * - Viewport: scrollable content region (role="region", aria-label)
 * - Scrollbar: track element (role="scrollbar", aria-controls, aria-orientation)
 * - Thumb: draggable thumb within scrollbar track
 *
 * Slots: root, viewport, scrollbar, thumb.
 */

import {
	createBuilderMetadata,
	extract,
} from "../../builders/index.js";
import type { Orientation } from "../../builders/types.js";
import type { ScrollAreaProps } from "./types.js";

// ============================================================================
// Metadata
// ============================================================================

const metadata = createBuilderMetadata(
	"scroll-area",
	["root", "viewport", "scrollbar", "thumb"] as const,
);

// ============================================================================
// Builder
// ============================================================================

/**
 * ColdLight ScrollArea builder.
 *
 * Provides ARIA-compliant attribute objects for a custom scrollbar container.
 * The viewport is a scrollable region with `role="region"` and `aria-label`.
 * The scrollbar track uses `role="scrollbar"` with full ARIA value attributes.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { createScrollArea } from '$lib/design/builders/scroll-area';
 *   const scroll = createScrollArea({ label: 'File list' });
 * </script>
 *
 * <div {...scroll.root}>
 *   <div {...scroll.viewport}>
 *     <!-- scrollable content -->
 *   </div>
 *   <div {...scroll.scrollbar}>
 *     <div {...scroll.thumb}></div>
 *   </div>
 * </div>
 * ```
 */
export class ScrollArea {
	/* Read-only props — $derived + extract (matches melt pattern) */
	#props!: ScrollAreaProps;
	readonly label = $derived(extract(this.#props.label, undefined as string | undefined));
	readonly orientation = $derived(extract(this.#props.orientation, "vertical" as Orientation));

	/** Unique IDs for each slot of this instance. */
	readonly ids: Record<"root" | "viewport" | "scrollbar" | "thumb", string> =
		metadata.createIds();

	/**
	 * Create a new ScrollArea builder instance.
	 *
	 * @param props - Configuration options for the scroll area.
	 */
	constructor(props: ScrollAreaProps = {}) {
		this.#props = props;
	}

	// ========================================================================
	// Slot attribute getters
	// ========================================================================

	/**
	 * Root container attributes.
	 *
	 * Spread onto the outermost wrapper `<div>`. Provides the data attribute,
	 * unique ID, and orientation data attribute for styling hooks.
	 */
	get root() {
		return {
			[metadata.dataAttrs.root]: "" as const,
			id: this.ids.root,
			"data-orientation": this.orientation,
		};
	}

	/**
	 * Viewport attributes.
	 *
	 * Spread onto the scrollable content container. Provides `role="region"`,
	 * `aria-label`, `tabindex=0` for keyboard scrolling, and overflow styling.
	 */
	get viewport() {
		return {
			[metadata.dataAttrs.viewport]: "" as const,
			id: this.ids.viewport,
			role: "region" as const,
			"aria-label": this.label,
			tabindex: 0,
			style: "overflow: auto;" as const,
		};
	}

	/**
	 * Scrollbar track attributes.
	 *
	 * Spread onto the scrollbar track element. Provides `role="scrollbar"` with
	 * full ARIA value attributes (`aria-valuemin`, `aria-valuemax`, `aria-valuenow`),
	 * `aria-controls` pointing to the viewport, and orientation data.
	 */
	get scrollbar() {
		return {
			[metadata.dataAttrs.scrollbar]: "" as const,
			id: this.ids.scrollbar,
			role: "scrollbar" as const,
			"aria-controls": this.ids.viewport,
			"aria-orientation": this.orientation,
			"aria-valuemin": 0,
			"aria-valuemax": 100,
			"aria-valuenow": 0,
			"data-orientation": this.orientation,
		};
	}

	/**
	 * Thumb attributes.
	 *
	 * Spread onto the draggable thumb element within the scrollbar track.
	 * Provides the data attribute, unique ID, and orientation data.
	 */
	get thumb() {
		return {
			[metadata.dataAttrs.thumb]: "" as const,
			id: this.ids.thumb,
			"data-orientation": this.orientation,
		};
	}
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Factory function for the ScrollArea builder — preferred API.
 *
 * @param props - Optional configuration for the scroll area.
 * @returns A new ScrollArea builder instance.
 */
export function createScrollArea(props?: ScrollAreaProps): ScrollArea {
	return new ScrollArea(props);
}
