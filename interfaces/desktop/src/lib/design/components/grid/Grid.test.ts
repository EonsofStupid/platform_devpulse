/**
 * @file components/grid/Grid.test.ts
 * @kind grid
 * @layer components
 * @package @devpulse/coldlight
 *
 * Grid component browser tests.
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { render } from "vitest-browser-svelte";
import { expect, test, describe } from "vitest";
import { Grid } from "./index.js";
import { contract } from "./contract.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("grid component — contract", () => {
	test("contract.kind is 'grid'", () => {
		expect(contract.kind).toBe("grid");
	});

	test("contract.primitiveKind is 'grid'", () => {
		expect(contract.primitiveKind).toBe("grid");
	});

	test("contract requires slot 'root'", () => {
		expect(contract.slots.required).toContain("root");
	});
});

// =============================================================================
// STRUCTURAL ATTRIBUTES
// =============================================================================

describe("grid component — structural attributes", () => {
	test("renders with data-kind='grid'", async () => {
		const { container } = render(Grid);
		const el = container.querySelector("[data-kind='grid']") as HTMLElement;
		expect(el).toBeTruthy();
	});

	test("has data-slot='root'", async () => {
		const { container } = render(Grid);
		const el = container.querySelector("[data-kind='grid']") as HTMLElement;
		await expect.element(el).toHaveAttribute("data-slot", "root");
	});
});

// =============================================================================
// RECIPE CLASSES
// =============================================================================

describe("grid component — recipe classes", () => {
	test("applies grid class by default", async () => {
		const { container } = render(Grid);
		const el = container.querySelector("[data-kind='grid']") as HTMLElement;
		await expect.element(el).toHaveClass("grid");
	});

	test("applies grid-cols-3 for columns='3'", async () => {
		const { container } = render(Grid, { props: { columns: "3" } });
		const el = container.querySelector("[data-kind='grid']") as HTMLElement;
		await expect.element(el).toHaveClass("grid-cols-3");
	});

	test("applies gap-6 for gap='6'", async () => {
		const { container } = render(Grid, { props: { gap: "6" } });
		const el = container.querySelector("[data-kind='grid']") as HTMLElement;
		await expect.element(el).toHaveClass("gap-6");
	});

	test("applies grid-rows-2 for rows='2'", async () => {
		const { container } = render(Grid, { props: { rows: "2" } });
		const el = container.querySelector("[data-kind='grid']") as HTMLElement;
		await expect.element(el).toHaveClass("grid-rows-2");
	});

	test("passes custom class", async () => {
		const { container } = render(Grid, { props: { class: "custom-grid" } });
		const el = container.querySelector("[data-kind='grid']") as HTMLElement;
		await expect.element(el).toHaveClass("custom-grid");
	});
});
