/**
 * @file ui/heading/Heading.test.ts
 * @kind heading
 * @layer ui
 * @package @devpulse/coldlight
 *
 * Heading UI browser tests — recipe classes + visual composition.
 * Structural/ARIA tests live in components/heading/Heading.test.ts.
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { render } from "vitest-browser-svelte";
import { expect, test, describe } from "vitest";
import Heading from "./Heading.svelte";

// =============================================================================
// RECIPE CLASSES
// =============================================================================

describe("heading ui — recipe classes", () => {
	test("applies heading-root class by default", async () => {
		const { container } = render(Heading);
		const el = container.querySelector("[data-kind='heading']") as HTMLElement;
		await expect.element(el).toHaveClass("heading-root");
	});

	test("applies heading-lg for size='lg' (default)", async () => {
		const { container } = render(Heading);
		const el = container.querySelector("[data-kind='heading']") as HTMLElement;
		await expect.element(el).toHaveClass("heading-lg");
	});

	test("applies heading-2xl for size='2xl'", async () => {
		const { container } = render(Heading, { props: { size: "2xl" } });
		const el = container.querySelector("[data-kind='heading']") as HTMLElement;
		await expect.element(el).toHaveClass("heading-2xl");
	});

	test("passes custom class", async () => {
		const { container } = render(Heading, { props: { class: "custom-heading" } });
		const el = container.querySelector("[data-kind='heading']") as HTMLElement;
		await expect.element(el).toHaveClass("custom-heading");
	});
});

// =============================================================================
// STRUCTURAL PASSTHROUGH
// =============================================================================

describe("heading ui — structural passthrough", () => {
	test("renders with data-kind='heading'", async () => {
		const { container } = render(Heading);
		const el = container.querySelector("[data-kind='heading']") as HTMLElement;
		expect(el).toBeTruthy();
	});

	test("renders as <h2> by default", async () => {
		const { container } = render(Heading);
		const el = container.querySelector("[data-kind='heading']") as HTMLElement;
		expect(el.tagName.toLowerCase()).toBe("h2");
	});

	test("renders as <h1> when level=1", async () => {
		const { container } = render(Heading, { props: { level: 1 } });
		const el = container.querySelector("[data-kind='heading']") as HTMLElement;
		expect(el.tagName.toLowerCase()).toBe("h1");
	});

	test("has role='heading'", async () => {
		const { container } = render(Heading);
		const el = container.querySelector("[data-kind='heading']") as HTMLElement;
		await expect.element(el).toHaveAttribute("role", "heading");
	});

	test("has aria-level matching heading level", async () => {
		const { container } = render(Heading, { props: { level: 3 } });
		const el = container.querySelector("[data-kind='heading']") as HTMLElement;
		await expect.element(el).toHaveAttribute("aria-level", "3");
	});
});
