/**
 * @file components/box/Box.test.ts
 * @kind box
 * @layer components
 * @package @devpulse/coldlight
 *
 * Box component browser tests.
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { render } from "vitest-browser-svelte";
import { expect, test, describe } from "vitest";
import Box from "./Box.svelte";
import { contract } from "./contract.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("box component — contract", () => {
	test("contract.kind is 'box'", () => {
		expect(contract.kind).toBe("box");
	});

	test("contract.primitiveKind is 'box'", () => {
		expect(contract.primitiveKind).toBe("box");
	});

	test("contract requires slot 'root'", () => {
		expect(contract.slots.required).toContain("root");
	});

	test("contract.interactions.modal is false", () => {
		expect(contract.interactions.modal).toBe(false);
	});
});

// =============================================================================
// STRUCTURAL ATTRIBUTES — data-kind, data-slot
// =============================================================================

describe("box component — structural attributes", () => {
	test("renders with data-kind='box'", async () => {
		const { container } = render(Box);
		const el = container.querySelector("[data-kind='box']");
		expect(el).toBeTruthy();
	});

	test("has data-slot='root'", async () => {
		const { container } = render(Box);
		const el = container.querySelector("[data-kind='box']");
		await expect.element(el!).toHaveAttribute("data-slot", "root");
	});
});

// =============================================================================
// RECIPE CLASSES — padding, radius
// =============================================================================

describe("box component — recipe classes", () => {
	test("applies padding class for padding='md'", async () => {
		const { container } = render(Box, { props: { padding: "md" } });
		const el = container.querySelector("[data-kind='box']");
		await expect.element(el!).toHaveClass("p-4");
	});

	test("applies radius class for radius='lg'", async () => {
		const { container } = render(Box, { props: { radius: "lg" } });
		const el = container.querySelector("[data-kind='box']");
		await expect.element(el!).toHaveClass("rounded-lg");
	});

	test("passes custom class", async () => {
		const { container } = render(Box, { props: { class: "custom-box" } });
		const el = container.querySelector("[data-kind='box']");
		await expect.element(el!).toHaveClass("custom-box");
	});
});
