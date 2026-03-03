/**
 * @file components/empty-state/EmptyState.test.ts
 * @kind empty-state
 * @layer components
 * @package @devpulse/coldlight
 *
 * EmptyState component browser tests.
 * Tests ARIA compliance, recipe application, and contract shape.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { render } from "vitest-browser-svelte";
import { expect, test, describe } from "vitest";
import { contract } from "./contract.js";
import { EmptyState } from "$lib/design/ui/empty-state/index.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("empty-state component — contract", () => {
	test("contract.kind is 'empty-state'", () => {
		expect(contract.kind).toBe("empty-state");
	});

	test("contract.primitiveKind is 'empty-state'", () => {
		expect(contract.primitiveKind).toBe("empty-state");
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

describe("empty-state component — ARIA", () => {
	test("has role='status'", async () => {
		const { getByRole } = render(EmptyState);
		const el = getByRole("status");
		expect(el).toBeTruthy();
	});
});

// =============================================================================
// RECIPE CLASSES
// =============================================================================

describe("empty-state component — recipe", () => {
	test("applies recipe base classes", async () => {
		const { getByRole } = render(EmptyState);
		const el = getByRole("status");
		await expect.element(el).toHaveClass("flex");
		await expect.element(el).toHaveClass("flex-col");
		await expect.element(el).toHaveClass("text-center");
	});

	test("applies md size by default", async () => {
		const { getByRole } = render(EmptyState);
		const el = getByRole("status");
		await expect.element(el).toHaveClass("p-8");
	});

	test("applies sm size variant", async () => {
		const { getByRole } = render(EmptyState, { props: { size: "sm" } });
		const el = getByRole("status");
		await expect.element(el).toHaveClass("p-6");
	});

	test("applies lg size variant", async () => {
		const { getByRole } = render(EmptyState, { props: { size: "lg" } });
		const el = getByRole("status");
		await expect.element(el).toHaveClass("p-12");
	});

	test("merges custom class prop", async () => {
		const { getByRole } = render(EmptyState, { props: { class: "my-custom" } });
		const el = getByRole("status");
		await expect.element(el).toHaveClass("my-custom");
	});
});
