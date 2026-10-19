/**
 * @file components/loading-overlay/LoadingOverlay.test.ts
 * @kind loading-overlay
 * @layer components
 * @package @devpulse/coldlight
 *
 * LoadingOverlay component browser tests.
 * Tests ARIA compliance, data-state derivation, composition application, and contract shape.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import LoadingOverlay from "./LoadingOverlay.svelte";

// =============================================================================
// ARIA ATTRIBUTES
// =============================================================================

describe("loading-overlay component — ARIA", () => {
	test("has role='alert'", async () => {
		const { getByRole } = render(LoadingOverlay, { props: { visible: true } });
		const el = getByRole("alert");
		expect(el).toBeTruthy();
	});

	test("has aria-busy='true' when visible", async () => {
		const { getByRole } = render(LoadingOverlay, { props: { visible: true } });
		const el = getByRole("alert");
		await expect.element(el).toHaveAttribute("aria-busy", "true");
	});

	test("has aria-label='Loading'", async () => {
		const { getByRole } = render(LoadingOverlay, { props: { visible: true } });
		const el = getByRole("alert");
		await expect.element(el).toHaveAttribute("aria-label", "Loading");
	});
});

// =============================================================================
// DATA-STATE DERIVATION
// =============================================================================

describe("loading-overlay component — data-state", () => {
	test("data-state is 'hidden' by default", async () => {
		const { getByRole } = render(LoadingOverlay);
		const el = getByRole("alert");
		await expect.element(el).toHaveAttribute("data-state", "hidden");
	});

	test("data-state is 'visible' when visible is true", async () => {
		const { getByRole } = render(LoadingOverlay, { props: { visible: true } });
		const el = getByRole("alert");
		await expect.element(el).toHaveAttribute("data-state", "visible");
	});
});

// =============================================================================
// RECIPE CLASSES
// =============================================================================

describe("loading-overlay component — composition", () => {
	test("applies composition base classes", async () => {
		const { getByRole } = render(LoadingOverlay, { props: { visible: true } });
		const el = getByRole("alert");
		await expect.element(el).toHaveClass("absolute");
		await expect.element(el).toHaveClass("flex");
	});

	test("merges custom class prop", async () => {
		const { getByRole } = render(LoadingOverlay, { props: { visible: true, class: "my-custom" } });
		const el = getByRole("alert");
		await expect.element(el).toHaveClass("my-custom");
	});
});
