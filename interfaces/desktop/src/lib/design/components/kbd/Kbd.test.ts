/**
 * @file components/kbd/Kbd.test.ts
 * @kind kbd
 * @layer components
 * @package @devpulse/coldlight
 *
 * Kbd component browser tests.
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { render } from "vitest-browser-svelte";
import { expect, test, describe } from "vitest";
import Kbd from "./Kbd.svelte";
import { contract } from "./contract.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("kbd component — contract", () => {
	test("contract.kind is 'kbd'", () => {
		expect(contract.kind).toBe("kbd");
	});

	test("contract.primitiveKind is 'kbd'", () => {
		expect(contract.primitiveKind).toBe("kbd");
	});

	test("contract requires slot 'root'", () => {
		expect(contract.slots.required).toContain("root");
	});
});

// =============================================================================
// STRUCTURAL ATTRIBUTES
// =============================================================================

describe("kbd component — structural attributes", () => {
	test("renders with data-kind='kbd'", async () => {
		const { container } = render(Kbd);
		const el = container.querySelector("[data-kind='kbd']") as HTMLElement;
		expect(el).toBeTruthy();
	});

	test("has data-slot='root'", async () => {
		const { container } = render(Kbd);
		const el = container.querySelector("[data-kind='kbd']") as HTMLElement;
		await expect.element(el).toHaveAttribute("data-slot", "root");
	});

	test("renders as <kbd> element", async () => {
		const { container } = render(Kbd);
		const el = container.querySelector("[data-kind='kbd']") as HTMLElement;
		expect(el.tagName.toLowerCase()).toBe("kbd");
	});
});

// =============================================================================
// RECIPE CLASSES
// =============================================================================

describe("kbd component — recipe classes", () => {
	test("applies base keycap styling", async () => {
		const { container } = render(Kbd);
		const el = container.querySelector("[data-kind='kbd']") as HTMLElement;
		await expect.element(el).toHaveClass("font-mono");
		await expect.element(el).toHaveClass("inline-flex");
	});

	test("applies text-xs for size='sm'", async () => {
		const { container } = render(Kbd, { props: { size: "sm" } });
		const el = container.querySelector("[data-kind='kbd']") as HTMLElement;
		await expect.element(el).toHaveClass("text-xs");
	});

	test("applies text-sm for size='md' (default)", async () => {
		const { container } = render(Kbd);
		const el = container.querySelector("[data-kind='kbd']") as HTMLElement;
		await expect.element(el).toHaveClass("text-sm");
	});

	test("applies text-base for size='lg'", async () => {
		const { container } = render(Kbd, { props: { size: "lg" } });
		const el = container.querySelector("[data-kind='kbd']") as HTMLElement;
		await expect.element(el).toHaveClass("text-base");
	});

	test("passes custom class", async () => {
		const { container } = render(Kbd, { props: { class: "custom-kbd" } });
		const el = container.querySelector("[data-kind='kbd']") as HTMLElement;
		await expect.element(el).toHaveClass("custom-kbd");
	});
});
