/**
 * @file components/skeleton/Skeleton.test.ts
 * @kind skeleton
 * @layer components
 * @package @devpulse/coldlight
 *
 * Skeleton component browser tests.
 * Tests ARIA compliance, data-state derivation, composition application, and contract shape.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import { contract } from "./contract.js";
import { Skeleton } from "./index.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("skeleton component — contract", () => {
	test("contract.kind is 'skeleton'", () => {
		expect(contract.kind).toBe("skeleton");
	});

	test("contract.primitiveKind is 'skeleton'", () => {
		expect(contract.primitiveKind).toBe("skeleton");
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

describe("skeleton component — ARIA", () => {
	test("has role='status'", async () => {
		const { getByRole } = render(Skeleton);
		const el = getByRole("status");
		expect(el).toBeTruthy();
	});

	test("has aria-busy='true' when loading", async () => {
		const { getByRole } = render(Skeleton);
		const el = getByRole("status");
		await expect.element(el).toHaveAttribute("aria-busy", "true");
	});

	test("has aria-label='Loading'", async () => {
		const { getByRole } = render(Skeleton);
		const el = getByRole("status");
		await expect.element(el).toHaveAttribute("aria-label", "Loading");
	});
});

// =============================================================================
// DATA-STATE DERIVATION
// =============================================================================

describe("skeleton component — data-state", () => {
	test("data-state is 'loading' by default", async () => {
		const { getByRole } = render(Skeleton);
		const el = getByRole("status");
		await expect.element(el).toHaveAttribute("data-state", "loading");
	});
});

// =============================================================================
// RECIPE CLASSES
// =============================================================================

describe("skeleton component — composition", () => {
	test("applies composition base classes", async () => {
		const { getByRole } = render(Skeleton);
		const el = getByRole("status");
		await expect.element(el).toHaveClass("animate-pulse");
	});

	test("applies text variant by default", async () => {
		const { getByRole } = render(Skeleton);
		const el = getByRole("status");
		await expect.element(el).toHaveClass("rounded");
	});

	test("applies circular variant", async () => {
		const { getByRole } = render(Skeleton, { props: { variant: "circular" } });
		const el = getByRole("status");
		await expect.element(el).toHaveClass("rounded-full");
	});

	test("merges custom class prop", async () => {
		const { getByRole } = render(Skeleton, { props: { class: "my-custom" } });
		const el = getByRole("status");
		await expect.element(el).toHaveClass("my-custom");
	});
});
