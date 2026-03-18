/**
 * @file components/prose/Prose.test.ts
 * @kind prose
 * @layer components
 * @package @devpulse/coldlight
 *
 * Prose component browser tests.
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import { contract } from "./contract.js";
import Prose from "./Prose.svelte";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("prose component — contract", () => {
	test("contract.kind is 'prose'", () => {
		expect(contract.kind).toBe("prose");
	});

	test("contract.primitiveKind is 'prose'", () => {
		expect(contract.primitiveKind).toBe("prose");
	});

	test("contract requires slot 'root'", () => {
		expect(contract.slots.required).toContain("root");
	});
});

// =============================================================================
// STRUCTURAL ATTRIBUTES
// =============================================================================

describe("prose component — structural attributes", () => {
	test("renders with data-kind='prose'", async () => {
		const { container } = render(Prose);
		const el = container.querySelector("[data-kind='prose']") as HTMLElement;
		expect(el).toBeTruthy();
	});

	test("has data-slot='root'", async () => {
		const { container } = render(Prose);
		const el = container.querySelector("[data-kind='prose']") as HTMLElement;
		await expect.element(el).toHaveAttribute("data-slot", "root");
	});
});

// =============================================================================
// RECIPE CLASSES
// =============================================================================

describe("prose component — recipe classes", () => {
	test("applies prose class by default", async () => {
		const { container } = render(Prose);
		const el = container.querySelector("[data-kind='prose']") as HTMLElement;
		await expect.element(el).toHaveClass("prose");
	});

	test("applies prose-invert for dark theme", async () => {
		const { container } = render(Prose);
		const el = container.querySelector("[data-kind='prose']") as HTMLElement;
		await expect.element(el).toHaveClass("prose-invert");
	});

	test("applies prose-base by default", async () => {
		const { container } = render(Prose);
		const el = container.querySelector("[data-kind='prose']") as HTMLElement;
		await expect.element(el).toHaveClass("prose-base");
	});

	test("applies prose-sm for size='sm'", async () => {
		const { container } = render(Prose, { props: { size: "sm" } });
		const el = container.querySelector("[data-kind='prose']") as HTMLElement;
		await expect.element(el).toHaveClass("prose-sm");
	});

	test("applies prose-lg for size='lg'", async () => {
		const { container } = render(Prose, { props: { size: "lg" } });
		const el = container.querySelector("[data-kind='prose']") as HTMLElement;
		await expect.element(el).toHaveClass("prose-lg");
	});

	test("passes custom class", async () => {
		const { container } = render(Prose, { props: { class: "custom-prose" } });
		const el = container.querySelector("[data-kind='prose']") as HTMLElement;
		await expect.element(el).toHaveClass("custom-prose");
	});
});
