/**
 * @file builders/switch/Switch.test.ts
 * @package @devpulse/coldlight
 *
 * COMPREHENSIVE — Switch builder integration tests.
 *
 * Tests the COMPLETE builder in a real Chromium DOM:
 *   1. Factory — createSwitch() returns Switch instance, accepts props
 *   2. Root ARIA — role, aria-checked (boolean), aria-disabled, aria-required, data-state, data-cl-switch-root, id, tabindex
 *   3. Thumb slot — aria-hidden, data-state mirrors root
 *   4. Label slot — data-cl-switch-label, data-disabled, click triggers toggle
 *   5. Click behavior — toggle, disabled guard
 *   6. Keyboard — Space toggles, Enter toggles (both per APG), disabled guard
 *   7. Controlled mode — getter for checked, onChange fires
 *   8. toggle() method — programmatic toggle, disabled guard
 *   9. Instance isolation — unique IDs, independent state
 *
 * This is a HEADLESS BUILDER test, not a Svelte component test.
 * We create DOM elements directly and spread builder attrs onto them.
 * This tests the builder API exactly as components will consume it.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 */

import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { Switch, createSwitch } from "./factory.js";
import { resetIdCounter } from "../../builders/builder-metadata.js";

// =============================================================================
// TEST HELPERS
// =============================================================================

/** Create a DOM switch from a builder instance with root, thumb, and label. */
function createDOM(builder: Switch): {
	root: HTMLButtonElement;
	thumb: HTMLSpanElement;
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

	const thumbEl = document.createElement("span");
	const thumbAttrs = builder.thumb;
	for (const [key, val] of Object.entries(thumbAttrs)) {
		if (val === undefined) continue;
		if (typeof val === "function") continue;
		if (typeof val === "boolean") {
			if (val) thumbEl.setAttribute(key, "");
			continue;
		}
		thumbEl.setAttribute(key, String(val));
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
	labelEl.textContent = "Toggle me";

	rootEl.appendChild(thumbEl);
	document.body.appendChild(rootEl);
	document.body.appendChild(labelEl);

	return { root: rootEl, thumb: thumbEl, label: labelEl };
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

describe("createSwitch — factory", () => {
	test("returns a Switch instance", () => {
		const builder = createSwitch();
		expect(builder).toBeInstanceOf(Switch);
	});

	test("accepts props", () => {
		const builder = createSwitch({ disabled: true });
		expect(builder.disabled).toBe(true);
	});

	test("defaults checked to false", () => {
		const builder = createSwitch();
		expect(builder.checked).toBe(false);
	});

	test("defaults disabled to false", () => {
		const builder = createSwitch();
		expect(builder.disabled).toBe(false);
	});

	test("accepts initial checked: true", () => {
		const builder = createSwitch({ checked: true });
		expect(builder.checked).toBe(true);
	});
});

// =============================================================================
// ROOT ELEMENT — ARIA
// =============================================================================

describe("Switch — root ARIA attributes", () => {
	test("root has role='switch'", () => {
		const builder = createSwitch();
		expect(builder.root.role).toBe("switch");
	});

	test("root has type='button'", () => {
		const builder = createSwitch();
		expect(builder.root.type).toBe("button");
	});

	test("root has data-cl-switch-root attribute", () => {
		const builder = createSwitch();
		expect(builder.root["data-cl-switch-root"]).toBe("");
	});

	test("root has unique id", () => {
		const builder = createSwitch();
		expect(builder.root.id).toMatch(/^cl-\d+$/);
	});

	test("root has tabindex=0", () => {
		const builder = createSwitch();
		expect(builder.root.tabindex).toBe(0);
	});

	test("root aria-checked is boolean false when unchecked", () => {
		const builder = createSwitch();
		expect(builder.root["aria-checked"]).toBe(false);
	});

	test("root aria-checked is boolean true when checked", () => {
		const builder = createSwitch({ checked: true });
		expect(builder.root["aria-checked"]).toBe(true);
	});

	test("root aria-checked is boolean (not string)", () => {
		const builder = createSwitch({ checked: true });
		expect(typeof builder.root["aria-checked"]).toBe("boolean");
	});

	test("root aria-disabled absent when not disabled", () => {
		const builder = createSwitch();
		expect(builder.root["aria-disabled"]).toBeUndefined();
	});

	test("root aria-disabled present when disabled", () => {
		const builder = createSwitch({ disabled: true });
		expect(builder.root["aria-disabled"]).toBe(true);
	});

	test("root aria-required absent when not required", () => {
		const builder = createSwitch();
		expect(builder.root["aria-required"]).toBeUndefined();
	});

	test("root aria-required present when required", () => {
		const builder = createSwitch({ required: true });
		expect(builder.root["aria-required"]).toBe(true);
	});

	test("root data-state is 'unchecked' when unchecked", () => {
		const builder = createSwitch();
		expect(builder.root["data-state"]).toBe("unchecked");
	});

	test("root data-state is 'checked' when checked", () => {
		const builder = createSwitch({ checked: true });
		expect(builder.root["data-state"]).toBe("checked");
	});

	test("root data-disabled absent when not disabled", () => {
		const builder = createSwitch();
		expect(builder.root["data-disabled"]).toBeUndefined();
	});

	test("root data-disabled present when disabled", () => {
		const builder = createSwitch({ disabled: true });
		expect(builder.root["data-disabled"]).toBe("");
	});

	test("root has onclick handler", () => {
		const builder = createSwitch();
		expect(typeof builder.root.onclick).toBe("function");
	});

	test("root has onkeydown handler", () => {
		const builder = createSwitch();
		expect(typeof builder.root.onkeydown).toBe("function");
	});
});

// =============================================================================
// THUMB SLOT — ARIA
// =============================================================================

describe("Switch — thumb slot", () => {
	test("thumb has aria-hidden='true'", () => {
		const builder = createSwitch();
		expect(builder.thumb["aria-hidden"]).toBe("true");
	});

	test("thumb has data-cl-switch-thumb attribute", () => {
		const builder = createSwitch();
		expect(builder.thumb["data-cl-switch-thumb"]).toBe("");
	});

	test("thumb has unique id", () => {
		const builder = createSwitch();
		expect(builder.thumb.id).toMatch(/^cl-\d+$/);
	});

	test("thumb data-state mirrors root when unchecked", () => {
		const builder = createSwitch();
		expect(builder.thumb["data-state"]).toBe("unchecked");
		expect(builder.root["data-state"]).toBe("unchecked");
	});

	test("thumb data-state mirrors root when checked", () => {
		const builder = createSwitch({ checked: true });
		expect(builder.thumb["data-state"]).toBe("checked");
		expect(builder.root["data-state"]).toBe("checked");
	});
});

// =============================================================================
// LABEL SLOT
// =============================================================================

describe("Switch — label slot", () => {
	test("label has data-cl-switch-label attribute", () => {
		const builder = createSwitch();
		expect(builder.label["data-cl-switch-label"]).toBe("");
	});

	test("label has unique id", () => {
		const builder = createSwitch();
		expect(builder.label.id).toMatch(/^cl-\d+$/);
	});

	test("label data-disabled absent when not disabled", () => {
		const builder = createSwitch();
		expect(builder.label["data-disabled"]).toBeUndefined();
	});

	test("label data-disabled present when disabled", () => {
		const builder = createSwitch({ disabled: true });
		expect(builder.label["data-disabled"]).toBe("");
	});

	test("label has onclick handler", () => {
		const builder = createSwitch();
		expect(typeof builder.label.onclick).toBe("function");
	});

	test("label click triggers toggle", () => {
		const onChange = vi.fn();
		const builder = createSwitch({ onCheckedChange: onChange });
		const { root, label } = createDOM(builder);
		cleanupEls.push(root, label);

		label.click();
		expect(onChange).toHaveBeenCalledWith(true);
	});

	test("label click on disabled does nothing", () => {
		const onChange = vi.fn();
		const builder = createSwitch({ disabled: true, onCheckedChange: onChange });
		const { root, label } = createDOM(builder);
		cleanupEls.push(root, label);

		label.click();
		expect(onChange).not.toHaveBeenCalled();
	});
});

// =============================================================================
// CLICK BEHAVIOR
// =============================================================================

describe("Switch — click behavior", () => {
	test("click toggles checked from false to true", () => {
		const onChange = vi.fn();
		const builder = createSwitch({ onCheckedChange: onChange });
		const { root, label } = createDOM(builder);
		cleanupEls.push(root, label);

		root.click();
		expect(onChange).toHaveBeenCalledWith(true);
	});

	test("click toggles checked from true to false", () => {
		const onChange = vi.fn();
		const builder = createSwitch({ checked: true, onCheckedChange: onChange });
		const { root, label } = createDOM(builder);
		cleanupEls.push(root, label);

		root.click();
		expect(onChange).toHaveBeenCalledWith(false);
	});

	test("click on disabled switch does nothing", () => {
		const onChange = vi.fn();
		const builder = createSwitch({ disabled: true, onCheckedChange: onChange });
		const { root, label } = createDOM(builder);
		cleanupEls.push(root, label);

		root.click();
		expect(onChange).not.toHaveBeenCalled();
	});
});

// =============================================================================
// KEYBOARD — Space and Enter (Switch accepts BOTH)
// =============================================================================

describe("Switch — keyboard", () => {
	test("Space toggles checked from false to true", () => {
		const onChange = vi.fn();
		const builder = createSwitch({ onCheckedChange: onChange });
		const { root, label } = createDOM(builder);
		cleanupEls.push(root, label);

		root.focus();
		pressKey(root, " ");
		expect(onChange).toHaveBeenCalledWith(true);
	});

	test("Space toggles checked from true to false", () => {
		const onChange = vi.fn();
		const builder = createSwitch({ checked: true, onCheckedChange: onChange });
		const { root, label } = createDOM(builder);
		cleanupEls.push(root, label);

		root.focus();
		pressKey(root, " ");
		expect(onChange).toHaveBeenCalledWith(false);
	});

	test("Enter toggles checked from false to true", () => {
		const onChange = vi.fn();
		const builder = createSwitch({ onCheckedChange: onChange });
		const { root, label } = createDOM(builder);
		cleanupEls.push(root, label);

		root.focus();
		pressKey(root, "Enter");
		expect(onChange).toHaveBeenCalledWith(true);
	});

	test("Enter toggles checked from true to false", () => {
		const onChange = vi.fn();
		const builder = createSwitch({ checked: true, onCheckedChange: onChange });
		const { root, label } = createDOM(builder);
		cleanupEls.push(root, label);

		root.focus();
		pressKey(root, "Enter");
		expect(onChange).toHaveBeenCalledWith(false);
	});

	test("Space on disabled switch does nothing", () => {
		const onChange = vi.fn();
		const builder = createSwitch({ disabled: true, onCheckedChange: onChange });
		const { root, label } = createDOM(builder);
		cleanupEls.push(root, label);

		root.focus();
		pressKey(root, " ");
		expect(onChange).not.toHaveBeenCalled();
	});

	test("Enter on disabled switch does nothing", () => {
		const onChange = vi.fn();
		const builder = createSwitch({ disabled: true, onCheckedChange: onChange });
		const { root, label } = createDOM(builder);
		cleanupEls.push(root, label);

		root.focus();
		pressKey(root, "Enter");
		expect(onChange).not.toHaveBeenCalled();
	});

	test("unrecognized key does not toggle", () => {
		const onChange = vi.fn();
		const builder = createSwitch({ onCheckedChange: onChange });
		const { root, label } = createDOM(builder);
		cleanupEls.push(root, label);

		root.focus();
		pressKey(root, "Tab");
		expect(onChange).not.toHaveBeenCalled();
	});
});

// =============================================================================
// CONTROLLED MODE
// =============================================================================

describe("Switch — controlled mode", () => {
	test("reads checked from getter", () => {
		let external = false;
		const builder = createSwitch({
			checked: () => external,
		});
		expect(builder.checked).toBe(false);
		external = true;
		expect(builder.checked).toBe(true);
	});

	test("controlled: aria-checked reflects getter value", () => {
		let external = false;
		const builder = createSwitch({
			checked: () => external,
		});
		expect(builder.root["aria-checked"]).toBe(false);
		external = true;
		expect(builder.root["aria-checked"]).toBe(true);
	});

	test("controlled: data-state reflects getter value", () => {
		let external = false;
		const builder = createSwitch({
			checked: () => external,
		});
		expect(builder.root["data-state"]).toBe("unchecked");
		external = true;
		expect(builder.root["data-state"]).toBe("checked");
	});

	test("controlled: onChange fires on click", () => {
		const onChange = vi.fn();
		const builder = createSwitch({
			checked: () => false,
			onCheckedChange: onChange,
		});
		const { root, label } = createDOM(builder);
		cleanupEls.push(root, label);

		root.click();
		expect(onChange).toHaveBeenCalledWith(true);
	});

	test("controlled disabled from getter", () => {
		let disabled = false;
		const builder = createSwitch({
			disabled: () => disabled,
		});
		expect(builder.disabled).toBe(false);
		disabled = true;
		expect(builder.disabled).toBe(true);
	});

	test("controlled required from getter", () => {
		let required = false;
		const builder = createSwitch({
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

describe("Switch — toggle() method", () => {
	test("programmatic toggle changes checked state", () => {
		const onChange = vi.fn();
		const builder = createSwitch({ onCheckedChange: onChange });
		builder.toggle();
		expect(onChange).toHaveBeenCalledWith(true);
	});

	test("programmatic toggle from true to false", () => {
		const onChange = vi.fn();
		const builder = createSwitch({ checked: true, onCheckedChange: onChange });
		builder.toggle();
		expect(onChange).toHaveBeenCalledWith(false);
	});

	test("toggle on disabled does nothing", () => {
		const onChange = vi.fn();
		const builder = createSwitch({ disabled: true, onCheckedChange: onChange });
		builder.toggle();
		expect(onChange).not.toHaveBeenCalled();
	});
});

// =============================================================================
// INSTANCE ISOLATION
// =============================================================================

describe("Switch — instance isolation", () => {
	test("two instances have different root IDs", () => {
		const a = createSwitch();
		const b = createSwitch();
		expect(a.ids.root).not.toBe(b.ids.root);
	});

	test("two instances have different thumb IDs", () => {
		const a = createSwitch();
		const b = createSwitch();
		expect(a.ids.thumb).not.toBe(b.ids.thumb);
	});

	test("two instances have different label IDs", () => {
		const a = createSwitch();
		const b = createSwitch();
		expect(a.ids.label).not.toBe(b.ids.label);
	});

	test("two instances have independent checked state", () => {
		const a = createSwitch({ checked: true });
		const b = createSwitch({ checked: false });
		expect(a.checked).toBe(true);
		expect(b.checked).toBe(false);
	});

	test("two instances have independent disabled state", () => {
		const a = createSwitch({ disabled: true });
		const b = createSwitch({ disabled: false });
		expect(a.disabled).toBe(true);
		expect(b.disabled).toBe(false);
	});
});
