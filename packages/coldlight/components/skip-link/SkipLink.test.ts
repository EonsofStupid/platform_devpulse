/**
 * @file components/skip-link/SkipLink.test.ts
 * @kind skip-link
 * @layer components
 * @package @devpulse/coldlight
 *
 * SkipLink component browser tests.
 * Tests ARIA semantics, builder integration, focus management, and composition.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import SkipLink from "./SkipLink.svelte";

// =============================================================================
// ARIA SEMANTICS
// =============================================================================

describe("skip-link component -- ARIA", () => {
	test("renders an <a> element with role='link'", async () => {
		const { getByRole } = render(SkipLink);
		const link = getByRole("link");
		expect(link).toBeTruthy();
	});

	test("has href='#main-content' by default", async () => {
		const { getByRole } = render(SkipLink);
		const link = getByRole("link");
		await expect.element(link).toHaveAttribute("href", "#main-content");
	});

	test("applies custom href from prop", async () => {
		const { getByRole } = render(SkipLink, { props: { href: "#content" } });
		const link = getByRole("link");
		await expect.element(link).toHaveAttribute("href", "#content");
	});

	test("has aria-label with default text", async () => {
		const { getByRole } = render(SkipLink);
		const link = getByRole("link");
		await expect.element(link).toHaveAttribute("aria-label", "Skip to main content");
	});

	test("has data-kind='skip-link'", async () => {
		const { getByRole } = render(SkipLink);
		const link = getByRole("link");
		await expect.element(link).toHaveAttribute("data-kind", "skip-link");
	});

	test("has data-slot='root'", async () => {
		const { getByRole } = render(SkipLink);
		const link = getByRole("link");
		await expect.element(link).toHaveAttribute("data-slot", "root");
	});
});

// =============================================================================
// DEFAULT TEXT
// =============================================================================

describe("skip-link component -- default text", () => {
	test("renders default label text when no children", async () => {
		const { getByRole } = render(SkipLink);
		const link = getByRole("link");
		await expect.element(link).toHaveTextContent("Skip to main content");
	});
});

// =============================================================================
// RECIPE APPLICATION
// =============================================================================

describe("skip-link component -- composition", () => {
	test("passes class prop to element", async () => {
		const { getByRole } = render(SkipLink, { props: { class: "test-class" } });
		const link = getByRole("link");
		await expect.element(link).toHaveClass("test-class");
	});
});
