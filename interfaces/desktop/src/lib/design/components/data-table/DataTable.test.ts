/**
 * @file components/data-table/DataTable.test.ts
 * @kind data-table
 * @layer components
 * @package @devpulse/coldlight
 *
 * DataTable component browser tests.
 * Tests ARIA application, builder attribute binding, composition class application,
 * and prop forwarding through the component layer.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import { contract } from "./contract.js";
import DataTable from "./DataTable.svelte";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("data-table component — contract", () => {
	test("contract.kind is 'data-table'", () => {
		expect(contract.kind).toBe("data-table");
	});

	test("contract.primitiveKind is 'data-table'", () => {
		expect(contract.primitiveKind).toBe("data-table");
	});

	test("contract requires slot 'root'", () => {
		expect(contract.slots.required).toContain("root");
	});

	test("contract.interactions.selectable is true", () => {
		expect(contract.interactions.selectable).toBe(true);
	});

	test("contract.interactions.modal is false", () => {
		expect(contract.interactions.modal).toBe(false);
	});
});

// =============================================================================
// STRUCTURAL ATTRIBUTES — data-kind, data-slot
// =============================================================================

describe("data-table component — structural attributes", () => {
	test("renders a wrapper <div> element", async () => {
		const { container } = render(DataTable);
		const root = container.querySelector("[data-kind='data-table']") as HTMLElement;
		expect(root).toBeTruthy();
	});

	test("has data-kind='data-table'", async () => {
		const { container } = render(DataTable);
		const root = container.querySelector("[data-kind='data-table']") as HTMLElement;
		await expect.element(root).toHaveAttribute("data-kind", "data-table");
	});

	test("has data-slot='root'", async () => {
		const { container } = render(DataTable);
		const root = container.querySelector("[data-kind='data-table']") as HTMLElement;
		await expect.element(root).toHaveAttribute("data-slot", "root");
	});
});

// =============================================================================
// RECIPE CLASSES — variant and size
// =============================================================================

describe("data-table component — composition classes", () => {
	test("applies composition classes for default variant", async () => {
		const { container } = render(DataTable);
		const root = container.querySelector("[data-kind='data-table']") as HTMLElement;
		await expect.element(root).toHaveClass("w-full");
	});

	test("passes class prop and merges with composition", async () => {
		const { container } = render(DataTable, { props: { class: "custom-dt" } });
		const root = container.querySelector("[data-kind='data-table']") as HTMLElement;
		await expect.element(root).toHaveClass("custom-dt");
	});
});

// =============================================================================
// PROP PASSTHROUGH — ...rest spread
// =============================================================================

describe("data-table component — prop passthrough", () => {
	test("forwards id attribute", async () => {
		const { container } = render(DataTable, { props: { id: "my-data-table" } });
		const root = container.querySelector("[data-kind='data-table']") as HTMLElement;
		await expect.element(root).toHaveAttribute("id", "my-data-table");
	});
});
