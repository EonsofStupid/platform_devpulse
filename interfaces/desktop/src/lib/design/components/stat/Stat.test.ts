/**
 * @file components/stat/Stat.test.ts
 * @kind stat
 * @layer components
 * @package @devpulse/coldlight
 *
 * Stat component browser tests.
 * Tests ARIA compliance, recipe application, and contract shape.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { render } from "vitest-browser-svelte";
import { expect, test, describe } from "vitest";
import { contract } from "./contract.js";
import Stat from "./Stat.svelte";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("stat component — contract", () => {
	test("contract.kind is 'stat'", () => {
		expect(contract.kind).toBe("stat");
	});

	test("contract.primitiveKind is 'stat'", () => {
		expect(contract.primitiveKind).toBe("stat");
	});

	test("contract requires slot 'root'", () => {
		expect(contract.slots.required).toContain("root");
	});

	test("contract root slot has role 'group'", () => {
		expect(contract.slotContracts.root.aria.role).toBe("group");
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

describe("stat component — ARIA", () => {
	test("has role='group'", async () => {
		const { getByRole } = render(Stat);
		const el = getByRole("group");
		expect(el).toBeTruthy();
	});
});

// =============================================================================
// RECIPE CLASSES
// =============================================================================

describe("stat component — recipe", () => {
	test("applies recipe base classes", async () => {
		const { getByRole } = render(Stat);
		const el = getByRole("group");
		await expect.element(el).toHaveClass("flex");
		await expect.element(el).toHaveClass("flex-col");
	});

	test("applies md size by default", async () => {
		const { getByRole } = render(Stat);
		const el = getByRole("group");
		await expect.element(el).toHaveClass("gap-1");
	});

	test("applies sm size variant", async () => {
		const { getByRole } = render(Stat, { props: { size: "sm" } });
		const el = getByRole("group");
		await expect.element(el).toHaveClass("text-sm");
	});

	test("applies lg size variant", async () => {
		const { getByRole } = render(Stat, { props: { size: "lg" } });
		const el = getByRole("group");
		await expect.element(el).toHaveClass("text-lg");
	});

	test("merges custom class prop", async () => {
		const { getByRole } = render(Stat, { props: { class: "my-custom" } });
		const el = getByRole("group");
		await expect.element(el).toHaveClass("my-custom");
	});
});
