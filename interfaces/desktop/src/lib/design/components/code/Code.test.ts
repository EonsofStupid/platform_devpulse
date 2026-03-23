/**
 * @file components/code/Code.test.ts
 * @kind code
 * @layer components
 * @package @devpulse/coldlight
 *
 * Code component browser tests.
 * Tests InlineCode and CodeBlock contract, structure, and composition application.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import InlineCode from "./InlineCode.svelte";
import { contract } from "./contract.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("code component — contract", () => {
	test("contract.kind is 'code'", () => {
		expect(contract.kind).toBe("code");
	});

	test("contract.primitiveKind is 'code'", () => {
		expect(contract.primitiveKind).toBe("code");
	});

	test("contract requires slot 'root'", () => {
		expect(contract.slots.required).toContain("root");
	});

	test("contract has optional slots for compound", () => {
		expect(contract.slots.optional).toContain("header");
		expect(contract.slots.optional).toContain("content");
		expect(contract.slots.optional).toContain("copyButton");
	});
});

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
