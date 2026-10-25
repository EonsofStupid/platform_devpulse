/**
 * @file builders/_internal/keyboard.test.ts
 * @package @devpulse/coldlight
 *
 * Keyboard constants and directional helpers — every key, every direction combo.
 */

import { describe, test, expect } from "vitest";
import { kbd, getNextKey, getPrevKey } from "./keyboard.js";

// =============================================================================
// kbd constants
// =============================================================================

describe("kbd constants", () => {
	test("SPACE is literal space character", () => {
		expect(kbd.SPACE).toBe(" ");
	});

	test("ENTER is 'Enter'", () => {
		expect(kbd.ENTER).toBe("Enter");
	});

	test("ESCAPE is 'Escape'", () => {
		expect(kbd.ESCAPE).toBe("Escape");
	});

	test("TAB is 'Tab'", () => {
		expect(kbd.TAB).toBe("Tab");
	});

	test("arrow keys match KeyboardEvent.key values", () => {
		expect(kbd.ARROW_UP).toBe("ArrowUp");
		expect(kbd.ARROW_DOWN).toBe("ArrowDown");
		expect(kbd.ARROW_LEFT).toBe("ArrowLeft");
		expect(kbd.ARROW_RIGHT).toBe("ArrowRight");
	});

	test("HOME and END", () => {
		expect(kbd.HOME).toBe("Home");
		expect(kbd.END).toBe("End");
	});

	test("modifier keys", () => {
		expect(kbd.SHIFT).toBe("Shift");
		expect(kbd.CONTROL).toBe("Control");
		expect(kbd.ALT).toBe("Alt");
		expect(kbd.META).toBe("Meta");
	});

	test("function keys F1-F12", () => {
		expect(kbd.F1).toBe("F1");
		expect(kbd.F12).toBe("F12");
	});

	test("editing keys", () => {
		expect(kbd.BACKSPACE).toBe("Backspace");
		expect(kbd.DELETE).toBe("Delete");
	});

	test("navigation keys", () => {
		expect(kbd.PAGE_UP).toBe("PageUp");
		expect(kbd.PAGE_DOWN).toBe("PageDown");
	});
});

// =============================================================================
// getNextKey — horizontal
// =============================================================================

describe("getNextKey — horizontal", () => {
	test("ltr horizontal → ArrowRight", () => {
		expect(getNextKey("ltr", "horizontal")).toBe(kbd.ARROW_RIGHT);
	});

	test("rtl horizontal → ArrowLeft", () => {
		expect(getNextKey("rtl", "horizontal")).toBe(kbd.ARROW_LEFT);
	});

	test("defaults to ltr horizontal", () => {
		expect(getNextKey()).toBe(kbd.ARROW_RIGHT);
	});
});

// =============================================================================
// getNextKey — vertical
// =============================================================================

describe("getNextKey — vertical", () => {
	test("ltr vertical → ArrowDown", () => {
		expect(getNextKey("ltr", "vertical")).toBe(kbd.ARROW_DOWN);
	});

	test("rtl vertical → ArrowDown (direction irrelevant)", () => {
		expect(getNextKey("rtl", "vertical")).toBe(kbd.ARROW_DOWN);
	});
});

// =============================================================================
// getPrevKey — horizontal
// =============================================================================

describe("getPrevKey — horizontal", () => {
	test("ltr horizontal → ArrowLeft", () => {
		expect(getPrevKey("ltr", "horizontal")).toBe(kbd.ARROW_LEFT);
	});

	test("rtl horizontal → ArrowRight", () => {
		expect(getPrevKey("rtl", "horizontal")).toBe(kbd.ARROW_RIGHT);
	});

	test("defaults to ltr horizontal", () => {
		expect(getPrevKey()).toBe(kbd.ARROW_LEFT);
	});
});

// =============================================================================
// getPrevKey — vertical
// =============================================================================

describe("getPrevKey — vertical", () => {
	test("ltr vertical → ArrowUp", () => {
		expect(getPrevKey("ltr", "vertical")).toBe(kbd.ARROW_UP);
	});

	test("rtl vertical → ArrowUp (direction irrelevant)", () => {
		expect(getPrevKey("rtl", "vertical")).toBe(kbd.ARROW_UP);
	});
});
