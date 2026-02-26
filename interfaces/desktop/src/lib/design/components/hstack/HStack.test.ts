/**
 * @file components/hstack/HStack.test.ts
 * @kind hstack
 * @layer components
 * @package @devpulse/coldlight
 *
 * HStack component browser tests.
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { render } from "vitest-browser-svelte";
import { expect, test, describe } from "vitest";
import HStack from "./HStack.svelte";
import { contract } from "./contract.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("hstack component — contract", () => {
	test("contract.kind is 'hstack'", () => {
		expect(contract.kind).toBe("hstack");
	});

	test("contract.primitiveKind is 'hstack'", () => {
		expect(contract.primitiveKind).toBe("hstack");
	});

	test("contract requires slot 'root'", () => {
		expect(contract.slots.required).toContain("root");
	});
});

// =============================================================================
// STRUCTURAL ATTRIBUTES
// =============================================================================

describe("hstack component — structural attributes", () => {
	test("renders with data-kind='hstack'", async () => {
		const { container } = render(HStack);
		const el = container.querySelector("[data-kind='hstack']") as HTMLElement;
		expect(el).toBeTruthy();
	});

	test("has data-slot='root'", async () => {
		const { container } = render(HStack);
		const el = container.querySelector("[data-kind='hstack']") as HTMLElement;
		await expect.element(el).toHaveAttribute("data-slot", "root");
	});
});

// =============================================================================
// RECIPE CLASSES
// =============================================================================

describe("hstack component — recipe classes", () => {
	test("applies flex and flex-row by default", async () => {
		const { container } = render(HStack);
		const el = container.querySelector("[data-kind='hstack']") as HTMLElement;
		await expect.element(el).toHaveClass("flex");
		await expect.element(el).toHaveClass("flex-row");
	});

	test("applies gap-4 for gap='4'", async () => {
		const { container } = render(HStack, { props: { gap: "4" } });
		const el = container.querySelector("[data-kind='hstack']") as HTMLElement;
		await expect.element(el).toHaveClass("gap-4");
	});

	test("applies items-center for align='center'", async () => {
		const { container } = render(HStack, { props: { align: "center" } });
		const el = container.querySelector("[data-kind='hstack']") as HTMLElement;
		await expect.element(el).toHaveClass("items-center");
	});

	test("applies items-baseline for align='baseline'", async () => {
		const { container } = render(HStack, { props: { align: "baseline" } });
		const el = container.querySelector("[data-kind='hstack']") as HTMLElement;
		await expect.element(el).toHaveClass("items-baseline");
	});

	test("passes custom class", async () => {
		const { container } = render(HStack, { props: { class: "custom-hstack" } });
		const el = container.querySelector("[data-kind='hstack']") as HTMLElement;
		await expect.element(el).toHaveClass("custom-hstack");
	});
});
