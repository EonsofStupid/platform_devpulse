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
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
	extract,
} from "../_internal/index.js";
import type { SlotAttrs, Orientation } from "../_internal/types.js";
import type { ScrollAreaProps } from "./types.js";

const metadata = createBuilderMetadata(
	"scroll-area",
	["root", "viewport", "scrollbar", "thumb"] as const,
);

export class ScrollArea {
	readonly ids = metadata.createIds();
	#label: Synced<string | undefined>;
	#orientation: Synced<Orientation>;

	constructor(props: ScrollAreaProps = {} as ScrollAreaProps) {
		this.#label = new Synced<string | undefined>({
			value: props.label,
			defaultValue: undefined,
		});

		this.#orientation = new Synced<Orientation>({
			value: props.orientation,
			defaultValue: "vertical",
		});
	}

	// --- Reactive state ---

	get orientation(): Orientation {
		return this.#orientation.current;
	}

	// --- Slot attribute getters ---

	/** Root container attributes. Spread onto the outermost wrapper. */
	get root(): SlotAttrs {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			"data-orientation": this.orientation,
		};
	}

	/** Viewport attributes. Spread onto the scrollable content container. */
	get viewport(): SlotAttrs {
		return {
			[metadata.dataAttrs.viewport]: "",
			id: this.ids.viewport,
			role: "region",
			"aria-label": this.#label.current,
			tabindex: 0,
			style: "overflow: auto;",
		};
	}

	/** Scrollbar track attributes. Spread onto the scrollbar track element. */
	get scrollbar(): SlotAttrs {
		return {
			[metadata.dataAttrs.scrollbar]: "",
			id: this.ids.scrollbar,
			role: "scrollbar",
			"aria-controls": this.ids.viewport,
			"aria-orientation": this.orientation,
			"aria-valuemin": 0,
			"aria-valuemax": 100,
			"aria-valuenow": 0,
			"data-orientation": this.orientation,
		};
	}

	/** Thumb attributes. Spread onto the draggable thumb element. */
	get thumb(): SlotAttrs {
		return {
			[metadata.dataAttrs.thumb]: "",
			id: this.ids.thumb,
			"data-orientation": this.orientation,
		};
	}
}

/** Factory function — preferred API. */
export function createScrollArea(props?: ScrollAreaProps): ScrollArea {
	return new ScrollArea(props);
}
