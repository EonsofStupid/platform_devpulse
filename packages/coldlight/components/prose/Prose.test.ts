/**
 * @file components/prose/Prose.test.ts
 * @kind prose
 * @layer components
 * @package @devpulse/coldlight
 *
 * Prose component browser tests.
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import Prose from "./Prose.svelte";

// =============================================================================
// STRUCTURAL ATTRIBUTES
// =============================================================================

describe("prose component — structural attributes", () => {
	test("renders with data-kind='prose'", async () => {
		const { container } = await render(Prose);
		const el = container.querySelector("[data-kind='prose']") as HTMLElement;
		expect(el).toBeTruthy();
	});

	test("has data-slot='root'", async () => {
		const { container } = await render(Prose);
		const el = container.querySelector("[data-kind='prose']") as HTMLElement;
		await expect.element(el).toHaveAttribute("data-slot", "root");
	});
});

// =============================================================================
// RECIPE CLASSES
// =============================================================================

describe("prose component — composition classes", () => {
	test("applies prose class by default", async () => {
		const { container } = await render(Prose);
		const el = container.querySelector("[data-kind='prose']") as HTMLElement;
		await expect.element(el).toHaveClass("prose");
	});

	test("applies prose-invert for dark theme", async () => {
		const { container } = await render(Prose);
		const el = container.querySelector("[data-kind='prose']") as HTMLElement;
		await expect.element(el).toHaveClass("prose-invert");
	});

	test("applies prose-base by default", async () => {
		const { container } = await render(Prose);
		const el = container.querySelector("[data-kind='prose']") as HTMLElement;
		await expect.element(el).toHaveClass("prose-base");
	});

	test("applies prose-sm for size='sm'", async () => {
		const { container } = await render(Prose, { props: { size: "sm" } });
		const el = container.querySelector("[data-kind='prose']") as HTMLElement;
		await expect.element(el).toHaveClass("prose-sm");
	});

	test("applies prose-lg for size='lg'", async () => {
		const { container } = await render(Prose, { props: { size: "lg" } });
		const el = container.querySelector("[data-kind='prose']") as HTMLElement;
		await expect.element(el).toHaveClass("prose-lg");
	});

	test("passes custom class", async () => {
		const { container } = await render(Prose, { props: { class: "custom-prose" } });
		const el = container.querySelector("[data-kind='prose']") as HTMLElement;
		await expect.element(el).toHaveClass("custom-prose");
	});
});
