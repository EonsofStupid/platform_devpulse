/**
 * @file components/aspect-ratio/AspectRatio.test.ts
 * @kind aspect-ratio
 * @layer components
 * @package @devpulse/coldlight
 *
 * AspectRatio component browser tests.
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { render } from "vitest-browser-svelte";
import { expect, test, describe } from "vitest";
import AspectRatio from "./AspectRatio.svelte";
import { contract } from "./contract.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("aspect-ratio component — contract", () => {
	test("contract.kind is 'aspect-ratio'", () => {
		expect(contract.kind).toBe("aspect-ratio");
	});

	test("contract.primitiveKind is 'aspect-ratio'", () => {
		expect(contract.primitiveKind).toBe("aspect-ratio");
	});

	test("contract requires slot 'root'", () => {
		expect(contract.slots.required).toContain("root");
	});
});

// =============================================================================
// STRUCTURAL ATTRIBUTES
// =============================================================================

describe("aspect-ratio component — structural attributes", () => {
	test("renders with data-kind='aspect-ratio'", async () => {
		const { container } = render(AspectRatio);
		const el = container.querySelector("[data-kind='aspect-ratio']");
		expect(el).toBeTruthy();
	});

	test("has data-slot='root'", async () => {
		const { container } = render(AspectRatio);
		const el = container.querySelector("[data-kind='aspect-ratio']");
		await expect.element(el!).toHaveAttribute("data-slot", "root");
	});
});

// =============================================================================
// RECIPE CLASSES
// =============================================================================

describe("aspect-ratio component — recipe classes", () => {
	test("applies relative and overflow-hidden", async () => {
		const { container } = render(AspectRatio);
		const el = container.querySelector("[data-kind='aspect-ratio']");
		await expect.element(el!).toHaveClass("relative");
		await expect.element(el!).toHaveClass("overflow-hidden");
	});

	test("passes custom class", async () => {
		const { container } = render(AspectRatio, { props: { class: "custom-aspect" } });
		const el = container.querySelector("[data-kind='aspect-ratio']");
		await expect.element(el!).toHaveClass("custom-aspect");
	});
});

// =============================================================================
// ASPECT RATIO — style attribute
// =============================================================================

describe("aspect-ratio component — ratio application", () => {
	test("applies aspect-ratio style for video preset", async () => {
		const { container } = render(AspectRatio, { props: { preset: "video" } });
		const el = container.querySelector("[data-kind='aspect-ratio']");
		const style = el!.getAttribute("style") || "";
		expect(style).toContain("aspect-ratio");
	});

	test("applies aspect-ratio style for square preset", async () => {
		const { container } = render(AspectRatio, { props: { preset: "square" } });
		const el = container.querySelector("[data-kind='aspect-ratio']");
		const style = el!.getAttribute("style") || "";
		expect(style).toContain("aspect-ratio");
		expect(style).toContain("1");
	});

	test("applies custom numeric ratio", async () => {
		const { container } = render(AspectRatio, { props: { ratio: 4 / 3 } });
		const el = container.querySelector("[data-kind='aspect-ratio']");
		const style = el!.getAttribute("style") || "";
		expect(style).toContain("aspect-ratio");
	});
});
