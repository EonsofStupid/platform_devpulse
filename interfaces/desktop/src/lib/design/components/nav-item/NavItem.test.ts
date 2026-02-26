/**
 * @file components/nav-item/NavItem.test.ts
 * @kind nav-item
 * @layer components
 * @package @devpulse/coldlight
 *
 * NavItem component browser tests.
 * Tests ARIA semantics, builder integration, and recipe application.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { render } from "vitest-browser-svelte";
import { expect, test, describe } from "vitest";
import NavItem from "./NavItem.svelte";
import { contract } from "./contract.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("nav-item component -- contract", () => {
	test("contract.kind is 'nav-item'", () => {
		expect(contract.kind).toBe("nav-item");
	});

	test("contract.primitiveKind is 'nav-item'", () => {
		expect(contract.primitiveKind).toBe("nav-item");
	});

	test("contract requires slot 'root'", () => {
		expect(contract.slots.required).toContain("root");
	});
});

// =============================================================================
// ARIA SEMANTICS
// =============================================================================

describe("nav-item component -- ARIA", () => {
	test("renders an <a> element with role='link'", async () => {
		const { getByRole } = render(NavItem);
		const link = getByRole("link");
		expect(link).toBeTruthy();
	});

	test("applies aria-current='page' when active", async () => {
		const { getByRole } = render(NavItem, { props: { active: true } });
		const link = getByRole("link");
		await expect.element(link).toHaveAttribute("aria-current", "page");
	});

	test("does not have aria-current when not active", async () => {
		const { getByRole } = render(NavItem);
		const link = getByRole("link");
		await expect.element(link).not.toHaveAttribute("aria-current");
	});

	test("applies aria-disabled when disabled", async () => {
		const { getByRole } = render(NavItem, { props: { disabled: true } });
		const link = getByRole("link");
		await expect.element(link).toHaveAttribute("aria-disabled", "true");
	});

	test("has data-kind='nav-item'", async () => {
		const { getByRole } = render(NavItem);
		const link = getByRole("link");
		await expect.element(link).toHaveAttribute("data-kind", "nav-item");
	});

	test("has data-slot='root'", async () => {
		const { getByRole } = render(NavItem);
		const link = getByRole("link");
		await expect.element(link).toHaveAttribute("data-slot", "root");
	});
});

// =============================================================================
// STATE DERIVATION
// =============================================================================

describe("nav-item component -- state", () => {
	test("data-state is 'idle' by default", async () => {
		const { getByRole } = render(NavItem);
		const link = getByRole("link");
		await expect.element(link).toHaveAttribute("data-state", "idle");
	});

	test("data-state is 'active' when active", async () => {
		const { getByRole } = render(NavItem, { props: { active: true } });
		const link = getByRole("link");
		await expect.element(link).toHaveAttribute("data-state", "active");
	});

	test("data-state is 'disabled' when disabled", async () => {
		const { getByRole } = render(NavItem, { props: { disabled: true } });
		const link = getByRole("link");
		await expect.element(link).toHaveAttribute("data-state", "disabled");
	});
});

// =============================================================================
// RECIPE APPLICATION
// =============================================================================

describe("nav-item component -- recipe", () => {
	test("passes class prop to element", async () => {
		const { getByRole } = render(NavItem, { props: { class: "test-class" } });
		const link = getByRole("link");
		await expect.element(link).toHaveClass("test-class");
	});
});
