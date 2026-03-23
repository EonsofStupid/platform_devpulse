/**
 * @file components/switch/Switch.test.ts
 * @kind switch
 * @layer components
 * @package @devpulse/coldlight
 *
 * Switch component browser tests.
 * Tests ARIA compliance, data-state derivation, composition application, and contract shape.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import { contract } from "./contract.js";
import Switch from "./Switch.svelte";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("switch component — contract", () => {
	test("contract.kind is 'switch'", () => {
		expect(contract.kind).toBe("switch");
	});

	test("contract.primitiveKind is 'switch'", () => {
		expect(contract.primitiveKind).toBe("switch");
	});

	test("contract requires slot 'root'", () => {
		expect(contract.slots.required).toContain("root");
	});

	test("contract has aria-checked as required ARIA", () => {
		const rootSlot = contract.slotContracts.root;
		const requiredAttrs = rootSlot.aria.required.map((r) => r.attr);
		expect(requiredAttrs).toContain("aria-checked");
	});

	test("contract has Space and Enter keyboard interactions", () => {
		expect(contract.keyboard.global.some((k) => k.key === "Space")).toBe(true);
		expect(contract.keyboard.global.some((k) => k.key === "Enter")).toBe(true);
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

describe("switch component — ARIA", () => {
	test("has role='switch'", async () => {
		const { getByRole } = render(Switch);
		const el = getByRole("switch");
		expect(el).toBeTruthy();
	});

	test("aria-checked is 'false' by default", async () => {
		const { getByRole } = render(Switch);
		const el = getByRole("switch");
		await expect.element(el).toHaveAttribute("aria-checked", "false");
	});

	test("aria-checked is 'true' when checked", async () => {
		const { getByRole } = render(Switch, { props: { checked: true } });
		const el = getByRole("switch");
		await expect.element(el).toHaveAttribute("aria-checked", "true");
	});

	test("aria-disabled is set when disabled", async () => {
		const { getByRole } = render(Switch, { props: { disabled: true } });
		const el = getByRole("switch");
		await expect.element(el).toHaveAttribute("aria-disabled", "true");
	});

	test("aria-disabled is not emitted when not disabled", async () => {
		const { getByRole } = render(Switch);
		const el = getByRole("switch");
		await expect.element(el).not.toHaveAttribute("aria-disabled");
	});
});

// =============================================================================
// DATA-STATE DERIVATION
// =============================================================================

describe("switch component — data-state", () => {
	test("data-state is 'unchecked' by default", async () => {
		const { getByRole } = render(Switch);
		const el = getByRole("switch");
		await expect.element(el).toHaveAttribute("data-state", "unchecked");
	});

	test("data-state is 'checked' when checked", async () => {
		const { getByRole } = render(Switch, { props: { checked: true } });
		const el = getByRole("switch");
		await expect.element(el).toHaveAttribute("data-state", "checked");
	});

	test("data-state is 'disabled' when disabled", async () => {
		const { getByRole } = render(Switch, { props: { disabled: true } });
		const el = getByRole("switch");
		await expect.element(el).toHaveAttribute("data-state", "disabled");
	});
});

// =============================================================================
// THUMB ELEMENT
// =============================================================================

describe("switch component — thumb", () => {
	test("renders a thumb element with aria-hidden", async () => {
		const { container } = render(Switch);
		const thumb = container.querySelector("[data-slot='thumb']");
		expect(thumb).toBeTruthy();
		// biome-ignore lint/style/noNonNullAssertion: test assertion — thumb element verified truthy above
		await expect.element(thumb! as unknown as HTMLElement).toHaveAttribute("aria-hidden", "true");
	});
});

// =============================================================================
// RECIPE CLASSES
// =============================================================================

describe("switch component — composition", () => {
	test("applies composition base classes", async () => {
		const { getByRole } = render(Switch);
		const el = getByRole("switch");
		await expect.element(el).toHaveClass("inline-flex");
		await expect.element(el).toHaveClass("items-center");
	});

	test("merges custom class prop", async () => {
		const { getByRole } = render(Switch, { props: { class: "my-custom" } });
		const el = getByRole("switch");
		await expect.element(el).toHaveClass("my-custom");
	});
});
