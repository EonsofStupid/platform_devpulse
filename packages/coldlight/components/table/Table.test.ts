/**
 * @file components/table/Table.test.ts
 * @kind table
 * @layer components
 * @package @devpulse/coldlight
 *
 * Table component browser tests.
 * Tests ARIA application, builder attribute binding, composition class application,
 * and prop forwarding through the component layer.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import Table from "./Table.svelte";

// =============================================================================
// STRUCTURAL ATTRIBUTES — data-kind, data-slot
// =============================================================================

describe("table component — structural attributes", () => {
	test("renders a <table> element with role='table'", async () => {
		const { getByRole } = await render(Table);
		const table = getByRole("table");
		expect(table).toBeTruthy();
	});

	test("has data-kind='table'", async () => {
		const { getByRole } = await render(Table);
		const table = getByRole("table");
		await expect.element(table).toHaveAttribute("data-kind", "table");
	});

	test("has data-slot='root'", async () => {
		const { getByRole } = await render(Table);
		const table = getByRole("table");
		await expect.element(table).toHaveAttribute("data-slot", "root");
	});
});

// =============================================================================
// ARIA ATTRIBUTES — component layer owns ARIA
// =============================================================================

describe("table component — ARIA attributes", () => {
	test("has role='table'", async () => {
		const { getByRole } = await render(Table);
		const table = getByRole("table");
		await expect.element(table).toHaveAttribute("role", "table");
	});

	test("passes aria-label when label prop provided", async () => {
		const { getByRole } = await render(Table, { props: { label: "User data" } });
		const table = getByRole("table");
		await expect.element(table).toHaveAttribute("aria-label", "User data");
	});
});

// =============================================================================
// RECIPE CLASSES — variant and size
// =============================================================================

describe("table component — composition classes", () => {
	test("applies composition classes for default variant", async () => {
		const { getByRole } = await render(Table);
		const table = getByRole("table");
		await expect.element(table).toHaveClass("w-full");
	});

	test("passes class prop and merges with composition", async () => {
		const { getByRole } = await render(Table, { props: { class: "custom-table" } });
		const table = getByRole("table");
		await expect.element(table).toHaveClass("custom-table");
	});
});

// =============================================================================
// PROP PASSTHROUGH — ...rest spread
// =============================================================================

describe("table component — prop passthrough", () => {
	test("forwards id attribute", async () => {
		const { getByRole } = await render(Table, { props: { id: "my-table" } });
		const table = getByRole("table");
		await expect.element(table).toHaveAttribute("id", "my-table");
	});
});
