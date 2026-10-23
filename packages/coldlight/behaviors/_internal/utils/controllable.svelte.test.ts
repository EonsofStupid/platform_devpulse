import { describe, expect, test, vi } from "vitest";
import { controllable } from "./controllable.svelte.js";

describe("controllable — React Aria's controlled-state model", () => {
	test("uncontrolled: starts at the default, changes locally, reports the change", () => {
		const onChange = vi.fn();
		const open = controllable<boolean>({
			value: () => undefined,
			defaultValue: () => false,
			onChange,
		});
		expect(open.current).toBe(false);
		open.set(true);
		expect(open.current).toBe(true);
		expect(onChange).toHaveBeenCalledWith(true);
	});

	test("controlled: follows the owner's value; a change is only reported", () => {
		let owned = $state(false);
		const onChange = vi.fn();
		const open = controllable<boolean>({ value: () => owned, defaultValue: () => true, onChange });
		expect(open.current).toBe(false);
		open.set(true);
		expect(onChange).toHaveBeenCalledWith(true);
		expect(open.current).toBe(false);
		owned = true;
		expect(open.current).toBe(true);
	});

	test("the owner can take or release control later", () => {
		let owned = $state<string | undefined>(undefined);
		const value = controllable<string>({ value: () => owned, defaultValue: () => "a" });
		value.set("b");
		expect(value.current).toBe("b");
		owned = "c";
		expect(value.current).toBe("c");
		owned = undefined;
		expect(value.current).toBe("b");
	});

	test("setting the value it already has does nothing", () => {
		const onChange = vi.fn();
		const pressed = controllable<boolean>({
			value: () => undefined,
			defaultValue: () => true,
			onChange,
		});
		pressed.set(true);
		expect(onChange).not.toHaveBeenCalled();
	});

	test("the default is read once", () => {
		let seed = $state("x");
		const value = controllable<string>({ value: () => undefined, defaultValue: () => seed });
		seed = "y";
		expect(value.current).toBe("x");
	});
});
