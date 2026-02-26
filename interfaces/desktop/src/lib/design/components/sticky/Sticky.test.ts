/**
 * @file components/sticky/Sticky.test.ts
 * @kind sticky
 * @layer components
 * @package @devpulse/coldlight
 *
 * Sticky component browser tests.
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { render } from "vitest-browser-svelte";
import { expect, test, describe } from "vitest";
import Sticky from "./Sticky.svelte";
import { contract } from "./contract.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("sticky component — contract", () => {
	test("contract.kind is 'sticky'", () => {
		expect(contract.kind).toBe("sticky");
	});

	test("contract.primitiveKind is 'sticky'", () => {
		expect(contract.primitiveKind).toBe("sticky");
	});

	test("contract requires slot 'root'", () => {
		expect(contract.slots.required).toContain("root");
	});
});

// =============================================================================
// STRUCTURAL ATTRIBUTES
// =============================================================================

describe("sticky component — structural attributes", () => {
	test("renders with data-kind='sticky'", async () => {
		const { container } = render(Sticky);
		const el = container.querySelector("[data-kind='sticky']") as HTMLElement;
		expect(el).toBeTruthy();
	});

	test("has data-slot='root'", async () => {
		const { container } = render(Sticky);
		const el = container.querySelector("[data-kind='sticky']") as HTMLElement;
		await expect.element(el).toHaveAttribute("data-slot", "root");
	});
});

// =============================================================================
// RECIPE CLASSES
// =============================================================================

describe("sticky component — recipe classes", () => {
	test("applies sticky and top-0 by default", async () => {
		const { container } = render(Sticky);
		const el = container.querySelector("[data-kind='sticky']") as HTMLElement;
		await expect.element(el).toHaveClass("sticky");
		await expect.element(el).toHaveClass("top-0");
	});

	test("applies top-4 for top='4'", async () => {
		const { container } = render(Sticky, { props: { top: "4" } });
		const el = container.querySelector("[data-kind='sticky']") as HTMLElement;
		await expect.element(el).toHaveClass("top-4");
	});

	test("applies z-20 for offset='md'", async () => {
		const { container } = render(Sticky, { props: { offset: "md" } });
		const el = container.querySelector("[data-kind='sticky']") as HTMLElement;
		await expect.element(el).toHaveClass("z-20");
	});

	test("passes custom class", async () => {
		const { container } = render(Sticky, { props: { class: "custom-sticky" } });
		const el = container.querySelector("[data-kind='sticky']") as HTMLElement;
		await expect.element(el).toHaveClass("custom-sticky");
	});
});
