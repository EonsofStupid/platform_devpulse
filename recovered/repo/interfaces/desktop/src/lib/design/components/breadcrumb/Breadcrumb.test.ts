/**
 * @file components/breadcrumb/Breadcrumb.test.ts
 * @kind breadcrumb
 * @layer components
 * @package @devpulse/coldlight
 *
 * Breadcrumb component browser tests.
 * Tests ARIA semantics, builder integration, and recipe application.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import Breadcrumb from "./Breadcrumb.svelte";
import { contract } from "./contract.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("breadcrumb component -- contract", () => {
	test("contract.kind is 'breadcrumb'", () => {
		expect(contract.kind).toBe("breadcrumb");
	});

	test("contract.primitiveKind is 'breadcrumb'", () => {
		expect(contract.primitiveKind).toBe("breadcrumb");
	});

	test("contract requires slot 'root'", () => {
		expect(contract.slots.required).toContain("root");
	});

	test("contract has optional slots for item, separator, link", () => {
		expect(contract.slots.optional).toContain("item");
		expect(contract.slots.optional).toContain("separator");
		expect(contract.slots.optional).toContain("link");
	});
});

// =============================================================================
// ARIA SEMANTICS
// =============================================================================

describe("breadcrumb component -- ARIA", () => {
	test("renders a <nav> element with role='navigation'", async () => {
		const { getByRole } = render(Breadcrumb);
		const nav = getByRole("navigation");
		expect(nav).toBeTruthy();
	});

	test("has aria-label='Breadcrumb' by default", async () => {
		const { getByRole } = render(Breadcrumb);
		const nav = getByRole("navigation");
		await expect.element(nav).toHaveAttribute("aria-label", "Breadcrumb");
	});

	test("applies custom aria-label from prop", async () => {
		const { getByRole } = render(Breadcrumb, { props: { label: "Page path" } });
		const nav = getByRole("navigation");
		await expect.element(nav).toHaveAttribute("aria-label", "Page path");
	});

	test("has data-kind='breadcrumb'", async () => {
		const { getByRole } = render(Breadcrumb);
		const nav = getByRole("navigation");
		await expect.element(nav).toHaveAttribute("data-kind", "breadcrumb");
	});

	test("has data-slot='root'", async () => {
		const { getByRole } = render(Breadcrumb);
		const nav = getByRole("navigation");
		await expect.element(nav).toHaveAttribute("data-slot", "root");
	});
});

// =============================================================================
// RECIPE APPLICATION
// =============================================================================

describe("breadcrumb component -- recipe", () => {
	test("passes class prop to element", async () => {
		const { getByRole } = render(Breadcrumb, { props: { class: "test-class" } });
		const nav = getByRole("navigation");
		await expect.element(nav).toHaveClass("test-class");
	});
});
