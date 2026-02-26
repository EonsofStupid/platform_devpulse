/**
 * @file builders/toolbar/Toolbar.test.ts
 * @package @devpulse/coldlight
 *
 * COMPREHENSIVE — Toolbar builder integration tests.
 *
 * Tests the COMPLETE builder in a real Chromium DOM:
 *   1. Factory — createToolbar() returns Toolbar, accepts props
 *   2. Root ARIA — role, aria-orientation, aria-label, data-cl-toolbar-root, data-orientation, data-disabled
 *   3. Item ARIA — data-cl-toolbar-item, data-value, aria-disabled, tabindex, data-disabled
 *   4. Arrow navigation (horizontal) — ArrowRight/Left, loop, Home/End
 *   5. Arrow navigation (vertical) — ArrowDown/Up in vertical mode
 *   6. Roving tabindex — onfocus sets tabindex=0 on focused, -1 on others
 *   7. Disabled — group disabled skips keyboard, item disabled filtered from nav
 *   8. Controlled mode — orientation/disabled from getter
 *   9. Instance isolation — different IDs
 *
 * This is a HEADLESS BUILDER test, not a Svelte component test.
 * We create DOM elements directly and spread builder attrs onto them.
 * This tests the builder API exactly as components will consume it.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 */

import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { Toolbar, createToolbar } from "./factory.js";
import { resetIdCounter } from "../_internal/builder-metadata.js";

// =============================================================================
// TEST HELPERS
// =============================================================================

/** Create a DOM toolbar from a builder instance with N items. */
function createDOM(
	builder: Toolbar,
	items: Array<{ value: string; disabled?: boolean }>,
): { root: HTMLElement; items: HTMLButtonElement[] } {
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

	const itemEls: HTMLButtonElement[] = [];
	for (const item of items) {
		const btn = document.createElement("button");
		const attrs = builder.getItem(item.value, item.disabled);
		for (const [key, val] of Object.entries(attrs)) {
			if (val === undefined) continue;
			if (typeof val === "function") {
				if (key === "onclick") btn.addEventListener("click", val as EventListener);
				if (key === "onkeydown") btn.addEventListener("keydown", val as EventListener);
				if (key === "onfocus") btn.addEventListener("focus", val as EventListener);
				continue;
			}
			if (typeof val === "boolean") {
				if (val) btn.setAttribute(key, "");
				else btn.removeAttribute(key);
				continue;
			}
			btn.setAttribute(key, String(val));
		}
		btn.textContent = item.value;
		rootEl.appendChild(btn);
		itemEls.push(btn);
	}

	document.body.appendChild(rootEl);
	return { root: rootEl, items: itemEls };
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

describe("createToolbar — factory", () => {
	test("returns a Toolbar instance", () => {
		const builder = createToolbar();
		expect(builder).toBeInstanceOf(Toolbar);
	});

	test("accepts props", () => {
		const builder = createToolbar({ disabled: true });
		expect(builder.disabled).toBe(true);
	});

	test("defaults disabled to false", () => {
		const builder = createToolbar();
		expect(builder.disabled).toBe(false);
	});

	test("defaults orientation to horizontal", () => {
		const builder = createToolbar();
		expect(builder.orientation).toBe("horizontal");
	});

	test("defaults loop to true", () => {
		const builder = createToolbar();
		expect(builder.loop).toBe(true);
	});
});

// =============================================================================
// ROOT ELEMENT — ARIA
// =============================================================================

describe("Toolbar — root ARIA attributes", () => {
	test("root has role='toolbar'", () => {
		const builder = createToolbar();
		expect(builder.root.role).toBe("toolbar");
	});

	test("root has data-cl-toolbar-root attribute", () => {
		const builder = createToolbar();
		expect(builder.root["data-cl-toolbar-root"]).toBe("");
	});

	test("root has unique id", () => {
		const builder = createToolbar();
		expect(builder.root.id).toMatch(/^cl-\d+$/);
	});

	test("root aria-orientation defaults to 'horizontal'", () => {
		const builder = createToolbar();
		expect(builder.root["aria-orientation"]).toBe("horizontal");
	});

	test("root aria-orientation respects vertical prop", () => {
		const builder = createToolbar({ orientation: "vertical" });
		expect(builder.root["aria-orientation"]).toBe("vertical");
	});

	test("root data-orientation mirrors aria-orientation", () => {
		const builder = createToolbar();
		expect(builder.root["data-orientation"]).toBe("horizontal");
	});

	test("root data-orientation is vertical when configured", () => {
		const builder = createToolbar({ orientation: "vertical" });
		expect(builder.root["data-orientation"]).toBe("vertical");
	});

	test("root aria-label is set when provided", () => {
		const builder = createToolbar({ label: "Formatting" });
		expect(builder.root["aria-label"]).toBe("Formatting");
	});

	test("root aria-label is undefined when not provided", () => {
		const builder = createToolbar();
		expect(builder.root["aria-label"]).toBeUndefined();
	});

	test("root data-disabled absent when not disabled", () => {
		const builder = createToolbar();
		expect(builder.root["data-disabled"]).toBeUndefined();
	});

	test("root data-disabled present when disabled", () => {
		const builder = createToolbar({ disabled: true });
		expect(builder.root["data-disabled"]).toBe("");
	});
});

// =============================================================================
// ITEM ELEMENT — ARIA
// =============================================================================

describe("Toolbar — item ARIA attributes", () => {
	test("item has data-cl-toolbar-item", () => {
		const builder = createToolbar();
		expect(builder.getItem("bold")["data-cl-toolbar-item"]).toBe("");
	});

	test("item has data-value matching value", () => {
		const builder = createToolbar();
		expect(builder.getItem("bold")["data-value"]).toBe("bold");
		expect(builder.getItem("italic")["data-value"]).toBe("italic");
	});

	test("item has unique id incorporating value", () => {
		const builder = createToolbar();
		const attrs = builder.getItem("bold");
		expect(attrs.id).toContain("bold");
		expect(typeof attrs.id).toBe("string");
	});

	test("item has tabindex=-1 by default", () => {
		const builder = createToolbar();
		expect(builder.getItem("bold").tabindex).toBe(-1);
	});

	test("item data-disabled absent when item enabled", () => {
		const builder = createToolbar();
		expect(builder.getItem("bold")["data-disabled"]).toBeUndefined();
	});

	test("item data-disabled present when item disabled", () => {
		const builder = createToolbar();
		expect(builder.getItem("bold", true)["data-disabled"]).toBe("");
	});

	test("item aria-disabled when group disabled", () => {
		const builder = createToolbar({ disabled: true });
		expect(builder.getItem("bold")["aria-disabled"]).toBe(true);
	});

	test("item aria-disabled when item individually disabled", () => {
		const builder = createToolbar();
		expect(builder.getItem("bold", true)["aria-disabled"]).toBe(true);
	});

	test("item aria-disabled undefined when not disabled", () => {
		const builder = createToolbar();
		expect(builder.getItem("bold")["aria-disabled"]).toBeUndefined();
	});

	test("item has onclick handler", () => {
		const builder = createToolbar();
		expect(typeof builder.getItem("bold").onclick).toBe("function");
	});

	test("item has onkeydown handler", () => {
		const builder = createToolbar();
		expect(typeof builder.getItem("bold").onkeydown).toBe("function");
	});

	test("item has onfocus handler", () => {
		const builder = createToolbar();
		expect(typeof builder.getItem("bold").onfocus).toBe("function");
	});
});

// =============================================================================
// KEYBOARD — Arrow navigation (horizontal)
// =============================================================================

describe("Toolbar — arrow navigation (horizontal)", () => {
	test("ArrowRight moves focus to next item", () => {
		const builder = createToolbar();
		const { root, items } = createDOM(builder, [
			{ value: "bold" },
			{ value: "italic" },
			{ value: "underline" },
		]);
		cleanupEl = root;

		items[0].focus();
		pressKey(items[0], "ArrowRight");
		expect(document.activeElement).toBe(items[1]);
	});

	test("ArrowLeft moves focus to previous item", () => {
		const builder = createToolbar();
		const { root, items } = createDOM(builder, [
			{ value: "bold" },
			{ value: "italic" },
			{ value: "underline" },
		]);
		cleanupEl = root;

		items[2].focus();
		pressKey(items[2], "ArrowLeft");
		expect(document.activeElement).toBe(items[1]);
	});

	test("ArrowRight on last item loops to first (loop: true, default)", () => {
		const builder = createToolbar(); // loop defaults to true
		const { root, items } = createDOM(builder, [
			{ value: "bold" },
			{ value: "italic" },
			{ value: "underline" },
		]);
		cleanupEl = root;

		items[2].focus();
		pressKey(items[2], "ArrowRight");
		expect(document.activeElement).toBe(items[0]);
	});

	test("ArrowLeft on first item loops to last (loop: true, default)", () => {
		const builder = createToolbar(); // loop defaults to true
		const { root, items } = createDOM(builder, [
			{ value: "bold" },
			{ value: "italic" },
			{ value: "underline" },
		]);
		cleanupEl = root;

		items[0].focus();
		pressKey(items[0], "ArrowLeft");
		expect(document.activeElement).toBe(items[2]);
	});

	test("ArrowRight on last item does NOT loop when loop=false", () => {
		const builder = createToolbar({ loop: false });
		const { root, items } = createDOM(builder, [
			{ value: "bold" },
			{ value: "italic" },
			{ value: "underline" },
		]);
		cleanupEl = root;

		items[2].focus();
		pressKey(items[2], "ArrowRight");
		// Focus should remain on the last item
		expect(document.activeElement).toBe(items[2]);
	});

	test("ArrowLeft on first item does NOT loop when loop=false", () => {
		const builder = createToolbar({ loop: false });
		const { root, items } = createDOM(builder, [
			{ value: "bold" },
			{ value: "italic" },
			{ value: "underline" },
		]);
		cleanupEl = root;

		items[0].focus();
		pressKey(items[0], "ArrowLeft");
		// Focus should remain on the first item
		expect(document.activeElement).toBe(items[0]);
	});

	test("Home moves focus to first item", () => {
		const builder = createToolbar();
		const { root, items } = createDOM(builder, [
			{ value: "bold" },
			{ value: "italic" },
			{ value: "underline" },
		]);
		cleanupEl = root;

		items[2].focus();
		pressKey(items[2], "Home");
		expect(document.activeElement).toBe(items[0]);
	});

	test("End moves focus to last item", () => {
		const builder = createToolbar();
		const { root, items } = createDOM(builder, [
			{ value: "bold" },
			{ value: "italic" },
			{ value: "underline" },
		]);
		cleanupEl = root;

		items[0].focus();
		pressKey(items[0], "End");
		expect(document.activeElement).toBe(items[2]);
	});
});

// =============================================================================
// KEYBOARD — Arrow navigation (vertical)
// =============================================================================

describe("Toolbar — arrow navigation (vertical)", () => {
	test("ArrowDown moves focus to next item in vertical mode", () => {
		const builder = createToolbar({ orientation: "vertical" });
		const { root, items } = createDOM(builder, [
			{ value: "bold" },
			{ value: "italic" },
			{ value: "underline" },
		]);
		cleanupEl = root;

		items[0].focus();
		pressKey(items[0], "ArrowDown");
		expect(document.activeElement).toBe(items[1]);
	});

	test("ArrowUp moves focus to previous item in vertical mode", () => {
		const builder = createToolbar({ orientation: "vertical" });
		const { root, items } = createDOM(builder, [
			{ value: "bold" },
			{ value: "italic" },
			{ value: "underline" },
		]);
		cleanupEl = root;

		items[2].focus();
		pressKey(items[2], "ArrowUp");
		expect(document.activeElement).toBe(items[1]);
	});

	test("ArrowDown on last item loops to first in vertical mode", () => {
		const builder = createToolbar({ orientation: "vertical" }); // loop defaults true
		const { root, items } = createDOM(builder, [
			{ value: "bold" },
			{ value: "italic" },
		]);
		cleanupEl = root;

		items[1].focus();
		pressKey(items[1], "ArrowDown");
		expect(document.activeElement).toBe(items[0]);
	});

	test("ArrowUp on first item loops to last in vertical mode", () => {
		const builder = createToolbar({ orientation: "vertical" }); // loop defaults true
		const { root, items } = createDOM(builder, [
			{ value: "bold" },
			{ value: "italic" },
		]);
		cleanupEl = root;

		items[0].focus();
		pressKey(items[0], "ArrowUp");
		expect(document.activeElement).toBe(items[1]);
	});

	test("ArrowRight does NOT navigate in vertical mode", () => {
		const builder = createToolbar({ orientation: "vertical" });
		const { root, items } = createDOM(builder, [
			{ value: "bold" },
			{ value: "italic" },
		]);
		cleanupEl = root;

		items[0].focus();
		pressKey(items[0], "ArrowRight");
		// Focus should stay on the current item
		expect(document.activeElement).toBe(items[0]);
	});

	test("ArrowLeft does NOT navigate in vertical mode", () => {
		const builder = createToolbar({ orientation: "vertical" });
		const { root, items } = createDOM(builder, [
			{ value: "bold" },
			{ value: "italic" },
		]);
		cleanupEl = root;

		items[1].focus();
		pressKey(items[1], "ArrowLeft");
		// Focus should stay on the current item
		expect(document.activeElement).toBe(items[1]);
	});

	test("Home still works in vertical mode", () => {
		const builder = createToolbar({ orientation: "vertical" });
		const { root, items } = createDOM(builder, [
			{ value: "bold" },
			{ value: "italic" },
			{ value: "underline" },
		]);
		cleanupEl = root;

		items[2].focus();
		pressKey(items[2], "Home");
		expect(document.activeElement).toBe(items[0]);
	});

	test("End still works in vertical mode", () => {
		const builder = createToolbar({ orientation: "vertical" });
		const { root, items } = createDOM(builder, [
			{ value: "bold" },
			{ value: "italic" },
			{ value: "underline" },
		]);
		cleanupEl = root;

		items[0].focus();
		pressKey(items[0], "End");
		expect(document.activeElement).toBe(items[2]);
	});
});

// =============================================================================
// ROVING TABINDEX
// =============================================================================

describe("Toolbar — roving tabindex", () => {
	test("onfocus sets tabindex=0 on focused item", () => {
		const builder = createToolbar();
		const { root, items } = createDOM(builder, [
			{ value: "bold" },
			{ value: "italic" },
			{ value: "underline" },
		]);
		cleanupEl = root;

		items[1].focus();
		expect(items[1].getAttribute("tabindex")).toBe("0");
	});

	test("onfocus sets tabindex=-1 on other items", () => {
		const builder = createToolbar();
		const { root, items } = createDOM(builder, [
			{ value: "bold" },
			{ value: "italic" },
			{ value: "underline" },
		]);
		cleanupEl = root;

		items[1].focus();
		expect(items[0].getAttribute("tabindex")).toBe("-1");
		expect(items[2].getAttribute("tabindex")).toBe("-1");
	});

	test("arrow navigation updates roving tabindex on new focused item", () => {
		const builder = createToolbar();
		const { root, items } = createDOM(builder, [
			{ value: "bold" },
			{ value: "italic" },
			{ value: "underline" },
		]);
		cleanupEl = root;

		items[0].focus();
		pressKey(items[0], "ArrowRight");
		// items[1] now focused — its onfocus handler fires
		expect(items[1].getAttribute("tabindex")).toBe("0");
		expect(items[0].getAttribute("tabindex")).toBe("-1");
		expect(items[2].getAttribute("tabindex")).toBe("-1");
	});
});

// =============================================================================
// DISABLED STATE
// =============================================================================

describe("Toolbar — disabled state", () => {
	test("group disabled: keyboard navigation does nothing", () => {
		const builder = createToolbar({ disabled: true });
		const { root, items } = createDOM(builder, [
			{ value: "bold" },
			{ value: "italic" },
		]);
		cleanupEl = root;

		items[0].focus();
		pressKey(items[0], "ArrowRight");
		// Focus should remain, onkeydown returns early
		expect(document.activeElement).toBe(items[0]);
	});

	test("individually disabled item is skipped during navigation", () => {
		const builder = createToolbar();
		const { root, items } = createDOM(builder, [
			{ value: "bold" },
			{ value: "italic", disabled: true },
			{ value: "underline" },
		]);
		cleanupEl = root;

		items[0].focus();
		pressKey(items[0], "ArrowRight");
		// The disabled item is filtered out of navigation — focus skips to underline
		expect(document.activeElement).toBe(items[2]);
	});

	test("disabled item is filtered from Home navigation", () => {
		const builder = createToolbar();
		const { root, items } = createDOM(builder, [
			{ value: "bold", disabled: true },
			{ value: "italic" },
			{ value: "underline" },
		]);
		cleanupEl = root;

		items[2].focus();
		pressKey(items[2], "Home");
		// First enabled item is "italic" (index 0 in filtered list)
		expect(document.activeElement).toBe(items[1]);
	});

	test("disabled item is filtered from End navigation", () => {
		const builder = createToolbar();
		const { root, items } = createDOM(builder, [
			{ value: "bold" },
			{ value: "italic" },
			{ value: "underline", disabled: true },
		]);
		cleanupEl = root;

		items[0].focus();
		pressKey(items[0], "End");
		// Last enabled item is "italic" (last in filtered list)
		expect(document.activeElement).toBe(items[1]);
	});

	test("group disabled prevents all item keyboard navigation", () => {
		const builder = createToolbar({ disabled: true });
		const { root, items } = createDOM(builder, [
			{ value: "bold" },
			{ value: "italic" },
			{ value: "underline" },
		]);
		cleanupEl = root;

		items[1].focus();
		pressKey(items[1], "ArrowRight");
		expect(document.activeElement).toBe(items[1]);
		pressKey(items[1], "ArrowLeft");
		expect(document.activeElement).toBe(items[1]);
		pressKey(items[1], "Home");
		expect(document.activeElement).toBe(items[1]);
		pressKey(items[1], "End");
		expect(document.activeElement).toBe(items[1]);
	});
});

// =============================================================================
// CONTROLLED MODE
// =============================================================================

describe("Toolbar — controlled mode", () => {
	test("orientation reads from getter", () => {
		let orientation: "horizontal" | "vertical" = "horizontal";
		const builder = createToolbar({
			orientation: () => orientation,
		});
		expect(builder.orientation).toBe("horizontal");
		expect(builder.root["aria-orientation"]).toBe("horizontal");
		orientation = "vertical";
		expect(builder.orientation).toBe("vertical");
		expect(builder.root["aria-orientation"]).toBe("vertical");
	});

	test("disabled reads from getter", () => {
		let disabled = false;
		const builder = createToolbar({
			disabled: () => disabled,
		});
		expect(builder.disabled).toBe(false);
		expect(builder.root["data-disabled"]).toBeUndefined();
		disabled = true;
		expect(builder.disabled).toBe(true);
		expect(builder.root["data-disabled"]).toBe("");
	});

	test("label reads from getter", () => {
		let label: string | undefined = "Formatting";
		const builder = createToolbar({
			label: () => label,
		});
		expect(builder.root["aria-label"]).toBe("Formatting");
		label = "Text Tools";
		expect(builder.root["aria-label"]).toBe("Text Tools");
		label = undefined;
		// Synced fallback: getter() ?? defaultValue(undefined) ?? internalValue("Formatting")
		expect(builder.root["aria-label"]).toBe("Formatting");
	});

	test("loop reads from getter", () => {
		let loop = true;
		const builder = createToolbar({
			loop: () => loop,
		});
		expect(builder.loop).toBe(true);
		loop = false;
		expect(builder.loop).toBe(false);
	});
});

// =============================================================================
// INSTANCE ISOLATION
// =============================================================================

describe("Toolbar — instance isolation", () => {
	test("two instances have different root IDs", () => {
		const a = createToolbar();
		const b = createToolbar();
		expect(a.ids.root).not.toBe(b.ids.root);
	});

	test("two instances have different item IDs", () => {
		const a = createToolbar();
		const b = createToolbar();
		expect(a.ids.item).not.toBe(b.ids.item);
	});

	test("two instances have independent state", () => {
		const a = createToolbar({ disabled: true, orientation: "vertical" });
		const b = createToolbar({ disabled: false, orientation: "horizontal" });
		expect(a.disabled).toBe(true);
		expect(a.orientation).toBe("vertical");
		expect(b.disabled).toBe(false);
		expect(b.orientation).toBe("horizontal");
	});
});
