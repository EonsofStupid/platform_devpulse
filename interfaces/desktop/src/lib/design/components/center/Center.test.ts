/**
 * @file components/center/Center.test.ts
 * @kind center
 * @layer components
 * @package @devpulse/coldlight
 *
 * Center component browser tests.
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { render } from "vitest-browser-svelte";
import { expect, test, describe } from "vitest";
import Center from "./Center.svelte";
import { contract } from "./contract.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("center component — contract", () => {
	test("contract.kind is 'center'", () => {
		expect(contract.kind).toBe("center");
	});

	test("contract.primitiveKind is 'center'", () => {
		expect(contract.primitiveKind).toBe("center");
	});

	test("contract requires slot 'root'", () => {
		expect(contract.slots.required).toContain("root");
	});
});

// =============================================================================
// STRUCTURAL ATTRIBUTES
// =============================================================================

describe("center component — structural attributes", () => {
	test("renders with data-kind='center'", async () => {
		const { container } = render(Center);
		const el = container.querySelector("[data-kind='center']");
		expect(el).toBeTruthy();
	});

	test("has data-slot='root'", async () => {
		const { container } = render(Center);
		const el = container.querySelector("[data-kind='center']");
		await expect.element(el!).toHaveAttribute("data-slot", "root");
	});
});

// =============================================================================
// RECIPE CLASSES
// =============================================================================

describe("center component — recipe classes", () => {
	test("applies flex centering by default", async () => {
		const { container } = render(Center);
		const el = container.querySelector("[data-kind='center']");
		await expect.element(el!).toHaveClass("flex");
		await expect.element(el!).toHaveClass("items-center");
		await expect.element(el!).toHaveClass("justify-center");
	});

	test("applies inline-flex when inline=true", async () => {
		const { container } = render(Center, { props: { inline: true } });
		const el = container.querySelector("[data-kind='center']");
		await expect.element(el!).toHaveClass("inline-flex");
		await expect.element(el!).toHaveClass("items-center");
		await expect.element(el!).toHaveClass("justify-center");
	});

	test("passes custom class", async () => {
		const { container } = render(Center, { props: { class: "custom-center" } });
		const el = container.querySelector("[data-kind='center']");
		await expect.element(el!).toHaveClass("custom-center");
	});
});
