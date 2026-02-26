/**
 * @file components/card/Card.test.ts
 * @kind card
 * @layer components
 * @package @devpulse/coldlight
 *
 * Card component browser tests.
 * Tests ARIA semantics, builder integration, and recipe application.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { render } from "vitest-browser-svelte";
import { expect, test, describe } from "vitest";
import Card from "./Card.svelte";
import { contract } from "./contract.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("card component -- contract", () => {
	test("contract.kind is 'card'", () => {
		expect(contract.kind).toBe("card");
	});

	test("contract.primitiveKind is 'card'", () => {
		expect(contract.primitiveKind).toBe("card");
	});

	test("contract requires slot 'root'", () => {
		expect(contract.slots.required).toContain("root");
	});

	test("contract has optional slots for header, content, footer", () => {
		expect(contract.slots.optional).toContain("header");
		expect(contract.slots.optional).toContain("content");
		expect(contract.slots.optional).toContain("footer");
	});
});

// =============================================================================
// ARIA SEMANTICS
// =============================================================================

describe("card component -- ARIA", () => {
	test("renders a <div> element with role='group'", async () => {
		const { getByRole } = render(Card);
		const card = getByRole("group");
		expect(card).toBeTruthy();
	});

	test("applies aria-label from prop", async () => {
		const { getByRole } = render(Card, { props: { label: "User profile" } });
		const card = getByRole("group");
		await expect.element(card).toHaveAttribute("aria-label", "User profile");
	});

	test("applies aria-labelledby from prop", async () => {
		const { getByRole } = render(Card, { props: { labelledBy: "card-title-1" } });
		const card = getByRole("group");
		await expect.element(card).toHaveAttribute("aria-labelledby", "card-title-1");
	});

	test("has data-kind='card'", async () => {
		const { getByRole } = render(Card);
		const card = getByRole("group");
		await expect.element(card).toHaveAttribute("data-kind", "card");
	});

	test("has data-slot='root'", async () => {
		const { getByRole } = render(Card);
		const card = getByRole("group");
		await expect.element(card).toHaveAttribute("data-slot", "root");
	});
});

// =============================================================================
// RECIPE APPLICATION
// =============================================================================

describe("card component -- recipe", () => {
	test("passes class prop to element", async () => {
		const { getByRole } = render(Card, { props: { class: "test-class" } });
		const card = getByRole("group");
		await expect.element(card).toHaveClass("test-class");
	});
});
