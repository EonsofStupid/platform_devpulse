/**
 * @file components/container/Container.test.ts
 * @kind container
 * @layer components
 * @package @devpulse/coldlight
 *
 * Container component browser tests.
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { render } from "vitest-browser-svelte";
import { expect, test, describe } from "vitest";
import Container from "./Container.svelte";
import { contract } from "./contract.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("container component — contract", () => {
	test("contract.kind is 'container'", () => {
		expect(contract.kind).toBe("container");
	});

	test("contract.primitiveKind is 'container'", () => {
		expect(contract.primitiveKind).toBe("container");
	});

	test("contract requires slot 'root'", () => {
		expect(contract.slots.required).toContain("root");
	});
});

// =============================================================================
// STRUCTURAL ATTRIBUTES
// =============================================================================

describe("container component — structural attributes", () => {
	test("renders with data-kind='container'", async () => {
		const { container } = render(Container);
		const el = container.querySelector("[data-kind='container']") as HTMLElement;
		expect(el).toBeTruthy();
	});

	test("has data-slot='root'", async () => {
		const { container } = render(Container);
		const el = container.querySelector("[data-kind='container']") as HTMLElement;
		await expect.element(el).toHaveAttribute("data-slot", "root");
	});
});

// =============================================================================
// RECIPE CLASSES
// =============================================================================

describe("container component — recipe classes", () => {
	test("applies base centering classes", async () => {
		const { container } = render(Container);
		const el = container.querySelector("[data-kind='container']") as HTMLElement;
		await expect.element(el).toHaveClass("mx-auto");
		await expect.element(el).toHaveClass("w-full");
		await expect.element(el).toHaveClass("px-4");
	});

	test("applies max-w-screen-xl by default", async () => {
		const { container } = render(Container);
		const el = container.querySelector("[data-kind='container']") as HTMLElement;
		await expect.element(el).toHaveClass("max-w-screen-xl");
	});

	test("applies max-w-screen-sm for size='sm'", async () => {
		const { container } = render(Container, { props: { size: "sm" } });
		const el = container.querySelector("[data-kind='container']") as HTMLElement;
		await expect.element(el).toHaveClass("max-w-screen-sm");
	});

	test("applies max-w-full for size='full'", async () => {
		const { container } = render(Container, { props: { size: "full" } });
		const el = container.querySelector("[data-kind='container']") as HTMLElement;
		await expect.element(el).toHaveClass("max-w-full");
	});

	test("passes custom class", async () => {
		const { container } = render(Container, { props: { class: "custom-container" } });
		const el = container.querySelector("[data-kind='container']") as HTMLElement;
		await expect.element(el).toHaveClass("custom-container");
	});
});
