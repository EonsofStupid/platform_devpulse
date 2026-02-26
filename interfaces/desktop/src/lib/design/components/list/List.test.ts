/**
 * @file components/list/List.test.ts
 * @kind list
 * @layer components
 * @package @devpulse/coldlight
 *
 * List component browser tests.
 * Tests ARIA application, builder attribute binding, recipe class application,
 * and prop forwarding through the component layer.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { render } from "vitest-browser-svelte";
import { expect, test, describe } from "vitest";
import List from "./List.svelte";
import { contract } from "./contract.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("list component — contract", () => {
	test("contract.kind is 'list'", () => {
		expect(contract.kind).toBe("list");
	});

	test("contract.primitiveKind is 'list'", () => {
		expect(contract.primitiveKind).toBe("list");
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

describe("list component — structural attributes", () => {
	test("renders a <ul> element with role='list'", async () => {
		const { getByRole } = render(List);
		const list = getByRole("list");
		expect(list).toBeTruthy();
	});

	test("has data-kind='list'", async () => {
		const { getByRole } = render(List);
		const list = getByRole("list");
		await expect.element(list).toHaveAttribute("data-kind", "list");
	});

	test("has data-slot='root'", async () => {
		const { getByRole } = render(List);
		const list = getByRole("list");
		await expect.element(list).toHaveAttribute("data-slot", "root");
	});
});

// =============================================================================
// ARIA ATTRIBUTES — component layer owns ARIA
// =============================================================================

describe("list component — ARIA attributes", () => {
	test("has role='list'", async () => {
		const { getByRole } = render(List);
		const list = getByRole("list");
		await expect.element(list).toHaveAttribute("role", "list");
	});

	test("passes aria-label when label prop provided", async () => {
		const { getByRole } = render(List, { props: { label: "Navigation items" } });
		const list = getByRole("list");
		await expect.element(list).toHaveAttribute("aria-label", "Navigation items");
	});
});

// =============================================================================
// RECIPE CLASSES — variant, size, spacing
// =============================================================================

describe("list component — recipe classes", () => {
	test("applies recipe classes for default variant", async () => {
		const { getByRole } = render(List);
		const list = getByRole("list");
		await expect.element(list).toHaveClass("list-none");
	});

	test("applies disc variant", async () => {
		const { getByRole } = render(List, { props: { variant: "disc" } });
		const list = getByRole("list");
		await expect.element(list).toHaveClass("list-disc");
	});

	test("passes class prop and merges with recipe", async () => {
		const { getByRole } = render(List, { props: { class: "custom-list" } });
		const list = getByRole("list");
		await expect.element(list).toHaveClass("custom-list");
	});
});

// =============================================================================
// PROP PASSTHROUGH — ...rest spread
// =============================================================================

describe("list component — prop passthrough", () => {
	test("forwards id attribute", async () => {
		const { getByRole } = render(List, { props: { id: "my-list" } });
		const list = getByRole("list");
		await expect.element(list).toHaveAttribute("id", "my-list");
	});
});
