/**
 * @file components/stack/Stack.test.ts
 * @kind stack
 * @layer components
 * @package @devpulse/coldlight
 *
 * Stack component browser tests.
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { render } from "vitest-browser-svelte";
import { expect, test, describe } from "vitest";
import Stack from "./Stack.svelte";
import { contract } from "./contract.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("stack component — contract", () => {
	test("contract.kind is 'stack'", () => {
		expect(contract.kind).toBe("stack");
	});

	test("contract.primitiveKind is 'stack'", () => {
		expect(contract.primitiveKind).toBe("stack");
	});

	test("contract requires slot 'root'", () => {
		expect(contract.slots.required).toContain("root");
	});
});

// =============================================================================
// STRUCTURAL ATTRIBUTES
// =============================================================================

describe("stack component — structural attributes", () => {
	test("renders with data-kind='stack'", async () => {
		const { container } = render(Stack);
		const el = container.querySelector("[data-kind='stack']") as HTMLElement;
		expect(el).toBeTruthy();
	});

	test("has data-slot='root'", async () => {
		const { container } = render(Stack);
		const el = container.querySelector("[data-kind='stack']") as HTMLElement;
		await expect.element(el).toHaveAttribute("data-slot", "root");
	});
});

// =============================================================================
// RECIPE CLASSES
// =============================================================================

describe("stack component — recipe classes", () => {
	test("applies flex and flex-col by default", async () => {
		const { container } = render(Stack);
		const el = container.querySelector("[data-kind='stack']") as HTMLElement;
		await expect.element(el).toHaveClass("flex");
		await expect.element(el).toHaveClass("flex-col");
	});

	test("applies gap-4 for gap='4'", async () => {
		const { container } = render(Stack, { props: { gap: "4" } });
		const el = container.querySelector("[data-kind='stack']") as HTMLElement;
		await expect.element(el).toHaveClass("gap-4");
	});

	test("applies items-center for align='center'", async () => {
		const { container } = render(Stack, { props: { align: "center" } });
		const el = container.querySelector("[data-kind='stack']") as HTMLElement;
		await expect.element(el).toHaveClass("items-center");
	});

	test("passes custom class", async () => {
		const { container } = render(Stack, { props: { class: "custom-stack" } });
		const el = container.querySelector("[data-kind='stack']") as HTMLElement;
		await expect.element(el).toHaveClass("custom-stack");
	});
});
