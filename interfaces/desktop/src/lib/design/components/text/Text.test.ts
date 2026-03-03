/**
 * @file components/text/Text.test.ts
 * @kind text
 * @layer components
 * @package @devpulse/coldlight
 *
 * Text component browser tests — ARIA + structural only. ZERO visual.
 * Recipe/visual tests live in ui/text/Text.test.ts.
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
		const el = container.querySelector("[data-kind='text']") as HTMLElement;
		expect(el).toBeTruthy();
	});

	test("has data-slot='root'", async () => {
		const { container } = render(Text);
		const el = container.querySelector("[data-kind='text']") as HTMLElement;
		await expect.element(el).toHaveAttribute("data-slot", "root");
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

	test("passes custom class", async () => {
		const { container } = render(Text, { props: { class: "custom-text" } });
		const el = container.querySelector("[data-kind='text']") as HTMLElement;
		await expect.element(el).toHaveClass("custom-text");
	});
});
