/**
 * @file components/banner/Banner.test.ts
 * @kind banner
 * @layer components
 * @package @devpulse/coldlight
 *
 * Banner component browser tests.
 * Tests ARIA compliance, positioning, dismiss behavior, recipe application, and contract shape.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import Banner from "./Banner.svelte";
import { contract } from "./contract.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("banner component — contract", () => {
	test("contract.kind is 'banner'", () => {
		expect(contract.kind).toBe("banner");
	});

	test("contract.primitiveKind is 'banner'", () => {
		expect(contract.primitiveKind).toBe("banner");
	});

	test("contract requires slot 'root'", () => {
		expect(contract.slots.required).toContain("root");
	});

	test("contract root slot has role 'complementary'", () => {
		expect(contract.slotContracts.root.aria.role).toBe("complementary");
	});

	test("contract has dismiss as optional slot", () => {
		expect(contract.slots.optional).toContain("dismiss");
	});

	test("contract has no keyboard interactions", () => {
		expect(contract.keyboard.global).toHaveLength(0);
	});

	test("contract interactions are all false", () => {
		expect(contract.interactions.modal).toBe(false);
		expect(contract.interactions.selectable).toBe(false);
		expect(contract.interactions.editable).toBe(false);
		expect(contract.interactions.expandable).toBe(false);
	});

	test("contract states include open and closed", () => {
		expect(contract.states.all).toContain("open");
		expect(contract.states.all).toContain("closed");
	});
});

// =============================================================================
// ARIA ATTRIBUTES
// =============================================================================

describe("banner component — ARIA", () => {
	test("has role='complementary'", async () => {
		const { container } = render(Banner);
		const el = container.querySelector("[role='complementary']");
		expect(el).toBeTruthy();
	});

	test("does NOT have role='alert'", async () => {
		const { container } = render(Banner);
		const el = container.querySelector("[role='alert']");
		expect(el).toBeNull();
	});
});

// =============================================================================
// DATA ATTRIBUTES
// =============================================================================

describe("banner component — data attributes", () => {
	test("has data-kind='banner'", async () => {
		const { container } = render(Banner);
		const el = container.querySelector("[data-kind='banner']");
		expect(el).toBeTruthy();
	});

	test("has data-slot='root'", async () => {
		const { container } = render(Banner);
		const el = container.querySelector("[data-slot='root']");
		expect(el).toBeTruthy();
	});

	test("has data-state='open' when visible", async () => {
		const { container } = render(Banner, { props: { open: true } });
		const el = container.querySelector("[data-kind='banner']");
		expect(el?.getAttribute("data-state")).toBe("open");
	});
});

// =============================================================================
// POSITIONING
// =============================================================================

describe("banner component — positioning", () => {
	test("applies fixed top positioning by default", async () => {
		const { container } = render(Banner);
		const el = container.querySelector("[data-kind='banner']") as HTMLElement;
		expect(el?.className).toContain("fixed");
		expect(el?.className).toContain("top-0");
	});

	test("applies fixed bottom positioning when position='bottom'", async () => {
		const { container } = render(Banner, { props: { position: "bottom" } });
		const el = container.querySelector("[data-kind='banner']") as HTMLElement;
		expect(el?.className).toContain("fixed");
		expect(el?.className).toContain("bottom-0");
	});
});

// =============================================================================
// DISMISS
// =============================================================================

describe("banner component — dismiss", () => {
	test("renders dismiss button by default", async () => {
		const { container } = render(Banner);
		const btn = container.querySelector("[data-slot='dismiss']");
		expect(btn).toBeTruthy();
	});

	test("dismiss button has aria-label", async () => {
		const { container } = render(Banner);
		const btn = container.querySelector("[data-slot='dismiss']");
		expect(btn?.getAttribute("aria-label")).toBe("Close banner");
	});

	test("hides dismiss button when dismissible=false", async () => {
		const { container } = render(Banner, { props: { dismissible: false } });
		const btn = container.querySelector("[data-slot='dismiss']");
		expect(btn).toBeNull();
	});

	test("does not render when open=false", async () => {
		const { container } = render(Banner, { props: { open: false } });
		const el = container.querySelector("[data-kind='banner']");
		expect(el).toBeNull();
	});
});

// =============================================================================
// CLASS COMPOSITION
// =============================================================================

describe("banner component — class composition", () => {
	test("merges custom class prop", async () => {
		const { container } = render(Banner, { props: { class: "my-custom" } });
		const el = container.querySelector("[data-kind='banner']") as HTMLElement;
		expect(el?.className).toContain("my-custom");
	});
});
