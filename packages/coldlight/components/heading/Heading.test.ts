/**
 * @file components/heading/Heading.test.ts
 * @kind heading
 * @layer components
 * @package @devpulse/coldlight
 *
 * Heading component browser tests — ARIA + structural only. ZERO visual.
 * Composition/visual tests live in ui/heading/Heading.test.ts.
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import Heading from "./Heading.svelte";

// =============================================================================
// STRUCTURAL ATTRIBUTES
// =============================================================================

describe("heading component — structural attributes", () => {
	test("renders with data-kind='heading'", async () => {
		const { container } = await render(Heading);
		const el = container.querySelector("[data-kind='heading']") as HTMLElement;
		expect(el).toBeTruthy();
	});

	test("has data-slot='root'", async () => {
		const { container } = await render(Heading);
		const el = container.querySelector("[data-kind='heading']") as HTMLElement;
		await expect.element(el).toHaveAttribute("data-slot", "root");
	});

	test("renders as <h2> by default", async () => {
		const { container } = await render(Heading);
		const el = container.querySelector("[data-kind='heading']") as HTMLElement;
		expect(el.tagName.toLowerCase()).toBe("h2");
	});

	test("renders as <h1> when level=1", async () => {
		const { container } = await render(Heading, { props: { level: 1 } });
		const el = container.querySelector("[data-kind='heading']") as HTMLElement;
		expect(el.tagName.toLowerCase()).toBe("h1");
	});

	test("renders as <h3> when level=3", async () => {
		const { container } = await render(Heading, { props: { level: 3 } });
		const el = container.querySelector("[data-kind='heading']") as HTMLElement;
		expect(el.tagName.toLowerCase()).toBe("h3");
	});

	test("passes custom class", async () => {
		const { container } = await render(Heading, { props: { class: "custom-heading" } });
		const el = container.querySelector("[data-kind='heading']") as HTMLElement;
		await expect.element(el).toHaveClass("custom-heading");
	});
});

// =============================================================================
// ARIA ATTRIBUTES
// =============================================================================

describe("heading component — ARIA attributes", () => {
	test("has role='heading'", async () => {
		const { container } = await render(Heading);
		const el = container.querySelector("[data-kind='heading']") as HTMLElement;
		await expect.element(el).toHaveAttribute("role", "heading");
	});

	test("has aria-level matching heading level", async () => {
		const { container } = await render(Heading, { props: { level: 3 } });
		const el = container.querySelector("[data-kind='heading']") as HTMLElement;
		await expect.element(el).toHaveAttribute("aria-level", "3");
	});
});
