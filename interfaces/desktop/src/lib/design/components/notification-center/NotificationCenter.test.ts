/**
 * @file components/notification-center/NotificationCenter.test.ts
 * @kind notification-center
 * @layer components
 * @package @devpulse/coldlight
 *
 * NotificationCenter component browser tests.
 * Tests ARIA compliance, data-state derivation, recipe application, and contract shape.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import { contract } from "./contract.js";
import NotificationCenter from "./NotificationCenter.svelte";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("notification-center component — contract", () => {
	test("contract.kind is 'notification-center'", () => {
		expect(contract.kind).toBe("notification-center");
	});

	test("contract.primitiveKind is 'notification-center'", () => {
		expect(contract.primitiveKind).toBe("notification-center");
	});

	test("contract requires slot 'root'", () => {
		expect(contract.slots.required).toContain("root");
	});

	test("contract root slot has role 'log'", () => {
		expect(contract.slotContracts.root.aria.role).toBe("log");
	});

	test("contract has no required ARIA attrs on root", () => {
		expect(contract.slotContracts.root.aria.required).toHaveLength(0);
	});

	test("contract has Escape keyboard interaction", () => {
		expect(contract.keyboard.global).toHaveLength(1);
		expect(contract.keyboard.global[0].key).toBe("Escape");
	});

	test("contract.interactions.expandable is true", () => {
		expect(contract.interactions.expandable).toBe(true);
	});
});

// =============================================================================
// ARIA ATTRIBUTES
// =============================================================================

describe("notification-center component — ARIA", () => {
	test("has role='log'", async () => {
		const { getByRole } = render(NotificationCenter);
		const el = getByRole("log");
		expect(el).toBeTruthy();
	});

	test("has aria-live='polite'", async () => {
		const { getByRole } = render(NotificationCenter);
		const el = getByRole("log");
		await expect.element(el).toHaveAttribute("aria-live", "polite");
	});

	test("has aria-relevant='additions'", async () => {
		const { getByRole } = render(NotificationCenter);
		const el = getByRole("log");
		await expect.element(el).toHaveAttribute("aria-relevant", "additions");
	});
});

// =============================================================================
// DATA-STATE DERIVATION
// =============================================================================

describe("notification-center component — data-state", () => {
	test("data-state is 'closed' by default", async () => {
		const { getByRole } = render(NotificationCenter);
		const el = getByRole("log");
		await expect.element(el).toHaveAttribute("data-state", "closed");
	});

	test("data-state is 'open' when open is true", async () => {
		const { getByRole } = render(NotificationCenter, { props: { open: true } });
		const el = getByRole("log");
		await expect.element(el).toHaveAttribute("data-state", "open");
	});
});

// =============================================================================
// RECIPE CLASSES
// =============================================================================

describe("notification-center component — recipe", () => {
	test("applies recipe base classes", async () => {
		const { getByRole } = render(NotificationCenter);
		const el = getByRole("log");
		await expect.element(el).toHaveClass("flex");
		await expect.element(el).toHaveClass("flex-col");
	});

	test("merges custom class prop", async () => {
		const { getByRole } = render(NotificationCenter, { props: { class: "my-custom" } });
		const el = getByRole("log");
		await expect.element(el).toHaveClass("my-custom");
	});
});
