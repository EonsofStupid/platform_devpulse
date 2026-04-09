import type { HTMLAttributes } from "svelte/elements";

export type VirtualizerScrollDirection = "vertical" | "horizontal";

export interface VirtualItem {
	/** Index in the full data array. */
	index: number;
	/** Pixel offset from the start of the scroll direction. */
	start: number;
	/** Pixel size (height for vertical, width for horizontal). */
	size: number;
	/** End offset (start + size). */
	end: number;
	/** Key for Svelte keyed each blocks. */
	key: string | number;
}

export interface UseVirtualizerProps<T = unknown> {
	/** Full list of items. Length drives totalSize calculation. */
	items: T[];
	/**
	 * Item size in pixels. Either a fixed number or a function that
	 * returns the size for a given index (variable height/width).
	 */
	itemSize: number | ((index: number) => number);
	/** Height of the scroll container in pixels. Required for vertical. */
	height?: number;
	/** Width of the scroll container in pixels. Required for horizontal. */
	width?: number;
	/** Scroll direction. Defaults to "vertical". */
	direction?: VirtualizerScrollDirection;
	/**
	 * Number of extra items to render above and below the visible window.
	 * Reduces blank flicker on fast scroll. Defaults to 3.
	 */
	overscan?: number;
	/** Accessible label for the scroll region. */
	"aria-label"?: string;
}

export type VirtualizerRootAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "virtualizer";
	"data-slot": "root";
};

export type VirtualizerInnerAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "virtualizer";
	"data-slot": "inner";
};

export type VirtualizerItemsAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "virtualizer";
	"data-slot": "items";
};

export interface UseVirtualizerReturn<_T = unknown> {
	/** The slice of VirtualItems that should be rendered. */
	readonly virtualItems: VirtualItem[];
	/** Total pixel size of all items (the scrollable extent). */
	readonly totalSize: number;
	/** Current scroll offset in pixels. */
	readonly scrollOffset: number;
	/** Attributes for the outer scrollable root container. */
	readonly root: VirtualizerRootAttrs;
	/** Attributes for the full-height/width inner spacer. */
	readonly inner: VirtualizerInnerAttrs;
	/** Attributes for the positioned items window. */
	readonly items: VirtualizerItemsAttrs;
	/** Programmatically scroll to an item index. */
	scrollToIndex(index: number, behavior?: ScrollBehavior): void;
	/** Ref setter — pass to bind:this on the root element. */
	setRootEl(el: HTMLElement | null): void;
}
