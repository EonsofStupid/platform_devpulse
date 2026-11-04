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

import "@devpulse/coldlight/index.css";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import Switch from "./Switch.svelte";
import type { SwitchProps } from "./types.js";

// =============================================================================
// ITS LOOK
// =============================================================================

describe("switch component — on and off read differently", () => {
	async function drawn(checked: boolean, props: Partial<SwitchProps> = {}) {
		const screen = await render(Switch, { checked, "aria-label": "Setting", ...props });
		const track = screen.container.querySelector('[role="switch"]') as HTMLElement;
		const thumb = track.querySelector('[data-slot="thumb"]') as HTMLElement;
		return { track, thumb };
	}
	/** Wait out the track's colour and the thumb's slide, so this reads where they land. */
	const settled = () => new Promise((resolve) => setTimeout(resolve, 300));

	// Where the thumb lands is Tailwind, which this package's tests do not compile;
	// the app checks it in domains/app/memory/ui/memory-notes/switch-layout.test.ts.
	test("the track changes colour", async () => {
		const off = await drawn(false);
		const on = await drawn(true);
		await settled();
		expect(getComputedStyle(on.track).backgroundColor).not.toBe(
			getComputedStyle(off.track).backgroundColor,
		);
	});

	test("the thumb has its own colour on both tracks", async () => {
		for (const checked of [false, true]) {
			const { track, thumb } = await drawn(checked);
			await settled();
			expect(getComputedStyle(thumb).backgroundColor).not.toBe(
				getComputedStyle(track).backgroundColor,
			);
			expect(getComputedStyle(thumb).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
		}
	});

	test("off comes from the family and its role, on from the primary role whatever they are", async () => {
		const off = await drawn(false, { surface: "glass", variant: "deep" });
		expect(off.track.dataset.surface).toBe("glass");
		expect(off.track.dataset.variant).toBe("deep");
		const glass = await drawn(true, { surface: "glass", variant: "deep" });
		const stark = await drawn(true, { surface: "stark", variant: "glow" });
		await settled();
		expect(getComputedStyle(glass.track).backgroundColor).toBe(
			getComputedStyle(stark.track).backgroundColor,
		);
		expect(getComputedStyle(glass.track).backgroundImage).toBe("none");
	});
});

// =============================================================================
// ARIA ATTRIBUTES
// =============================================================================

describe("switch component — ARIA", () => {
	test("has role='switch'", async () => {
		const { getByRole } = await render(Switch);
		const el = getByRole("switch");
		expect(el).toBeTruthy();
	});

	test("aria-checked is 'false' by default", async () => {
		const { getByRole } = await render(Switch);
		const el = getByRole("switch");
		await expect.element(el).toHaveAttribute("aria-checked", "false");
	});

	test("aria-checked is 'true' when checked", async () => {
		const { getByRole } = await render(Switch, { props: { checked: true } });
		const el = getByRole("switch");
		await expect.element(el).toHaveAttribute("aria-checked", "true");
	});

	test("aria-disabled is set when disabled", async () => {
		const { getByRole } = await render(Switch, { props: { disabled: true } });
		const el = getByRole("switch");
		await expect.element(el).toHaveAttribute("aria-disabled", "true");
	});

	test("aria-disabled is not emitted when not disabled", async () => {
		const { getByRole } = await render(Switch);
		const el = getByRole("switch");
		await expect.element(el).not.toHaveAttribute("aria-disabled");
	});
});

// =============================================================================
// DATA-STATE DERIVATION
// =============================================================================

describe("switch component — data-state", () => {
	test("data-state is 'unchecked' by default", async () => {
		const { getByRole } = await render(Switch);
		const el = getByRole("switch");
		await expect.element(el).toHaveAttribute("data-state", "unchecked");
	});

	test("data-state is 'checked' when checked", async () => {
		const { getByRole } = await render(Switch, { props: { checked: true } });
		const el = getByRole("switch");
		await expect.element(el).toHaveAttribute("data-state", "checked");
	});

	test("disabled is its own attribute; data-state stays checked/unchecked", async () => {
		const { getByRole } = await render(Switch, { props: { disabled: true } });
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
		const { getByRole } = await render(Switch, {
			props: { defaultChecked: true, onCheckedChange },
		});
		const el = getByRole("switch");
		await expect.element(el).toHaveAttribute("aria-checked", "true");
		await el.click();
		await expect.element(el).toHaveAttribute("aria-checked", "false");
		expect(onCheckedChange).toHaveBeenCalledWith(false);
	});

	test("controlled: follows checked; a click only asks the owner", async () => {
		const onCheckedChange = vi.fn();
		const { getByRole, rerender } = await render(Switch, {
			props: { checked: false, onCheckedChange },
		});
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
		const { container } = await render(Switch);
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
		const { getByRole } = await render(Switch);
		const el = getByRole("switch");
		await expect.element(el).toHaveClass("inline-flex");
		await expect.element(el).toHaveClass("items-center");
	});

	test("merges custom class prop", async () => {
		const { getByRole } = await render(Switch, { props: { class: "my-custom" } });
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
		const { getByRole } = await render(Switch, { props: { onclick } });
		const el = getByRole("switch");
		await el.click();
		expect(onclick).toHaveBeenCalledOnce();
		await expect.element(el).toHaveAttribute("aria-checked", "true");
	});

	test("disabled: a caller's onclick does not run", async () => {
		const onclick = vi.fn();
		const { getByRole } = await render(Switch, { props: { disabled: true, onclick } });
		(getByRole("switch").element() as HTMLElement).click();
		expect(onclick).not.toHaveBeenCalled();
	});
});
