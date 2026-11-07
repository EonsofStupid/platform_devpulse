/**
 * @file builders/search-input/SearchInput.test.ts
 * @package @devpulse/coldlight
 *
 * GOLD STANDARD — SearchInput builder integration tests.
 *
 * Tests the COMPLETE builder in a real Chromium DOM:
 *   1. Factory — createSearchInput() returns instance, accepts props, defaults
 *   2. Root ARIA — role="search", aria-label, data-cl-search-input-root, data-has-value
 *   3. Input ARIA — role="searchbox", type="search", aria-label, aria-disabled, placeholder
 *   4. Icon slot — aria-hidden="true"
 *   5. Clear slot — aria-label, aria-disabled, data-visible, tabindex
 *   6. Keyboard — Escape clears value, disabled skips
 *   7. clearValue() — clears value, fires onClear callback
 *   8. hasValue — computed getter tracks emptiness
 *   9. Controlled mode — value from getter, disabled from getter
 *  10. Instance isolation — different IDs
 *
 * This is a HEADLESS BUILDER test, not a Svelte component test.
 * We create DOM elements directly and spread builder attrs onto them.
 * This tests the builder API exactly as components will consume it.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 */

import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { SearchInput, createSearchInput } from "./factory.js";
import { resetIdCounter } from "../../builders/builder-metadata.js";

// =============================================================================
// TEST HELPERS
// =============================================================================

/** Create a DOM search-input from a builder instance. */
function createDOM(builder: SearchInput): {
	root: HTMLElement;
	input: HTMLInputElement;
	icon: HTMLElement;
	clearBtn: HTMLButtonElement;
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

	// Icon element (decorative)
	const iconEl = document.createElement("span");
	const iconAttrs = builder.icon;
	for (const [key, val] of Object.entries(iconAttrs)) {
		if (val === undefined) continue;
		if (typeof val === "function") continue;
		if (typeof val === "boolean") {
			if (val) iconEl.setAttribute(key, "");
			continue;
		}
		iconEl.setAttribute(key, String(val));
	}
	rootEl.appendChild(iconEl);

	// Clear button
	const clearBtn = document.createElement("button") as HTMLButtonElement;
	const clearAttrs = builder.clear;
	for (const [key, val] of Object.entries(clearAttrs)) {
		if (val === undefined) continue;
		if (typeof val === "function") {
			if (key === "onclick") clearBtn.addEventListener("click", val as EventListener);
			continue;
		}
		if (typeof val === "boolean") {
			if (val) clearBtn.setAttribute(key, "");
			else clearBtn.removeAttribute(key);
			continue;
		}
		clearBtn.setAttribute(key, String(val));
	}
	clearBtn.textContent = "x";
	rootEl.appendChild(clearBtn);

	document.body.appendChild(rootEl);
	return { root: rootEl, input: inputEl, icon: iconEl, clearBtn };
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

describe("createSearchInput — factory", () => {
	test("returns a SearchInput instance", () => {
		const builder = createSearchInput();
		expect(builder).toBeInstanceOf(SearchInput);
	});

	test("accepts props", () => {
		const builder = createSearchInput({ disabled: true });
		expect(builder.disabled).toBe(true);
	});

	test("defaults value to empty string", () => {
		const builder = createSearchInput();
		expect(builder.value).toBe("");
	});

	test("accepts initial value", () => {
		const builder = createSearchInput({ value: "hello" });
		expect(builder.value).toBe("hello");
	});
});

// =============================================================================
// ROOT ELEMENT — ARIA
// =============================================================================

describe("SearchInput — root ARIA attributes", () => {
	test("root has role='search'", () => {
		const builder = createSearchInput();
		expect(builder.root.role).toBe("search");
	});

	test("root has data-cl-search-input-root attribute", () => {
		const builder = createSearchInput();
		expect(builder.root["data-cl-search-input-root"]).toBe("");
	});

	test("root has unique id", () => {
		const builder = createSearchInput();
		expect(builder.root.id).toMatch(/^cl-\d+$/);
	});

	test("root aria-label defaults to 'Search'", () => {
		const builder = createSearchInput();
		expect(builder.root["aria-label"]).toBe("Search");
	});

	test("root aria-label reflects custom prop", () => {
		const builder = createSearchInput({ "aria-label": "Find users" });
		expect(builder.root["aria-label"]).toBe("Find users");
	});

	test("root data-disabled absent when not disabled", () => {
		const builder = createSearchInput();
		expect(builder.root["data-disabled"]).toBeUndefined();
	});

	test("root data-disabled present when disabled", () => {
		const builder = createSearchInput({ disabled: true });
		expect(builder.root["data-disabled"]).toBe("");
	});

	test("root data-has-value absent when value empty", () => {
		const builder = createSearchInput();
		expect(builder.root["data-has-value"]).toBeUndefined();
	});

	test("root data-has-value present when value non-empty", () => {
		const builder = createSearchInput({ value: "test" });
		expect(builder.root["data-has-value"]).toBe("");
	});
});

// =============================================================================
// INPUT ELEMENT — ARIA
// =============================================================================

describe("SearchInput — input ARIA attributes", () => {
	test("input has role='searchbox'", () => {
		const builder = createSearchInput();
		expect(builder.input.role).toBe("searchbox");
	});

	test("input has data-cl-search-input-input attribute", () => {
		const builder = createSearchInput();
		expect(builder.input["data-cl-search-input-input"]).toBe("");
	});

	test("input has type='search'", () => {
		const builder = createSearchInput();
		expect(builder.input.type).toBe("search");
	});

	test("input value reflects builder value", () => {
		const builder = createSearchInput({ value: "query" });
		expect(builder.input.value).toBe("query");
	});

	test("input placeholder defaults to 'Search...'", () => {
		const builder = createSearchInput();
		expect(builder.input.placeholder).toBe("Search...");
	});

	test("input placeholder reflects custom prop", () => {
		const builder = createSearchInput({ placeholder: "Type to filter..." });
		expect(builder.input.placeholder).toBe("Type to filter...");
	});

	test("input aria-label defaults to 'Search'", () => {
		const builder = createSearchInput();
		expect(builder.input["aria-label"]).toBe("Search");
	});

	test("input aria-label reflects custom prop", () => {
		const builder = createSearchInput({ "aria-label": "Find items" });
		expect(builder.input["aria-label"]).toBe("Find items");
	});

	test("input aria-disabled is true when disabled", () => {
		const builder = createSearchInput({ disabled: true });
		expect(builder.input["aria-disabled"]).toBe(true);
	});

	test("input aria-disabled is undefined when enabled", () => {
		const builder = createSearchInput();
		expect(builder.input["aria-disabled"]).toBeUndefined();
	});

	test("input has oninput handler", () => {
		const builder = createSearchInput();
		expect(typeof builder.input.oninput).toBe("function");
	});

	test("input has onkeydown handler", () => {
		const builder = createSearchInput();
		expect(typeof builder.input.onkeydown).toBe("function");
	});
});

// =============================================================================
// ICON SLOT — decorative
// =============================================================================

describe("SearchInput — icon slot", () => {
	test("icon has aria-hidden='true'", () => {
		const builder = createSearchInput();
		expect(builder.icon["aria-hidden"]).toBe("true");
	});

	test("icon has data-cl-search-input-icon attribute", () => {
		const builder = createSearchInput();
		expect(builder.icon["data-cl-search-input-icon"]).toBe("");
	});

	test("icon has unique id", () => {
		const builder = createSearchInput();
		expect(builder.icon.id).toMatch(/^cl-\d+$/);
	});
});

// =============================================================================
// CLEAR SLOT — button
// =============================================================================

describe("SearchInput — clear button", () => {
	test("clear has aria-label='Clear search'", () => {
		const builder = createSearchInput();
		expect(builder.clear["aria-label"]).toBe("Clear search");
	});

	test("clear has data-cl-search-input-clear attribute", () => {
		const builder = createSearchInput();
		expect(builder.clear["data-cl-search-input-clear"]).toBe("");
	});

	test("clear has type='button'", () => {
		const builder = createSearchInput();
		expect(builder.clear.type).toBe("button");
	});

	test("clear tabindex is -1 when value is empty", () => {
		const builder = createSearchInput();
		expect(builder.clear.tabindex).toBe(-1);
	});

	test("clear tabindex is 0 when value is non-empty", () => {
		const builder = createSearchInput({ value: "test" });
		expect(builder.clear.tabindex).toBe(0);
	});

	test("clear aria-disabled when no value", () => {
		const builder = createSearchInput();
		expect(builder.clear["aria-disabled"]).toBe(true);
	});

	test("clear aria-disabled when disabled (even with value)", () => {
		const builder = createSearchInput({ value: "test", disabled: true });
		expect(builder.clear["aria-disabled"]).toBe(true);
	});

	test("clear not aria-disabled when has value and enabled", () => {
		const builder = createSearchInput({ value: "test" });
		expect(builder.clear["aria-disabled"]).toBeUndefined();
	});

	test("clear data-visible absent when no value", () => {
		const builder = createSearchInput();
		expect(builder.clear["data-visible"]).toBeUndefined();
	});

	test("clear data-visible present when has value", () => {
		const builder = createSearchInput({ value: "test" });
		expect(builder.clear["data-visible"]).toBe("");
	});

	test("clear data-disabled present when no value", () => {
		const builder = createSearchInput();
		expect(builder.clear["data-disabled"]).toBe("");
	});

	test("clear data-disabled absent when has value and enabled", () => {
		const builder = createSearchInput({ value: "test" });
		expect(builder.clear["data-disabled"]).toBeUndefined();
	});

	test("clear has onclick handler", () => {
		const builder = createSearchInput();
		expect(typeof builder.clear.onclick).toBe("function");
	});
});

// =============================================================================
// KEYBOARD — Escape clears
// =============================================================================

describe("SearchInput — keyboard navigation", () => {
	test("Escape clears value when has value", () => {
		const onChange = vi.fn();
		const builder = createSearchInput({ value: "hello", onValueChange: onChange });
		const { root, input } = createDOM(builder);
		cleanupEl = root;

		input.focus();
		pressKey(input, "Escape");
		expect(onChange).toHaveBeenCalledWith("");
	});

	test("Escape does nothing when value is empty", () => {
		const onChange = vi.fn();
		const builder = createSearchInput({ onValueChange: onChange });
		const { root, input } = createDOM(builder);
		cleanupEl = root;

		input.focus();
		pressKey(input, "Escape");
		expect(onChange).not.toHaveBeenCalled();
	});

	test("Escape does nothing when disabled", () => {
		const onChange = vi.fn();
		const builder = createSearchInput({ value: "hello", disabled: true, onValueChange: onChange });
		const { root, input } = createDOM(builder);
		cleanupEl = root;

		input.focus();
		pressKey(input, "Escape");
		expect(onChange).not.toHaveBeenCalled();
	});

	test("Escape fires onClear callback", () => {
		const onClear = vi.fn();
		const builder = createSearchInput({ value: "hello", onClear });
		const { root, input } = createDOM(builder);
		cleanupEl = root;

		input.focus();
		pressKey(input, "Escape");
		expect(onClear).toHaveBeenCalled();
	});
});

// =============================================================================
// clearValue() — programmatic clear
// =============================================================================

describe("SearchInput — clearValue()", () => {
	test("clearValue sets value to empty string", () => {
		const onChange = vi.fn();
		const builder = createSearchInput({ value: "hello", onValueChange: onChange });
		const { root } = createDOM(builder);
		cleanupEl = root;

		builder.clearValue();
		expect(onChange).toHaveBeenCalledWith("");
	});

	test("clearValue fires onClear callback", () => {
		const onClear = vi.fn();
		const builder = createSearchInput({ value: "hello", onClear });
		const { root } = createDOM(builder);
		cleanupEl = root;

		builder.clearValue();
		expect(onClear).toHaveBeenCalled();
	});

	test("clearValue refocuses input element", () => {
		const builder = createSearchInput({ value: "hello" });
		const { root, input } = createDOM(builder);
		cleanupEl = root;

		builder.clearValue();
		expect(document.activeElement).toBe(input);
	});

	test("clear button click clears value", () => {
		const onChange = vi.fn();
		const builder = createSearchInput({ value: "hello", onValueChange: onChange });
		const { root, clearBtn } = createDOM(builder);
		cleanupEl = root;

		clearBtn.click();
		expect(onChange).toHaveBeenCalledWith("");
	});

	test("clear button click does nothing when disabled", () => {
		const onChange = vi.fn();
		const builder = createSearchInput({ value: "hello", disabled: true, onValueChange: onChange });
		const { root, clearBtn } = createDOM(builder);
		cleanupEl = root;

		clearBtn.click();
		expect(onChange).not.toHaveBeenCalled();
	});

	test("clear button click fires onClear callback", () => {
		const onClear = vi.fn();
		const builder = createSearchInput({ value: "hello", onClear });
		const { root, clearBtn } = createDOM(builder);
		cleanupEl = root;

		clearBtn.click();
		expect(onClear).toHaveBeenCalled();
	});
});

// =============================================================================
// COMPUTED — hasValue
// =============================================================================

describe("SearchInput — hasValue computed", () => {
	test("hasValue is false when value is empty", () => {
		const builder = createSearchInput();
		expect(builder.hasValue).toBe(false);
	});

	test("hasValue is true when value is non-empty", () => {
		const builder = createSearchInput({ value: "test" });
		expect(builder.hasValue).toBe(true);
	});
});

// =============================================================================
// CONTROLLED MODE
// =============================================================================

describe("SearchInput — controlled mode", () => {
	test("reads value from getter", () => {
		let external = "hello";
		const builder = createSearchInput({
			value: () => external,
		});
		expect(builder.value).toBe("hello");
		external = "world";
		expect(builder.value).toBe("world");
	});

	test("hasValue tracks controlled value", () => {
		let external = "";
		const builder = createSearchInput({
			value: () => external,
		});
		expect(builder.hasValue).toBe(false);
		external = "query";
		expect(builder.hasValue).toBe(true);
	});

	test("controlled: onChange fires on clear", () => {
		const onChange = vi.fn();
		const builder = createSearchInput({
			value: () => "hello",
			onValueChange: onChange,
		});
		const { root, clearBtn } = createDOM(builder);
		cleanupEl = root;

		clearBtn.click();
		expect(onChange).toHaveBeenCalledWith("");
	});

	test("controlled disabled from getter", () => {
		let disabled = false;
		const builder = createSearchInput({
			disabled: () => disabled,
		});
		expect(builder.disabled).toBe(false);
		disabled = true;
		expect(builder.disabled).toBe(true);
	});
});

// =============================================================================
// INSTANCE ISOLATION
// =============================================================================

describe("SearchInput — instance isolation", () => {
	test("two instances have different IDs", () => {
		const a = createSearchInput();
		const b = createSearchInput();
		expect(a.ids.root).not.toBe(b.ids.root);
		expect(a.ids.input).not.toBe(b.ids.input);
		expect(a.ids.icon).not.toBe(b.ids.icon);
		expect(a.ids.clear).not.toBe(b.ids.clear);
	});

	test("two instances have independent values", () => {
		const a = createSearchInput({ value: "alpha" });
		const b = createSearchInput({ value: "beta" });
		expect(a.value).toBe("alpha");
		expect(b.value).toBe("beta");
	});

	test("two instances have independent disabled state", () => {
		const a = createSearchInput({ disabled: true });
		const b = createSearchInput({ disabled: false });
		expect(a.disabled).toBe(true);
		expect(b.disabled).toBe(false);
	});
});
