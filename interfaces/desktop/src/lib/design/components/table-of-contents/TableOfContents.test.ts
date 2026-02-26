/**
 * @file components/table-of-contents/TableOfContents.test.ts
 * @kind table-of-contents
 * @layer components
 * @package @devpulse/coldlight
 *
 * TableOfContents component browser tests.
 * Tests ARIA semantics, builder integration, and recipe application.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { render } from "vitest-browser-svelte";
import { expect, test, describe } from "vitest";
import TableOfContents from "./TableOfContents.svelte";
import { contract } from "./contract.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("table-of-contents component -- contract", () => {
	test("contract.kind is 'table-of-contents'", () => {
		expect(contract.kind).toBe("table-of-contents");
	});

	test("contract.primitiveKind is 'table-of-contents'", () => {
		expect(contract.primitiveKind).toBe("table-of-contents");
	});

	test("contract requires slot 'root'", () => {
		expect(contract.slots.required).toContain("root");
	});

	test("contract has optional slots for item and link", () => {
		expect(contract.slots.optional).toContain("item");
		expect(contract.slots.optional).toContain("link");
	});
});

// =============================================================================
// ARIA SEMANTICS
// =============================================================================

describe("table-of-contents component -- ARIA", () => {
	test("renders a <nav> element with role='navigation'", async () => {
		const { getByRole } = render(TableOfContents);
		const nav = getByRole("navigation");
		expect(nav).toBeTruthy();
	});

	test("has aria-label='Table of contents' by default", async () => {
		const { getByRole } = render(TableOfContents);
		const nav = getByRole("navigation");
		await expect.element(nav).toHaveAttribute("aria-label", "Table of contents");
	});

	test("applies custom aria-label from prop", async () => {
		const { getByRole } = render(TableOfContents, { props: { label: "On this page" } });
		const nav = getByRole("navigation");
		await expect.element(nav).toHaveAttribute("aria-label", "On this page");
	});

	test("has data-kind='table-of-contents'", async () => {
		const { getByRole } = render(TableOfContents);
		const nav = getByRole("navigation");
		await expect.element(nav).toHaveAttribute("data-kind", "table-of-contents");
	});

	test("has data-slot='root'", async () => {
		const { getByRole } = render(TableOfContents);
		const nav = getByRole("navigation");
		await expect.element(nav).toHaveAttribute("data-slot", "root");
	});
});

// =============================================================================
// RECIPE APPLICATION
// =============================================================================

describe("table-of-contents component -- recipe", () => {
	test("passes class prop to element", async () => {
		const { getByRole } = render(TableOfContents, { props: { class: "test-class" } });
		const nav = getByRole("navigation");
		await expect.element(nav).toHaveClass("test-class");
	});
});
