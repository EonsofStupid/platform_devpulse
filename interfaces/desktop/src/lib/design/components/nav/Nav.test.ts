/**
 * @file components/nav/Nav.test.ts
 * @kind nav
 * @layer components
 * @package @devpulse/coldlight
 *
 * Nav component browser tests.
 * Tests ARIA semantics, builder integration, and recipe application.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import { contract } from "./contract.js";
import Nav from "./Nav.svelte";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("nav component -- contract", () => {
	test("contract.kind is 'nav'", () => {
		expect(contract.kind).toBe("nav");
	});

	test("contract.primitiveKind is 'nav'", () => {
		expect(contract.primitiveKind).toBe("nav");
	});

	test("contract requires slot 'root'", () => {
		expect(contract.slots.required).toContain("root");
	});
});

// =============================================================================
// ARIA SEMANTICS
// =============================================================================

describe("nav component -- ARIA", () => {
	test("renders a <nav> element with role='navigation'", async () => {
		const { getByRole } = render(Nav);
		const nav = getByRole("navigation");
		expect(nav).toBeTruthy();
	});

	test("applies aria-label from prop", async () => {
		const { getByRole } = render(Nav, { props: { label: "Main navigation" } });
		const nav = getByRole("navigation");
		await expect.element(nav).toHaveAttribute("aria-label", "Main navigation");
	});

	test("has data-kind='nav'", async () => {
		const { getByRole } = render(Nav);
		const nav = getByRole("navigation");
		await expect.element(nav).toHaveAttribute("data-kind", "nav");
	});

	test("has data-slot='root'", async () => {
		const { getByRole } = render(Nav);
		const nav = getByRole("navigation");
		await expect.element(nav).toHaveAttribute("data-slot", "root");
	});
});

// =============================================================================
// RECIPE APPLICATION
// =============================================================================

describe("nav component -- recipe", () => {
	test("passes class prop to element", async () => {
		const { getByRole } = render(Nav, { props: { class: "test-class" } });
		const nav = getByRole("navigation");
		await expect.element(nav).toHaveClass("test-class");
	});
});
