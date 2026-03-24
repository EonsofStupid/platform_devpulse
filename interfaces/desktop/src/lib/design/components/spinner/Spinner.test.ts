/**
 * @file components/spinner/Spinner.test.ts
 * @kind spinner
 * @layer components
 * @package @devpulse/coldlight
 *
 * Spinner component browser tests.
 * Tests ARIA compliance, data-state derivation, and composition application.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import { Spinner } from "./index.js";

// =============================================================================
// ARIA ATTRIBUTES
// =============================================================================

describe("spinner component — ARIA", () => {
	test("has role='status'", async () => {
		const { getByRole } = render(Spinner);
		const el = getByRole("status");
		expect(el).toBeTruthy();
	});

	test("has aria-label='Loading' by default when active", async () => {
		const { getByRole } = render(Spinner);
		const el = getByRole("status");
		await expect.element(el).toHaveAttribute("aria-label", "Loading");
	});
});

// =============================================================================
// DATA-STATE DERIVATION
// =============================================================================

describe("spinner component — data-state", () => {
	test("data-state is 'active' by default", async () => {
		const { getByRole } = render(Spinner);
		const el = getByRole("status");
		await expect.element(el).toHaveAttribute("data-state", "active");
	});
});

// =============================================================================
// RECIPE CLASSES
// =============================================================================

describe("spinner component — composition", () => {
	test("applies composition base classes", async () => {
		const { getByRole } = render(Spinner);
		const el = getByRole("status");
		await expect.element(el).toHaveClass("inline-block");
		await expect.element(el).toHaveClass("animate-spin");
	});

	test("applies size variant classes", async () => {
		const { getByRole } = render(Spinner, { props: { size: "sm" } });
		const el = getByRole("status");
		await expect.element(el).toHaveClass("h-4");
		await expect.element(el).toHaveClass("w-4");
	});

	test("merges custom class prop", async () => {
		const { getByRole } = render(Spinner, { props: { class: "my-custom" } });
		const el = getByRole("status");
		await expect.element(el).toHaveClass("my-custom");
	});
});
