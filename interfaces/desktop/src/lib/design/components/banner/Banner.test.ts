/**
 * @file components/banner/Banner.test.ts
 * @kind banner
 * @layer components
 * @package @devpulse/coldlight
 *
 * Banner component browser tests.
 * Tests ARIA compliance, data-state derivation, recipe application, and contract shape.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import Banner from "./Banner.svelte";
import { contract } from "./contract.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("banner component — contract", () => {
	test("contract.kind is 'banner'", () => {
		expect(contract.kind).toBe("banner");
	});

	test("contract.primitiveKind is 'banner'", () => {
		expect(contract.primitiveKind).toBe("banner");
	});

	test("contract requires slot 'root'", () => {
		expect(contract.slots.required).toContain("root");
	});

	test("contract root slot has role 'alert'", () => {
		expect(contract.slotContracts.root.aria.role).toBe("alert");
	});

	test("contract has no required ARIA attrs on root", () => {
		expect(contract.slotContracts.root.aria.required).toHaveLength(0);
	});

	test("contract has no keyboard interactions", () => {
		expect(contract.keyboard.global).toHaveLength(0);
	});

	test("contract interactions are all false", () => {
		expect(contract.interactions.modal).toBe(false);
		expect(contract.interactions.selectable).toBe(false);
		expect(contract.interactions.editable).toBe(false);
		expect(contract.interactions.expandable).toBe(false);
	});
});

// =============================================================================
// ARIA ATTRIBUTES
// =============================================================================

describe("banner component — ARIA", () => {
	test("has role='alert'", async () => {
		const { getByRole } = render(Banner);
		const el = getByRole("alert");
		expect(el).toBeTruthy();
	});
});

// =============================================================================
// DATA-STATE DERIVATION
// =============================================================================

describe("banner component — data-state", () => {
	test("data-state is 'visible' by default", async () => {
		const { getByRole } = render(Banner);
		const el = getByRole("alert");
		await expect.element(el).toHaveAttribute("data-state", "visible");
	});
});

// =============================================================================
// RECIPE CLASSES
// =============================================================================

describe("banner component — recipe", () => {
	test("applies recipe base classes", async () => {
		const { getByRole } = render(Banner);
		const el = getByRole("alert");
		await expect.element(el).toHaveClass("relative");
		await expect.element(el).toHaveClass("flex");
	});

	test("merges custom class prop", async () => {
		const { getByRole } = render(Banner, { props: { class: "my-custom" } });
		const el = getByRole("alert");
		await expect.element(el).toHaveClass("my-custom");
	});
});
