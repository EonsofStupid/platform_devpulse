/**
 * @file components/list/List.test.ts
 * @kind list
 * @layer components
 * @package @devpulse/coldlight
 *
 * List component browser tests.
 * Tests ARIA application, builder attribute binding, composition class application,
 * and prop forwarding through the component layer.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import List from "./List.svelte";

// =============================================================================
// STRUCTURAL ATTRIBUTES — data-kind, data-slot
// =============================================================================

describe("list component — structural attributes", () => {
	test("renders a <ul> element with role='list'", async () => {
		const { getByRole } = await render(List);
		const list = getByRole("list");
		expect(list).toBeTruthy();
	});

	test("has data-kind='list'", async () => {
		const { getByRole } = await render(List);
		const list = getByRole("list");
		await expect.element(list).toHaveAttribute("data-kind", "list");
	});

	test("has data-slot='root'", async () => {
		const { getByRole } = await render(List);
		const list = getByRole("list");
		await expect.element(list).toHaveAttribute("data-slot", "root");
	});
});

// =============================================================================
// ARIA ATTRIBUTES — component layer owns ARIA
// =============================================================================

describe("list component — ARIA attributes", () => {
	test("has role='list'", async () => {
		const { getByRole } = await render(List);
		const list = getByRole("list");
		await expect.element(list).toHaveAttribute("role", "list");
	});

	test("passes aria-label when label prop provided", async () => {
		const { getByRole } = await render(List, { props: { label: "Navigation items" } });
		const list = getByRole("list");
		await expect.element(list).toHaveAttribute("aria-label", "Navigation items");
	});
});

// =============================================================================
// RECIPE CLASSES — variant, size, spacing
// =============================================================================

describe("list component — composition classes", () => {
	test("applies composition classes for default variant", async () => {
		const { getByRole } = await render(List);
		const list = getByRole("list");
		await expect.element(list).toHaveClass("list-none");
	});

	test("applies disc variant", async () => {
		const { getByRole } = await render(List, { props: { variant: "disc" } });
		const list = getByRole("list");
		await expect.element(list).toHaveClass("list-disc");
	});

	test("passes class prop and merges with composition", async () => {
		const { getByRole } = await render(List, { props: { class: "custom-list" } });
		const list = getByRole("list");
		await expect.element(list).toHaveClass("custom-list");
	});
});

// =============================================================================
// PROP PASSTHROUGH — ...rest spread
// =============================================================================

describe("list component — prop passthrough", () => {
	test("forwards id attribute", async () => {
		const { getByRole } = await render(List, { props: { id: "my-list" } });
		const list = getByRole("list");
		await expect.element(list).toHaveAttribute("id", "my-list");
	});
});
