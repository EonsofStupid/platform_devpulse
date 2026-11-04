/**
 * @file components/notification-center/NotificationCenter.test.ts
 * @kind notification-center
 * @layer components
 * @package @devpulse/coldlight
 *
 * NotificationCenter component browser tests.
 * Tests ARIA compliance, data-state derivation, and composition application.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import NotificationCenter from "./NotificationCenter.svelte";

// =============================================================================
// ARIA ATTRIBUTES
// =============================================================================

describe("notification-center component — ARIA", () => {
	test("has role='log'", async () => {
		const { getByRole } = await render(NotificationCenter);
		const el = getByRole("log");
		expect(el).toBeTruthy();
	});

	test("has aria-live='polite'", async () => {
		const { getByRole } = await render(NotificationCenter);
		const el = getByRole("log");
		await expect.element(el).toHaveAttribute("aria-live", "polite");
	});

	test("has aria-relevant='additions'", async () => {
		const { getByRole } = await render(NotificationCenter);
		const el = getByRole("log");
		await expect.element(el).toHaveAttribute("aria-relevant", "additions");
	});
});

// =============================================================================
// DATA-STATE DERIVATION
// =============================================================================

describe("notification-center component — data-state", () => {
	test("data-state is 'closed' by default", async () => {
		const { getByRole } = await render(NotificationCenter);
		const el = getByRole("log");
		await expect.element(el).toHaveAttribute("data-state", "closed");
	});

	test("data-state is 'open' when open is true", async () => {
		const { getByRole } = await render(NotificationCenter, { props: { open: true } });
		const el = getByRole("log");
		await expect.element(el).toHaveAttribute("data-state", "open");
	});
});

// =============================================================================
// RECIPE CLASSES
// =============================================================================

describe("notification-center component — composition", () => {
	test("applies composition base classes", async () => {
		const { getByRole } = await render(NotificationCenter);
		const el = getByRole("log");
		await expect.element(el).toHaveClass("flex");
		await expect.element(el).toHaveClass("flex-col");
	});

	test("merges custom class prop", async () => {
		const { getByRole } = await render(NotificationCenter, { props: { class: "my-custom" } });
		const el = getByRole("log");
		await expect.element(el).toHaveClass("my-custom");
	});
});
