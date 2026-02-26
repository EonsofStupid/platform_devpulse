/**
 * @file components/text/Text.test.ts
 * @kind text
 * @layer components
 * @package @devpulse/coldlight
 *
 * Text component browser tests.
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { render } from "vitest-browser-svelte";
import { expect, test, describe } from "vitest";
import Text from "./Text.svelte";
import { contract } from "./contract.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("text component — contract", () => {
	test("contract.kind is 'text'", () => {
		expect(contract.kind).toBe("text");
	});

	test("contract.primitiveKind is 'text'", () => {
		expect(contract.primitiveKind).toBe("text");
	});

	test("contract requires slot 'root'", () => {
		expect(contract.slots.required).toContain("root");
	});
});

// =============================================================================
// STRUCTURAL ATTRIBUTES
// =============================================================================

describe("text component — structural attributes", () => {
	test("renders with data-kind='text'", async () => {
		const { container } = render(Text);
		const el = container.querySelector("[data-kind='text']");
		expect(el).toBeTruthy();
	});

	test("has data-slot='root'", async () => {
		const { container } = render(Text);
		const el = container.querySelector("[data-kind='text']");
		await expect.element(el!).toHaveAttribute("data-slot", "root");
	});

	test("renders as <span> by default", async () => {
		const { container } = render(Text);
		const el = container.querySelector("[data-kind='text']");
		expect(el!.tagName.toLowerCase()).toBe("span");
	});

	test("renders as <p> when as='p'", async () => {
		const { container } = render(Text, { props: { as: "p" } });
		const el = container.querySelector("[data-kind='text']");
		expect(el!.tagName.toLowerCase()).toBe("p");
	});
});

// =============================================================================
// RECIPE CLASSES
// =============================================================================

describe("text component — recipe classes", () => {
	test("applies text-base by default", async () => {
		const { container } = render(Text);
		const el = container.querySelector("[data-kind='text']");
		await expect.element(el!).toHaveClass("text-base");
	});

	test("applies text-sm for size='sm'", async () => {
		const { container } = render(Text, { props: { size: "sm" } });
		const el = container.querySelector("[data-kind='text']");
		await expect.element(el!).toHaveClass("text-sm");
	});

	test("applies font-bold for weight='bold'", async () => {
		const { container } = render(Text, { props: { weight: "bold" } });
		const el = container.querySelector("[data-kind='text']");
		await expect.element(el!).toHaveClass("font-bold");
	});

	test("applies muted color class", async () => {
		const { container } = render(Text, { props: { color: "muted" } });
		const el = container.querySelector("[data-kind='text']");
		await expect.element(el!).toHaveClass("text-text-secondary");
	});

	test("passes custom class", async () => {
		const { container } = render(Text, { props: { class: "custom-text" } });
		const el = container.querySelector("[data-kind='text']");
		await expect.element(el!).toHaveClass("custom-text");
	});
});
