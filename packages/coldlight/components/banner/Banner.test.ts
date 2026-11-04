/**
 * @file components/banner/Banner.test.ts
 * @kind banner
 * @layer components
 * @package @devpulse/coldlight
 *
 * Banner component browser tests.
 * Tests ARIA compliance, positioning, dismiss behavior, and composition application.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import Banner from "./Banner.svelte";

// =============================================================================
// ARIA ATTRIBUTES
// =============================================================================

describe("banner component — ARIA", () => {
	test("has role='complementary'", async () => {
		const { container } = await render(Banner);
		const el = container.querySelector("[role='complementary']");
		expect(el).toBeTruthy();
	});

	test("does NOT have role='alert'", async () => {
		const { container } = await render(Banner);
		const el = container.querySelector("[role='alert']");
		expect(el).toBeNull();
	});
});

// =============================================================================
// DATA ATTRIBUTES
// =============================================================================

describe("banner component — data attributes", () => {
	test("has data-kind='banner'", async () => {
		const { container } = await render(Banner);
		const el = container.querySelector("[data-kind='banner']");
		expect(el).toBeTruthy();
	});

	test("has data-slot='root'", async () => {
		const { container } = await render(Banner);
		const el = container.querySelector("[data-slot='root']");
		expect(el).toBeTruthy();
	});

	test("has data-state='open' when visible", async () => {
		const { container } = await render(Banner, { props: { open: true } });
		const el = container.querySelector("[data-kind='banner']");
		expect(el?.getAttribute("data-state")).toBe("open");
	});
});

// =============================================================================
// POSITIONING
// =============================================================================

describe("banner component — positioning", () => {
	test("applies fixed top positioning by default", async () => {
		const { container } = await render(Banner);
		const el = container.querySelector("[data-kind='banner']") as HTMLElement;
		expect(el?.className).toContain("fixed");
		expect(el?.className).toContain("top-0");
	});

	test("applies fixed bottom positioning when position='bottom'", async () => {
		const { container } = await render(Banner, { props: { position: "bottom" } });
		const el = container.querySelector("[data-kind='banner']") as HTMLElement;
		expect(el?.className).toContain("fixed");
		expect(el?.className).toContain("bottom-0");
	});
});

// =============================================================================
// DISMISS
// =============================================================================

describe("banner component — dismiss", () => {
	test("renders dismiss button by default", async () => {
		const { container } = await render(Banner);
		const btn = container.querySelector("[data-slot='dismiss']");
		expect(btn).toBeTruthy();
	});

	test("dismiss button has aria-label", async () => {
		const { container } = await render(Banner);
		const btn = container.querySelector("[data-slot='dismiss']");
		expect(btn?.getAttribute("aria-label")).toBe("Close banner");
	});

	test("hides dismiss button when dismissible=false", async () => {
		const { container } = await render(Banner, { props: { dismissible: false } });
		const btn = container.querySelector("[data-slot='dismiss']");
		expect(btn).toBeNull();
	});

	test("does not render when open=false", async () => {
		const { container } = await render(Banner, { props: { open: false } });
		const el = container.querySelector("[data-kind='banner']");
		expect(el).toBeNull();
	});
});

// =============================================================================
// CLASS COMPOSITION
// =============================================================================

describe("banner component — class composition", () => {
	test("merges custom class prop", async () => {
		const { container } = await render(Banner, { props: { class: "my-custom" } });
		const el = container.querySelector("[data-kind='banner']") as HTMLElement;
		expect(el?.className).toContain("my-custom");
	});
});
