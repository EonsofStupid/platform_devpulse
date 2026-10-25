/**
 * @file components/flex/Flex.test.ts
 * @kind flex
 * @layer components
 * @package @devpulse/coldlight
 *
 * Flex component browser tests.
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import { contract } from "./contract.js";
import Flex from "./Flex.svelte";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("flex component — contract", () => {
	test("contract.kind is 'flex'", () => {
		expect(contract.kind).toBe("flex");
	});

	test("contract.primitiveKind is 'flex'", () => {
		expect(contract.primitiveKind).toBe("flex");
	});

	test("contract requires slot 'root'", () => {
		expect(contract.slots.required).toContain("root");
	});
});

// =============================================================================
// STRUCTURAL ATTRIBUTES
// =============================================================================

describe("flex component — structural attributes", () => {
	test("renders with data-kind='flex'", async () => {
		const { container } = render(Flex);
		const el = container.querySelector("[data-kind='flex']") as HTMLElement;
		expect(el).toBeTruthy();
	});

	test("has data-slot='root'", async () => {
		const { container } = render(Flex);
		const el = container.querySelector("[data-kind='flex']") as HTMLElement;
		await expect.element(el).toHaveAttribute("data-slot", "root");
	});
});

// =============================================================================
// RECIPE CLASSES
// =============================================================================

describe("flex component — recipe classes", () => {
	test("applies flex class by default", async () => {
		const { container } = render(Flex);
		const el = container.querySelector("[data-kind='flex']") as HTMLElement;
		await expect.element(el).toHaveClass("flex");
	});

	test("applies flex-col for direction='column'", async () => {
		const { container } = render(Flex, { props: { direction: "column" } });
		const el = container.querySelector("[data-kind='flex']") as HTMLElement;
		await expect.element(el).toHaveClass("flex-col");
	});

	test("applies gap-4 for gap='4'", async () => {
		const { container } = render(Flex, { props: { gap: "4" } });
		const el = container.querySelector("[data-kind='flex']") as HTMLElement;
		await expect.element(el).toHaveClass("gap-4");
	});

	test("applies items-center for align='center'", async () => {
		const { container } = render(Flex, { props: { align: "center" } });
		const el = container.querySelector("[data-kind='flex']") as HTMLElement;
		await expect.element(el).toHaveClass("items-center");
	});

	test("applies justify-between for justify='between'", async () => {
		const { container } = render(Flex, { props: { justify: "between" } });
		const el = container.querySelector("[data-kind='flex']") as HTMLElement;
		await expect.element(el).toHaveClass("justify-between");
	});

	test("applies flex-wrap when wrap=true", async () => {
		const { container } = render(Flex, { props: { wrap: true } });
		const el = container.querySelector("[data-kind='flex']") as HTMLElement;
		await expect.element(el).toHaveClass("flex-wrap");
	});

	test("passes custom class", async () => {
		const { container } = render(Flex, { props: { class: "custom-flex" } });
		const el = container.querySelector("[data-kind='flex']") as HTMLElement;
		await expect.element(el).toHaveClass("custom-flex");
	});
});
