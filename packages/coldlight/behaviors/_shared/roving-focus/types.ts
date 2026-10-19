import type { Direction, Orientation } from "../../_internal/utils/kbd.js";

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
