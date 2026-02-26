/**
 * @file builders/_internal/synced.svelte.test.ts
 * @package @devpulse/coldlight
 *
 * GOLD STANDARD — Synced<T> state wrapper tests.
 *
 * Synced is the CORE state primitive. Every builder wraps its main state in it.
 * If Synced breaks, EVERY builder breaks. These tests are exhaustive.
 *
 * Two modes:
 *   CONTROLLED — value is a getter function. Builder never stores.
 *     Reads: always from getter. Writes: only fire onChange.
 *   UNCONTROLLED — value is a static value. Builder manages internal $state.
 *     Reads: from internal $state. Writes: update internal + fire onChange.
 *
 * equalityCheck:
 *   true — reference equality (===). Prevents onChange for same value.
 *   function — custom comparator. Prevents onChange when comparator returns true.
 *   undefined — no check. onChange always fires.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * NOTE: .svelte.test.ts extension required for Svelte 5 rune compilation ($state, $derived).
 */

import { describe, test, expect, vi } from "vitest";
import { Synced } from "./synced.svelte.js";

// =============================================================================
// UNCONTROLLED MODE — static initial value
// =============================================================================

describe("Synced — uncontrolled", () => {
	test("initializes with defaultValue when no value provided", () => {
		const synced = new Synced({
			value: undefined,
			defaultValue: false,
		});
		expect(synced.current).toBe(false);
	});

	test("initializes with static value when provided", () => {
		const synced = new Synced({
			value: "hello",
			defaultValue: "default",
		});
		expect(synced.current).toBe("hello");
	});

	test("initializes with defaultValue when static value is undefined", () => {
		const synced = new Synced({
			value: undefined,
			defaultValue: 42,
		});
		expect(synced.current).toBe(42);
	});

	test("setting current updates internal state", () => {
		const synced = new Synced({
			value: false,
			defaultValue: false,
		});
		synced.current = true;
		expect(synced.current).toBe(true);
	});

	test("setting current fires onChange", () => {
		const onChange = vi.fn();
		const synced = new Synced({
			value: false,
			onChange,
			defaultValue: false,
		});
		synced.current = true;
		expect(onChange).toHaveBeenCalledOnce();
		expect(onChange).toHaveBeenCalledWith(true);
	});

	test("setting same value still fires onChange (no equalityCheck)", () => {
		const onChange = vi.fn();
		const synced = new Synced({
			value: "hello",
			onChange,
			defaultValue: "",
		});
		synced.current = "hello";
		expect(onChange).toHaveBeenCalledOnce();
	});

	test("multiple sets accumulate correctly", () => {
		const values: number[] = [];
		const synced = new Synced({
			value: 0,
			onChange: (v: number) => values.push(v),
			defaultValue: 0,
		});
		synced.current = 1;
		synced.current = 2;
		synced.current = 3;
		expect(synced.current).toBe(3);
		expect(values).toEqual([1, 2, 3]);
	});

	test("works without onChange callback", () => {
		const synced = new Synced({
			value: "a",
			defaultValue: "",
		});
		synced.current = "b";
		expect(synced.current).toBe("b");
	});
});

// =============================================================================
// CONTROLLED MODE — getter function
// =============================================================================

describe("Synced — controlled", () => {
	test("reads from getter on every access", () => {
		let external = "first";
		const synced = new Synced({
			value: () => external,
			defaultValue: "",
		});
		expect(synced.current).toBe("first");
		external = "second";
		expect(synced.current).toBe("second");
	});

	test("getter returning undefined falls back to defaultValue", () => {
		const synced = new Synced({
			value: () => undefined as string | undefined,
			defaultValue: "fallback",
		});
		expect(synced.current).toBe("fallback");
	});

	test("setting current does NOT update internal state — only fires onChange", () => {
		let external = false;
		const onChange = vi.fn((v: boolean) => { external = v; });
		const synced = new Synced({
			value: () => external,
			onChange,
			defaultValue: false,
		});

		synced.current = true;
		expect(onChange).toHaveBeenCalledWith(true);
		// Getter still reads from external, which onChange updated
		expect(synced.current).toBe(true);
	});

	test("controlled: onChange not provided — setting is a no-op", () => {
		const synced = new Synced({
			value: () => "immutable",
			defaultValue: "",
		});
		synced.current = "attempt";
		// Still reads from getter
		expect(synced.current).toBe("immutable");
	});

	test("controlled mode detected even if getter returns undefined", () => {
		const onChange = vi.fn();
		const synced = new Synced({
			value: () => undefined as boolean | undefined,
			onChange,
			defaultValue: false,
		});
		// Should still be in controlled mode — setter fires onChange
		synced.current = true;
		expect(onChange).toHaveBeenCalledWith(true);
	});
});

// =============================================================================
// EQUALITY CHECK — reference equality (true)
// =============================================================================

describe("Synced — equalityCheck: true (reference)", () => {
	test("suppresses onChange when same primitive value is set", () => {
		const onChange = vi.fn();
		const synced = new Synced({
			value: "hello",
			onChange,
			defaultValue: "",
			equalityCheck: true,
		});
		synced.current = "hello";
		expect(onChange).not.toHaveBeenCalled();
	});

	test("fires onChange when different value is set", () => {
		const onChange = vi.fn();
		const synced = new Synced({
			value: "hello",
			onChange,
			defaultValue: "",
			equalityCheck: true,
		});
		synced.current = "world";
		expect(onChange).toHaveBeenCalledOnce();
		expect(onChange).toHaveBeenCalledWith("world");
	});

	test("reference equality for objects — same ref suppresses", () => {
		const onChange = vi.fn();
		const obj = { a: 1 };
		const synced = new Synced({
			value: obj,
			onChange,
			defaultValue: {},
			equalityCheck: true,
		});
		synced.current = obj;
		expect(onChange).not.toHaveBeenCalled();
	});

	test("reference equality for objects — different ref fires", () => {
		const onChange = vi.fn();
		const synced = new Synced({
			value: { a: 1 },
			onChange,
			defaultValue: {},
			equalityCheck: true,
		});
		synced.current = { a: 1 }; // Same shape but different reference
		expect(onChange).toHaveBeenCalledOnce();
	});

	test("NaN === NaN is false, so onChange fires", () => {
		const onChange = vi.fn();
		const synced = new Synced({
			value: NaN,
			onChange,
			defaultValue: 0,
			equalityCheck: true,
		});
		synced.current = NaN;
		// NaN !== NaN in JavaScript, so equality check doesn't suppress
		expect(onChange).toHaveBeenCalledOnce();
	});
});

// =============================================================================
// EQUALITY CHECK — custom function
// =============================================================================

describe("Synced — equalityCheck: function (custom)", () => {
	test("suppresses onChange when custom comparator returns true", () => {
		const onChange = vi.fn();
		const synced = new Synced({
			value: { id: 1, name: "a" },
			onChange,
			defaultValue: { id: 0, name: "" },
			equalityCheck: (a, b) => a.id === b.id,
		});
		// Same id, different name — custom check says equal
		synced.current = { id: 1, name: "b" };
		expect(onChange).not.toHaveBeenCalled();
	});

	test("fires onChange when custom comparator returns false", () => {
		const onChange = vi.fn();
		const synced = new Synced({
			value: { id: 1, name: "a" },
			onChange,
			defaultValue: { id: 0, name: "" },
			equalityCheck: (a, b) => a.id === b.id,
		});
		synced.current = { id: 2, name: "a" };
		expect(onChange).toHaveBeenCalledOnce();
	});

	test("custom equality in controlled mode", () => {
		let external = 5;
		const onChange = vi.fn((v: number) => { external = v; });
		const synced = new Synced({
			value: () => external,
			onChange,
			defaultValue: 0,
			equalityCheck: (a, b) => Math.abs(a - b) < 0.01,
		});
		// Setting to nearly the same value — suppressed
		synced.current = 5.001;
		expect(onChange).not.toHaveBeenCalled();

		// Setting to significantly different value — fires
		synced.current = 10;
		expect(onChange).toHaveBeenCalledOnce();
	});
});

// =============================================================================
// EDGE CASES — falsy gauntlet
// =============================================================================

describe("Synced — edge cases", () => {
	test("defaultValue: false — initializes correctly (not undefined)", () => {
		const synced = new Synced({
			value: undefined,
			defaultValue: false,
		});
		expect(synced.current).toBe(false);
	});

	test("defaultValue: 0 — initializes correctly (not undefined)", () => {
		const synced = new Synced({
			value: undefined,
			defaultValue: 0,
		});
		expect(synced.current).toBe(0);
	});

	test("defaultValue: empty string — initializes correctly", () => {
		const synced = new Synced({
			value: undefined,
			defaultValue: "",
		});
		expect(synced.current).toBe("");
	});

	test("setting to false works (not treated as undefined)", () => {
		const synced = new Synced({
			value: true,
			defaultValue: true,
		});
		synced.current = false;
		expect(synced.current).toBe(false);
	});

	test("setting to 0 works (not treated as undefined)", () => {
		const synced = new Synced({
			value: 42,
			defaultValue: 0,
		});
		synced.current = 0;
		expect(synced.current).toBe(0);
	});

	test("setting to null works", () => {
		const synced = new Synced<null | string>({
			value: "hello",
			defaultValue: null,
		});
		synced.current = null;
		expect(synced.current).toBeNull();
	});
});

// =============================================================================
// INTEGRATION — builder usage pattern
// =============================================================================

describe("Synced — builder usage pattern", () => {
	test("toggle pattern: uncontrolled boolean", () => {
		const onChange = vi.fn();
		const synced = new Synced({
			value: undefined,
			onChange,
			defaultValue: false,
		});

		expect(synced.current).toBe(false);
		synced.current = !synced.current;
		expect(synced.current).toBe(true);
		synced.current = !synced.current;
		expect(synced.current).toBe(false);
		expect(onChange).toHaveBeenCalledTimes(2);
	});

	test("disabled prop pattern: controlled getter", () => {
		let disabled = false;
		const synced = new Synced({
			value: () => disabled,
			defaultValue: false,
		});

		expect(synced.current).toBe(false);
		disabled = true;
		expect(synced.current).toBe(true);
		disabled = false;
		expect(synced.current).toBe(false);
	});

	test("orientation prop pattern: controlled with default", () => {
		const synced = new Synced({
			value: undefined,
			defaultValue: "horizontal" as "horizontal" | "vertical",
		});
		expect(synced.current).toBe("horizontal");
	});
});
