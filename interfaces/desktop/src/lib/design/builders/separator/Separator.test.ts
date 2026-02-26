/**
 * @file builders/separator/Separator.test.ts
 * @package @devpulse/coldlight
 *
 * Separator builder integration tests.
 *
 * Tests the COMPLETE builder in a real Chromium DOM:
 *   1. Factory — createSeparator() returns instance with correct defaults
 *   2. Semantic mode (decorative=false) — role="separator", aria-orientation, data-orientation
 *   3. Decorative mode (decorative=true) — role="none", aria-hidden, NO aria-orientation
 *   4. Orientation — defaults horizontal, respects vertical prop
 *   5. Controlled mode — orientation/decorative from getter
 *   6. Instance isolation — unique IDs, independent state
 *
 * This is a HEADLESS BUILDER test, not a Svelte component test.
 * We create DOM elements directly and spread builder attrs onto them.
 * This tests the builder API exactly as components will consume it.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 */

import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { Separator, createSeparator } from "./factory.js";
import { resetIdCounter } from "../_internal/builder-metadata.js";

// =============================================================================
// TEST HELPERS
// =============================================================================

/** Create a DOM separator from a builder instance. */
function createDOM(builder: Separator): HTMLElement {
	const el = document.createElement("hr");
	const attrs = builder.root;
	for (const [key, val] of Object.entries(attrs)) {
		if (val === undefined) continue;
		if (typeof val === "function") continue;
		if (typeof val === "boolean") {
			if (val) el.setAttribute(key, "");
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

describe("createSeparator — factory", () => {
	test("returns a Separator instance", () => {
		const builder = createSeparator();
		expect(builder).toBeInstanceOf(Separator);
	});

	test("defaults orientation to 'horizontal'", () => {
		const builder = createSeparator();
		expect(builder.orientation).toBe("horizontal");
	});

	test("defaults decorative to false", () => {
		const builder = createSeparator();
		expect(builder.decorative).toBe(false);
	});

	test("accepts orientation prop", () => {
		const builder = createSeparator({ orientation: "vertical" });
		expect(builder.orientation).toBe("vertical");
	});

	test("accepts decorative prop", () => {
		const builder = createSeparator({ decorative: true });
		expect(builder.decorative).toBe(true);
	});
});

// =============================================================================
// SEMANTIC MODE (decorative=false) — ARIA
// =============================================================================

describe("Separator — semantic mode (decorative=false)", () => {
	test("root has role='separator'", () => {
		const builder = createSeparator();
		expect(builder.root.role).toBe("separator");
	});

	test("root has aria-orientation matching orientation", () => {
		const builder = createSeparator();
		expect(builder.root["aria-orientation"]).toBe("horizontal");
	});

	test("root has aria-orientation='vertical' when vertical", () => {
		const builder = createSeparator({ orientation: "vertical" });
		expect(builder.root["aria-orientation"]).toBe("vertical");
	});

	test("root has data-orientation matching orientation", () => {
		const builder = createSeparator();
		expect(builder.root["data-orientation"]).toBe("horizontal");
	});

	test("root has data-cl-separator-root attribute", () => {
		const builder = createSeparator();
		expect(builder.root["data-cl-separator-root"]).toBe("");
	});

	test("root has unique id", () => {
		const builder = createSeparator();
		expect(builder.root.id).toMatch(/^cl-\d+$/);
	});

	test("root does NOT have aria-hidden in semantic mode", () => {
		const builder = createSeparator();
		expect(builder.root["aria-hidden"]).toBeUndefined();
	});

	test("root does NOT have role='none' in semantic mode", () => {
		const builder = createSeparator();
		expect(builder.root.role).not.toBe("none");
	});

	test("DOM element receives correct role attribute", () => {
		const builder = createSeparator();
		const el = createDOM(builder);
		cleanupEl = el;

		expect(el.getAttribute("role")).toBe("separator");
	});

	test("DOM element receives correct aria-orientation attribute", () => {
		const builder = createSeparator({ orientation: "vertical" });
		const el = createDOM(builder);
		cleanupEl = el;

		expect(el.getAttribute("aria-orientation")).toBe("vertical");
	});
});

// =============================================================================
// DECORATIVE MODE (decorative=true) — ARIA
// =============================================================================

describe("Separator — decorative mode (decorative=true)", () => {
	test("root has role='none'", () => {
		const builder = createSeparator({ decorative: true });
		expect(builder.root.role).toBe("none");
	});

	test("root has aria-hidden=true", () => {
		const builder = createSeparator({ decorative: true });
		expect(builder.root["aria-hidden"]).toBe(true);
	});

	test("root does NOT have aria-orientation (not applicable for decorative)", () => {
		const builder = createSeparator({ decorative: true });
		expect(builder.root["aria-orientation"]).toBeUndefined();
	});

	test("root still has data-orientation (visual, not semantic)", () => {
		const builder = createSeparator({ decorative: true });
		expect(builder.root["data-orientation"]).toBe("horizontal");
	});

	test("root still has data-cl-separator-root attribute", () => {
		const builder = createSeparator({ decorative: true });
		expect(builder.root["data-cl-separator-root"]).toBe("");
	});

	test("root still has unique id", () => {
		const builder = createSeparator({ decorative: true });
		expect(builder.root.id).toMatch(/^cl-\d+$/);
	});

	test("DOM element receives role='none' attribute", () => {
		const builder = createSeparator({ decorative: true });
		const el = createDOM(builder);
		cleanupEl = el;

		expect(el.getAttribute("role")).toBe("none");
	});

	test("DOM element receives aria-hidden attribute", () => {
		const builder = createSeparator({ decorative: true });
		const el = createDOM(builder);
		cleanupEl = el;

		expect(el.hasAttribute("aria-hidden")).toBe(true);
	});

	test("decorative vertical still has data-orientation='vertical'", () => {
		const builder = createSeparator({ decorative: true, orientation: "vertical" });
		expect(builder.root["data-orientation"]).toBe("vertical");
	});
});

// =============================================================================
// ORIENTATION
// =============================================================================

describe("Separator — orientation", () => {
	test("defaults to horizontal", () => {
		const builder = createSeparator();
		expect(builder.orientation).toBe("horizontal");
		expect(builder.root["data-orientation"]).toBe("horizontal");
	});

	test("respects vertical prop", () => {
		const builder = createSeparator({ orientation: "vertical" });
		expect(builder.orientation).toBe("vertical");
		expect(builder.root["data-orientation"]).toBe("vertical");
	});
});

// =============================================================================
// CONTROLLED MODE
// =============================================================================

describe("Separator — controlled mode", () => {
	test("orientation from getter", () => {
		let orientation: "horizontal" | "vertical" = "horizontal";
		const builder = createSeparator({
			orientation: () => orientation,
		});
		expect(builder.orientation).toBe("horizontal");
		expect(builder.root["aria-orientation"]).toBe("horizontal");

		orientation = "vertical";
		expect(builder.orientation).toBe("vertical");
		expect(builder.root["aria-orientation"]).toBe("vertical");
	});

	test("decorative from getter", () => {
		let decorative = false;
		const builder = createSeparator({
			decorative: () => decorative,
		});
		expect(builder.decorative).toBe(false);
		expect(builder.root.role).toBe("separator");

		decorative = true;
		expect(builder.decorative).toBe(true);
		expect(builder.root.role).toBe("none");
	});

	test("controlled decorative toggle switches ARIA semantics", () => {
		let decorative = false;
		const builder = createSeparator({
			decorative: () => decorative,
		});

		// Semantic mode
		expect(builder.root.role).toBe("separator");
		expect(builder.root["aria-orientation"]).toBe("horizontal");
		expect(builder.root["aria-hidden"]).toBeUndefined();

		// Switch to decorative
		decorative = true;
		expect(builder.root.role).toBe("none");
		expect(builder.root["aria-hidden"]).toBe(true);
		expect(builder.root["aria-orientation"]).toBeUndefined();
	});
});

// =============================================================================
// INSTANCE ISOLATION
// =============================================================================

describe("Separator — instance isolation", () => {
	test("two instances have different IDs", () => {
		const a = createSeparator();
		const b = createSeparator();
		expect(a.ids.root).not.toBe(b.ids.root);
	});

	test("two instances have independent decorative state", () => {
		const a = createSeparator({ decorative: true });
		const b = createSeparator({ decorative: false });
		expect(a.decorative).toBe(true);
		expect(b.decorative).toBe(false);
		expect(a.root.role).toBe("none");
		expect(b.root.role).toBe("separator");
	});

	test("two instances have independent orientation state", () => {
		const a = createSeparator({ orientation: "vertical" });
		const b = createSeparator({ orientation: "horizontal" });
		expect(a.orientation).toBe("vertical");
		expect(b.orientation).toBe("horizontal");
	});

	test("IDs follow predictable pattern after reset", () => {
		const a = createSeparator();
		expect(a.ids.root).toBe("cl-0");
		const b = createSeparator();
		expect(b.ids.root).toBe("cl-1");
	});
});
