/**
 * @file builders/_internal/keyboard.ts
 * @package @devpulse/coldlight
 *
 * Keyboard constants and directional key helpers.
 * Mirrors melt's kbd constants + getNextKey/getPrevKey exactly.
 */

import type { Direction, Orientation } from "./types.js";

export const kbd = {
	ALT: "Alt",
	ARROW_DOWN: "ArrowDown",
	ARROW_LEFT: "ArrowLeft",
	ARROW_RIGHT: "ArrowRight",
	ARROW_UP: "ArrowUp",
	BACKSPACE: "Backspace",
	CAPS_LOCK: "CapsLock",
	CONTROL: "Control",
	DELETE: "Delete",
	END: "End",
	ENTER: "Enter",
	ESCAPE: "Escape",
	F1: "F1",
	F2: "F2",
	F3: "F3",
	F4: "F4",
	F5: "F5",
	F6: "F6",
	F7: "F7",
	F8: "F8",
	F9: "F9",
	F10: "F10",
	F11: "F11",
	F12: "F12",
	HOME: "Home",
	META: "Meta",
	PAGE_DOWN: "PageDown",
	PAGE_UP: "PageUp",
	SHIFT: "Shift",
	SPACE: " ",
	TAB: "Tab",
} as const;

export type KbdKey = (typeof kbd)[keyof typeof kbd];

/** Get the "next" arrow key for a given direction + orientation. */
export function getNextKey(dir: Direction = "ltr", orientation: Orientation = "horizontal"): string {
	return {
		horizontal: dir === "rtl" ? kbd.ARROW_LEFT : kbd.ARROW_RIGHT,
		vertical: kbd.ARROW_DOWN,
	}[orientation];
}

/** Get the "previous" arrow key for a given direction + orientation. */
export function getPrevKey(dir: Direction = "ltr", orientation: Orientation = "horizontal"): string {
	return {
		horizontal: dir === "rtl" ? kbd.ARROW_RIGHT : kbd.ARROW_LEFT,
		vertical: kbd.ARROW_UP,
	}[orientation];
}
