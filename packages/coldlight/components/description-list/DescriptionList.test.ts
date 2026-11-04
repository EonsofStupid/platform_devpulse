/**
 * @file components/description-list/DescriptionList.test.ts
 * @kind description-list
 * @layer components
 * @package @devpulse/coldlight
 *
 * DescriptionList component browser tests.
 * Tests ARIA application, builder attribute binding, composition class application,
 * and prop forwarding through the component layer.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import DescriptionList from "./DescriptionList.svelte";

// =============================================================================
// STRUCTURAL ATTRIBUTES — data-kind, data-slot
// =============================================================================

describe("description-list component — structural attributes", () => {
	test("renders a <dl> element", async () => {
		const { container } = await render(DescriptionList);
		const dl = container.querySelector("dl");
		expect(dl).toBeTruthy();
	});

	test("has data-kind='description-list'", async () => {
		const { container } = await render(DescriptionList);
		const dl = container.querySelector("dl");
		// biome-ignore lint/style/noNonNullAssertion: test assertion — dl element always rendered
		await expect.element(dl!).toHaveAttribute("data-kind", "description-list");
	});

	test("has data-slot='root'", async () => {
		const { container } = await render(DescriptionList);
		const dl = container.querySelector("dl");
		// biome-ignore lint/style/noNonNullAssertion: test assertion — dl element always rendered
		await expect.element(dl!).toHaveAttribute("data-slot", "root");
	});
});

// =============================================================================
// ARIA ATTRIBUTES — component layer owns ARIA
// =============================================================================

describe("description-list component — ARIA attributes", () => {
	test("passes aria-label when label prop provided", async () => {
		const { container } = await render(DescriptionList, { props: { label: "User details" } });
		const dl = container.querySelector("dl");
		// biome-ignore lint/style/noNonNullAssertion: test assertion — dl element always rendered
		await expect.element(dl!).toHaveAttribute("aria-label", "User details");
	});
});

// =============================================================================
// RECIPE CLASSES — variant and size
// =============================================================================

describe("description-list component — composition classes", () => {
	test("applies composition classes for default variant", async () => {
		const { container } = await render(DescriptionList);
		const dl = container.querySelector("dl");
		// biome-ignore lint/style/noNonNullAssertion: test assertion — dl element always rendered
		await expect.element(dl!).toHaveClass("text-base");
	});

	test("applies sm size classes", async () => {
		const { container } = await render(DescriptionList, { props: { size: "sm" } });
		const dl = container.querySelector("dl");
		// biome-ignore lint/style/noNonNullAssertion: test assertion — dl element always rendered
		await expect.element(dl!).toHaveClass("text-sm");
	});

	test("passes class prop and merges with composition", async () => {
		const { container } = await render(DescriptionList, { props: { class: "custom-dl" } });
		const dl = container.querySelector("dl");
		// biome-ignore lint/style/noNonNullAssertion: test assertion — dl element always rendered
		await expect.element(dl!).toHaveClass("custom-dl");
	});
});

// =============================================================================
// PROP PASSTHROUGH — ...rest spread
// =============================================================================

describe("description-list component — prop passthrough", () => {
	test("forwards id attribute", async () => {
		const { container } = await render(DescriptionList, { props: { id: "my-dl" } });
		const dl = container.querySelector("dl");
		// biome-ignore lint/style/noNonNullAssertion: test assertion — dl element always rendered
		await expect.element(dl!).toHaveAttribute("id", "my-dl");
	});
});
