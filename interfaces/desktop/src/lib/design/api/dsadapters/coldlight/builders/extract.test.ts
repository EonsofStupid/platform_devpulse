/**
 * @file builders/_internal/extract.test.ts
 * @package @devpulse/coldlight
 *
 * Extract tests — MaybeGetter resolution with all code paths.
 */

import { describe, test, expect } from "vitest";
import { extract } from "./extract.js";

// =============================================================================
// Static values
// =============================================================================

describe("extract — static values", () => {
	test("returns static string value", () => {
		expect(extract("hello")).toBe("hello");
	});

	test("returns static number value", () => {
		expect(extract(42)).toBe(42);
	});

	test("returns static boolean value", () => {
		expect(extract(true)).toBe(true);
		expect(extract(false)).toBe(false);
	});

	test("returns static null value", () => {
		expect(extract(null)).toBe(null);
	});

	test("returns undefined when static undefined and no fallback", () => {
		expect(extract(undefined)).toBeUndefined();
	});

	test("returns fallback when static undefined", () => {
		expect(extract(undefined, "fallback")).toBe("fallback");
	});

	test("returns static value even when fallback provided", () => {
		expect(extract("value", "fallback")).toBe("value");
	});

	test("returns false (not fallback) when value is false", () => {
		expect(extract(false, true)).toBe(false);
	});

	test("returns 0 (not fallback) when value is 0", () => {
		expect(extract(0, 99)).toBe(0);
	});

	test("returns empty string (not fallback) when value is empty string", () => {
		// Note: empty string is nullish-coalesced to fallback by ??
		// This is expected behavior — empty string is NOT nullish
		expect(extract("", "fallback")).toBe("");
	});
});

// =============================================================================
// Getter functions
// =============================================================================

describe("extract — getter functions", () => {
	test("calls getter and returns result", () => {
		expect(extract(() => "hello")).toBe("hello");
	});

	test("calls getter returning number", () => {
		expect(extract(() => 42)).toBe(42);
	});

	test("returns fallback when getter returns undefined", () => {
		expect(extract(() => undefined as string | undefined, "fallback")).toBe("fallback");
	});

	test("returns undefined when getter returns undefined and no fallback", () => {
		expect(extract(() => undefined)).toBeUndefined();
	});

	test("calls getter each time (not cached)", () => {
		let count = 0;
		const getter = () => ++count;
		expect(extract(getter)).toBe(1);
		expect(extract(getter)).toBe(2);
		expect(extract(getter)).toBe(3);
	});

	test("returns getter result even when fallback provided", () => {
		expect(extract(() => "from-getter", "fallback")).toBe("from-getter");
	});

	test("returns false from getter (not fallback)", () => {
		expect(extract(() => false, true)).toBe(false);
	});
});
