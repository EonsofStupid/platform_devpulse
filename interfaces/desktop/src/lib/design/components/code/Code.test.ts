/**
 * @file components/code/Code.test.ts
 * @kind code
 * @layer components
 * @package @devpulse/coldlight
 *
 * Code component browser tests.
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { render } from "vitest-browser-svelte";
import { expect, test, describe } from "vitest";
import Code from "./Code.svelte";
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
});

// =============================================================================
// STRUCTURAL ATTRIBUTES
// =============================================================================

describe("code component — structural attributes", () => {
	test("renders with data-kind='code'", async () => {
		const { container } = render(Code);
		const el = container.querySelector("[data-kind='code']") as HTMLElement;
		expect(el).toBeTruthy();
	});

	test("has data-slot='root'", async () => {
		const { container } = render(Code);
		const el = container.querySelector("[data-kind='code']") as HTMLElement;
		await expect.element(el).toHaveAttribute("data-slot", "root");
	});

	test("renders as <code> element", async () => {
		const { container } = render(Code);
		const el = container.querySelector("[data-kind='code']") as HTMLElement;
		expect(el.tagName.toLowerCase()).toBe("code");
	});

	test("renders block code wrapped in <pre>", async () => {
		const { container } = render(Code, { props: { inline: false } });
		const pre = container.querySelector("pre") as HTMLElement;
		expect(pre).toBeTruthy();
		const code = pre.querySelector("[data-kind='code']") as HTMLElement;
		expect(code).toBeTruthy();
	});
});

// =============================================================================
// RECIPE CLASSES
// =============================================================================

describe("code component — recipe classes", () => {
	test("applies inline styles by default", async () => {
		const { container } = render(Code);
		const el = container.querySelector("[data-kind='code']") as HTMLElement;
		await expect.element(el).toHaveClass("font-mono");
		await expect.element(el).toHaveClass("text-sm");
	});

	test("applies block styles when inline=false", async () => {
		const { container } = render(Code, { props: { inline: false } });
		const pre = container.querySelector("pre") as HTMLElement;
		await expect.element(pre).toHaveClass("font-mono");
		await expect.element(pre).toHaveClass("overflow-x-auto");
	});

	test("sets data-language when language provided", async () => {
		const { container } = render(Code, { props: { language: "typescript" } });
		const el = container.querySelector("[data-kind='code']") as HTMLElement;
		await expect.element(el).toHaveAttribute("data-language", "typescript");
	});

	test("passes custom class for inline", async () => {
		const { container } = render(Code, { props: { class: "custom-code" } });
		const el = container.querySelector("[data-kind='code']") as HTMLElement;
		await expect.element(el).toHaveClass("custom-code");
	});
});
