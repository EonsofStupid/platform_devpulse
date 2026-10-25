/**
 * @file Panel Component Layer — Vitest Browser Tests
 *
 * Tests the FULL component stack: recipe classes → blueprint defaults →
 * data attributes → slot rendering → padding overrides.
 *
 * Categories:
 *   1. Contract: data-kind, data-slot on every slot
 *   2. Recipe classes: glass-void default classes applied
 *   3. Structure: header/body/footer DOM order, optional slots
 *   4. Slot rendering: content visible in each slot
 *   5. Padding: padding prop overrides recipe padding
 *   6. Recipe override: custom recipe prop applies different styling
 *   7. Surface props: accent/radius forwarded to recipe
 */

import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import PanelTest from "./Panel.test.svelte";

// =============================================================================
// Helpers
// =============================================================================

const wait = (ms = 50) => new Promise((r) => setTimeout(r, ms));

function getRoot(): HTMLElement | null {
	return document.querySelector('[data-kind="panel"][data-slot="root"]');
}

function getHeader(): HTMLElement | null {
	return document.querySelector('[data-kind="panel"][data-slot="header"]');
}

function getBody(): HTMLElement | null {
	return document.querySelector('[data-kind="panel"][data-slot="body"]');
}

function getFooter(): HTMLElement | null {
	return document.querySelector('[data-kind="panel"][data-slot="footer"]');
}

// =============================================================================
// 1. Contract — data-kind, data-slot
// =============================================================================

describe("Panel: contract (data attributes)", () => {
	it("root has data-kind=panel and data-slot=root", async () => {
		render(PanelTest);
		await wait();
		const root = getRoot();
		expect(root).not.toBeNull();
		expect(root?.getAttribute("data-kind")).toBe("panel");
		expect(root?.getAttribute("data-slot")).toBe("root");
	});

	it("header has data-kind=panel and data-slot=header", async () => {
		render(PanelTest);
		await wait();
		const header = getHeader();
		expect(header).not.toBeNull();
		expect(header?.getAttribute("data-kind")).toBe("panel");
		expect(header?.getAttribute("data-slot")).toBe("header");
	});

	it("body has data-kind=panel and data-slot=body", async () => {
		render(PanelTest);
		await wait();
		const body = getBody();
		expect(body).not.toBeNull();
		expect(body?.getAttribute("data-kind")).toBe("panel");
		expect(body?.getAttribute("data-slot")).toBe("body");
	});

	it("footer has data-kind=panel and data-slot=footer", async () => {
		render(PanelTest);
		await wait();
		const footer = getFooter();
		expect(footer).not.toBeNull();
		expect(footer?.getAttribute("data-kind")).toBe("panel");
		expect(footer?.getAttribute("data-slot")).toBe("footer");
	});
});

// =============================================================================
// 2. Recipe classes — glass-void default
// =============================================================================

describe("Panel: recipe classes (glass-void)", () => {
	it("root has glass-void and layout classes", async () => {
		render(PanelTest);
		await wait();
		const root = getRoot();
		expect(root?.classList.contains("glass-void")).toBe(true);
		expect(root?.classList.contains("flex")).toBe(true);
		expect(root?.classList.contains("flex-col")).toBe(true);
		expect(root?.classList.contains("overflow-hidden")).toBe(true);
	});

	it("root has border and radius from recipe", async () => {
		render(PanelTest);
		await wait();
		const root = getRoot();
		expect(root?.classList.contains("rounded-lg")).toBe(true);
		expect(root?.className).toMatch(/border/);
	});

	it("header has border-b and text classes", async () => {
		render(PanelTest);
		await wait();
		const header = getHeader();
		expect(header?.className).toMatch(/border-b/);
		expect(header?.classList.contains("text-sm")).toBe(true);
		expect(header?.classList.contains("font-medium")).toBe(true);
	});

	it("body has flex-1 and overflow-auto", async () => {
		render(PanelTest);
		await wait();
		const body = getBody();
		expect(body?.classList.contains("flex-1")).toBe(true);
		expect(body?.classList.contains("overflow-auto")).toBe(true);
	});

	it("footer has border-t class", async () => {
		render(PanelTest);
		await wait();
		const footer = getFooter();
		expect(footer?.className).toMatch(/border-t/);
	});
});

// =============================================================================
// 3. Structure — DOM order, optional slots
// =============================================================================

describe("Panel: structure", () => {
	it("header/body/footer render in correct DOM order", async () => {
		render(PanelTest);
		await wait();
		const root = getRoot();
		expect(root).not.toBeNull();
		const children = Array.from(root?.children ?? []);
		const slots = children.map((c) => c.getAttribute("data-slot"));
		expect(slots).toEqual(["header", "body", "footer"]);
	});

	it("renders without header when showHeader=false", async () => {
		render(PanelTest, { showHeader: false });
		await wait();
		expect(getHeader()).toBeNull();
		expect(getBody()).not.toBeNull();
		expect(getFooter()).not.toBeNull();
	});

	it("renders without footer when showFooter=false", async () => {
		render(PanelTest, { showFooter: false });
		await wait();
		expect(getHeader()).not.toBeNull();
		expect(getBody()).not.toBeNull();
		expect(getFooter()).toBeNull();
	});

	it("renders body-only panel", async () => {
		render(PanelTest, { showHeader: false, showFooter: false });
		await wait();
		const root = getRoot();
		expect(root).not.toBeNull();
		expect(root?.children.length).toBe(1);
		expect(root?.children[0]?.getAttribute("data-slot")).toBe("body");
	});
});

// =============================================================================
// 4. Slot rendering — content visible
// =============================================================================

describe("Panel: slot rendering", () => {
	it("header renders text content", async () => {
		render(PanelTest);
		await wait();
		const header = getHeader();
		expect(header).not.toBeNull();
		expect(header?.textContent?.trim()).toBe("Dashboard");
	});

	it("body renders paragraph content", async () => {
		render(PanelTest);
		await wait();
		const body = getBody();
		expect(body).not.toBeNull();
		expect(body?.textContent).toContain("Panel content goes here");
	});

	it("footer renders button content", async () => {
		render(PanelTest);
		await wait();
		const footer = getFooter();
		expect(footer).not.toBeNull();
		const button = footer?.querySelector("button");
		expect(button).not.toBeNull();
		expect(button?.textContent?.trim()).toBe("Save");
	});
});

// =============================================================================
// 5. Padding — padding prop overrides
// =============================================================================

describe("Panel: padding", () => {
	it("default padding (md) uses recipe classes", async () => {
		render(PanelTest);
		await wait();
		const body = getBody();
		expect(body).not.toBeNull();
		// Default recipe body has px-4 py-3
		expect(body?.classList.contains("px-4")).toBe(true);
		expect(body?.classList.contains("py-3")).toBe(true);
	});

	it('padding="none" applies p-0 to slots', async () => {
		render(PanelTest, { padding: "none" });
		await wait();
		const body = getBody();
		expect(body).not.toBeNull();
		expect(body?.classList.contains("p-0")).toBe(true);
		// twMerge should remove the recipe's px-4 py-3
		expect(body?.classList.contains("px-4")).toBe(false);
		expect(body?.classList.contains("py-3")).toBe(false);
	});

	it('padding="lg" applies px-6 py-5 to slots', async () => {
		render(PanelTest, { padding: "lg" });
		await wait();
		const body = getBody();
		expect(body).not.toBeNull();
		expect(body?.classList.contains("px-6")).toBe(true);
		expect(body?.classList.contains("py-5")).toBe(true);
		// Should override recipe defaults
		expect(body?.classList.contains("px-4")).toBe(false);
		expect(body?.classList.contains("py-3")).toBe(false);
	});

	it('padding="sm" applies px-2 py-1.5 to slots', async () => {
		render(PanelTest, { padding: "sm" });
		await wait();
		const body = getBody();
		expect(body).not.toBeNull();
		expect(body?.classList.contains("px-2")).toBe(true);
	});
});

// =============================================================================
// 6. Recipe override
// =============================================================================

describe("Panel: recipe override", () => {
	it("recipe=panel.matte.flat applies matte classes", async () => {
		render(PanelTest, { recipe: "panel.matte.flat" });
		await wait();
		const root = getRoot();
		expect(root).not.toBeNull();
		expect(root?.classList.contains("bg-zinc-900/80")).toBe(true);
		expect(root?.classList.contains("glass-void")).toBe(false);
	});

	it("recipe=panel.matte.flat with radius=md uses rounded-md", async () => {
		render(PanelTest, { recipe: "panel.matte.flat", radius: "md" });
		await wait();
		const root = getRoot();
		expect(root).not.toBeNull();
		expect(root?.classList.contains("rounded-md")).toBe(true);
		expect(root?.classList.contains("rounded-lg")).toBe(false);
	});
});

// =============================================================================
// 7. Surface props — forwarded to recipe
// =============================================================================

describe("Panel: surface props", () => {
	it("radius prop affects root radius class", async () => {
		render(PanelTest, { radius: "xl" });
		await wait();
		const root = getRoot();
		expect(root).not.toBeNull();
		expect(root?.classList.contains("rounded-xl")).toBe(true);
		expect(root?.classList.contains("rounded-lg")).toBe(false);
	});

	it("custom class on root is merged", async () => {
		render(PanelTest, { rootClass: "my-custom-class" });
		await wait();
		const root = getRoot();
		expect(root).not.toBeNull();
		expect(root?.classList.contains("my-custom-class")).toBe(true);
		// Recipe classes still present
		expect(root?.classList.contains("glass-void")).toBe(true);
	});
});
