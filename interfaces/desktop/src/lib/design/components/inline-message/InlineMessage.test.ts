/**
 * @file components/inline-message/InlineMessage.test.ts
 * @kind inline-message
 * @layer components
 * @package @devpulse/coldlight
 *
 * InlineMessage component browser tests.
 * Tests ARIA compliance, data-state derivation, composition application, and contract shape.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import InlineMessage from "./InlineMessage.svelte";

// =============================================================================
// ARIA ATTRIBUTES
// =============================================================================

describe("inline-message component — ARIA", () => {
	test("has role='status'", async () => {
		const { getByRole } = render(InlineMessage);
		const el = getByRole("status");
		expect(el).toBeTruthy();
	});

	test("has aria-live='polite'", async () => {
		const { getByRole } = render(InlineMessage);
		const el = getByRole("status");
		await expect.element(el).toHaveAttribute("aria-live", "polite");
	});
});

// =============================================================================
// DATA-STATE DERIVATION
// =============================================================================

describe("inline-message component — data-state", () => {
	test("data-state is 'info' by default", async () => {
		const { getByRole } = render(InlineMessage);
		const el = getByRole("status");
		await expect.element(el).toHaveAttribute("data-state", "info");
	});

	test("data-state is 'error' when tone is error", async () => {
		const { getByRole } = render(InlineMessage, { props: { tone: "error" } });
		const el = getByRole("status");
		await expect.element(el).toHaveAttribute("data-state", "error");
	});

	test("data-state is 'help' when tone is help", async () => {
		const { getByRole } = render(InlineMessage, { props: { tone: "help" } });
		const el = getByRole("status");
		await expect.element(el).toHaveAttribute("data-state", "help");
	});
});

// =============================================================================
// RECIPE CLASSES
// =============================================================================

describe("inline-message component — composition", () => {
	test("applies composition base classes", async () => {
		const { getByRole } = render(InlineMessage);
		const el = getByRole("status");
		await expect.element(el).toHaveClass("inline-flex");
	});

	test("merges custom class prop", async () => {
		const { getByRole } = render(InlineMessage, { props: { class: "my-custom" } });
		const el = getByRole("status");
		await expect.element(el).toHaveClass("my-custom");
	});
});
