/**
 * @file builders/checkbox/Checkbox.test.ts
 * @package @devpulse/coldlight
 *
 * COMPREHENSIVE — Checkbox builder integration tests.
 *
 * Tests the COMPLETE builder in a real Chromium DOM:
 *   1. Factory — createCheckbox() returns Checkbox instance, accepts props
 *   2. Root ARIA — role, aria-checked, aria-disabled, aria-required, data-state, data-cl-checkbox-root, id, tabindex
 *   3. Indicator slot — aria-hidden, data-state mirrors root
 *   4. Label slot — data-cl-checkbox-label, data-disabled, click triggers toggle
 *   5. Click behavior — toggle, disabled guard, indeterminate clearing
 *   6. Keyboard — Space toggles, Space disabled guard, Space clears indeterminate, Enter does NOT toggle
 *   7. Tri-state — indeterminate aria-checked="mixed", data-state="indeterminate"
 *   8. Controlled mode — getter for checked, onChange fires, controlled indeterminate
 *   9. toggle() method — programmatic toggle, disabled guard
 *  10. Instance isolation — unique IDs, independent state
 *
 * This is a HEADLESS BUILDER test, not a Svelte component test.
 * We create DOM elements directly and spread builder attrs onto them.
 * This tests the builder API exactly as components will consume it.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 */

import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { Checkbox, createCheckbox } from "./factory.svelte.js";
import { resetIdCounter } from "../../builders/builder-metadata.js";

// =============================================================================
// TEST HELPERS
// =============================================================================

/** Create a DOM checkbox from a builder instance with root, indicator, and label. */
function createDOM(builder: Checkbox): {
	root: HTMLButtonElement;
	indicator: HTMLSpanElement;
	label: HTMLLabelElement;
} {
	const rootEl = document.createElement("button");
	const rootAttrs = builder.root;
	for (const [key, val] of Object.entries(rootAttrs)) {
		if (val === undefined) continue;
		if (typeof val === "function") {
			if (key === "onclick") rootEl.addEventListener("click", val as EventListener);
			if (key === "onkeydown") rootEl.addEventListener("keydown", val as EventListener);
			continue;
		}
		if (typeof val === "boolean") {
			if (val) rootEl.setAttribute(key, "");
			continue;
		}
		rootEl.setAttribute(key, String(val));
	}

	const indicatorEl = document.createElement("span");
	const indicatorAttrs = builder.indicator;
	for (const [key, val] of Object.entries(indicatorAttrs)) {
		if (val === undefined) continue;
		if (typeof val === "function") continue;
		if (typeof val === "boolean") {
			if (val) indicatorEl.setAttribute(key, "");
			continue;
		}
		indicatorEl.setAttribute(key, String(val));
	}

	const labelEl = document.createElement("label") as HTMLLabelElement;
	const labelAttrs = builder.label;
	for (const [key, val] of Object.entries(labelAttrs)) {
		if (val === undefined) continue;
		if (typeof val === "function") {
			if (key === "onclick") labelEl.addEventListener("click", val as EventListener);
			continue;
		}
		if (typeof val === "boolean") {
			if (val) labelEl.setAttribute(key, "");
			continue;
		}
		labelEl.setAttribute(key, String(val));
	}
	labelEl.textContent = "Check me";

	rootEl.appendChild(indicatorEl);
	document.body.appendChild(rootEl);
	document.body.appendChild(labelEl);

	return { root: rootEl, indicator: indicatorEl, label: labelEl };
}

/** Dispatch a real KeyboardEvent on an element. */
function pressKey(el: HTMLElement, key: string): void {
	el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
}

let cleanupEls: HTMLElement[] = [];

beforeEach(() => {
	resetIdCounter();
});

afterEach(() => {
	for (const el of cleanupEls) {
		if (el.parentNode) {
			el.parentNode.removeChild(el);
		}
	}
	cleanupEls = [];
});

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

describe("createCheckbox — factory", () => {
	test("returns a Checkbox instance", () => {
		const builder = createCheckbox();
		expect(builder).toBeInstanceOf(Checkbox);
	});

	test("accepts props", () => {
		const builder = createCheckbox({ disabled: true });
		expect(builder.disabled).toBe(true);
	});

	test("defaults checked to false", () => {
		const builder = createCheckbox();
		expect(builder.checked).toBe(false);
	});

	test("defaults indeterminate to false", () => {
		const builder = createCheckbox();
		expect(builder.indeterminate).toBe(false);
	});

	test("defaults disabled to false", () => {
		const builder = createCheckbox();
		expect(builder.disabled).toBe(false);
	});

	test("accepts initial checked: true", () => {
		const builder = createCheckbox({ checked: true });
		expect(builder.checked).toBe(true);
	});
});

// =============================================================================
// ROOT ELEMENT — ARIA
// =============================================================================

describe("Checkbox — root ARIA attributes", () => {
	test("root has role='checkbox'", () => {
		const builder = createCheckbox();
		expect(builder.root.role).toBe("checkbox");
	});

	test("root has type='button'", () => {
		const builder = createCheckbox();
		expect(builder.root.type).toBe("button");
	});

	test("root has data-cl-checkbox-root attribute", () => {
		const builder = createCheckbox();
		expect(builder.root["data-cl-checkbox-root"]).toBe("");
	});

	test("root has unique id", () => {
		const builder = createCheckbox();
		expect(builder.root.id).toMatch(/^cl-\d+$/);
	});

	test("root has tabindex=0", () => {
		const builder = createCheckbox();
		expect(builder.root.tabindex).toBe(0);
	});

	test("root aria-checked is 'false' when unchecked", () => {
		const builder = createCheckbox();
		expect(builder.root["aria-checked"]).toBe("false");
	});

	test("root aria-checked is 'true' when checked", () => {
		const builder = createCheckbox({ checked: true });
		expect(builder.root["aria-checked"]).toBe("true");
	});

	test("root aria-checked is 'mixed' when indeterminate", () => {
		const builder = createCheckbox({ indeterminate: true });
		expect(builder.root["aria-checked"]).toBe("mixed");
	});

	test("root aria-disabled absent when not disabled", () => {
		const builder = createCheckbox();
		expect(builder.root["aria-disabled"]).toBeUndefined();
	});

	test("root aria-disabled present when disabled", () => {
		const builder = createCheckbox({ disabled: true });
		expect(builder.root["aria-disabled"]).toBe(true);
	});

	test("root aria-required absent when not required", () => {
		const builder = createCheckbox();
		expect(builder.root["aria-required"]).toBeUndefined();
	});

	test("root aria-required present when required", () => {
		const builder = createCheckbox({ required: true });
		expect(builder.root["aria-required"]).toBe(true);
	});

	test("root data-state is 'unchecked' when unchecked", () => {
		const builder = createCheckbox();
		expect(builder.root["data-state"]).toBe("unchecked");
	});

	test("root data-state is 'checked' when checked", () => {
		const builder = createCheckbox({ checked: true });
		expect(builder.root["data-state"]).toBe("checked");
	});

	test("root data-state is 'indeterminate' when indeterminate", () => {
		const builder = createCheckbox({ indeterminate: true });
		expect(builder.root["data-state"]).toBe("indeterminate");
	});

	test("root data-disabled absent when not disabled", () => {
		const builder = createCheckbox();
		expect(builder.root["data-disabled"]).toBeUndefined();
	});

	test("root data-disabled present when disabled", () => {
		const builder = createCheckbox({ disabled: true });
		expect(builder.root["data-disabled"]).toBe("");
	});

	test("root has onclick handler", () => {
		const builder = createCheckbox();
		expect(typeof builder.root.onclick).toBe("function");
	});

	test("root has onkeydown handler", () => {
		const builder = createCheckbox();
		expect(typeof builder.root.onkeydown).toBe("function");
	});
});

// =============================================================================
// INDICATOR SLOT — ARIA
// =============================================================================

describe("Checkbox — indicator slot", () => {
	test("indicator has aria-hidden='true'", () => {
		const builder = createCheckbox();
		expect(builder.indicator["aria-hidden"]).toBe("true");
	});

	test("indicator has data-cl-checkbox-indicator attribute", () => {
		const builder = createCheckbox();
		expect(builder.indicator["data-cl-checkbox-indicator"]).toBe("");
	});

	test("indicator has unique id", () => {
		const builder = createCheckbox();
		expect(builder.indicator.id).toMatch(/^cl-\d+$/);
	});

	test("indicator data-state mirrors root when unchecked", () => {
		const builder = createCheckbox();
		expect(builder.indicator["data-state"]).toBe("unchecked");
		expect(builder.root["data-state"]).toBe("unchecked");
	});

	test("indicator data-state mirrors root when checked", () => {
		const builder = createCheckbox({ checked: true });
		expect(builder.indicator["data-state"]).toBe("checked");
		expect(builder.root["data-state"]).toBe("checked");
	});

	test("indicator data-state mirrors root when indeterminate", () => {
		const builder = createCheckbox({ indeterminate: true });
		expect(builder.indicator["data-state"]).toBe("indeterminate");
		expect(builder.root["data-state"]).toBe("indeterminate");
	});
});

// =============================================================================
// LABEL SLOT
// =============================================================================

describe("Checkbox — label slot", () => {
	test("label has data-cl-checkbox-label attribute", () => {
		const builder = createCheckbox();
		expect(builder.label["data-cl-checkbox-label"]).toBe("");
	});

	test("label has unique id", () => {
		const builder = createCheckbox();
		expect(builder.label.id).toMatch(/^cl-\d+$/);
	});

	test("label data-disabled absent when not disabled", () => {
		const builder = createCheckbox();
		expect(builder.label["data-disabled"]).toBeUndefined();
	});

	test("label data-disabled present when disabled", () => {
		const builder = createCheckbox({ disabled: true });
		expect(builder.label["data-disabled"]).toBe("");
	});

	test("label has onclick handler", () => {
		const builder = createCheckbox();
		expect(typeof builder.label.onclick).toBe("function");
	});

	test("label click triggers toggle", () => {
		const onChange = vi.fn();
		const builder = createCheckbox({ onCheckedChange: onChange });
		const { root, label } = createDOM(builder);
		cleanupEls.push(root, label);

		label.click();
		expect(onChange).toHaveBeenCalledWith(true);
	});

	test("label click on disabled does nothing", () => {
		const onChange = vi.fn();
		const builder = createCheckbox({ disabled: true, onCheckedChange: onChange });
		const { root, label } = createDOM(builder);
		cleanupEls.push(root, label);

		label.click();
		expect(onChange).not.toHaveBeenCalled();
	});
});

// =============================================================================
// CLICK BEHAVIOR
// =============================================================================

describe("Checkbox — click behavior", () => {
	test("click toggles checked from false to true", () => {
		const onChange = vi.fn();
		const builder = createCheckbox({ onCheckedChange: onChange });
		const { root, label } = createDOM(builder);
		cleanupEls.push(root, label);

		root.click();
		expect(onChange).toHaveBeenCalledWith(true);
	});

	test("click toggles checked from true to false", () => {
		const onChange = vi.fn();
		const builder = createCheckbox({ checked: true, onCheckedChange: onChange });
		const { root, label } = createDOM(builder);
		cleanupEls.push(root, label);

		root.click();
		expect(onChange).toHaveBeenCalledWith(false);
	});

	test("click on disabled checkbox does nothing", () => {
		const onChange = vi.fn();
		const builder = createCheckbox({ disabled: true, onCheckedChange: onChange });
		const { root, label } = createDOM(builder);
		cleanupEls.push(root, label);

		root.click();
		expect(onChange).not.toHaveBeenCalled();
	});

	test("click clears indeterminate then toggles", () => {
		const onCheckedChange = vi.fn();
		const onIndeterminateChange = vi.fn();
		const builder = createCheckbox({
			indeterminate: true,
			onCheckedChange,
			onIndeterminateChange,
		});
		const { root, label } = createDOM(builder);
		cleanupEls.push(root, label);

		root.click();
		// Indeterminate should be cleared
		expect(onIndeterminateChange).toHaveBeenCalledWith(false);
		// Checked should toggle (from false to true)
		expect(onCheckedChange).toHaveBeenCalledWith(true);
	});
});

// =============================================================================
// KEYBOARD — Space and Enter
// =============================================================================

describe("Checkbox — keyboard", () => {
	test("Space toggles checked from false to true", () => {
		const onChange = vi.fn();
		const builder = createCheckbox({ onCheckedChange: onChange });
		const { root, label } = createDOM(builder);
		cleanupEls.push(root, label);

		root.focus();
		pressKey(root, " ");
		expect(onChange).toHaveBeenCalledWith(true);
	});

	test("Space toggles checked from true to false", () => {
		const onChange = vi.fn();
		const builder = createCheckbox({ checked: true, onCheckedChange: onChange });
		const { root, label } = createDOM(builder);
		cleanupEls.push(root, label);

		root.focus();
		pressKey(root, " ");
		expect(onChange).toHaveBeenCalledWith(false);
	});

	test("Space on disabled checkbox does nothing", () => {
		const onChange = vi.fn();
		const builder = createCheckbox({ disabled: true, onCheckedChange: onChange });
		const { root, label } = createDOM(builder);
		cleanupEls.push(root, label);

		root.focus();
		pressKey(root, " ");
		expect(onChange).not.toHaveBeenCalled();
	});

	test("Space clears indeterminate then toggles", () => {
		const onCheckedChange = vi.fn();
		const onIndeterminateChange = vi.fn();
		const builder = createCheckbox({
			indeterminate: true,
			onCheckedChange,
			onIndeterminateChange,
		});
		const { root, label } = createDOM(builder);
		cleanupEls.push(root, label);

		root.focus();
		pressKey(root, " ");
		expect(onIndeterminateChange).toHaveBeenCalledWith(false);
		expect(onCheckedChange).toHaveBeenCalledWith(true);
	});

	test("Enter does NOT toggle (only Space per APG)", () => {
		const onChange = vi.fn();
		const builder = createCheckbox({ onCheckedChange: onChange });
		const { root, label } = createDOM(builder);
		cleanupEls.push(root, label);

		root.focus();
		pressKey(root, "Enter");
		expect(onChange).not.toHaveBeenCalled();
	});
});

// =============================================================================
// TRI-STATE (INDETERMINATE)
// =============================================================================

describe("Checkbox — tri-state (indeterminate)", () => {
	test("indeterminate produces aria-checked='mixed'", () => {
		const builder = createCheckbox({ indeterminate: true });
		expect(builder.root["aria-checked"]).toBe("mixed");
	});

	test("indeterminate produces data-state='indeterminate'", () => {
		const builder = createCheckbox({ indeterminate: true });
		expect(builder.root["data-state"]).toBe("indeterminate");
	});

	test("indeterminate takes precedence over checked for aria-checked", () => {
		const builder = createCheckbox({ checked: true, indeterminate: true });
		expect(builder.root["aria-checked"]).toBe("mixed");
	});

	test("indeterminate takes precedence over checked for data-state", () => {
		const builder = createCheckbox({ checked: true, indeterminate: true });
		expect(builder.root["data-state"]).toBe("indeterminate");
	});

	test("indicator reflects indeterminate state", () => {
		const builder = createCheckbox({ indeterminate: true });
		expect(builder.indicator["data-state"]).toBe("indeterminate");
	});
});

// =============================================================================
// CONTROLLED MODE
// =============================================================================

describe("Checkbox — controlled mode", () => {
	test("reads checked from getter", () => {
		let external = false;
		const builder = createCheckbox({
			checked: () => external,
		});
		expect(builder.checked).toBe(false);
		external = true;
		expect(builder.checked).toBe(true);
	});

	test("controlled: aria-checked reflects getter value", () => {
		let external = false;
		const builder = createCheckbox({
			checked: () => external,
		});
		expect(builder.root["aria-checked"]).toBe("false");
		external = true;
		expect(builder.root["aria-checked"]).toBe("true");
	});

	test("controlled: onChange fires on click", () => {
		const onChange = vi.fn();
		const builder = createCheckbox({
			checked: () => false,
			onCheckedChange: onChange,
		});
		const { root, label } = createDOM(builder);
		cleanupEls.push(root, label);

		root.click();
		expect(onChange).toHaveBeenCalledWith(true);
	});

	test("controlled indeterminate from getter", () => {
		let indet = false;
		const builder = createCheckbox({
			indeterminate: () => indet,
		});
		expect(builder.indeterminate).toBe(false);
		expect(builder.root["aria-checked"]).toBe("false");
		indet = true;
		expect(builder.indeterminate).toBe(true);
		expect(builder.root["aria-checked"]).toBe("mixed");
	});

	test("controlled disabled from getter", () => {
		let disabled = false;
		const builder = createCheckbox({
			disabled: () => disabled,
		});
		expect(builder.disabled).toBe(false);
		disabled = true;
		expect(builder.disabled).toBe(true);
	});

	test("controlled required from getter", () => {
		let required = false;
		const builder = createCheckbox({
			required: () => required,
		});
		expect(builder.required).toBe(false);
		required = true;
		expect(builder.required).toBe(true);
	});
});

// =============================================================================
// toggle() METHOD
// =============================================================================

describe("Checkbox — toggle() method", () => {
	test("programmatic toggle changes checked state", () => {
		const onChange = vi.fn();
		const builder = createCheckbox({ onCheckedChange: onChange });
		builder.toggle();
		expect(onChange).toHaveBeenCalledWith(true);
	});

	test("programmatic toggle from true to false", () => {
		const onChange = vi.fn();
		const builder = createCheckbox({ checked: true, onCheckedChange: onChange });
		builder.toggle();
		expect(onChange).toHaveBeenCalledWith(false);
	});

	test("toggle on disabled does nothing", () => {
		const onChange = vi.fn();
		const builder = createCheckbox({ disabled: true, onCheckedChange: onChange });
		builder.toggle();
		expect(onChange).not.toHaveBeenCalled();
	});

	test("toggle clears indeterminate", () => {
		const onIndeterminateChange = vi.fn();
		const builder = createCheckbox({
			indeterminate: true,
			onIndeterminateChange,
		});
		builder.toggle();
		expect(onIndeterminateChange).toHaveBeenCalledWith(false);
	});
});

// =============================================================================
// INSTANCE ISOLATION
// =============================================================================

describe("Checkbox — instance isolation", () => {
	test("two instances have different root IDs", () => {
		const a = createCheckbox();
		const b = createCheckbox();
		expect(a.ids.root).not.toBe(b.ids.root);
	});

	test("two instances have different indicator IDs", () => {
		const a = createCheckbox();
		const b = createCheckbox();
		expect(a.ids.indicator).not.toBe(b.ids.indicator);
	});

	test("two instances have different label IDs", () => {
		const a = createCheckbox();
		const b = createCheckbox();
		expect(a.ids.label).not.toBe(b.ids.label);
	});

	test("two instances have independent checked state", () => {
		const a = createCheckbox({ checked: true });
		const b = createCheckbox({ checked: false });
		expect(a.checked).toBe(true);
		expect(b.checked).toBe(false);
	});

	test("two instances have independent disabled state", () => {
		const a = createCheckbox({ disabled: true });
		const b = createCheckbox({ disabled: false });
		expect(a.disabled).toBe(true);
		expect(b.disabled).toBe(false);
	});
});
