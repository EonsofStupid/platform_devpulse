/**
 * @file builders/_internal/merge-attrs.test.ts
 * @package @devpulse/coldlight
 *
 * GOLD STANDARD — mergeAttrs utility tests.
 *
 * mergeAttrs is how components compose builder attributes with their own.
 * It MUST handle:
 *   - Event handler chaining (onclick from builder + onclick from component = both fire)
 *   - Style concatenation (builder style + component style = "a;b")
 *   - Class concatenation (builder class + component class = "a b")
 *   - Last-wins for everything else
 *   - Svelte false-attribute bug workaround (hidden/disabled)
 *
 * This is the most critical utility for correctness. If mergeAttrs silently
 * overwrites an onclick handler, the entire builder system breaks — buttons
 * stop toggling, keyboards stop navigating, accessibility disappears.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 */

import { describe, test, expect, vi } from "vitest";
import { mergeAttrs } from "./merge-attrs.js";

// =============================================================================
// EMPTY / SINGLE OBJECT
// =============================================================================

describe("mergeAttrs — base cases", () => {
	test("zero arguments returns empty object", () => {
		expect(mergeAttrs()).toEqual({});
	});

	test("single object returns a copy (not reference)", () => {
		const original = { role: "button", class: "foo" };
		const result = mergeAttrs(original);
		expect(result).toEqual({ role: "button", class: "foo" });
		expect(result).not.toBe(original);
	});

	test("single object with disabled:false — disabled is removed (Svelte bug)", () => {
		const result = mergeAttrs({ disabled: false, role: "button" });
		expect(result).not.toHaveProperty("disabled");
		expect(result.role).toBe("button");
	});

	test("single object with hidden:false — hidden is removed (Svelte bug)", () => {
		const result = mergeAttrs({ hidden: false, class: "foo" });
		expect(result).not.toHaveProperty("hidden");
	});
});

// =============================================================================
// LAST-WINS for scalar attributes
// =============================================================================

describe("mergeAttrs — last-wins scalars", () => {
	test("second object overwrites first for same key", () => {
		const result = mergeAttrs(
			{ role: "button" },
			{ role: "switch" },
		);
		expect(result.role).toBe("switch");
	});

	test("second object adds keys not in first", () => {
		const result = mergeAttrs(
			{ role: "button" },
			{ "aria-pressed": true },
		);
		expect(result.role).toBe("button");
		expect(result["aria-pressed"]).toBe(true);
	});

	test("undefined in second does NOT overwrite first", () => {
		const result = mergeAttrs(
			{ "aria-label": "Save" },
			{ "aria-label": undefined },
		);
		expect(result["aria-label"]).toBe("Save");
	});

	test("null in second DOES overwrite first (null is not undefined)", () => {
		const result = mergeAttrs(
			{ "data-value": "bold" },
			{ "data-value": null },
		);
		expect(result["data-value"]).toBeNull();
	});

	test("false in second DOES overwrite first", () => {
		const result = mergeAttrs(
			{ "aria-pressed": true },
			{ "aria-pressed": false },
		);
		expect(result["aria-pressed"]).toBe(false);
	});

	test("0 in second DOES overwrite first", () => {
		const result = mergeAttrs(
			{ tabindex: -1 },
			{ tabindex: 0 },
		);
		expect(result.tabindex).toBe(0);
	});

	test("empty string in second DOES overwrite first", () => {
		const result = mergeAttrs(
			{ "data-cl-root": "old" },
			{ "data-cl-root": "" },
		);
		expect(result["data-cl-root"]).toBe("");
	});

	test("three objects — last wins across all", () => {
		const result = mergeAttrs(
			{ role: "button" },
			{ role: "switch" },
			{ role: "checkbox" },
		);
		expect(result.role).toBe("checkbox");
	});
});

// =============================================================================
// EVENT HANDLER CHAINING
// =============================================================================

describe("mergeAttrs — event handler chaining", () => {
	test("two onclick handlers — both fire in order", () => {
		const calls: string[] = [];
		const result = mergeAttrs(
			{ onclick: () => calls.push("builder") },
			{ onclick: () => calls.push("component") },
		);

		(result.onclick as () => void)();
		expect(calls).toEqual(["builder", "component"]);
	});

	test("three onclick handlers — all fire in order", () => {
		const calls: string[] = [];
		const result = mergeAttrs(
			{ onclick: () => calls.push("first") },
			{ onclick: () => calls.push("second") },
			{ onclick: () => calls.push("third") },
		);

		(result.onclick as () => void)();
		expect(calls).toEqual(["first", "second", "third"]);
	});

	test("onkeydown handlers chain (keyboard events critical for builders)", () => {
		const calls: string[] = [];
		const result = mergeAttrs(
			{ onkeydown: () => calls.push("builder-keydown") },
			{ onkeydown: () => calls.push("component-keydown") },
		);

		(result.onkeydown as () => void)();
		expect(calls).toEqual(["builder-keydown", "component-keydown"]);
	});

	test("onfocus handlers chain", () => {
		const calls: string[] = [];
		const result = mergeAttrs(
			{ onfocus: () => calls.push("a") },
			{ onfocus: () => calls.push("b") },
		);

		(result.onfocus as () => void)();
		expect(calls).toEqual(["a", "b"]);
	});

	test("onblur handlers chain", () => {
		const calls: string[] = [];
		const result = mergeAttrs(
			{ onblur: () => calls.push("a") },
			{ onblur: () => calls.push("b") },
		);

		(result.onblur as () => void)();
		expect(calls).toEqual(["a", "b"]);
	});

	test("different event types don't interfere", () => {
		const clicks: string[] = [];
		const keys: string[] = [];
		const result = mergeAttrs(
			{ onclick: () => clicks.push("click-a"), onkeydown: () => keys.push("key-a") },
			{ onclick: () => clicks.push("click-b"), onkeydown: () => keys.push("key-b") },
		);

		(result.onclick as () => void)();
		(result.onkeydown as () => void)();
		expect(clicks).toEqual(["click-a", "click-b"]);
		expect(keys).toEqual(["key-a", "key-b"]);
	});

	test("event handler + undefined — handler preserved", () => {
		const fn = vi.fn();
		const result = mergeAttrs(
			{ onclick: fn },
			{ onclick: undefined },
		);
		// undefined doesn't overwrite, so fn should be preserved
		expect(result.onclick).toBe(fn);
	});

	test("handler arguments are passed through", () => {
		const received: unknown[] = [];
		const result = mergeAttrs(
			{ onclick: (e: unknown) => received.push(e) },
			{ onclick: (e: unknown) => received.push(e) },
		);

		const mockEvent = { type: "click" };
		(result.onclick as (e: unknown) => void)(mockEvent);
		expect(received).toEqual([mockEvent, mockEvent]);
	});
});

// =============================================================================
// STYLE CONCATENATION
// =============================================================================

describe("mergeAttrs — style concatenation", () => {
	test("two style strings joined with semicolon", () => {
		const result = mergeAttrs(
			{ style: "color: red" },
			{ style: "font-size: 14px" },
		);
		expect(result.style).toBe("color: red;font-size: 14px");
	});

	test("three style strings joined sequentially", () => {
		const result = mergeAttrs(
			{ style: "a: 1" },
			{ style: "b: 2" },
			{ style: "c: 3" },
		);
		expect(result.style).toBe("a: 1;b: 2;c: 3");
	});

	test("style string + undefined — string preserved", () => {
		const result = mergeAttrs(
			{ style: "color: red" },
			{ style: undefined },
		);
		expect(result.style).toBe("color: red");
	});

	test("non-string style (object) — last wins (no concat)", () => {
		const result = mergeAttrs(
			{ style: { color: "red" } },
			{ style: { fontSize: "14px" } },
		);
		expect(result.style).toEqual({ fontSize: "14px" });
	});
});

// =============================================================================
// CLASS CONCATENATION
// =============================================================================

describe("mergeAttrs — class concatenation", () => {
	test("two class strings joined with space", () => {
		const result = mergeAttrs(
			{ class: "btn" },
			{ class: "btn-primary" },
		);
		expect(result.class).toBe("btn btn-primary");
	});

	test("three class strings joined sequentially", () => {
		const result = mergeAttrs(
			{ class: "a" },
			{ class: "b" },
			{ class: "c" },
		);
		expect(result.class).toBe("a b c");
	});

	test("class string + undefined — string preserved", () => {
		const result = mergeAttrs(
			{ class: "btn" },
			{ class: undefined },
		);
		expect(result.class).toBe("btn");
	});

	test("empty class + class — no leading space", () => {
		const result = mergeAttrs(
			{ class: "" },
			{ class: "btn" },
		);
		expect(result.class).toBe(" btn");
	});
});

// =============================================================================
// SVELTE BUG WORKAROUND — hidden/disabled false
// =============================================================================

describe("mergeAttrs — Svelte false-attribute bug workaround", () => {
	test("disabled:true is preserved", () => {
		const result = mergeAttrs({ disabled: true });
		expect(result.disabled).toBe(true);
	});

	test("disabled:false is removed", () => {
		const result = mergeAttrs({ disabled: false });
		expect(result).not.toHaveProperty("disabled");
	});

	test("hidden:true is preserved", () => {
		const result = mergeAttrs({ hidden: true });
		expect(result.hidden).toBe(true);
	});

	test("hidden:false is removed", () => {
		const result = mergeAttrs({ hidden: false });
		expect(result).not.toHaveProperty("hidden");
	});

	test("disabled from merge: true + false → false → removed", () => {
		const result = mergeAttrs(
			{ disabled: true },
			{ disabled: false },
		);
		// false overwrites true, then Svelte workaround removes it
		expect(result).not.toHaveProperty("disabled");
	});

	test("disabled from merge: false + true → true → preserved", () => {
		const result = mergeAttrs(
			{ disabled: false },
			{ disabled: true },
		);
		expect(result.disabled).toBe(true);
	});

	test("other boolean attrs are NOT affected (only hidden/disabled)", () => {
		const result = mergeAttrs({ "aria-pressed": false, "aria-disabled": false });
		expect(result["aria-pressed"]).toBe(false);
		expect(result["aria-disabled"]).toBe(false);
	});
});

// =============================================================================
// COMPOSITION — real builder + component merge pattern
// =============================================================================

describe("mergeAttrs — real-world composition", () => {
	test("builder attrs + component attrs = correct merged element", () => {
		// Builder produces these attrs for a toggle-group item
		const builderAttrs = {
			"data-cl-toggle-group-item": "",
			"data-value": "bold",
			"data-state": "off",
			role: "button",
			"aria-pressed": false,
			tabindex: -1,
			onclick: vi.fn(),
			onkeydown: vi.fn(),
		};

		// Component adds visual attrs
		const componentAttrs = {
			class: "btn btn-toggle",
			onclick: vi.fn(), // additional click handler for analytics
		};

		const merged = mergeAttrs(builderAttrs, componentAttrs);

		// Scalars: builder values preserved
		expect(merged["data-cl-toggle-group-item"]).toBe("");
		expect(merged["data-value"]).toBe("bold");
		expect(merged.role).toBe("button");
		expect(merged["aria-pressed"]).toBe(false);
		expect(merged.tabindex).toBe(-1);

		// Class: from component
		expect(merged.class).toBe("btn btn-toggle");

		// onclick: BOTH fire (chained)
		(merged.onclick as () => void)();
		expect(builderAttrs.onclick).toHaveBeenCalledOnce();
		expect(componentAttrs.onclick).toHaveBeenCalledOnce();

		// onkeydown: only builder (component didn't add one)
		expect(typeof merged.onkeydown).toBe("function");
	});

	test("builder root attrs + user spread = complete element attrs", () => {
		const builderRoot = {
			"data-cl-toggle-group-root": "",
			role: "group",
			"aria-orientation": "horizontal",
			"data-orientation": "horizontal",
		};

		const userProps = {
			class: "flex gap-1 p-1",
			"aria-label": "Text formatting",
			id: "format-toolbar",
		};

		const merged = mergeAttrs(builderRoot, userProps);

		// Builder ARIA preserved
		expect(merged.role).toBe("group");
		expect(merged["aria-orientation"]).toBe("horizontal");

		// User additions merged in
		expect(merged.class).toBe("flex gap-1 p-1");
		expect(merged["aria-label"]).toBe("Text formatting");
		expect(merged.id).toBe("format-toolbar");

		// Builder data attrs preserved
		expect(merged["data-cl-toggle-group-root"]).toBe("");
	});
});
