import { describe, expect, test, vi } from "vitest";
import { mergeProps } from "./merge-props.js";

describe("mergeProps — React Aria's merge, for Svelte spreads", () => {
	test("event handlers run in order instead of replacing each other", () => {
		const calls: string[] = [];
		const merged = mergeProps(
			{ onclick: () => calls.push("behavior") },
			{ onclick: () => calls.push("caller") },
		);
		(merged.onclick as () => void)();
		expect(calls).toEqual(["behavior", "caller"]);
	});

	test("a handler on one side only is kept as it is", () => {
		const onfocus = vi.fn();
		const merged = mergeProps({ onfocus }, { id: "x" });
		expect(merged.onfocus).toBe(onfocus);
	});

	test("class joins; style strings join", () => {
		expect(mergeProps({ class: "a" }, { class: "b" }).class).toBe("a b");
		expect(mergeProps({ style: "color: red" }, { style: "width: 1px" }).style).toBe(
			"color: red;width: 1px",
		);
	});

	test("other values: the later one wins, but a later undefined does not erase", () => {
		const merged = mergeProps({ id: "a", role: "button" }, { id: "b", role: undefined });
		expect(merged.id).toBe("b");
		expect(merged.role).toBe("button");
	});

	test("undefined sources are skipped", () => {
		expect(mergeProps(undefined, { id: "a" }, undefined).id).toBe("a");
	});
});
