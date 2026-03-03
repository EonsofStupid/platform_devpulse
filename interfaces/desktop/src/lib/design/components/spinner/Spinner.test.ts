/**
 * @file components/spinner/Spinner.test.ts
 * @kind spinner
 * @layer components
 * @package @devpulse/coldlight
 *
 * Spinner component browser tests.
 * Tests ARIA compliance, data-state derivation, recipe application, and contract shape.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { render } from "vitest-browser-svelte";
import { expect, test, describe } from "vitest";
import { contract } from "./contract.js";
import { Spinner } from "$lib/design/ui/spinner/index.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("spinner component — contract", () => {
	test("contract.kind is 'spinner'", () => {
		expect(contract.kind).toBe("spinner");
	});

	test("contract.primitiveKind is 'spinner'", () => {
		expect(contract.primitiveKind).toBe("spinner");
	});

	test("contract requires slot 'root'", () => {
		expect(contract.slots.required).toContain("root");
	});

	test("contract root slot has role 'status'", () => {
		expect(contract.slotContracts.root.aria.role).toBe("status");
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

describe("spinner component — ARIA", () => {
	test("has role='status'", async () => {
		const { getByRole } = render(Spinner);
		const el = getByRole("status");
		expect(el).toBeTruthy();
	});

	test("has aria-label='Loading' by default when active", async () => {
		const { getByRole } = render(Spinner);
		const el = getByRole("status");
		await expect.element(el).toHaveAttribute("aria-label", "Loading");
	});
});

// =============================================================================
// DATA-STATE DERIVATION
// =============================================================================

describe("spinner component — data-state", () => {
	test("data-state is 'active' by default", async () => {
		const { getByRole } = render(Spinner);
		const el = getByRole("status");
		await expect.element(el).toHaveAttribute("data-state", "active");
	});
});

// =============================================================================
// RECIPE CLASSES
// =============================================================================

describe("spinner component — recipe", () => {
	test("applies recipe base classes", async () => {
		const { getByRole } = render(Spinner);
		const el = getByRole("status");
		await expect.element(el).toHaveClass("inline-block");
		await expect.element(el).toHaveClass("animate-spin");
	});

	test("applies size variant classes", async () => {
		const { getByRole } = render(Spinner, { props: { size: "sm" } });
		const el = getByRole("status");
		await expect.element(el).toHaveClass("h-4");
		await expect.element(el).toHaveClass("w-4");
	});

	test("merges custom class prop", async () => {
		const { getByRole } = render(Spinner, { props: { class: "my-custom" } });
		const el = getByRole("status");
		await expect.element(el).toHaveClass("my-custom");
	});
});
