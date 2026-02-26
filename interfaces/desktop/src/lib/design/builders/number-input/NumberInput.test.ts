/**
 * @file builders/number-input/NumberInput.test.ts
 * @package @devpulse/coldlight
 *
 * GOLD STANDARD — NumberInput builder integration tests.
 *
 * Tests the COMPLETE builder in a real Chromium DOM:
 *   1. Factory — createNumberInput() returns instance, accepts props, defaults
 *   2. Root ARIA — role="group", data-cl-number-input-root, aria-label
 *   3. Input ARIA — role="spinbutton", aria-valuenow/min/max/text, inputmode, disabled, readonly, required
 *   4. Increment button — aria-label, type, tabindex, aria-disabled at max/disabled
 *   5. Decrement button — aria-label, type, tabindex, aria-disabled at min/disabled
 *   6. Keyboard — ArrowUp/Down, Home, End, disabled/readonly skips
 *   7. Clamping — value stays within min/max, step increments
 *   8. Click handlers — increment/decrement clicks, disabled skips
 *   9. canIncrement/canDecrement — computed getters reflect bounds + disabled/readonly
 *  10. Controlled mode — value from getter, onChange fires
 *  11. Instance isolation — different IDs
 *
 * This is a HEADLESS BUILDER test, not a Svelte component test.
 * We create DOM elements directly and spread builder attrs onto them.
 * This tests the builder API exactly as components will consume it.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 */

import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { NumberInput, createNumberInput } from "./factory.js";
import { resetIdCounter } from "../_internal/builder-metadata.js";

// =============================================================================
// TEST HELPERS
// =============================================================================

/** Create a DOM number-input from a builder instance. */
function createDOM(builder: NumberInput): {
	root: HTMLElement;
	input: HTMLInputElement;
	incBtn: HTMLButtonElement;
	decBtn: HTMLButtonElement;
} {
	const rootEl = document.createElement("div");
	const rootAttrs = builder.root;
	for (const [key, val] of Object.entries(rootAttrs)) {
		if (val === undefined) continue;
		if (typeof val === "function") continue;
		if (typeof val === "boolean") {
			if (val) rootEl.setAttribute(key, "");
			continue;
		}
		rootEl.setAttribute(key, String(val));
	}

	// Input element
	const inputEl = document.createElement("input") as HTMLInputElement;
	const inputAttrs = builder.input;
	for (const [key, val] of Object.entries(inputAttrs)) {
		if (val === undefined) continue;
		if (typeof val === "function") {
			if (key === "oninput") inputEl.addEventListener("input", val as EventListener);
			if (key === "onkeydown") inputEl.addEventListener("keydown", val as EventListener);
			continue;
		}
		if (typeof val === "boolean") {
			if (val) inputEl.setAttribute(key, "");
			else inputEl.removeAttribute(key);
			continue;
		}
		inputEl.setAttribute(key, String(val));
	}
	rootEl.appendChild(inputEl);

	// Increment button
	const incBtn = document.createElement("button") as HTMLButtonElement;
	const incAttrs = builder.increment;
	for (const [key, val] of Object.entries(incAttrs)) {
		if (val === undefined) continue;
		if (typeof val === "function") {
			if (key === "onclick") incBtn.addEventListener("click", val as EventListener);
			continue;
		}
		if (typeof val === "boolean") {
			if (val) incBtn.setAttribute(key, "");
			else incBtn.removeAttribute(key);
			continue;
		}
		incBtn.setAttribute(key, String(val));
	}
	incBtn.textContent = "+";
	rootEl.appendChild(incBtn);

	// Decrement button
	const decBtn = document.createElement("button") as HTMLButtonElement;
	const decAttrs = builder.decrement;
	for (const [key, val] of Object.entries(decAttrs)) {
		if (val === undefined) continue;
		if (typeof val === "function") {
			if (key === "onclick") decBtn.addEventListener("click", val as EventListener);
			continue;
		}
		if (typeof val === "boolean") {
			if (val) decBtn.setAttribute(key, "");
			else decBtn.removeAttribute(key);
			continue;
		}
		decBtn.setAttribute(key, String(val));
	}
	decBtn.textContent = "-";
	rootEl.appendChild(decBtn);

	document.body.appendChild(rootEl);
	return { root: rootEl, input: inputEl, incBtn, decBtn };
}

/** Dispatch a real KeyboardEvent on an element. */
function pressKey(el: HTMLElement, key: string): void {
	el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
}

let cleanupEl: HTMLElement | null = null;

beforeEach(() => {
	resetIdCounter();
});

afterEach(() => {
	if (cleanupEl?.parentNode) {
		cleanupEl.parentNode.removeChild(cleanupEl);
	}
	cleanupEl = null;
});

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

describe("createNumberInput — factory", () => {
	test("returns a NumberInput instance", () => {
		const builder = createNumberInput();
		expect(builder).toBeInstanceOf(NumberInput);
	});

	test("accepts props", () => {
		const builder = createNumberInput({ disabled: true });
		expect(builder.disabled).toBe(true);
	});

	test("defaults value to 0", () => {
		const builder = createNumberInput();
		expect(builder.value).toBe(0);
	});

	test("accepts initial value", () => {
		const builder = createNumberInput({ value: 42 });
		expect(builder.value).toBe(42);
	});

	test("defaults min to -Infinity", () => {
		const builder = createNumberInput();
		expect(builder.min).toBe(-Infinity);
	});

	test("defaults max to Infinity", () => {
		const builder = createNumberInput();
		expect(builder.max).toBe(Infinity);
	});

	test("defaults step to 1", () => {
		const builder = createNumberInput();
		expect(builder.step).toBe(1);
	});
});

// =============================================================================
// ROOT ELEMENT — ARIA
// =============================================================================

describe("NumberInput — root ARIA attributes", () => {
	test("root has role='group'", () => {
		const builder = createNumberInput();
		expect(builder.root.role).toBe("group");
	});

	test("root has data-cl-number-input-root attribute", () => {
		const builder = createNumberInput();
		expect(builder.root["data-cl-number-input-root"]).toBe("");
	});

	test("root has unique id", () => {
		const builder = createNumberInput();
		expect(builder.root.id).toMatch(/^cl-\d+$/);
	});

	test("root aria-label reflects prop", () => {
		const builder = createNumberInput({ "aria-label": "Quantity" });
		expect(builder.root["aria-label"]).toBe("Quantity");
	});

	test("root aria-label is undefined when not set", () => {
		const builder = createNumberInput();
		expect(builder.root["aria-label"]).toBeUndefined();
	});

	test("root data-disabled absent when not disabled", () => {
		const builder = createNumberInput();
		expect(builder.root["data-disabled"]).toBeUndefined();
	});

	test("root data-disabled present when disabled", () => {
		const builder = createNumberInput({ disabled: true });
		expect(builder.root["data-disabled"]).toBe("");
	});
});

// =============================================================================
// INPUT ELEMENT — ARIA
// =============================================================================

describe("NumberInput — input ARIA attributes", () => {
	test("input has role='spinbutton'", () => {
		const builder = createNumberInput();
		expect(builder.input.role).toBe("spinbutton");
	});

	test("input has data-cl-number-input-input attribute", () => {
		const builder = createNumberInput();
		expect(builder.input["data-cl-number-input-input"]).toBe("");
	});

	test("input has type='text'", () => {
		const builder = createNumberInput();
		expect(builder.input.type).toBe("text");
	});

	test("input has inputmode='numeric'", () => {
		const builder = createNumberInput();
		expect(builder.input.inputmode).toBe("numeric");
	});

	test("input value reflects builder value", () => {
		const builder = createNumberInput({ value: 25 });
		expect(builder.input.value).toBe(25);
	});

	test("input aria-valuenow reflects current value", () => {
		const builder = createNumberInput({ value: 10 });
		expect(builder.input["aria-valuenow"]).toBe(10);
	});

	test("input aria-valuemin reflects min when finite", () => {
		const builder = createNumberInput({ min: 0 });
		expect(builder.input["aria-valuemin"]).toBe(0);
	});

	test("input aria-valuemin is undefined when min is -Infinity", () => {
		const builder = createNumberInput();
		expect(builder.input["aria-valuemin"]).toBeUndefined();
	});

	test("input aria-valuemax reflects max when finite", () => {
		const builder = createNumberInput({ max: 100 });
		expect(builder.input["aria-valuemax"]).toBe(100);
	});

	test("input aria-valuemax is undefined when max is Infinity", () => {
		const builder = createNumberInput();
		expect(builder.input["aria-valuemax"]).toBeUndefined();
	});

	test("input aria-valuetext reflects valueText prop", () => {
		const builder = createNumberInput({ value: 50, valueText: "50 percent" });
		expect(builder.input["aria-valuetext"]).toBe("50 percent");
	});

	test("input aria-valuetext is undefined when empty", () => {
		const builder = createNumberInput();
		expect(builder.input["aria-valuetext"]).toBeUndefined();
	});

	test("input aria-disabled is true when disabled", () => {
		const builder = createNumberInput({ disabled: true });
		expect(builder.input["aria-disabled"]).toBe(true);
	});

	test("input aria-disabled is undefined when enabled", () => {
		const builder = createNumberInput();
		expect(builder.input["aria-disabled"]).toBeUndefined();
	});

	test("input aria-readonly is true when readonly", () => {
		const builder = createNumberInput({ readonly: true });
		expect(builder.input["aria-readonly"]).toBe(true);
	});

	test("input aria-readonly is undefined when not readonly", () => {
		const builder = createNumberInput();
		expect(builder.input["aria-readonly"]).toBeUndefined();
	});

	test("input aria-required is true when required", () => {
		const builder = createNumberInput({ required: true });
		expect(builder.input["aria-required"]).toBe(true);
	});

	test("input aria-required is undefined when not required", () => {
		const builder = createNumberInput();
		expect(builder.input["aria-required"]).toBeUndefined();
	});

	test("input has onkeydown handler", () => {
		const builder = createNumberInput();
		expect(typeof builder.input.onkeydown).toBe("function");
	});

	test("input has oninput handler", () => {
		const builder = createNumberInput();
		expect(typeof builder.input.oninput).toBe("function");
	});
});

// =============================================================================
// INCREMENT BUTTON — ARIA
// =============================================================================

describe("NumberInput — increment button ARIA", () => {
	test("increment has aria-label='Increase value'", () => {
		const builder = createNumberInput();
		expect(builder.increment["aria-label"]).toBe("Increase value");
	});

	test("increment has data-cl-number-input-increment attribute", () => {
		const builder = createNumberInput();
		expect(builder.increment["data-cl-number-input-increment"]).toBe("");
	});

	test("increment has type='button'", () => {
		const builder = createNumberInput();
		expect(builder.increment.type).toBe("button");
	});

	test("increment has tabindex=-1", () => {
		const builder = createNumberInput();
		expect(builder.increment.tabindex).toBe(-1);
	});

	test("increment aria-disabled when at max", () => {
		const builder = createNumberInput({ value: 10, max: 10 });
		expect(builder.increment["aria-disabled"]).toBe(true);
	});

	test("increment aria-disabled when group disabled", () => {
		const builder = createNumberInput({ disabled: true });
		expect(builder.increment["aria-disabled"]).toBe(true);
	});

	test("increment aria-disabled when readonly", () => {
		const builder = createNumberInput({ readonly: true });
		expect(builder.increment["aria-disabled"]).toBe(true);
	});

	test("increment not aria-disabled when within range", () => {
		const builder = createNumberInput({ value: 5, max: 10 });
		expect(builder.increment["aria-disabled"]).toBeUndefined();
	});

	test("increment has onclick handler", () => {
		const builder = createNumberInput();
		expect(typeof builder.increment.onclick).toBe("function");
	});
});

// =============================================================================
// DECREMENT BUTTON — ARIA
// =============================================================================

describe("NumberInput — decrement button ARIA", () => {
	test("decrement has aria-label='Decrease value'", () => {
		const builder = createNumberInput();
		expect(builder.decrement["aria-label"]).toBe("Decrease value");
	});

	test("decrement has data-cl-number-input-decrement attribute", () => {
		const builder = createNumberInput();
		expect(builder.decrement["data-cl-number-input-decrement"]).toBe("");
	});

	test("decrement has type='button'", () => {
		const builder = createNumberInput();
		expect(builder.decrement.type).toBe("button");
	});

	test("decrement has tabindex=-1", () => {
		const builder = createNumberInput();
		expect(builder.decrement.tabindex).toBe(-1);
	});

	test("decrement aria-disabled when at min", () => {
		const builder = createNumberInput({ value: 0, min: 0 });
		expect(builder.decrement["aria-disabled"]).toBe(true);
	});

	test("decrement aria-disabled when group disabled", () => {
		const builder = createNumberInput({ disabled: true });
		expect(builder.decrement["aria-disabled"]).toBe(true);
	});

	test("decrement aria-disabled when readonly", () => {
		const builder = createNumberInput({ readonly: true });
		expect(builder.decrement["aria-disabled"]).toBe(true);
	});

	test("decrement not aria-disabled when within range", () => {
		const builder = createNumberInput({ value: 5, min: 0 });
		expect(builder.decrement["aria-disabled"]).toBeUndefined();
	});

	test("decrement has onclick handler", () => {
		const builder = createNumberInput();
		expect(typeof builder.decrement.onclick).toBe("function");
	});
});

// =============================================================================
// KEYBOARD — ArrowUp/ArrowDown/Home/End
// =============================================================================

describe("NumberInput — keyboard navigation", () => {
	test("ArrowUp increments value", () => {
		const onChange = vi.fn();
		const builder = createNumberInput({ value: 5, onValueChange: onChange });
		const { root, input } = createDOM(builder);
		cleanupEl = root;

		input.focus();
		pressKey(input, "ArrowUp");
		expect(onChange).toHaveBeenCalledWith(6);
	});

	test("ArrowDown decrements value", () => {
		const onChange = vi.fn();
		const builder = createNumberInput({ value: 5, onValueChange: onChange });
		const { root, input } = createDOM(builder);
		cleanupEl = root;

		input.focus();
		pressKey(input, "ArrowDown");
		expect(onChange).toHaveBeenCalledWith(4);
	});

	test("Home sets value to min", () => {
		const onChange = vi.fn();
		const builder = createNumberInput({ value: 50, min: 0, onValueChange: onChange });
		const { root, input } = createDOM(builder);
		cleanupEl = root;

		input.focus();
		pressKey(input, "Home");
		expect(onChange).toHaveBeenCalledWith(0);
	});

	test("End sets value to max", () => {
		const onChange = vi.fn();
		const builder = createNumberInput({ value: 50, max: 100, onValueChange: onChange });
		const { root, input } = createDOM(builder);
		cleanupEl = root;

		input.focus();
		pressKey(input, "End");
		expect(onChange).toHaveBeenCalledWith(100);
	});

	test("Home does nothing when min is -Infinity", () => {
		const onChange = vi.fn();
		const builder = createNumberInput({ value: 50, onValueChange: onChange });
		const { root, input } = createDOM(builder);
		cleanupEl = root;

		input.focus();
		pressKey(input, "Home");
		expect(onChange).not.toHaveBeenCalled();
	});

	test("End does nothing when max is Infinity", () => {
		const onChange = vi.fn();
		const builder = createNumberInput({ value: 50, onValueChange: onChange });
		const { root, input } = createDOM(builder);
		cleanupEl = root;

		input.focus();
		pressKey(input, "End");
		expect(onChange).not.toHaveBeenCalled();
	});

	test("keyboard does nothing when disabled", () => {
		const onChange = vi.fn();
		const builder = createNumberInput({ value: 5, disabled: true, onValueChange: onChange });
		const { root, input } = createDOM(builder);
		cleanupEl = root;

		input.focus();
		pressKey(input, "ArrowUp");
		pressKey(input, "ArrowDown");
		expect(onChange).not.toHaveBeenCalled();
	});

	test("keyboard does nothing when readonly", () => {
		const onChange = vi.fn();
		const builder = createNumberInput({ value: 5, readonly: true, onValueChange: onChange });
		const { root, input } = createDOM(builder);
		cleanupEl = root;

		input.focus();
		pressKey(input, "ArrowUp");
		pressKey(input, "ArrowDown");
		expect(onChange).not.toHaveBeenCalled();
	});
});

// =============================================================================
// CLAMPING — value stays within bounds
// =============================================================================

describe("NumberInput — clamping and step", () => {
	test("value is clamped to min on set", () => {
		const builder = createNumberInput({ value: 5, min: 0 });
		builder.value = -10;
		expect(builder.value).toBe(0);
	});

	test("value is clamped to max on set", () => {
		const builder = createNumberInput({ value: 5, max: 10 });
		builder.value = 100;
		expect(builder.value).toBe(10);
	});

	test("step increment respects custom step", () => {
		const onChange = vi.fn();
		const builder = createNumberInput({ value: 0, step: 5, onValueChange: onChange });
		const { root, input } = createDOM(builder);
		cleanupEl = root;

		input.focus();
		pressKey(input, "ArrowUp");
		expect(onChange).toHaveBeenCalledWith(5);
	});

	test("increment does not exceed max", () => {
		const onChange = vi.fn();
		const builder = createNumberInput({ value: 9, max: 10, step: 5, onValueChange: onChange });
		const { root, input } = createDOM(builder);
		cleanupEl = root;

		input.focus();
		pressKey(input, "ArrowUp");
		// canIncrement is true (9 < 10), so increment fires: clamp(9+5, 0, 10) = 10
		expect(onChange).toHaveBeenCalledWith(10);
	});

	test("decrement does not go below min", () => {
		const onChange = vi.fn();
		const builder = createNumberInput({ value: 1, min: 0, step: 5, onValueChange: onChange });
		const { root, input } = createDOM(builder);
		cleanupEl = root;

		input.focus();
		pressKey(input, "ArrowDown");
		// canDecrement is true (1 > 0), so decrement fires: clamp(1-5, 0, Inf) = 0
		expect(onChange).toHaveBeenCalledWith(0);
	});
});

// =============================================================================
// CLICK HANDLERS — increment/decrement buttons
// =============================================================================

describe("NumberInput — click handlers", () => {
	test("increment button click increases value", () => {
		const onChange = vi.fn();
		const builder = createNumberInput({ value: 5, onValueChange: onChange });
		const { root, incBtn } = createDOM(builder);
		cleanupEl = root;

		incBtn.click();
		expect(onChange).toHaveBeenCalledWith(6);
	});

	test("decrement button click decreases value", () => {
		const onChange = vi.fn();
		const builder = createNumberInput({ value: 5, onValueChange: onChange });
		const { root, decBtn } = createDOM(builder);
		cleanupEl = root;

		decBtn.click();
		expect(onChange).toHaveBeenCalledWith(4);
	});

	test("increment click does nothing when disabled", () => {
		const onChange = vi.fn();
		const builder = createNumberInput({ value: 5, disabled: true, onValueChange: onChange });
		const { root, incBtn } = createDOM(builder);
		cleanupEl = root;

		incBtn.click();
		expect(onChange).not.toHaveBeenCalled();
	});

	test("decrement click does nothing when disabled", () => {
		const onChange = vi.fn();
		const builder = createNumberInput({ value: 5, disabled: true, onValueChange: onChange });
		const { root, decBtn } = createDOM(builder);
		cleanupEl = root;

		decBtn.click();
		expect(onChange).not.toHaveBeenCalled();
	});

	test("increment click does nothing when at max", () => {
		const onChange = vi.fn();
		const builder = createNumberInput({ value: 10, max: 10, onValueChange: onChange });
		const { root, incBtn } = createDOM(builder);
		cleanupEl = root;

		incBtn.click();
		expect(onChange).not.toHaveBeenCalled();
	});

	test("decrement click does nothing when at min", () => {
		const onChange = vi.fn();
		const builder = createNumberInput({ value: 0, min: 0, onValueChange: onChange });
		const { root, decBtn } = createDOM(builder);
		cleanupEl = root;

		decBtn.click();
		expect(onChange).not.toHaveBeenCalled();
	});

	test("increment click does nothing when readonly", () => {
		const onChange = vi.fn();
		const builder = createNumberInput({ value: 5, readonly: true, onValueChange: onChange });
		const { root, incBtn } = createDOM(builder);
		cleanupEl = root;

		incBtn.click();
		expect(onChange).not.toHaveBeenCalled();
	});

	test("decrement click does nothing when readonly", () => {
		const onChange = vi.fn();
		const builder = createNumberInput({ value: 5, readonly: true, onValueChange: onChange });
		const { root, decBtn } = createDOM(builder);
		cleanupEl = root;

		decBtn.click();
		expect(onChange).not.toHaveBeenCalled();
	});
});

// =============================================================================
// COMPUTED GETTERS — canIncrement / canDecrement
// =============================================================================

describe("NumberInput — canIncrement / canDecrement", () => {
	test("canIncrement is true when below max", () => {
		const builder = createNumberInput({ value: 5, max: 10 });
		expect(builder.canIncrement).toBe(true);
	});

	test("canIncrement is false when at max", () => {
		const builder = createNumberInput({ value: 10, max: 10 });
		expect(builder.canIncrement).toBe(false);
	});

	test("canIncrement is false when disabled", () => {
		const builder = createNumberInput({ value: 5, max: 10, disabled: true });
		expect(builder.canIncrement).toBe(false);
	});

	test("canIncrement is false when readonly", () => {
		const builder = createNumberInput({ value: 5, max: 10, readonly: true });
		expect(builder.canIncrement).toBe(false);
	});

	test("canDecrement is true when above min", () => {
		const builder = createNumberInput({ value: 5, min: 0 });
		expect(builder.canDecrement).toBe(true);
	});

	test("canDecrement is false when at min", () => {
		const builder = createNumberInput({ value: 0, min: 0 });
		expect(builder.canDecrement).toBe(false);
	});

	test("canDecrement is false when disabled", () => {
		const builder = createNumberInput({ value: 5, min: 0, disabled: true });
		expect(builder.canDecrement).toBe(false);
	});

	test("canDecrement is false when readonly", () => {
		const builder = createNumberInput({ value: 5, min: 0, readonly: true });
		expect(builder.canDecrement).toBe(false);
	});
});

// =============================================================================
// CONTROLLED MODE
// =============================================================================

describe("NumberInput — controlled mode", () => {
	test("reads value from getter", () => {
		let external = 10;
		const builder = createNumberInput({
			value: () => external,
		});
		expect(builder.value).toBe(10);
		external = 42;
		expect(builder.value).toBe(42);
	});

	test("controlled: onChange fires on increment click", () => {
		const onChange = vi.fn();
		const builder = createNumberInput({
			value: () => 5,
			onValueChange: onChange,
		});
		const { root, incBtn } = createDOM(builder);
		cleanupEl = root;

		incBtn.click();
		expect(onChange).toHaveBeenCalledWith(6);
	});

	test("controlled: onChange fires on decrement click", () => {
		const onChange = vi.fn();
		const builder = createNumberInput({
			value: () => 5,
			onValueChange: onChange,
		});
		const { root, decBtn } = createDOM(builder);
		cleanupEl = root;

		decBtn.click();
		expect(onChange).toHaveBeenCalledWith(4);
	});

	test("controlled disabled from getter", () => {
		let disabled = false;
		const builder = createNumberInput({
			disabled: () => disabled,
		});
		expect(builder.disabled).toBe(false);
		disabled = true;
		expect(builder.disabled).toBe(true);
	});

	test("controlled readonly from getter", () => {
		let readonly = false;
		const builder = createNumberInput({
			readonly: () => readonly,
		});
		expect(builder.readOnly).toBe(false);
		readonly = true;
		expect(builder.readOnly).toBe(true);
	});

	test("controlled min from getter", () => {
		let min = 0;
		const builder = createNumberInput({
			min: () => min,
		});
		expect(builder.min).toBe(0);
		min = 10;
		expect(builder.min).toBe(10);
	});

	test("controlled max from getter", () => {
		let max = 100;
		const builder = createNumberInput({
			max: () => max,
		});
		expect(builder.max).toBe(100);
		max = 50;
		expect(builder.max).toBe(50);
	});
});

// =============================================================================
// INSTANCE ISOLATION
// =============================================================================

describe("NumberInput — instance isolation", () => {
	test("two instances have different IDs", () => {
		const a = createNumberInput();
		const b = createNumberInput();
		expect(a.ids.root).not.toBe(b.ids.root);
		expect(a.ids.input).not.toBe(b.ids.input);
		expect(a.ids.increment).not.toBe(b.ids.increment);
		expect(a.ids.decrement).not.toBe(b.ids.decrement);
	});

	test("two instances have independent values", () => {
		const a = createNumberInput({ value: 10 });
		const b = createNumberInput({ value: 99 });
		expect(a.value).toBe(10);
		expect(b.value).toBe(99);
	});

	test("two instances have independent disabled state", () => {
		const a = createNumberInput({ disabled: true });
		const b = createNumberInput({ disabled: false });
		expect(a.disabled).toBe(true);
		expect(b.disabled).toBe(false);
	});
});
