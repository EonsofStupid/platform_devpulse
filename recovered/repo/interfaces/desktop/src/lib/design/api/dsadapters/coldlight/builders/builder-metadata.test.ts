/**
 * @file builders/_internal/builder-metadata.test.ts
 * @package @devpulse/coldlight
 *
 * ColdLight builder utility tests.
 *
 * Tests every public export from builder-metadata.ts:
 *   createBuilderMetadata — data attr factory, CSS selectors, ID generation
 *   dataAttr — boolean/string → attribute value mapping
 *   disabledAttr — boolean → disabled attribute mapping
 *   createId — unique ID generation with cl- prefix
 *   resetIdCounter — test isolation utility
 *
 * Test philosophy:
 *   - Every code path exercised (not just happy path)
 *   - Falsy gauntlet: 0, "", false, null, undefined — the values that break production
 *   - Contract verification: output shapes match what builders depend on
 *   - Isolation: resetIdCounter between test groups to prevent cross-test contamination
 *   - Composition: test utilities together the way builders actually compose them
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 */

import { describe, test, expect, beforeEach } from "vitest";
import {
	createBuilderMetadata,
	dataAttr,
	disabledAttr,
	createId,
	resetIdCounter,
} from "./builder-metadata.js";

// =============================================================================
// createId — standalone unique ID generation
// =============================================================================

describe("createId", () => {
	beforeEach(() => {
		resetIdCounter();
	});

	test("returns string with cl- prefix", () => {
		const id = createId();
		expect(id).toMatch(/^cl-\d+$/);
	});

	test("increments counter on each call", () => {
		const id1 = createId();
		const id2 = createId();
		const id3 = createId();
		expect(id1).toBe("cl-0");
		expect(id2).toBe("cl-1");
		expect(id3).toBe("cl-2");
	});

	test("never produces duplicate IDs within a session", () => {
		const ids = new Set<string>();
		for (let i = 0; i < 1000; i++) {
			ids.add(createId());
		}
		expect(ids.size).toBe(1000);
	});
});

// =============================================================================
// resetIdCounter — test isolation
// =============================================================================

describe("resetIdCounter", () => {
	test("resets counter back to 0", () => {
		createId(); // cl-0
		createId(); // cl-1
		createId(); // cl-2
		resetIdCounter();
		expect(createId()).toBe("cl-0");
	});

	test("calling reset multiple times is idempotent", () => {
		resetIdCounter();
		resetIdCounter();
		resetIdCounter();
		expect(createId()).toBe("cl-0");
	});
});

// =============================================================================
// dataAttr — boolean/string → attribute value
// =============================================================================

describe("dataAttr", () => {
	test("true → empty string (attribute present, no value)", () => {
		expect(dataAttr(true)).toBe("");
	});

	test("false → undefined (attribute absent from DOM)", () => {
		expect(dataAttr(false)).toBeUndefined();
	});

	test("string value → pass through unchanged", () => {
		expect(dataAttr("checked")).toBe("checked");
	});

	test("empty string → pass through (valid attribute value)", () => {
		expect(dataAttr("")).toBe("");
	});

	// --- Composition with DOM: verify attribute actually renders ---

	test("true renders as attribute present on element", () => {
		const el = document.createElement("div");
		const val = dataAttr(true);
		if (val !== undefined) {
			el.setAttribute("data-checked", val);
		}
		expect(el.hasAttribute("data-checked")).toBe(true);
		expect(el.getAttribute("data-checked")).toBe("");
	});

	test("false does NOT render attribute on element", () => {
		const el = document.createElement("div");
		const val = dataAttr(false);
		if (val !== undefined) {
			el.setAttribute("data-disabled", val);
		}
		expect(el.hasAttribute("data-disabled")).toBe(false);
	});

	test("string value renders with value on element", () => {
		const el = document.createElement("div");
		const val = dataAttr("on");
		if (val !== undefined) {
			el.setAttribute("data-state", val);
		}
		expect(el.getAttribute("data-state")).toBe("on");
	});
});

// =============================================================================
// disabledAttr — boolean → disabled attribute
// =============================================================================

describe("disabledAttr", () => {
	test("true → true (native disabled attribute)", () => {
		expect(disabledAttr(true)).toBe(true);
	});

	test("false → undefined (no attribute)", () => {
		expect(disabledAttr(false)).toBeUndefined();
	});

	test("undefined → undefined (no attribute)", () => {
		expect(disabledAttr(undefined)).toBeUndefined();
	});

	test("no argument → undefined", () => {
		expect(disabledAttr()).toBeUndefined();
	});

	// --- Composition with DOM ---

	test("true actually disables an HTML button", () => {
		const btn = document.createElement("button");
		const val = disabledAttr(true);
		if (val === true) {
			btn.disabled = true;
		}
		expect(btn.disabled).toBe(true);
	});

	test("false does not disable an HTML button", () => {
		const btn = document.createElement("button");
		const val = disabledAttr(false);
		if (val === true) {
			btn.disabled = true;
		}
		expect(btn.disabled).toBe(false);
	});
});

// =============================================================================
// createBuilderMetadata — the main factory
// =============================================================================

describe("createBuilderMetadata", () => {
	beforeEach(() => {
		resetIdCounter();
	});

	// --- Shape verification ---

	test("returns object with dataAttrs, dataSelectors, createIds", () => {
		const meta = createBuilderMetadata("test", ["root", "item"] as const);
		expect(meta).toHaveProperty("dataAttrs");
		expect(meta).toHaveProperty("dataSelectors");
		expect(meta).toHaveProperty("createIds");
		expect(typeof meta.createIds).toBe("function");
	});

	// --- dataAttrs: data-cl-{name}-{part} ---

	test("dataAttrs use data-cl- prefix with builder name and part", () => {
		const meta = createBuilderMetadata("toggle-group", ["root", "item"] as const);
		expect(meta.dataAttrs.root).toBe("data-cl-toggle-group-root");
		expect(meta.dataAttrs.item).toBe("data-cl-toggle-group-item");
	});

	test("dataAttrs with single part", () => {
		const meta = createBuilderMetadata("toggle", ["trigger"] as const);
		expect(meta.dataAttrs.trigger).toBe("data-cl-toggle-trigger");
	});

	test("dataAttrs with many parts", () => {
		const meta = createBuilderMetadata("menu", [
			"root", "trigger", "content", "item", "separator", "group",
		] as const);
		expect(meta.dataAttrs.root).toBe("data-cl-menu-root");
		expect(meta.dataAttrs.trigger).toBe("data-cl-menu-trigger");
		expect(meta.dataAttrs.content).toBe("data-cl-menu-content");
		expect(meta.dataAttrs.item).toBe("data-cl-menu-item");
		expect(meta.dataAttrs.separator).toBe("data-cl-menu-separator");
		expect(meta.dataAttrs.group).toBe("data-cl-menu-group");
	});

	test("dataAttrs with hyphenated part names", () => {
		const meta = createBuilderMetadata("toggle", ["hidden-input"] as const);
		expect(meta.dataAttrs["hidden-input"]).toBe("data-cl-toggle-hidden-input");
	});

	// --- dataSelectors: [data-cl-{name}-{part}] ---

	test("dataSelectors are CSS attribute selectors", () => {
		const meta = createBuilderMetadata("toggle-group", ["root", "item"] as const);
		expect(meta.dataSelectors.root).toBe("[data-cl-toggle-group-root]");
		expect(meta.dataSelectors.item).toBe("[data-cl-toggle-group-item]");
	});

	test("dataSelectors work with querySelectorAll", () => {
		const meta = createBuilderMetadata("test-widget", ["root", "item"] as const);

		// Create DOM structure
		const container = document.createElement("div");
		const root = document.createElement("div");
		root.setAttribute(meta.dataAttrs.root, "");
		container.appendChild(root);

		const item1 = document.createElement("button");
		item1.setAttribute(meta.dataAttrs.item, "");
		root.appendChild(item1);

		const item2 = document.createElement("button");
		item2.setAttribute(meta.dataAttrs.item, "");
		root.appendChild(item2);

		document.body.appendChild(container);

		// Query using selectors
		const foundRoot = container.querySelector(meta.dataSelectors.root);
		expect(foundRoot).toBe(root);

		const foundItems = container.querySelectorAll(meta.dataSelectors.item);
		expect(foundItems.length).toBe(2);
		expect(foundItems[0]).toBe(item1);
		expect(foundItems[1]).toBe(item2);

		// Cleanup
		document.body.removeChild(container);
	});

	// --- createIds: kind-scoped structured IDs ---

	test("createIds returns kind-scoped IDs: cl-{name}-{part}-{instance}", () => {
		const meta = createBuilderMetadata("test", ["root", "item"] as const);
		const ids = meta.createIds();
		expect(ids.root).toBe("cl-test-root-0");
		expect(ids.item).toBe("cl-test-item-0");
	});

	test("all slots in one createIds call share the same instance number", () => {
		const meta = createBuilderMetadata("dialog", ["root", "trigger", "content", "overlay"] as const);
		const ids = meta.createIds();
		// All should end with -0 (same instance)
		expect(ids.root).toBe("cl-dialog-root-0");
		expect(ids.trigger).toBe("cl-dialog-trigger-0");
		expect(ids.content).toBe("cl-dialog-content-0");
		expect(ids.overlay).toBe("cl-dialog-overlay-0");
	});

	test("createIds produces different instance numbers per call", () => {
		const meta = createBuilderMetadata("test", ["root"] as const);
		const ids1 = meta.createIds();
		const ids2 = meta.createIds();
		expect(ids1.root).toBe("cl-test-root-0");
		expect(ids2.root).toBe("cl-test-root-1");
		expect(ids1.root).not.toBe(ids2.root);
	});

	test("createIds across different builders produce unique IDs", () => {
		const meta1 = createBuilderMetadata("widget-a", ["root"] as const);
		const meta2 = createBuilderMetadata("widget-b", ["root"] as const);
		const ids1 = meta1.createIds();
		const ids2 = meta2.createIds();
		// Different builder name AND different instance number
		expect(ids1.root).toBe("cl-widget-a-root-0");
		expect(ids2.root).toBe("cl-widget-b-root-1");
		expect(ids1.root).not.toBe(ids2.root);
	});

	test("IDs include kind name for debugging", () => {
		const meta = createBuilderMetadata("toggle-group", ["root", "item"] as const);
		const ids = meta.createIds();
		expect(ids.root).toContain("toggle-group");
		expect(ids.item).toContain("toggle-group");
	});

	test("IDs include slot name for debugging", () => {
		const meta = createBuilderMetadata("menu", ["root", "trigger", "content"] as const);
		const ids = meta.createIds();
		expect(ids.root).toContain("root");
		expect(ids.trigger).toContain("trigger");
		expect(ids.content).toContain("content");
	});

	test("never produces duplicate IDs across many instances", () => {
		const meta = createBuilderMetadata("stress", ["root", "item"] as const);
		const allIds = new Set<string>();
		for (let i = 0; i < 500; i++) {
			const ids = meta.createIds();
			allIds.add(ids.root);
			allIds.add(ids.item);
		}
		expect(allIds.size).toBe(1000);
	});

	// --- Readonly enforcement ---

	test("dataAttrs object is readonly (frozen)", () => {
		const meta = createBuilderMetadata("test", ["root"] as const);
		expect(() => {
			// @ts-expect-error — testing runtime immutability
			meta.dataAttrs.root = "hacked";
		}).toThrow();
	});

	test("dataSelectors object is readonly (frozen)", () => {
		const meta = createBuilderMetadata("test", ["root"] as const);
		expect(() => {
			// @ts-expect-error — testing runtime immutability
			meta.dataSelectors.root = "hacked";
		}).toThrow();
	});

	// --- Integration: full builder metadata usage pattern ---

	test("full builder pattern — metadata drives element attributes and selectors", () => {
		const meta = createBuilderMetadata("toggle-group", ["root", "item"] as const);
		const ids = meta.createIds();

		// Simulate building a toggle-group in DOM
		const rootEl = document.createElement("div");
		rootEl.setAttribute(meta.dataAttrs.root, "");
		rootEl.setAttribute("id", ids.root);
		rootEl.setAttribute("role", "group");

		const item1 = document.createElement("button");
		item1.setAttribute(meta.dataAttrs.item, "");
		item1.setAttribute("id", `${ids.item}-bold`);
		item1.setAttribute("data-value", "bold");
		item1.setAttribute("role", "button");
		rootEl.appendChild(item1);

		const item2 = document.createElement("button");
		item2.setAttribute(meta.dataAttrs.item, "");
		item2.setAttribute("id", `${ids.item}-italic`);
		item2.setAttribute("data-value", "italic");
		item2.setAttribute("role", "button");
		rootEl.appendChild(item2);

		document.body.appendChild(rootEl);

		// Verify: selector-driven queries work
		const root = document.querySelector(meta.dataSelectors.root);
		expect(root).toBeTruthy();
		expect(root?.getAttribute("role")).toBe("group");

		const items = document.querySelectorAll(meta.dataSelectors.item);
		expect(items.length).toBe(2);

		// Verify: IDs are structured and debuggable
		expect(ids.root).toMatch(/^cl-toggle-group-root-\d+$/);
		expect(ids.item).toMatch(/^cl-toggle-group-item-\d+$/);

		// Verify: filter disabled items (common builder pattern)
		item2.setAttribute("data-disabled", "");
		const enabledItems = Array.from(
			rootEl.querySelectorAll<HTMLElement>(meta.dataSelectors.item),
		).filter((el) => !el.hasAttribute("data-disabled"));
		expect(enabledItems.length).toBe(1);
		expect(enabledItems[0].getAttribute("data-value")).toBe("bold");

		// Cleanup
		document.body.removeChild(rootEl);
	});
});
