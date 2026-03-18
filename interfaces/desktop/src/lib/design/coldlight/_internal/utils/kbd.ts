/**
 * Keyboard constants and directional helpers.
 * WAI-ARIA APG keyboard interaction patterns.
 */

export const kbd = {
	ALT: "Alt",
	ARROW_DOWN: "ArrowDown",
	ARROW_LEFT: "ArrowLeft",
	ARROW_RIGHT: "ArrowRight",
	ARROW_UP: "ArrowUp",
	BACKSPACE: "Backspace",
	DELETE: "Delete",
	END: "End",
	ENTER: "Enter",
	ESCAPE: "Escape",
	HOME: "Home",
	PAGE_DOWN: "PageDown",
	PAGE_UP: "PageUp",
	SPACE: " ",
	TAB: "Tab",
} as const;

export type KbdKey = (typeof kbd)[keyof typeof kbd];

export type Direction = "ltr" | "rtl";
export type Orientation = "horizontal" | "vertical";

/** Get the "next" arrow key for direction + orientation. */
export function getNextKey(
	dir: Direction = "ltr",
	orientation: Orientation = "horizontal",
): string {
	return orientation === "horizontal"
		? dir === "rtl"
			? kbd.ARROW_LEFT
			: kbd.ARROW_RIGHT
		: kbd.ARROW_DOWN;
}

/** Get the "previous" arrow key for direction + orientation. */
export function getPrevKey(
	dir: Direction = "ltr",
	orientation: Orientation = "horizontal",
): string {
	return orientation === "horizontal"
		? dir === "rtl"
			? kbd.ARROW_RIGHT
			: kbd.ARROW_LEFT
		: kbd.ARROW_UP;
}
