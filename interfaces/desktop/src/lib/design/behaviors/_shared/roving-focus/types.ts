import type { Direction, Orientation } from "../../_internal/utils/kbd.js";

/**
 * Config for createRovingHandler — the per-item/per-container keydown
 * delegate. Unlike RovingFocusConfig (container $effect model), this shape
 * fits hooks that hand out attribute bags with `onkeydown` closures and
 * hold no container ref.
 */
export interface RovingHandlerConfig {
	/** Selector resolved via target.closest() to find the composite root. */
	containerSelector: string;
	/** CSS selector for enabled items within the container. */
	itemSelector: string;
	/** Arrow key orientation. Default: "horizontal". */
	orientation?: Orientation;
	/** Text direction, read per keystroke. Default: document dir (use-locale). */
	dir?: () => Direction;
	/** Loop from last → first. Default: true. */
	loop?: boolean;
	/** Handle Home/End. Default: true. */
	homeEnd?: boolean;
	/** Called with the newly focused item. */
	onFocusItem?: (item: HTMLElement) => void;
}

export interface RovingFocusConfig {
	/** The container element that holds focusable items. */
	container: () => HTMLElement | null;
	/** CSS selector to find focusable items within container. */
	itemSelector: string;
	/** Current active item value/id. */
	activeValue: () => string | undefined;
	/** Callback when active item changes via keyboard. */
	onActiveChange: (value: string) => void;
	/** Arrow key orientation. Default: "horizontal". */
	orientation?: Orientation;
	/** Text direction for arrow key inversion. Default: "ltr". */
	dir?: Direction;
	/** Loop from last → first. Default: true. */
	loop?: boolean;
	/** Attribute on items holding their value. Default: "data-value". */
	valueAttr?: string;
	/** Attribute marking disabled items. Default: "data-disabled". */
	disabledAttr?: string;
}
