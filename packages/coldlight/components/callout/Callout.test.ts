/**
 * @file components/callout/Callout.test.ts
 * @kind callout
 * @layer components
 * @package @devpulse/coldlight
 *
 * Callout component browser tests.
 * Tests ARIA compliance, data-state derivation, and composition application.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import Callout from "./Callout.svelte";

// =============================================================================
// ARIA ATTRIBUTES
// =============================================================================

describe("callout component — ARIA", () => {
	test("has role='note'", async () => {
		const { getByRole } = render(Callout);
		const el = getByRole("note");
		expect(el).toBeTruthy();
	});
});

// =============================================================================
// DATA-STATE DERIVATION
// =============================================================================

describe("callout component — data-state", () => {
	test("data-state is 'info' by default", async () => {
		const { getByRole } = render(Callout);
		const el = getByRole("note");
		await expect.element(el).toHaveAttribute("data-state", "info");
	});

	test("data-state is 'warning' when variant is warning", async () => {
		const { getByRole } = render(Callout, { props: { variant: "warning" } });
		const el = getByRole("note");
		await expect.element(el).toHaveAttribute("data-state", "warning");
	});

	test("data-state is 'tip' when variant is tip", async () => {
		const { getByRole } = render(Callout, { props: { variant: "tip" } });
		const el = getByRole("note");
		await expect.element(el).toHaveAttribute("data-state", "tip");
	});
});

// =============================================================================
// RECIPE CLASSES
// =============================================================================

describe("callout component — composition", () => {
	test("applies composition base classes", async () => {
		const { getByRole } = render(Callout);
		const el = getByRole("note");
		await expect.element(el).toHaveClass("relative");
		await expect.element(el).toHaveClass("flex");
	});

	test("merges custom class prop", async () => {
		const { getByRole } = render(Callout, { props: { class: "my-custom" } });
		const el = getByRole("note");
		await expect.element(el).toHaveClass("my-custom");
	});
});
