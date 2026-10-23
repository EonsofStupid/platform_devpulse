/**
 * @file components/switch/Switch.test.ts
 * @kind switch
 * @layer components
 * @package @devpulse/coldlight
 *
 * Switch component browser tests.
 * Tests ARIA compliance, data-state derivation, and composition application.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import Switch from "./Switch.svelte";

// =============================================================================
// ARIA ATTRIBUTES
// =============================================================================

describe("switch component — ARIA", () => {
	test("has role='switch'", async () => {
		const { getByRole } = render(Switch);
		const el = getByRole("switch");
		expect(el).toBeTruthy();
	});

	test("aria-checked is 'false' by default", async () => {
		const { getByRole } = render(Switch);
		const el = getByRole("switch");
		await expect.element(el).toHaveAttribute("aria-checked", "false");
	});

	test("aria-checked is 'true' when checked", async () => {
		const { getByRole } = render(Switch, { props: { checked: true } });
		const el = getByRole("switch");
		await expect.element(el).toHaveAttribute("aria-checked", "true");
	});

	test("aria-disabled is set when disabled", async () => {
		const { getByRole } = render(Switch, { props: { disabled: true } });
		const el = getByRole("switch");
		await expect.element(el).toHaveAttribute("aria-disabled", "true");
	});

	test("aria-disabled is not emitted when not disabled", async () => {
		const { getByRole } = render(Switch);
		const el = getByRole("switch");
		await expect.element(el).not.toHaveAttribute("aria-disabled");
	});
});

// =============================================================================
// DATA-STATE DERIVATION
// =============================================================================

describe("switch component — data-state", () => {
	test("data-state is 'unchecked' by default", async () => {
		const { getByRole } = render(Switch);
		const el = getByRole("switch");
		await expect.element(el).toHaveAttribute("data-state", "unchecked");
	});

	test("data-state is 'checked' when checked", async () => {
		const { getByRole } = render(Switch, { props: { checked: true } });
		const el = getByRole("switch");
		await expect.element(el).toHaveAttribute("data-state", "checked");
	});

	test("disabled is its own attribute; data-state stays checked/unchecked", async () => {
		const { getByRole } = render(Switch, { props: { disabled: true } });
		const el = getByRole("switch");
		await expect.element(el).toHaveAttribute("data-disabled", "");
		await expect.element(el).toHaveAttribute("aria-disabled", "true");
		await expect.element(el).toHaveAttribute("data-state", "unchecked");
	});
});

// =============================================================================
// CONTROLLED AND UNCONTROLLED STATE
// =============================================================================

describe("switch component — controlled and uncontrolled state", () => {
	test("uncontrolled: starts from defaultChecked and toggles itself", async () => {
		const onCheckedChange = vi.fn();
		const { getByRole } = render(Switch, { props: { defaultChecked: true, onCheckedChange } });
		const el = getByRole("switch");
		await expect.element(el).toHaveAttribute("aria-checked", "true");
		await el.click();
		await expect.element(el).toHaveAttribute("aria-checked", "false");
		expect(onCheckedChange).toHaveBeenCalledWith(false);
	});

	test("controlled: follows checked; a click only asks the owner", async () => {
		const onCheckedChange = vi.fn();
		const { getByRole, rerender } = render(Switch, { props: { checked: false, onCheckedChange } });
		const el = getByRole("switch");
		await el.click();
		expect(onCheckedChange).toHaveBeenCalledWith(true);
		await expect.element(el).toHaveAttribute("aria-checked", "false");
		await rerender({ checked: true });
		await expect.element(el).toHaveAttribute("aria-checked", "true");
	});
});

// =============================================================================
// THUMB ELEMENT
// =============================================================================

describe("switch component — thumb", () => {
	test("renders a thumb element with aria-hidden", async () => {
		const { container } = render(Switch);
		const thumb = container.querySelector("[data-slot='thumb']");
		expect(thumb).toBeTruthy();
		// biome-ignore lint/style/noNonNullAssertion: test assertion — thumb element verified truthy above
		await expect.element(thumb! as unknown as HTMLElement).toHaveAttribute("aria-hidden", "true");
	});
});

// =============================================================================
// RECIPE CLASSES
// =============================================================================

describe("switch component — composition", () => {
	test("applies composition base classes", async () => {
		const { getByRole } = render(Switch);
		const el = getByRole("switch");
		await expect.element(el).toHaveClass("inline-flex");
		await expect.element(el).toHaveClass("items-center");
	});

	test("merges custom class prop", async () => {
		const { getByRole } = render(Switch, { props: { class: "my-custom" } });
		const el = getByRole("switch");
		await expect.element(el).toHaveClass("my-custom");
	});
});

// =============================================================================
// EVENTS
// =============================================================================

describe("switch component — events", () => {
	test("a caller's onclick runs alongside the switch, not instead of it", async () => {
		const onclick = vi.fn();
		const { getByRole } = render(Switch, { props: { onclick } });
		const el = getByRole("switch");
		await el.click();
		expect(onclick).toHaveBeenCalledOnce();
		await expect.element(el).toHaveAttribute("aria-checked", "true");
	});

	test("disabled: a caller's onclick does not run", async () => {
		const onclick = vi.fn();
		const { getByRole } = render(Switch, { props: { disabled: true, onclick } });
		(getByRole("switch").element() as HTMLElement).click();
		expect(onclick).not.toHaveBeenCalled();
	});
});
