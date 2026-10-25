/**
 * @file builders/_internal/selection-state.svelte.test.ts
 * @package @devpulse/coldlight
 *
 * GOLD STANDARD — SelectionState<T, Multiple> tests.
 *
 * SelectionState manages selection for any builder with selectable items:
 * toggle-group, toolbar, data-table, radio-group pattern.
 *
 * Two axes:
 *   SINGLE (Multiple = false): value is T | undefined. One item selected at a time.
 *   MULTI  (Multiple = true):  value is SvelteSet<T>. Any number selected.
 *
 * Three ownership modes:
 *   UNCONTROLLED static: value is T or undefined. Internal SvelteSet stores state.
 *   CONTROLLED getter:   value is () => T. Reads from getter. onChange fires.
 *   CONTROLLED SvelteSet: value is SvelteSet<T>. Reads/writes directly.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * NOTE: .svelte.test.ts for $derived rune compilation.
 */

import { describe, test, expect, vi } from "vitest";
import { SvelteSet } from "svelte/reactivity";
import { SelectionState } from "./selection-state.svelte.js";

// =============================================================================
// SINGLE SELECT — UNCONTROLLED
// =============================================================================

describe("SelectionState — single select, uncontrolled", () => {
	test("initializes with no selection when value undefined", () => {
		const state = new SelectionState({ multiple: false });
		expect(state.current).toBeUndefined();
	});

	test("initializes with static value", () => {
		const state = new SelectionState({
			value: "bold",
			multiple: false,
		});
		expect(state.current).toBe("bold");
	});

	test("has() returns true for selected item", () => {
		const state = new SelectionState({
			value: "bold",
			multiple: false,
		});
		expect(state.has("bold")).toBe(true);
	});

	test("has() returns false for non-selected item", () => {
		const state = new SelectionState({
			value: "bold",
			multiple: false,
		});
		expect(state.has("italic")).toBe(false);
	});

	test("toggle selects an unselected item", () => {
		const onChange = vi.fn();
		const state = new SelectionState({
			onChange,
			multiple: false,
		});
		state.toggle("bold");
		expect(onChange).toHaveBeenCalledWith("bold");
	});

	test("toggle deselects a selected item", () => {
		const onChange = vi.fn();
		const state = new SelectionState({
			value: "bold",
			onChange,
			multiple: false,
		});
		state.toggle("bold");
		expect(onChange).toHaveBeenCalledWith(undefined);
	});

	test("toggle replaces previous selection (single mode)", () => {
		const values: (string | undefined)[] = [];
		const state = new SelectionState({
			value: "bold",
			onChange: (v) => values.push(v as string | undefined),
			multiple: false,
		});
		state.toggle("italic");
		// In single mode, selecting "italic" should replace "bold"
		expect(values[0]).toBe("italic");
	});

	test("add replaces in single mode", () => {
		const onChange = vi.fn();
		const state = new SelectionState({
			value: "bold",
			onChange,
			multiple: false,
		});
		state.add("italic");
		expect(onChange).toHaveBeenCalledWith("italic");
	});

	test("delete removes current selection", () => {
		const onChange = vi.fn();
		const state = new SelectionState({
			value: "bold",
			onChange,
			multiple: false,
		});
		state.delete("bold");
		expect(onChange).toHaveBeenCalledWith(undefined);
	});

	test("clear removes all selections", () => {
		const onChange = vi.fn();
		const state = new SelectionState({
			value: "bold",
			onChange,
			multiple: false,
		});
		state.clear();
		expect(onChange).toHaveBeenCalledWith(undefined);
	});

	test("toArray returns single-element array or empty", () => {
		const state = new SelectionState({
			value: "bold",
			multiple: false,
		});
		expect(state.toArray()).toEqual(["bold"]);
	});

	test("toArray returns empty array when nothing selected", () => {
		const state = new SelectionState({ multiple: false });
		expect(state.toArray()).toEqual([]);
	});
});

// =============================================================================
// MULTI SELECT — UNCONTROLLED
// =============================================================================

describe("SelectionState — multi select, uncontrolled", () => {
	test("initializes with empty set when no value", () => {
		const state = new SelectionState<string, true>({
			multiple: true,
		});
		const current = state.current as SvelteSet<string>;
		expect(current.size).toBe(0);
	});

	test("initializes from iterable value", () => {
		const state = new SelectionState<string, true>({
			value: ["bold", "italic"] as unknown as undefined,
			multiple: true,
		});
		expect(state.has("bold")).toBe(true);
		expect(state.has("italic")).toBe(true);
	});

	test("toggle adds unselected item", () => {
		const onChange = vi.fn();
		const state = new SelectionState<string, true>({
			onChange: onChange as (value: SvelteSet<string>) => void,
			multiple: true,
		});
		state.toggle("bold");
		expect(onChange).toHaveBeenCalled();
		const received = onChange.mock.calls[0][0] as SvelteSet<string>;
		expect(received.has("bold")).toBe(true);
	});

	test("toggle removes selected item", () => {
		const onChange = vi.fn();
		const state = new SelectionState<string, true>({
			value: ["bold"] as unknown as undefined,
			onChange: onChange as (value: SvelteSet<string>) => void,
			multiple: true,
		});
		state.toggle("bold");
		expect(onChange).toHaveBeenCalled();
	});

	test("multiple items can be selected simultaneously", () => {
		const state = new SelectionState<string, true>({
			multiple: true,
		});
		state.add("bold");
		state.add("italic");
		state.add("underline");
		expect(state.has("bold")).toBe(true);
		expect(state.has("italic")).toBe(true);
		expect(state.has("underline")).toBe(true);
	});

	test("delete removes one item, others remain", () => {
		const state = new SelectionState<string, true>({
			value: ["bold", "italic"] as unknown as undefined,
			multiple: true,
		});
		state.delete("bold");
		expect(state.has("bold")).toBe(false);
		expect(state.has("italic")).toBe(true);
	});

	test("clear removes all items", () => {
		const state = new SelectionState<string, true>({
			value: ["bold", "italic", "underline"] as unknown as undefined,
			multiple: true,
		});
		state.clear();
		expect(state.toArray()).toEqual([]);
	});

	test("toArray returns all selected items", () => {
		const state = new SelectionState<string, true>({
			value: ["bold", "italic"] as unknown as undefined,
			multiple: true,
		});
		const arr = state.toArray();
		expect(arr).toContain("bold");
		expect(arr).toContain("italic");
		expect(arr.length).toBe(2);
	});
});

// =============================================================================
// CONTROLLED — getter function
// =============================================================================

describe("SelectionState — controlled (getter)", () => {
	test("reads from getter", () => {
		let external: string | undefined = "bold";
		const state = new SelectionState({
			value: () => external,
			multiple: false,
		});
		expect(state.current).toBe("bold");
		external = "italic";
		expect(state.current).toBe("italic");
	});

	test("toggle fires onChange without storing internally", () => {
		let external: string | undefined = "bold";
		const onChange = vi.fn((v: string | undefined) => { external = v; });
		const state = new SelectionState({
			value: () => external,
			onChange,
			multiple: false,
		});
		state.toggle("bold");
		expect(onChange).toHaveBeenCalled();
	});
});

// =============================================================================
// CONTROLLED — SvelteSet (multi, direct)
// =============================================================================

describe("SelectionState — controlled (SvelteSet)", () => {
	test("reads from SvelteSet directly", () => {
		const set = new SvelteSet(["bold", "italic"]);
		const state = new SelectionState<string, true>({
			value: set,
			multiple: true,
		});
		expect(state.has("bold")).toBe(true);
		expect(state.has("italic")).toBe(true);
	});

	test("external SvelteSet mutations are reflected", () => {
		const set = new SvelteSet(["bold"]);
		const state = new SelectionState<string, true>({
			value: set,
			multiple: true,
		});
		set.add("italic");
		expect(state.has("italic")).toBe(true);
	});
});

// =============================================================================
// SUPPRESSED onChange — deep equality
// =============================================================================

describe("SelectionState — onChange suppression", () => {
	test("does not fire onChange when toggle results in same state (deselect non-existent)", () => {
		const onChange = vi.fn();
		const state = new SelectionState({
			onChange,
			multiple: false,
		});
		// Nothing selected. Toggling non-existent item should add it.
		// But toggling an item that doesn't exist when nothing selected should select it.
		state.toggle("bold");
		expect(onChange).toHaveBeenCalledOnce();
	});
});

// =============================================================================
// EDGE CASES
// =============================================================================

describe("SelectionState — edge cases", () => {
	test("single select: toggle same item twice = back to undefined", () => {
		const values: (string | undefined)[] = [];
		const state = new SelectionState({
			onChange: (v) => values.push(v as string | undefined),
			multiple: false,
		});
		state.toggle("bold");
		state.toggle("bold");
		expect(values).toEqual(["bold", undefined]);
	});

	test("has() with non-existent item returns false", () => {
		const state = new SelectionState({ multiple: false });
		expect(state.has("nonexistent")).toBe(false);
	});

	test("delete non-existent item is safe (no error)", () => {
		const state = new SelectionState({ multiple: false });
		expect(() => state.delete("nonexistent")).not.toThrow();
	});

	test("clear on already empty state is safe", () => {
		const state = new SelectionState({ multiple: false });
		expect(() => state.clear()).not.toThrow();
	});

	test("toArray on empty state returns empty array", () => {
		const state = new SelectionState({ multiple: false });
		expect(state.toArray()).toEqual([]);
	});
});

// =============================================================================
// INTEGRATION — toggle-group usage pattern
// =============================================================================

describe("SelectionState — toggle-group pattern", () => {
	test("single select toggle-group: click bold, click italic, click italic again", () => {
		const values: (string | undefined)[] = [];
		const state = new SelectionState({
			onChange: (v) => values.push(v as string | undefined),
			multiple: false,
		});

		state.toggle("bold");    // select bold
		state.toggle("italic");  // select italic (replaces bold)
		state.toggle("italic");  // deselect italic

		expect(values).toEqual(["bold", "italic", undefined]);
	});

	test("multi select toggle-group: add bold, add italic, remove bold", () => {
		const calls: SvelteSet<string>[] = [];
		const state = new SelectionState<string, true>({
			onChange: (v) => calls.push(new SvelteSet(v as SvelteSet<string>)),
			multiple: true,
		});

		state.toggle("bold");
		state.toggle("italic");
		state.toggle("bold");

		expect(calls.length).toBe(3);
		// After bold
		expect(calls[0].has("bold")).toBe(true);
		// After italic
		expect(calls[1].has("bold")).toBe(true);
		expect(calls[1].has("italic")).toBe(true);
		// After removing bold
		expect(calls[2].has("bold")).toBe(false);
		expect(calls[2].has("italic")).toBe(true);
	});
});
