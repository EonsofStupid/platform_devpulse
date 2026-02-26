/**
 * @file components/callout/Callout.test.ts
 * @kind callout
 * @layer components
 * @package @devpulse/coldlight
 *
 * Callout component browser tests.
 * Tests ARIA compliance, data-state derivation, recipe application, and contract shape.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { render } from "vitest-browser-svelte";
import { expect, test, describe } from "vitest";
import { contract } from "./contract.js";
import Callout from "./Callout.svelte";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("callout component — contract", () => {
	test("contract.kind is 'callout'", () => {
		expect(contract.kind).toBe("callout");
	});

	test("contract.primitiveKind is 'callout'", () => {
		expect(contract.primitiveKind).toBe("callout");
	});

	test("contract requires slot 'root'", () => {
		expect(contract.slots.required).toContain("root");
	});

	test("contract root slot has role 'note'", () => {
		expect(contract.slotContracts.root.aria.role).toBe("note");
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

describe("callout component — ARIA", () => {
	test("has role='note'", async () => {
		const { getByRole } = render(Callout);
		const el = getByRole("note");
		expect(el).toBeTruthy();
	});
});

// =============================================================================
// DATA-STATE DERIVATION
// =============================================================================

describe("callout component — data-state", () => {
	test("data-state is 'info' by default", async () => {
		const { getByRole } = render(Callout);
		const el = getByRole("note");
		await expect.element(el).toHaveAttribute("data-state", "info");
	});

	test("data-state is 'warning' when variant is warning", async () => {
		const { getByRole } = render(Callout, { props: { variant: "warning" } });
		const el = getByRole("note");
		await expect.element(el).toHaveAttribute("data-state", "warning");
	});

	test("data-state is 'tip' when variant is tip", async () => {
		const { getByRole } = render(Callout, { props: { variant: "tip" } });
		const el = getByRole("note");
		await expect.element(el).toHaveAttribute("data-state", "tip");
	});
});

// =============================================================================
// RECIPE CLASSES
// =============================================================================

describe("callout component — recipe", () => {
	test("applies recipe base classes", async () => {
		const { getByRole } = render(Callout);
		const el = getByRole("note");
		await expect.element(el).toHaveClass("relative");
		await expect.element(el).toHaveClass("flex");
	});

	test("merges custom class prop", async () => {
		const { getByRole } = render(Callout, { props: { class: "my-custom" } });
		const el = getByRole("note");
		await expect.element(el).toHaveClass("my-custom");
	});
});
