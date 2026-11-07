/**
 * @file builders/sheet/Sheet.test.ts
 * @package @devpulse/coldlight
 *
 * COMPREHENSIVE — Sheet builder integration tests.
 *
 * Tests the COMPLETE builder in a real Chromium DOM:
 *   1. Factory — createSheet() returns instance, accepts props, defaults
 *   2. Trigger ARIA — aria-haspopup, aria-expanded, aria-controls, data-state, data-cl-sheet-trigger
 *   3. Overlay ARIA — role="presentation", aria-hidden, data-state, click behavior
 *   4. Content ARIA — role="dialog", aria-modal, aria-label, data-state, data-side
 *   5. Close button ARIA — aria-label="Close", data-state, click closes
 *   6. Keyboard — Escape closes (when enabled), does NOT close (when disabled)
 *   7. Open state — getter/setter, onOpenChange callback
 *   8. Side prop — data-side defaults, respects all four sides
 *   9. Controlled mode — reads from getter, onOpenChange fires
 *  10. ID cross-linking — trigger aria-controls matches content id
 *  11. Instance isolation — different IDs
 *
 * This is a HEADLESS BUILDER test, not a Svelte component test.
 * We create DOM elements directly and spread builder attrs onto them.
 * This tests the builder API exactly as components will consume it.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 */

import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { Sheet, createSheet } from "./factory.js";
import { resetIdCounter } from "../../builders/builder-metadata.js";

// =============================================================================
// TEST HELPERS
// =============================================================================

/** Apply builder attrs to a DOM element. Attach event handlers. */
function applyAttrs(el: HTMLElement, attrs: Record<string, unknown>): void {
	for (const [key, val] of Object.entries(attrs)) {
		if (val === undefined) continue;
		if (typeof val === "function") {
			if (key === "onclick") el.addEventListener("click", val as EventListener);
			if (key === "onkeydown") el.addEventListener("keydown", val as EventListener);
			continue;
		}
		if (typeof val === "boolean") {
			if (val) el.setAttribute(key, "");
			else el.setAttribute(key, String(val));
			continue;
		}
		el.setAttribute(key, String(val));
	}
}

/** Create a full DOM structure for a Sheet builder instance. */
function createDOM(builder: Sheet): {
	trigger: HTMLButtonElement;
	overlay: HTMLDivElement;
	content: HTMLDivElement;
	close: HTMLButtonElement;
} {
	const trigger = document.createElement("button");
	applyAttrs(trigger, builder.trigger);
	trigger.textContent = "Open Sheet";

	const overlay = document.createElement("div");
	applyAttrs(overlay, builder.overlay);

	const content = document.createElement("div");
	applyAttrs(content, builder.content);

	const close = document.createElement("button");
	applyAttrs(close, builder.close);
	close.textContent = "X";

	content.appendChild(close);
	document.body.appendChild(trigger);
	document.body.appendChild(overlay);
	document.body.appendChild(content);

	return { trigger, overlay, content, close };
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
		if (el.parentNode) el.parentNode.removeChild(el);
	}
	cleanupEls = [];
});

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

describe("createSheet — factory", () => {
	test("returns a Sheet instance", () => {
		const builder = createSheet();
		expect(builder).toBeInstanceOf(Sheet);
	});

	test("accepts props", () => {
		const builder = createSheet({ side: "left", closeOnEscape: false });
		expect(builder.side).toBe("left");
	});

	test("defaults open to false", () => {
		const builder = createSheet();
		expect(builder.open).toBe(false);
	});

	test("defaults side to 'right'", () => {
		const builder = createSheet();
		expect(builder.side).toBe("right");
	});
});

// =============================================================================
// TRIGGER ELEMENT — ARIA
// =============================================================================

describe("Sheet — trigger ARIA attributes", () => {
	test("trigger has aria-haspopup='dialog'", () => {
		const builder = createSheet();
		expect(builder.trigger["aria-haspopup"]).toBe("dialog");
	});

	test("trigger has aria-expanded=false when closed", () => {
		const builder = createSheet();
		expect(builder.trigger["aria-expanded"]).toBe(false);
	});

	test("trigger has aria-expanded=true when open", () => {
		const builder = createSheet({ open: true });
		expect(builder.trigger["aria-expanded"]).toBe(true);
	});

	test("trigger aria-controls links to content id", () => {
		const builder = createSheet();
		expect(builder.trigger["aria-controls"]).toBe(builder.ids.content);
	});

	test("trigger data-state is 'closed' when closed", () => {
		const builder = createSheet();
		expect(builder.trigger["data-state"]).toBe("closed");
	});

	test("trigger data-state is 'open' when open", () => {
		const builder = createSheet({ open: true });
		expect(builder.trigger["data-state"]).toBe("open");
	});

	test("trigger has data-cl-sheet-trigger attribute", () => {
		const builder = createSheet();
		expect(builder.trigger["data-cl-sheet-trigger"]).toBe("");
	});

	test("trigger has unique id", () => {
		const builder = createSheet();
		expect(builder.trigger.id).toMatch(/^cl-\d+$/);
	});

	test("trigger click opens the sheet", () => {
		const onOpenChange = vi.fn();
		const builder = createSheet({ onOpenChange });
		const { trigger, overlay, content, close } = createDOM(builder);
		cleanupEls.push(trigger, overlay, content);

		trigger.click();
		expect(onOpenChange).toHaveBeenCalledWith(true);
	});
});

// =============================================================================
// OVERLAY ELEMENT — ARIA
// =============================================================================

describe("Sheet — overlay ARIA attributes", () => {
	test("overlay has role='presentation'", () => {
		const builder = createSheet();
		expect(builder.overlay.role).toBe("presentation");
	});

	test("overlay has aria-hidden='true'", () => {
		const builder = createSheet();
		expect(builder.overlay["aria-hidden"]).toBe("true");
	});

	test("overlay has data-state 'closed' when closed", () => {
		const builder = createSheet();
		expect(builder.overlay["data-state"]).toBe("closed");
	});

	test("overlay has data-state 'open' when open", () => {
		const builder = createSheet({ open: true });
		expect(builder.overlay["data-state"]).toBe("open");
	});

	test("overlay has data-cl-sheet-overlay attribute", () => {
		const builder = createSheet();
		expect(builder.overlay["data-cl-sheet-overlay"]).toBe("");
	});

	test("overlay click closes when closeOnOutsideClick=true (default)", () => {
		const onOpenChange = vi.fn();
		const builder = createSheet({ open: true, onOpenChange });
		const { trigger, overlay, content } = createDOM(builder);
		cleanupEls.push(trigger, overlay, content);

		overlay.click();
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	test("overlay click does NOT close when closeOnOutsideClick=false", () => {
		const onOpenChange = vi.fn();
		const builder = createSheet({
			open: true,
			onOpenChange,
			closeOnOutsideClick: false,
		});
		const { trigger, overlay, content } = createDOM(builder);
		cleanupEls.push(trigger, overlay, content);

		overlay.click();
		expect(onOpenChange).not.toHaveBeenCalled();
	});
});

// =============================================================================
// CONTENT ELEMENT — ARIA
// =============================================================================

describe("Sheet — content ARIA attributes", () => {
	test("content has role='dialog'", () => {
		const builder = createSheet();
		expect(builder.content.role).toBe("dialog");
	});

	test("content has aria-modal='true'", () => {
		const builder = createSheet();
		expect(builder.content["aria-modal"]).toBe("true");
	});

	test("content has aria-label when label is set", () => {
		const builder = createSheet({ label: "Settings panel" });
		expect(builder.content["aria-label"]).toBe("Settings panel");
	});

	test("content aria-label is undefined when no label", () => {
		const builder = createSheet();
		expect(builder.content["aria-label"]).toBeUndefined();
	});

	test("content has data-state 'closed' when closed", () => {
		const builder = createSheet();
		expect(builder.content["data-state"]).toBe("closed");
	});

	test("content has data-state 'open' when open", () => {
		const builder = createSheet({ open: true });
		expect(builder.content["data-state"]).toBe("open");
	});

	test("content has data-side matching side prop", () => {
		const builder = createSheet({ side: "left" });
		expect(builder.content["data-side"]).toBe("left");
	});

	test("content data-side defaults to 'right'", () => {
		const builder = createSheet();
		expect(builder.content["data-side"]).toBe("right");
	});

	test("content has data-cl-sheet-content attribute", () => {
		const builder = createSheet();
		expect(builder.content["data-cl-sheet-content"]).toBe("");
	});

	test("content has unique id", () => {
		const builder = createSheet();
		expect(builder.content.id).toMatch(/^cl-\d+$/);
	});
});

// =============================================================================
// CLOSE BUTTON — ARIA
// =============================================================================

describe("Sheet — close button ARIA attributes", () => {
	test("close has aria-label='Close'", () => {
		const builder = createSheet();
		expect(builder.close["aria-label"]).toBe("Close");
	});

	test("close has data-state 'closed' when closed", () => {
		const builder = createSheet();
		expect(builder.close["data-state"]).toBe("closed");
	});

	test("close has data-state 'open' when open", () => {
		const builder = createSheet({ open: true });
		expect(builder.close["data-state"]).toBe("open");
	});

	test("close has data-cl-sheet-close attribute", () => {
		const builder = createSheet();
		expect(builder.close["data-cl-sheet-close"]).toBe("");
	});

	test("close click closes the sheet", () => {
		const onOpenChange = vi.fn();
		const builder = createSheet({ open: true, onOpenChange });
		const { trigger, overlay, content, close } = createDOM(builder);
		cleanupEls.push(trigger, overlay, content);

		close.click();
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});
});

// =============================================================================
// KEYBOARD — Escape
// =============================================================================

describe("Sheet — keyboard (Escape)", () => {
	test("Escape on content closes when closeOnEscape=true (default)", () => {
		const onOpenChange = vi.fn();
		const builder = createSheet({ open: true, onOpenChange });
		const { trigger, overlay, content } = createDOM(builder);
		cleanupEls.push(trigger, overlay, content);

		content.focus();
		pressKey(content, "Escape");
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	test("Escape on content does NOT close when closeOnEscape=false", () => {
		const onOpenChange = vi.fn();
		const builder = createSheet({
			open: true,
			onOpenChange,
			closeOnEscape: false,
		});
		const { trigger, overlay, content } = createDOM(builder);
		cleanupEls.push(trigger, overlay, content);

		content.focus();
		pressKey(content, "Escape");
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	test("non-Escape key does not close the sheet", () => {
		const onOpenChange = vi.fn();
		const builder = createSheet({ open: true, onOpenChange });
		const { trigger, overlay, content } = createDOM(builder);
		cleanupEls.push(trigger, overlay, content);

		content.focus();
		pressKey(content, "Tab");
		expect(onOpenChange).not.toHaveBeenCalled();
	});
});

// =============================================================================
// OPEN STATE — getter / setter / callback
// =============================================================================

describe("Sheet — open state management", () => {
	test("open property getter reflects initial state", () => {
		const closed = createSheet();
		expect(closed.open).toBe(false);

		const opened = createSheet({ open: true });
		expect(opened.open).toBe(true);
	});

	test("open property setter updates state", () => {
		const builder = createSheet();
		expect(builder.open).toBe(false);
		builder.open = true;
		expect(builder.open).toBe(true);
	});

	test("onOpenChange callback fires when trigger opens", () => {
		const onOpenChange = vi.fn();
		const builder = createSheet({ onOpenChange });
		const { trigger, overlay, content } = createDOM(builder);
		cleanupEls.push(trigger, overlay, content);

		trigger.click();
		expect(onOpenChange).toHaveBeenCalledWith(true);
	});

	test("onOpenChange callback fires when close button closes", () => {
		const onOpenChange = vi.fn();
		const builder = createSheet({ open: true, onOpenChange });
		const { trigger, overlay, content, close } = createDOM(builder);
		cleanupEls.push(trigger, overlay, content);

		close.click();
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	test("onOpenChange callback fires when overlay closes", () => {
		const onOpenChange = vi.fn();
		const builder = createSheet({ open: true, onOpenChange });
		const { trigger, overlay, content } = createDOM(builder);
		cleanupEls.push(trigger, overlay, content);

		overlay.click();
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	test("onOpenChange callback fires when Escape closes", () => {
		const onOpenChange = vi.fn();
		const builder = createSheet({ open: true, onOpenChange });
		const { trigger, overlay, content } = createDOM(builder);
		cleanupEls.push(trigger, overlay, content);

		pressKey(content, "Escape");
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});
});

// =============================================================================
// SIDE PROP
// =============================================================================

describe("Sheet — side prop", () => {
	test("data-side defaults to 'right'", () => {
		const builder = createSheet();
		expect(builder.content["data-side"]).toBe("right");
	});

	test("data-side respects 'left'", () => {
		const builder = createSheet({ side: "left" });
		expect(builder.content["data-side"]).toBe("left");
	});

	test("data-side respects 'top'", () => {
		const builder = createSheet({ side: "top" });
		expect(builder.content["data-side"]).toBe("top");
	});

	test("data-side respects 'bottom'", () => {
		const builder = createSheet({ side: "bottom" });
		expect(builder.content["data-side"]).toBe("bottom");
	});

	test("side getter returns current side", () => {
		const builder = createSheet({ side: "top" });
		expect(builder.side).toBe("top");
	});
});

// =============================================================================
// CONTROLLED MODE
// =============================================================================

describe("Sheet — controlled mode", () => {
	test("reads open from getter", () => {
		let external = false;
		const builder = createSheet({
			open: () => external,
		});
		expect(builder.open).toBe(false);
		external = true;
		expect(builder.open).toBe(true);
	});

	test("controlled: trigger aria-expanded tracks getter", () => {
		let external = false;
		const builder = createSheet({
			open: () => external,
		});
		expect(builder.trigger["aria-expanded"]).toBe(false);
		external = true;
		expect(builder.trigger["aria-expanded"]).toBe(true);
	});

	test("controlled: data-state tracks getter across all slots", () => {
		let external = false;
		const builder = createSheet({
			open: () => external,
		});
		expect(builder.trigger["data-state"]).toBe("closed");
		expect(builder.overlay["data-state"]).toBe("closed");
		expect(builder.content["data-state"]).toBe("closed");
		expect(builder.close["data-state"]).toBe("closed");

		external = true;
		expect(builder.trigger["data-state"]).toBe("open");
		expect(builder.overlay["data-state"]).toBe("open");
		expect(builder.content["data-state"]).toBe("open");
		expect(builder.close["data-state"]).toBe("open");
	});

	test("controlled: onOpenChange fires on trigger click", () => {
		const onOpenChange = vi.fn();
		const builder = createSheet({
			open: () => false,
			onOpenChange,
		});
		const { trigger, overlay, content } = createDOM(builder);
		cleanupEls.push(trigger, overlay, content);

		trigger.click();
		expect(onOpenChange).toHaveBeenCalledWith(true);
	});

	test("controlled: side from getter", () => {
		let side: "left" | "right" | "top" | "bottom" = "right";
		const builder = createSheet({
			side: () => side,
		});
		expect(builder.content["data-side"]).toBe("right");
		side = "left";
		expect(builder.content["data-side"]).toBe("left");
	});

	test("controlled: label from getter", () => {
		let label: string | undefined = "First";
		const builder = createSheet({
			label: () => label,
		});
		expect(builder.content["aria-label"]).toBe("First");
		label = "Second";
		expect(builder.content["aria-label"]).toBe("Second");
	});
});

// =============================================================================
// ID CROSS-LINKING
// =============================================================================

describe("Sheet — ID cross-linking", () => {
	test("trigger aria-controls matches content id", () => {
		const builder = createSheet();
		const triggerId = builder.trigger["aria-controls"];
		const contentId = builder.content.id;
		expect(triggerId).toBe(contentId);
	});

	test("trigger aria-controls is the content ids entry", () => {
		const builder = createSheet();
		expect(builder.trigger["aria-controls"]).toBe(builder.ids.content);
	});

	test("all slots have their ids from the ids record", () => {
		const builder = createSheet();
		expect(builder.trigger.id).toBe(builder.ids.trigger);
		expect(builder.overlay.id).toBe(builder.ids.overlay);
		expect(builder.content.id).toBe(builder.ids.content);
		expect(builder.close.id).toBe(builder.ids.close);
	});
});

// =============================================================================
// INSTANCE ISOLATION
// =============================================================================

describe("Sheet — instance isolation", () => {
	test("two instances have different IDs", () => {
		const a = createSheet();
		const b = createSheet();
		expect(a.ids.trigger).not.toBe(b.ids.trigger);
		expect(a.ids.overlay).not.toBe(b.ids.overlay);
		expect(a.ids.content).not.toBe(b.ids.content);
		expect(a.ids.close).not.toBe(b.ids.close);
	});

	test("two instances have independent open state", () => {
		const a = createSheet({ open: true });
		const b = createSheet({ open: false });
		expect(a.open).toBe(true);
		expect(b.open).toBe(false);
	});

	test("two instances have independent side state", () => {
		const a = createSheet({ side: "left" });
		const b = createSheet({ side: "bottom" });
		expect(a.side).toBe("left");
		expect(b.side).toBe("bottom");
	});
});
