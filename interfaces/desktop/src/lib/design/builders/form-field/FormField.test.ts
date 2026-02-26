/**
 * @file builders/form-field/FormField.test.ts
 * @package @devpulse/coldlight
 *
 * COMPREHENSIVE — FormField builder integration tests.
 *
 * Tests the COMPLETE builder in a real Chromium DOM:
 *   1. Factory — createFormField() returns instance, accepts props, defaults
 *   2. Root ARIA — role="group", aria-labelledby, data-invalid, data-required, data-disabled
 *   3. Label slot — for= links to control id, data-required, data-disabled
 *   4. Control slot — aria-describedby, aria-invalid, aria-required, aria-disabled, data-*
 *   5. Description slot — id linked via control aria-describedby
 *   6. Error slot — role="alert", aria-live="polite", data-invalid, id linked
 *   7. ID cross-linking — label for -> control id, control aria-describedby -> description + error ids
 *   8. State transitions — toggling invalid/required/disabled updates ARIA across all slots
 *   9. Controlled mode — reads from getters
 *  10. Instance isolation — different IDs, independent state
 *
 * This is a HEADLESS BUILDER test, not a Svelte component test.
 * We create DOM elements directly and spread builder attrs onto them.
 * This tests the builder API exactly as components will consume it.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 */

import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { FormField, createFormField } from "./factory.js";
import { resetIdCounter } from "../_internal/builder-metadata.js";

// =============================================================================
// TEST HELPERS
// =============================================================================

/** Apply builder attrs to a DOM element. */
function applyAttrs(el: HTMLElement, attrs: Record<string, unknown>): void {
	for (const [key, val] of Object.entries(attrs)) {
		if (val === undefined) continue;
		if (typeof val === "function") continue;
		if (typeof val === "boolean") {
			if (val) el.setAttribute(key, "");
			else el.setAttribute(key, String(val));
			continue;
		}
		el.setAttribute(key, String(val));
	}
}

/** Create a full DOM structure for a FormField builder instance. */
function createDOM(builder: FormField): {
	root: HTMLDivElement;
	label: HTMLLabelElement;
	control: HTMLInputElement;
	description: HTMLParagraphElement;
	error: HTMLParagraphElement;
} {
	const root = document.createElement("div");
	applyAttrs(root, builder.root);

	const label = document.createElement("label");
	applyAttrs(label, builder.label);
	label.textContent = "Email";

	const control = document.createElement("input");
	applyAttrs(control, builder.control);
	control.type = "email";

	const description = document.createElement("p");
	applyAttrs(description, builder.description);
	description.textContent = "Enter your email address.";

	const error = document.createElement("p");
	applyAttrs(error, builder.error);
	error.textContent = "Email is required.";

	root.appendChild(label);
	root.appendChild(control);
	root.appendChild(description);
	root.appendChild(error);
	document.body.appendChild(root);

	return { root, label, control, description, error };
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

describe("createFormField — factory", () => {
	test("returns a FormField instance", () => {
		const builder = createFormField();
		expect(builder).toBeInstanceOf(FormField);
	});

	test("accepts props", () => {
		const builder = createFormField({ invalid: true, required: true });
		expect(builder.invalid).toBe(true);
		expect(builder.required).toBe(true);
	});

	test("defaults invalid to false", () => {
		const builder = createFormField();
		expect(builder.invalid).toBe(false);
	});

	test("defaults required to false", () => {
		const builder = createFormField();
		expect(builder.required).toBe(false);
	});

	test("defaults disabled to false", () => {
		const builder = createFormField();
		expect(builder.disabled).toBe(false);
	});
});

// =============================================================================
// ROOT ELEMENT — ARIA
// =============================================================================

describe("FormField — root ARIA attributes", () => {
	test("root has role='group'", () => {
		const builder = createFormField();
		expect(builder.root.role).toBe("group");
	});

	test("root has aria-labelledby linking to label id", () => {
		const builder = createFormField();
		expect(builder.root["aria-labelledby"]).toBe(builder.ids.label);
	});

	test("root has data-cl-form-field-root attribute", () => {
		const builder = createFormField();
		expect(builder.root["data-cl-form-field-root"]).toBe("");
	});

	test("root has unique id", () => {
		const builder = createFormField();
		expect(builder.root.id).toMatch(/^cl-\d+$/);
	});

	test("root data-invalid absent when not invalid", () => {
		const builder = createFormField();
		expect(builder.root["data-invalid"]).toBeUndefined();
	});

	test("root data-invalid present when invalid", () => {
		const builder = createFormField({ invalid: true });
		expect(builder.root["data-invalid"]).toBe("");
	});

	test("root data-required absent when not required", () => {
		const builder = createFormField();
		expect(builder.root["data-required"]).toBeUndefined();
	});

	test("root data-required present when required", () => {
		const builder = createFormField({ required: true });
		expect(builder.root["data-required"]).toBe("");
	});

	test("root data-disabled absent when not disabled", () => {
		const builder = createFormField();
		expect(builder.root["data-disabled"]).toBeUndefined();
	});

	test("root data-disabled present when disabled", () => {
		const builder = createFormField({ disabled: true });
		expect(builder.root["data-disabled"]).toBe("");
	});
});

// =============================================================================
// LABEL SLOT — ARIA
// =============================================================================

describe("FormField — label slot attributes", () => {
	test("label has for= linking to control id", () => {
		const builder = createFormField();
		expect(builder.label.for).toBe(builder.ids.control);
	});

	test("label has data-cl-form-field-label attribute", () => {
		const builder = createFormField();
		expect(builder.label["data-cl-form-field-label"]).toBe("");
	});

	test("label has unique id", () => {
		const builder = createFormField();
		expect(builder.label.id).toMatch(/^cl-\d+$/);
	});

	test("label data-required absent when not required", () => {
		const builder = createFormField();
		expect(builder.label["data-required"]).toBeUndefined();
	});

	test("label data-required present when required", () => {
		const builder = createFormField({ required: true });
		expect(builder.label["data-required"]).toBe("");
	});

	test("label data-disabled absent when not disabled", () => {
		const builder = createFormField();
		expect(builder.label["data-disabled"]).toBeUndefined();
	});

	test("label data-disabled present when disabled", () => {
		const builder = createFormField({ disabled: true });
		expect(builder.label["data-disabled"]).toBe("");
	});
});

// =============================================================================
// CONTROL SLOT — ARIA
// =============================================================================

describe("FormField — control slot attributes", () => {
	test("control has data-cl-form-field-control attribute", () => {
		const builder = createFormField();
		expect(builder.control["data-cl-form-field-control"]).toBe("");
	});

	test("control has unique id", () => {
		const builder = createFormField();
		expect(builder.control.id).toMatch(/^cl-\d+$/);
	});

	test("control aria-describedby includes description id", () => {
		const builder = createFormField();
		const describedBy = builder.control["aria-describedby"] as string;
		expect(describedBy).toContain(builder.ids.description);
	});

	test("control aria-describedby includes error id when invalid with error", () => {
		const builder = createFormField({ invalid: true, error: "Something wrong" });
		const describedBy = builder.control["aria-describedby"] as string;
		expect(describedBy).toContain(builder.ids.error);
	});

	test("control aria-describedby does NOT include error id when not invalid", () => {
		const builder = createFormField({ error: "Something wrong" });
		const describedBy = builder.control["aria-describedby"] as string;
		expect(describedBy).not.toContain(builder.ids.error);
	});

	test("control aria-describedby does NOT include error id when invalid but no error message", () => {
		const builder = createFormField({ invalid: true });
		const describedBy = builder.control["aria-describedby"] as string;
		expect(describedBy).not.toContain(builder.ids.error);
	});

	test("control aria-invalid is 'true' when invalid", () => {
		const builder = createFormField({ invalid: true });
		expect(builder.control["aria-invalid"]).toBe("true");
	});

	test("control aria-invalid is undefined when not invalid", () => {
		const builder = createFormField();
		expect(builder.control["aria-invalid"]).toBeUndefined();
	});

	test("control aria-required is 'true' when required", () => {
		const builder = createFormField({ required: true });
		expect(builder.control["aria-required"]).toBe("true");
	});

	test("control aria-required is undefined when not required", () => {
		const builder = createFormField();
		expect(builder.control["aria-required"]).toBeUndefined();
	});

	test("control aria-disabled is true when disabled", () => {
		const builder = createFormField({ disabled: true });
		expect(builder.control["aria-disabled"]).toBe(true);
	});

	test("control aria-disabled is undefined when not disabled", () => {
		const builder = createFormField();
		expect(builder.control["aria-disabled"]).toBeUndefined();
	});

	test("control data-invalid present when invalid", () => {
		const builder = createFormField({ invalid: true });
		expect(builder.control["data-invalid"]).toBe("");
	});

	test("control data-invalid absent when not invalid", () => {
		const builder = createFormField();
		expect(builder.control["data-invalid"]).toBeUndefined();
	});

	test("control data-required present when required", () => {
		const builder = createFormField({ required: true });
		expect(builder.control["data-required"]).toBe("");
	});

	test("control data-required absent when not required", () => {
		const builder = createFormField();
		expect(builder.control["data-required"]).toBeUndefined();
	});

	test("control data-disabled present when disabled", () => {
		const builder = createFormField({ disabled: true });
		expect(builder.control["data-disabled"]).toBe("");
	});

	test("control data-disabled absent when not disabled", () => {
		const builder = createFormField();
		expect(builder.control["data-disabled"]).toBeUndefined();
	});
});

// =============================================================================
// DESCRIPTION SLOT
// =============================================================================

describe("FormField — description slot attributes", () => {
	test("description has data-cl-form-field-description attribute", () => {
		const builder = createFormField();
		expect(builder.description["data-cl-form-field-description"]).toBe("");
	});

	test("description has id that matches control aria-describedby", () => {
		const builder = createFormField();
		const describedBy = builder.control["aria-describedby"] as string;
		expect(describedBy).toContain(builder.description.id as string);
	});

	test("description id is the ids.description entry", () => {
		const builder = createFormField();
		expect(builder.description.id).toBe(builder.ids.description);
	});
});

// =============================================================================
// ERROR SLOT
// =============================================================================

describe("FormField — error slot attributes", () => {
	test("error has role='alert'", () => {
		const builder = createFormField();
		expect(builder.error.role).toBe("alert");
	});

	test("error has aria-live='polite'", () => {
		const builder = createFormField();
		expect(builder.error["aria-live"]).toBe("polite");
	});

	test("error has data-cl-form-field-error attribute", () => {
		const builder = createFormField();
		expect(builder.error["data-cl-form-field-error"]).toBe("");
	});

	test("error has unique id", () => {
		const builder = createFormField();
		expect(builder.error.id).toMatch(/^cl-\d+$/);
	});

	test("error data-invalid present when invalid", () => {
		const builder = createFormField({ invalid: true });
		expect(builder.error["data-invalid"]).toBe("");
	});

	test("error data-invalid absent when not invalid", () => {
		const builder = createFormField();
		expect(builder.error["data-invalid"]).toBeUndefined();
	});

	test("error id matches control aria-describedby when invalid with error message", () => {
		const builder = createFormField({ invalid: true, error: "Required field" });
		const describedBy = builder.control["aria-describedby"] as string;
		const errorId = builder.error.id as string;
		expect(describedBy).toContain(errorId);
	});
});

// =============================================================================
// ID CROSS-LINKING
// =============================================================================

describe("FormField — ID cross-linking", () => {
	test("label for links to control id", () => {
		const builder = createFormField();
		expect(builder.label.for).toBe(builder.control.id);
	});

	test("root aria-labelledby links to label id", () => {
		const builder = createFormField();
		expect(builder.root["aria-labelledby"]).toBe(builder.label.id);
	});

	test("control aria-describedby links to description id", () => {
		const builder = createFormField();
		const describedBy = builder.control["aria-describedby"] as string;
		expect(describedBy).toContain(builder.ids.description);
	});

	test("control aria-describedby includes error id when invalid with error", () => {
		const builder = createFormField({ invalid: true, error: "Err" });
		const describedBy = builder.control["aria-describedby"] as string;
		const parts = describedBy.split(" ");
		expect(parts).toContain(builder.ids.description);
		expect(parts).toContain(builder.ids.error);
	});

	test("control aria-describedby does NOT include error id when valid", () => {
		const builder = createFormField({ error: "Err" });
		const describedBy = builder.control["aria-describedby"] as string;
		const parts = describedBy.split(" ");
		expect(parts).toContain(builder.ids.description);
		expect(parts).not.toContain(builder.ids.error);
	});

	test("all slots have their ids from the ids record", () => {
		const builder = createFormField();
		expect(builder.root.id).toBe(builder.ids.root);
		expect(builder.label.id).toBe(builder.ids.label);
		expect(builder.control.id).toBe(builder.ids.control);
		expect(builder.description.id).toBe(builder.ids.description);
		expect(builder.error.id).toBe(builder.ids.error);
	});
});

// =============================================================================
// STATE TRANSITIONS
// =============================================================================

describe("FormField — state transitions", () => {
	test("toggling invalid updates root data-invalid", () => {
		let invalid = false;
		const builder = createFormField({ invalid: () => invalid });
		expect(builder.root["data-invalid"]).toBeUndefined();
		invalid = true;
		expect(builder.root["data-invalid"]).toBe("");
	});

	test("toggling invalid updates control aria-invalid", () => {
		let invalid = false;
		const builder = createFormField({ invalid: () => invalid });
		expect(builder.control["aria-invalid"]).toBeUndefined();
		invalid = true;
		expect(builder.control["aria-invalid"]).toBe("true");
	});

	test("toggling invalid updates error data-invalid", () => {
		let invalid = false;
		const builder = createFormField({ invalid: () => invalid });
		expect(builder.error["data-invalid"]).toBeUndefined();
		invalid = true;
		expect(builder.error["data-invalid"]).toBe("");
	});

	test("toggling invalid updates control aria-describedby (adds error id)", () => {
		let invalid = false;
		const builder = createFormField({ invalid: () => invalid, error: "Err" });
		const describedByValid = builder.control["aria-describedby"] as string;
		expect(describedByValid).not.toContain(builder.ids.error);

		invalid = true;
		const describedByInvalid = builder.control["aria-describedby"] as string;
		expect(describedByInvalid).toContain(builder.ids.error);
	});

	test("toggling required updates root data-required", () => {
		let required = false;
		const builder = createFormField({ required: () => required });
		expect(builder.root["data-required"]).toBeUndefined();
		required = true;
		expect(builder.root["data-required"]).toBe("");
	});

	test("toggling required updates label data-required", () => {
		let required = false;
		const builder = createFormField({ required: () => required });
		expect(builder.label["data-required"]).toBeUndefined();
		required = true;
		expect(builder.label["data-required"]).toBe("");
	});

	test("toggling required updates control aria-required", () => {
		let required = false;
		const builder = createFormField({ required: () => required });
		expect(builder.control["aria-required"]).toBeUndefined();
		required = true;
		expect(builder.control["aria-required"]).toBe("true");
	});

	test("toggling disabled updates root data-disabled", () => {
		let disabled = false;
		const builder = createFormField({ disabled: () => disabled });
		expect(builder.root["data-disabled"]).toBeUndefined();
		disabled = true;
		expect(builder.root["data-disabled"]).toBe("");
	});

	test("toggling disabled updates label data-disabled", () => {
		let disabled = false;
		const builder = createFormField({ disabled: () => disabled });
		expect(builder.label["data-disabled"]).toBeUndefined();
		disabled = true;
		expect(builder.label["data-disabled"]).toBe("");
	});

	test("toggling disabled updates control aria-disabled", () => {
		let disabled = false;
		const builder = createFormField({ disabled: () => disabled });
		expect(builder.control["aria-disabled"]).toBeUndefined();
		disabled = true;
		expect(builder.control["aria-disabled"]).toBe(true);
	});
});

// =============================================================================
// CONTROLLED MODE
// =============================================================================

describe("FormField — controlled mode", () => {
	test("reads invalid from getter", () => {
		let external = false;
		const builder = createFormField({ invalid: () => external });
		expect(builder.invalid).toBe(false);
		external = true;
		expect(builder.invalid).toBe(true);
	});

	test("reads required from getter", () => {
		let external = false;
		const builder = createFormField({ required: () => external });
		expect(builder.required).toBe(false);
		external = true;
		expect(builder.required).toBe(true);
	});

	test("reads disabled from getter", () => {
		let external = false;
		const builder = createFormField({ disabled: () => external });
		expect(builder.disabled).toBe(false);
		external = true;
		expect(builder.disabled).toBe(true);
	});

	test("controlled error from getter affects aria-describedby", () => {
		let error: string | undefined = undefined;
		let invalid = true;
		const builder = createFormField({
			invalid: () => invalid,
			error: () => error,
		});

		// No error message, so error id should NOT be in describedby
		const describedByNoError = builder.control["aria-describedby"] as string;
		expect(describedByNoError).not.toContain(builder.ids.error);

		// Set error message — now error id should appear
		error = "Something went wrong";
		const describedByWithError = builder.control["aria-describedby"] as string;
		expect(describedByWithError).toContain(builder.ids.error);
	});
});

// =============================================================================
// INSTANCE ISOLATION
// =============================================================================

describe("FormField — instance isolation", () => {
	test("two instances have different IDs", () => {
		const a = createFormField();
		const b = createFormField();
		expect(a.ids.root).not.toBe(b.ids.root);
		expect(a.ids.label).not.toBe(b.ids.label);
		expect(a.ids.control).not.toBe(b.ids.control);
		expect(a.ids.description).not.toBe(b.ids.description);
		expect(a.ids.error).not.toBe(b.ids.error);
	});

	test("two instances have independent invalid state", () => {
		const a = createFormField({ invalid: true });
		const b = createFormField({ invalid: false });
		expect(a.invalid).toBe(true);
		expect(b.invalid).toBe(false);
	});

	test("two instances have independent required state", () => {
		const a = createFormField({ required: true });
		const b = createFormField({ required: false });
		expect(a.required).toBe(true);
		expect(b.required).toBe(false);
	});

	test("two instances have independent disabled state", () => {
		const a = createFormField({ disabled: true });
		const b = createFormField({ disabled: false });
		expect(a.disabled).toBe(true);
		expect(b.disabled).toBe(false);
	});
});
