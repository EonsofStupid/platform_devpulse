/**
 * @file builders/_internal/is.test.ts
 * @package @devpulse/coldlight
 *
 * Type guard tests — every guard, every edge case.
 * Pure functions, no DOM needed.
 */

import { describe, test, expect } from "vitest";
import {
	isFunction,
	isGetter,
	isString,
	isHTMLElement,
	isIterable,
	isEventHandler,
} from "./is.js";

// =============================================================================
// isFunction
// =============================================================================

describe("isFunction", () => {
	test("returns true for arrow function", () => {
		expect(isFunction(() => {})).toBe(true);
	});

	test("returns true for named function", () => {
		function foo() {}
		expect(isFunction(foo)).toBe(true);
	});

	test("returns true for class constructor", () => {
		class Foo {}
		expect(isFunction(Foo)).toBe(true);
	});

	test("returns false for string", () => {
		expect(isFunction("hello")).toBe(false);
	});

	test("returns false for number", () => {
		expect(isFunction(42)).toBe(false);
	});

	test("returns false for null", () => {
		expect(isFunction(null)).toBe(false);
	});

	test("returns false for undefined", () => {
		expect(isFunction(undefined)).toBe(false);
	});

	test("returns false for object", () => {
		expect(isFunction({})).toBe(false);
	});

	test("returns false for array", () => {
		expect(isFunction([])).toBe(false);
	});

	test("returns false for boolean", () => {
		expect(isFunction(true)).toBe(false);
	});
});

// =============================================================================
// isGetter
// =============================================================================

describe("isGetter", () => {
	test("returns true for getter (arrow)", () => {
		expect(isGetter(() => 42)).toBe(true);
	});

	test("returns true for getter (named)", () => {
		function getValue() { return 42; }
		expect(isGetter(getValue)).toBe(true);
	});

	test("returns false for non-function", () => {
		expect(isGetter(42)).toBe(false);
		expect(isGetter("hello")).toBe(false);
		expect(isGetter(null)).toBe(false);
	});
});

// =============================================================================
// isString
// =============================================================================

describe("isString", () => {
	test("returns true for string literal", () => {
		expect(isString("hello")).toBe(true);
	});

	test("returns true for empty string", () => {
		expect(isString("")).toBe(true);
	});

	test("returns false for number", () => {
		expect(isString(42)).toBe(false);
	});

	test("returns false for null", () => {
		expect(isString(null)).toBe(false);
	});

	test("returns false for undefined", () => {
		expect(isString(undefined)).toBe(false);
	});

	test("returns false for String object", () => {
		// eslint-disable-next-line no-new-wrappers
		expect(isString(new String("hello"))).toBe(false);
	});
});

// =============================================================================
// isHTMLElement
// =============================================================================

describe("isHTMLElement", () => {
	test("returns true for a div element", () => {
		const el = document.createElement("div");
		expect(isHTMLElement(el)).toBe(true);
	});

	test("returns true for a button element", () => {
		const el = document.createElement("button");
		expect(isHTMLElement(el)).toBe(true);
	});

	test("returns false for a text node", () => {
		const node = document.createTextNode("hello");
		expect(isHTMLElement(node)).toBe(false);
	});

	test("returns false for null", () => {
		expect(isHTMLElement(null)).toBe(false);
	});

	test("returns false for plain object", () => {
		expect(isHTMLElement({})).toBe(false);
	});
});

// =============================================================================
// isIterable
// =============================================================================

describe("isIterable", () => {
	test("returns true for array", () => {
		expect(isIterable([1, 2, 3])).toBe(true);
	});

	test("returns true for Set", () => {
		expect(isIterable(new Set([1, 2]))).toBe(true);
	});

	test("returns true for Map", () => {
		expect(isIterable(new Map())).toBe(true);
	});

	test("returns false for string (excluded by design)", () => {
		// isIterable checks for object + Symbol.iterator
		// strings have Symbol.iterator but are typeof "string" not "object"
		expect(isIterable("hello")).toBe(false);
	});

	test("returns false for number", () => {
		expect(isIterable(42)).toBe(false);
	});

	test("returns false for null", () => {
		expect(isIterable(null)).toBe(false);
	});

	test("returns false for undefined", () => {
		expect(isIterable(undefined)).toBe(false);
	});

	test("returns false for plain object", () => {
		expect(isIterable({})).toBe(false);
	});

	test("returns true for custom iterable", () => {
		const iterable = { [Symbol.iterator]: () => ({ next: () => ({ done: true, value: undefined }) }) };
		expect(isIterable(iterable)).toBe(true);
	});
});

// =============================================================================
// isEventHandler
// =============================================================================

describe("isEventHandler", () => {
	test("returns true for onclick", () => {
		expect(isEventHandler("onclick")).toBe(true);
	});

	test("returns true for onfocus", () => {
		expect(isEventHandler("onfocus")).toBe(true);
	});

	test("returns true for onkeydown", () => {
		expect(isEventHandler("onkeydown")).toBe(true);
	});

	test("returns true for onpointerenter", () => {
		expect(isEventHandler("onpointerenter")).toBe(true);
	});

	test("returns false for 'on' alone (too short)", () => {
		expect(isEventHandler("on")).toBe(false);
	});

	test("returns false for 'class'", () => {
		expect(isEventHandler("class")).toBe(false);
	});

	test("returns false for 'role'", () => {
		expect(isEventHandler("role")).toBe(false);
	});

	test("returns false for 'disabled'", () => {
		expect(isEventHandler("disabled")).toBe(false);
	});

	test("returns false for empty string", () => {
		expect(isEventHandler("")).toBe(false);
	});
});
