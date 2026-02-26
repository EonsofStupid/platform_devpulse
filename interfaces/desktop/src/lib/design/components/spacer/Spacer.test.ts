/**
 * @file components/spacer/Spacer.test.ts
 * @kind spacer
 * @layer components
 * @package @devpulse/coldlight
 *
 * Spacer component browser tests.
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { render } from "vitest-browser-svelte";
import { expect, test, describe } from "vitest";
import Spacer from "./Spacer.svelte";
import { contract } from "./contract.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("spacer component — contract", () => {
	test("contract.kind is 'spacer'", () => {
		expect(contract.kind).toBe("spacer");
	});

	test("contract.primitiveKind is 'spacer'", () => {
		expect(contract.primitiveKind).toBe("spacer");
	});

	test("contract requires slot 'root'", () => {
		expect(contract.slots.required).toContain("root");
	});
});

// =============================================================================
// STRUCTURAL ATTRIBUTES
// =============================================================================

describe("spacer component — structural attributes", () => {
	test("renders with data-kind='spacer'", async () => {
		const { container } = render(Spacer);
		const el = container.querySelector("[data-kind='spacer']") as HTMLElement;
		expect(el).toBeTruthy();
	});

	test("has data-slot='root'", async () => {
		const { container } = render(Spacer);
		const el = container.querySelector("[data-kind='spacer']") as HTMLElement;
		await expect.element(el).toHaveAttribute("data-slot", "root");
	});

	test("has aria-hidden='true'", async () => {
		const { container } = render(Spacer);
		const el = container.querySelector("[data-kind='spacer']") as HTMLElement;
		await expect.element(el).toHaveAttribute("aria-hidden", "true");
	});
});

// =============================================================================
// RECIPE CLASSES
// =============================================================================

describe("spacer component — recipe classes", () => {
	test("applies flex-1 by default (size='auto')", async () => {
		const { container } = render(Spacer);
		const el = container.querySelector("[data-kind='spacer']") as HTMLElement;
		await expect.element(el).toHaveClass("flex-1");
	});

	test("applies w-4 h-4 for size='md'", async () => {
		const { container } = render(Spacer, { props: { size: "md" } });
		const el = container.querySelector("[data-kind='spacer']") as HTMLElement;
		await expect.element(el).toHaveClass("w-4");
		await expect.element(el).toHaveClass("h-4");
	});

	test("passes custom class", async () => {
		const { container } = render(Spacer, { props: { class: "custom-spacer" } });
		const el = container.querySelector("[data-kind='spacer']") as HTMLElement;
		await expect.element(el).toHaveClass("custom-spacer");
	});
});
