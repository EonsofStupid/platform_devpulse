/**
 * @file components/alert/Alert.test.ts
 * @kind alert
 * @layer components
 * @package @devpulse/coldlight
 *
 * Alert component browser tests.
 * Tests ARIA compliance, data-state derivation, recipe application, and contract shape.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import { contract } from "./contract.js";
import { Alert } from "./index.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("alert component — contract", () => {
	test("contract.kind is 'alert'", () => {
		expect(contract.kind).toBe("alert");
	});

	test("contract.primitiveKind is 'alert'", () => {
		expect(contract.primitiveKind).toBe("alert");
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

describe("alert component — ARIA", () => {
	test("has role='alert'", async () => {
		const { getByRole } = render(Alert);
		const el = getByRole("alert");
		expect(el).toBeTruthy();
	});
});

// =============================================================================
// DATA-STATE DERIVATION
// =============================================================================

describe("alert component — data-state", () => {
	test("data-state is 'info' by default", async () => {
		const { getByRole } = render(Alert);
		const el = getByRole("alert");
		await expect.element(el).toHaveAttribute("data-state", "info");
	});

	test("data-state is 'success' when intent is success", async () => {
		const { getByRole } = render(Alert, { props: { intent: "success" } });
		const el = getByRole("alert");
		await expect.element(el).toHaveAttribute("data-state", "success");
	});

	test("data-state is 'warning' when intent is warning", async () => {
		const { getByRole } = render(Alert, { props: { intent: "warning" } });
		const el = getByRole("alert");
		await expect.element(el).toHaveAttribute("data-state", "warning");
	});

	test("data-state is 'error' when intent is error", async () => {
		const { getByRole } = render(Alert, { props: { intent: "error" } });
		const el = getByRole("alert");
		await expect.element(el).toHaveAttribute("data-state", "error");
	});
});

// =============================================================================
// CLOSABLE BEHAVIOR
// =============================================================================

describe("alert component — closable", () => {
	test("does not render close button by default", async () => {
		const { container } = render(Alert);
		const closeBtn = container.querySelector("[aria-label='Close alert']");
		expect(closeBtn).toBeNull();
	});

	test("renders close button when closable", async () => {
		const { container } = render(Alert, { props: { closable: true } });
		const closeBtn = container.querySelector("[aria-label='Close alert']");
		expect(closeBtn).toBeTruthy();
	});
});

// =============================================================================
// RECIPE CLASSES
// =============================================================================

describe("alert component — recipe", () => {
	test("applies recipe base classes", async () => {
		const { getByRole } = render(Alert);
		const el = getByRole("alert");
		await expect.element(el).toHaveClass("relative");
		await expect.element(el).toHaveClass("flex");
	});

	test("merges custom class prop", async () => {
		const { getByRole } = render(Alert, { props: { class: "my-custom" } });
		const el = getByRole("alert");
		await expect.element(el).toHaveClass("my-custom");
	});
});
