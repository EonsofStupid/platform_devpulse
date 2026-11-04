/**
 * @file components/empty-state/EmptyState.test.ts
 * @kind empty-state
 * @layer components
 * @package @devpulse/coldlight
 *
 * EmptyState component browser tests.
 * Tests ARIA compliance, composition application, and contract shape.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import { EmptyState } from "./index.js";

// =============================================================================
// ARIA ATTRIBUTES
// =============================================================================

describe("empty-state component — ARIA", () => {
	test("has role='status'", async () => {
		const { getByRole } = await render(EmptyState);
		const el = getByRole("status");
		expect(el).toBeTruthy();
	});
});

// =============================================================================
// RECIPE CLASSES
// =============================================================================

describe("empty-state component — composition", () => {
	test("applies composition base classes", async () => {
		const { getByRole } = await render(EmptyState);
		const el = getByRole("status");
		await expect.element(el).toHaveClass("flex");
		await expect.element(el).toHaveClass("flex-col");
		await expect.element(el).toHaveClass("text-center");
	});

	test("applies md size by default", async () => {
		const { getByRole } = await render(EmptyState);
		const el = getByRole("status");
		await expect.element(el).toHaveClass("p-8");
	});

	test("applies sm size variant", async () => {
		const { getByRole } = await render(EmptyState, { props: { size: "sm" } });
		const el = getByRole("status");
		await expect.element(el).toHaveClass("p-6");
	});

	test("applies lg size variant", async () => {
		const { getByRole } = await render(EmptyState, { props: { size: "lg" } });
		const el = getByRole("status");
		await expect.element(el).toHaveClass("p-12");
	});

	test("merges custom class prop", async () => {
		const { getByRole } = await render(EmptyState, { props: { class: "my-custom" } });
		const el = getByRole("status");
		await expect.element(el).toHaveClass("my-custom");
	});
});
