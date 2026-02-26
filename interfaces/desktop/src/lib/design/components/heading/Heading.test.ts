/**
 * @file components/heading/Heading.test.ts
 * @kind heading
 * @layer components
 * @package @devpulse/coldlight
 *
 * Heading component browser tests.
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { render } from "vitest-browser-svelte";
import { expect, test, describe } from "vitest";
import Heading from "./Heading.svelte";
import { contract } from "./contract.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("heading component — contract", () => {
	test("contract.kind is 'heading'", () => {
		expect(contract.kind).toBe("heading");
	});

	test("contract.primitiveKind is 'heading'", () => {
		expect(contract.primitiveKind).toBe("heading");
	});

	test("contract requires slot 'root'", () => {
		expect(contract.slots.required).toContain("root");
	});
});

// =============================================================================
// STRUCTURAL ATTRIBUTES
// =============================================================================

describe("heading component — structural attributes", () => {
	test("renders with data-kind='heading'", async () => {
		const { container } = render(Heading);
		const el = container.querySelector("[data-kind='heading']");
		expect(el).toBeTruthy();
	});

	test("has data-slot='root'", async () => {
		const { container } = render(Heading);
		const el = container.querySelector("[data-kind='heading']");
		await expect.element(el!).toHaveAttribute("data-slot", "root");
	});

	test("renders as <h2> by default", async () => {
		const { container } = render(Heading);
		const el = container.querySelector("[data-kind='heading']");
		expect(el!.tagName.toLowerCase()).toBe("h2");
	});

	test("renders as <h1> when level=1", async () => {
		const { container } = render(Heading, { props: { level: 1 } });
		const el = container.querySelector("[data-kind='heading']");
		expect(el!.tagName.toLowerCase()).toBe("h1");
	});

	test("renders as <h3> when level=3", async () => {
		const { container } = render(Heading, { props: { level: 3 } });
		const el = container.querySelector("[data-kind='heading']");
		expect(el!.tagName.toLowerCase()).toBe("h3");
	});
});

// =============================================================================
// ARIA ATTRIBUTES
// =============================================================================

describe("heading component — ARIA attributes", () => {
	test("has role='heading'", async () => {
		const { container } = render(Heading);
		const el = container.querySelector("[data-kind='heading']");
		await expect.element(el!).toHaveAttribute("role", "heading");
	});

	test("has aria-level matching heading level", async () => {
		const { container } = render(Heading, { props: { level: 3 } });
		const el = container.querySelector("[data-kind='heading']");
		await expect.element(el!).toHaveAttribute("aria-level", "3");
	});
});

// =============================================================================
// RECIPE CLASSES
// =============================================================================

describe("heading component — recipe classes", () => {
	test("applies font-bold by default", async () => {
		const { container } = render(Heading);
		const el = container.querySelector("[data-kind='heading']");
		await expect.element(el!).toHaveClass("font-bold");
	});

	test("applies text-xl for size='lg' (default)", async () => {
		const { container } = render(Heading);
		const el = container.querySelector("[data-kind='heading']");
		await expect.element(el!).toHaveClass("text-xl");
	});

	test("applies text-3xl for size='2xl'", async () => {
		const { container } = render(Heading, { props: { size: "2xl" } });
		const el = container.querySelector("[data-kind='heading']");
		await expect.element(el!).toHaveClass("text-3xl");
	});

	test("passes custom class", async () => {
		const { container } = render(Heading, { props: { class: "custom-heading" } });
		const el = container.querySelector("[data-kind='heading']");
		await expect.element(el!).toHaveClass("custom-heading");
	});
});
