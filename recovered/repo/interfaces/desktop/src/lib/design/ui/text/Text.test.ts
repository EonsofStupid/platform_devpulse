/**
 * @file ui/text/Text.test.ts
 * @kind text
 * @layer ui
 * @package @devpulse/coldlight
 *
 * Text UI browser tests — recipe classes + visual composition.
 * Structural/ARIA tests live in components/text/Text.test.ts.
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { render } from "vitest-browser-svelte";
import { expect, test, describe } from "vitest";
import Text from "./Text.svelte";

// =============================================================================
// RECIPE CLASSES
// =============================================================================

describe("text ui — recipe classes", () => {
	test("applies text-base by default", async () => {
		const { container } = render(Text);
		const el = container.querySelector("[data-kind='text']") as HTMLElement;
		await expect.element(el).toHaveClass("text-base");
	});

	test("applies text-sm for size='sm'", async () => {
		const { container } = render(Text, { props: { size: "sm" } });
		const el = container.querySelector("[data-kind='text']") as HTMLElement;
		await expect.element(el).toHaveClass("text-sm");
	});

	test("applies font-bold for weight='bold'", async () => {
		const { container } = render(Text, { props: { weight: "bold" } });
		const el = container.querySelector("[data-kind='text']") as HTMLElement;
		await expect.element(el).toHaveClass("font-bold");
	});

	test("applies muted color class", async () => {
		const { container } = render(Text, { props: { color: "muted" } });
		const el = container.querySelector("[data-kind='text']") as HTMLElement;
		await expect.element(el).toHaveClass("text-text-secondary");
	});

	test("passes custom class", async () => {
		const { container } = render(Text, { props: { class: "custom-text" } });
		const el = container.querySelector("[data-kind='text']") as HTMLElement;
		await expect.element(el).toHaveClass("custom-text");
	});
});

// =============================================================================
// STRUCTURAL PASSTHROUGH
// =============================================================================

describe("text ui — structural passthrough", () => {
	test("renders with data-kind='text'", async () => {
		const { container } = render(Text);
		const el = container.querySelector("[data-kind='text']") as HTMLElement;
		expect(el).toBeTruthy();
	});

	test("renders as <span> by default", async () => {
		const { container } = render(Text);
		const el = container.querySelector("[data-kind='text']") as HTMLElement;
		expect(el.tagName.toLowerCase()).toBe("span");
	});

	test("renders as <p> when as='p'", async () => {
		const { container } = render(Text, { props: { as: "p" } });
		const el = container.querySelector("[data-kind='text']") as HTMLElement;
		expect(el.tagName.toLowerCase()).toBe("p");
	});
});
