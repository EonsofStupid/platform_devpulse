/**
 * @file components/code/Code.test.ts
 * @kind code
 * @layer components
 * @package @devpulse/coldlight
 *
 * Code component browser tests.
 * Tests InlineCode and CodeBlock structure and composition application.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import InlineCode from "./InlineCode.svelte";

// =============================================================================
// INLINE CODE
// =============================================================================

describe("inline code — structural", () => {
	test("renders with data-kind='code'", async () => {
		const { container } = render(InlineCode);
		const el = container.querySelector("[data-kind='code']");
		expect(el).toBeTruthy();
	});

	test("has data-slot='inline'", async () => {
		const { container } = render(InlineCode);
		const el = container.querySelector("[data-kind='code']");
		await expect.element(el as HTMLElement).toHaveAttribute("data-slot", "inline");
	});

	test("renders as <code> element", async () => {
		const { container } = render(InlineCode);
		const el = container.querySelector("[data-kind='code']") as HTMLElement;
		expect(el.tagName.toLowerCase()).toBe("code");
	});

	test("merges custom class", async () => {
		const { container } = render(InlineCode, { props: { class: "my-code" } });
		const el = container.querySelector("[data-kind='code']") as HTMLElement;
		await expect.element(el).toHaveClass("my-code");
	});
});
