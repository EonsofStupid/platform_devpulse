/**
 * Toggle — ARIA (APG button, toggle mode), the look attributes, its states,
 * and controlled versus uncontrolled pressed state (plan 0006 T2).
 */

import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { locatePart, snippetOf } from "#coldlight/testing/parts.js";
import Toggle from "./Toggle.svelte";

const label = snippetOf("<span>Bold</span>");

describe("toggle — ARIA", () => {
	test("is a button reporting aria-pressed", async () => {
		const { getByRole } = render(Toggle, { props: { children: label } });
		const el = getByRole("button", { name: "Bold" });
		await expect.element(el).toBeInTheDocument();
		await expect.element(el).toHaveAttribute("aria-pressed", "false");
	});

	test("disabled: aria-disabled and data-disabled, and a click changes nothing", async () => {
		const onPressedChange = vi.fn();
		const { getByRole } = render(Toggle, {
			props: { children: label, disabled: true, onPressedChange },
		});
		const el = getByRole("button", { name: "Bold" });
		await expect.element(el).toHaveAttribute("aria-disabled", "true");
		await expect.element(el).toHaveAttribute("data-disabled", "");
		await el.click({ force: true });
		expect(onPressedChange).not.toHaveBeenCalled();
		await expect.element(el).toHaveAttribute("aria-pressed", "false");
	});
});

describe("toggle — look attributes (plan 0006 §0s)", () => {
	test("defaults: the elevated role at size md, no inline style", async () => {
		const { container } = render(Toggle, { props: { children: label } });
		const root = locatePart(container, "toggle");
		await expect.element(root).toHaveAttribute("data-variant", "elevated");
		await expect.element(root).toHaveAttribute("data-size", "md");
		expect(root.element().hasAttribute("style")).toBe(false);
	});

	test("surface sets the family for the toggle itself", async () => {
		const { container } = render(Toggle, {
			props: { children: label, surface: "glass", variant: "deep" },
		});
		const root = locatePart(container, "toggle");
		await expect.element(root).toHaveAttribute("data-surface", "glass");
		await expect.element(root).toHaveAttribute("data-variant", "deep");
	});
});

describe("toggle — controlled and uncontrolled state", () => {
	test("uncontrolled: starts from defaultPressed and toggles itself", async () => {
		const onPressedChange = vi.fn();
		const { container } = render(Toggle, {
			props: { children: label, defaultPressed: true, onPressedChange },
		});
		const root = locatePart(container, "toggle");
		await expect.element(root).toHaveAttribute("data-state", "on");
		await root.click();
		await expect.element(root).toHaveAttribute("data-state", "off");
		await expect.element(root).toHaveAttribute("aria-pressed", "false");
		expect(onPressedChange).toHaveBeenCalledWith(false);
	});

	test("controlled: follows pressed; a click only asks the owner", async () => {
		const onPressedChange = vi.fn();
		const { container, rerender } = render(Toggle, {
			props: { children: label, pressed: false, onPressedChange },
		});
		const root = locatePart(container, "toggle");
		await root.click();
		expect(onPressedChange).toHaveBeenCalledWith(true);
		await expect.element(root).toHaveAttribute("aria-pressed", "false");
		await rerender({ pressed: true });
		await expect.element(root).toHaveAttribute("aria-pressed", "true");
		await expect.element(root).toHaveAttribute("data-state", "on");
	});
});

describe("toggle — events", () => {
	test("a caller's onclick runs alongside the toggle, not instead of it", async () => {
		const onclick = vi.fn();
		const { container } = render(Toggle, { props: { children: label, onclick } });
		const root = locatePart(container, "toggle");
		await root.click();
		expect(onclick).toHaveBeenCalledOnce();
		await expect.element(root).toHaveAttribute("aria-pressed", "true");
	});

	test("disabled: a caller's onclick does not run", async () => {
		const onclick = vi.fn();
		const { container } = render(Toggle, { props: { children: label, disabled: true, onclick } });
		(locatePart(container, "toggle").element() as HTMLElement).click();
		expect(onclick).not.toHaveBeenCalled();
	});
});
