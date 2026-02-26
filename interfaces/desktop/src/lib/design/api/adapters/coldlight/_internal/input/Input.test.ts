/**
 * @file builders/input/Input.test.ts
 * @package @devpulse/coldlight
 *
 * Input builder integration tests.
 *
 * Tests the COMPLETE builder in a real Chromium DOM:
 *   1. Factory — createInput() returns instance with correct defaults
 *   2. Root ARIA — data-cl-input-root, unique id, aria-invalid, aria-required,
 *      aria-disabled, aria-readonly, aria-errormessage
 *   3. Validation states — data-state reflects valid/invalid, data-disabled,
 *      data-readonly, data-required
 *   4. Value binding — value property, setter, onChange callback
 *   5. Disabled state — aria-disabled, data-disabled, native disabled attr
 *   6. Required state — aria-required, data-required, native required attr
 *   7. Invalid state — aria-invalid, data-invalid
 *   8. Readonly state — aria-readonly, data-readonly, native readonly attr
 *   9. Controlled mode — value/disabled/invalid from getter
 *  10. Instance isolation — unique IDs, independent state
 *
 * This is a HEADLESS BUILDER test, not a Svelte component test.
 * We create DOM elements directly and spread builder attrs onto them.
 * This tests the builder API exactly as components will consume it.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 */

import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { Input, createInput } from "./factory.js";
import { resetIdCounter } from "../../../../../builders/_internal/builder-metadata.js";

// =============================================================================
// TEST HELPERS
// =============================================================================

/** Create a DOM input from a builder instance. */
function createDOM(builder: Input): HTMLInputElement {
	const el = document.createElement("input");
	const attrs = builder.root;
	for (const [key, val] of Object.entries(attrs)) {
		if (val === undefined) continue;
		if (typeof val === "function") {
			// Attach event listeners
			if (key === "oninput") el.addEventListener("input", val as EventListener);
			continue;
		}
		if (typeof val === "boolean") {
			if (val) el.setAttribute(key, "");
			else el.removeAttribute(key);
			continue;
		}
		if (key === "value") {
			el.value = String(val);
			continue;
		}
		el.setAttribute(key, String(val));
	}
	document.body.appendChild(el);
	return el;
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

describe("createInput — factory", () => {
	test("returns an Input instance", () => {
		const builder = createInput();
		expect(builder).toBeInstanceOf(Input);
	});

	test("defaults value to empty string", () => {
		const builder = createInput();
		expect(builder.value).toBe("");
	});

	test("defaults disabled to false", () => {
		const builder = createInput();
		expect(builder.disabled).toBe(false);
	});

	test("defaults readonly to false", () => {
		const builder = createInput();
		expect(builder.readOnly).toBe(false);
	});

	test("defaults required to false", () => {
		const builder = createInput();
		expect(builder.required).toBe(false);
	});

	test("defaults invalid to false", () => {
		const builder = createInput();
		expect(builder.invalid).toBe(false);
	});

	test("accepts initial value prop", () => {
		const builder = createInput({ value: "hello" });
		expect(builder.value).toBe("hello");
	});

	test("accepts disabled prop", () => {
		const builder = createInput({ disabled: true });
		expect(builder.disabled).toBe(true);
	});
});

// =============================================================================
// ROOT ELEMENT — ARIA ATTRIBUTES
// =============================================================================

describe("Input — root ARIA attributes", () => {
	test("root has data-cl-input-root attribute", () => {
		const builder = createInput();
		expect(builder.root["data-cl-input-root"]).toBe("");
	});

	test("root has unique id", () => {
		const builder = createInput();
		expect(builder.root.id).toMatch(/^cl-\d+$/);
	});

	test("root has type='text' by default", () => {
		const builder = createInput();
		expect(builder.root.type).toBe("text");
	});

	test("root respects type prop", () => {
		const builder = createInput({ type: "email" });
		expect(builder.root.type).toBe("email");
	});

	test("root aria-invalid absent when valid", () => {
		const builder = createInput();
		expect(builder.root["aria-invalid"]).toBeUndefined();
	});

	test("root aria-invalid=true when invalid", () => {
		const builder = createInput({ invalid: true });
		expect(builder.root["aria-invalid"]).toBe(true);
	});

	test("root aria-required absent when not required", () => {
		const builder = createInput();
		expect(builder.root["aria-required"]).toBeUndefined();
	});

	test("root aria-required=true when required", () => {
		const builder = createInput({ required: true });
		expect(builder.root["aria-required"]).toBe(true);
	});

	test("root aria-disabled absent when not disabled", () => {
		const builder = createInput();
		expect(builder.root["aria-disabled"]).toBeUndefined();
	});

	test("root aria-disabled=true when disabled", () => {
		const builder = createInput({ disabled: true });
		expect(builder.root["aria-disabled"]).toBe(true);
	});

	test("root aria-readonly absent when not readonly", () => {
		const builder = createInput();
		expect(builder.root["aria-readonly"]).toBeUndefined();
	});

	test("root aria-readonly=true when readonly", () => {
		const builder = createInput({ readonly: true });
		expect(builder.root["aria-readonly"]).toBe(true);
	});

	test("root aria-errormessage absent when valid", () => {
		const builder = createInput({ "aria-errormessage": "err-1" });
		expect(builder.root["aria-errormessage"]).toBeUndefined();
	});

	test("root aria-errormessage present when invalid and provided", () => {
		const builder = createInput({ invalid: true, "aria-errormessage": "err-1" });
		expect(builder.root["aria-errormessage"]).toBe("err-1");
	});

	test("root aria-label forwarded when provided", () => {
		const builder = createInput({ "aria-label": "Search" });
		expect(builder.root["aria-label"]).toBe("Search");
	});

	test("root aria-labelledby forwarded when provided", () => {
		const builder = createInput({ "aria-labelledby": "label-1" });
		expect(builder.root["aria-labelledby"]).toBe("label-1");
	});

	test("root aria-describedby forwarded when provided", () => {
		const builder = createInput({ "aria-describedby": "desc-1" });
		expect(builder.root["aria-describedby"]).toBe("desc-1");
	});

	test("root placeholder forwarded when provided", () => {
		const builder = createInput({ placeholder: "Type here..." });
		expect(builder.root.placeholder).toBe("Type here...");
	});
});

// =============================================================================
// VALIDATION / DATA ATTRIBUTES
// =============================================================================

describe("Input — data attributes (validation states)", () => {
	test("data-valid present when not invalid", () => {
		const builder = createInput();
		expect(builder.root["data-valid"]).toBe("");
	});

	test("data-valid absent when invalid", () => {
		const builder = createInput({ invalid: true });
		expect(builder.root["data-valid"]).toBeUndefined();
	});

	test("data-invalid absent when valid", () => {
		const builder = createInput();
		expect(builder.root["data-invalid"]).toBeUndefined();
	});

	test("data-invalid present when invalid", () => {
		const builder = createInput({ invalid: true });
		expect(builder.root["data-invalid"]).toBe("");
	});

	test("data-disabled absent when not disabled", () => {
		const builder = createInput();
		expect(builder.root["data-disabled"]).toBeUndefined();
	});

	test("data-disabled present when disabled", () => {
		const builder = createInput({ disabled: true });
		expect(builder.root["data-disabled"]).toBe("");
	});

	test("data-readonly absent when not readonly", () => {
		const builder = createInput();
		expect(builder.root["data-readonly"]).toBeUndefined();
	});

	test("data-readonly present when readonly", () => {
		const builder = createInput({ readonly: true });
		expect(builder.root["data-readonly"]).toBe("");
	});

	test("data-required absent when not required", () => {
		const builder = createInput();
		expect(builder.root["data-required"]).toBeUndefined();
	});

	test("data-required present when required", () => {
		const builder = createInput({ required: true });
		expect(builder.root["data-required"]).toBe("");
	});
});

// =============================================================================
// VALUE BINDING
// =============================================================================

describe("Input — value binding", () => {
	test("value property reflects current value", () => {
		const builder = createInput({ value: "hello" });
		expect(builder.value).toBe("hello");
		expect(builder.root.value).toBe("hello");
	});

	test("value setter updates value", () => {
		const builder = createInput({ value: "hello" });
		builder.value = "world";
		expect(builder.value).toBe("world");
	});

	test("onValueChange fires when value changes via setter", () => {
		const onChange = vi.fn();
		const builder = createInput({ onValueChange: onChange });
		builder.value = "test";
		expect(onChange).toHaveBeenCalledWith("test");
	});

	test("clear() resets value to empty string", () => {
		const builder = createInput({ value: "hello" });
		builder.clear();
		expect(builder.value).toBe("");
	});

	test("clear() triggers onValueChange", () => {
		const onChange = vi.fn();
		const builder = createInput({ value: "hello", onValueChange: onChange });
		builder.clear();
		expect(onChange).toHaveBeenCalledWith("");
	});

	test("oninput handler is a function", () => {
		const builder = createInput();
		expect(typeof builder.root.oninput).toBe("function");
	});
});

// =============================================================================
// DISABLED STATE
// =============================================================================

describe("Input — disabled state", () => {
	test("native disabled attr absent when not disabled", () => {
		const builder = createInput();
		expect(builder.root.disabled).toBeUndefined();
	});

	test("native disabled attr present when disabled", () => {
		const builder = createInput({ disabled: true });
		expect(builder.root.disabled).toBe(true);
	});

	test("aria-disabled=true when disabled", () => {
		const builder = createInput({ disabled: true });
		expect(builder.root["aria-disabled"]).toBe(true);
	});

	test("data-disabled present when disabled", () => {
		const builder = createInput({ disabled: true });
		expect(builder.root["data-disabled"]).toBe("");
	});

	test("DOM element has disabled attribute when disabled", () => {
		const builder = createInput({ disabled: true });
		const el = createDOM(builder);
		cleanupEl = el;

		expect(el.hasAttribute("disabled")).toBe(true);
	});
});

// =============================================================================
// REQUIRED STATE
// =============================================================================

describe("Input — required state", () => {
	test("native required attr absent when not required", () => {
		const builder = createInput();
		expect(builder.root.required).toBeUndefined();
	});

	test("native required attr present when required", () => {
		const builder = createInput({ required: true });
		expect(builder.root.required).toBe(true);
	});

	test("aria-required=true when required", () => {
		const builder = createInput({ required: true });
		expect(builder.root["aria-required"]).toBe(true);
	});

	test("data-required present when required", () => {
		const builder = createInput({ required: true });
		expect(builder.root["data-required"]).toBe("");
	});
});

// =============================================================================
// INVALID STATE
// =============================================================================

describe("Input — invalid state", () => {
	test("aria-invalid absent when valid", () => {
		const builder = createInput();
		expect(builder.root["aria-invalid"]).toBeUndefined();
	});

	test("aria-invalid=true when invalid", () => {
		const builder = createInput({ invalid: true });
		expect(builder.root["aria-invalid"]).toBe(true);
	});

	test("data-invalid present when invalid", () => {
		const builder = createInput({ invalid: true });
		expect(builder.root["data-invalid"]).toBe("");
	});

	test("data-valid absent when invalid", () => {
		const builder = createInput({ invalid: true });
		expect(builder.root["data-valid"]).toBeUndefined();
	});

	test("aria-errormessage present only when invalid", () => {
		const builder = createInput({ invalid: true, "aria-errormessage": "err-msg" });
		expect(builder.root["aria-errormessage"]).toBe("err-msg");
	});

	test("aria-errormessage absent when valid even if prop set", () => {
		const builder = createInput({ invalid: false, "aria-errormessage": "err-msg" });
		expect(builder.root["aria-errormessage"]).toBeUndefined();
	});
});

// =============================================================================
// READONLY STATE
// =============================================================================

describe("Input — readonly state", () => {
	test("native readonly attr absent when not readonly", () => {
		const builder = createInput();
		expect(builder.root.readonly).toBeUndefined();
	});

	test("native readonly attr present when readonly", () => {
		const builder = createInput({ readonly: true });
		expect(builder.root.readonly).toBe(true);
	});

	test("aria-readonly=true when readonly", () => {
		const builder = createInput({ readonly: true });
		expect(builder.root["aria-readonly"]).toBe(true);
	});

	test("data-readonly present when readonly", () => {
		const builder = createInput({ readonly: true });
		expect(builder.root["data-readonly"]).toBe("");
	});
});

// =============================================================================
// CONTROLLED MODE
// =============================================================================

describe("Input — controlled mode", () => {
	test("value from getter", () => {
		let external = "hello";
		const builder = createInput({
			value: () => external,
		});
		expect(builder.value).toBe("hello");

		external = "world";
		expect(builder.value).toBe("world");
	});

	test("disabled from getter", () => {
		let disabled = false;
		const builder = createInput({
			disabled: () => disabled,
		});
		expect(builder.disabled).toBe(false);
		expect(builder.root["aria-disabled"]).toBeUndefined();

		disabled = true;
		expect(builder.disabled).toBe(true);
		expect(builder.root["aria-disabled"]).toBe(true);
	});

	test("invalid from getter", () => {
		let invalid = false;
		const builder = createInput({
			invalid: () => invalid,
		});
		expect(builder.invalid).toBe(false);
		expect(builder.root["aria-invalid"]).toBeUndefined();

		invalid = true;
		expect(builder.invalid).toBe(true);
		expect(builder.root["aria-invalid"]).toBe(true);
	});

	test("required from getter", () => {
		let required = false;
		const builder = createInput({
			required: () => required,
		});
		expect(builder.required).toBe(false);

		required = true;
		expect(builder.required).toBe(true);
		expect(builder.root["aria-required"]).toBe(true);
	});

	test("readonly from getter", () => {
		let readOnly = false;
		const builder = createInput({
			readonly: () => readOnly,
		});
		expect(builder.readOnly).toBe(false);

		readOnly = true;
		expect(builder.readOnly).toBe(true);
		expect(builder.root["aria-readonly"]).toBe(true);
	});

	test("type from getter", () => {
		let type = "text";
		const builder = createInput({
			type: () => type,
		});
		expect(builder.root.type).toBe("text");

		type = "password";
		expect(builder.root.type).toBe("password");
	});

	test("controlled invalid toggle switches aria-errormessage", () => {
		let invalid = false;
		const builder = createInput({
			invalid: () => invalid,
			"aria-errormessage": "err-id",
		});

		expect(builder.root["aria-errormessage"]).toBeUndefined();

		invalid = true;
		expect(builder.root["aria-errormessage"]).toBe("err-id");

		invalid = false;
		expect(builder.root["aria-errormessage"]).toBeUndefined();
	});
});

// =============================================================================
// INSTANCE ISOLATION
// =============================================================================

describe("Input — instance isolation", () => {
	test("two instances have different IDs", () => {
		const a = createInput();
		const b = createInput();
		expect(a.ids.root).not.toBe(b.ids.root);
	});

	test("two instances have independent value state", () => {
		const a = createInput({ value: "alpha" });
		const b = createInput({ value: "beta" });
		expect(a.value).toBe("alpha");
		expect(b.value).toBe("beta");
	});

	test("two instances have independent disabled state", () => {
		const a = createInput({ disabled: true });
		const b = createInput({ disabled: false });
		expect(a.disabled).toBe(true);
		expect(b.disabled).toBe(false);
	});

	test("two instances have independent invalid state", () => {
		const a = createInput({ invalid: true });
		const b = createInput({ invalid: false });
		expect(a.invalid).toBe(true);
		expect(b.invalid).toBe(false);
		expect(a.root["aria-invalid"]).toBe(true);
		expect(b.root["aria-invalid"]).toBeUndefined();
	});

	test("IDs follow predictable pattern after reset", () => {
		const a = createInput();
		expect(a.ids.root).toBe("cl-0");
		const b = createInput();
		expect(b.ids.root).toBe("cl-1");
	});
});
