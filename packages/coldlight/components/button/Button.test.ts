/**
 * Button — APG button ARIA, the look attributes (plan 0006 §0s), disabled and
 * loading, and toggle mode in both control modes (plan 0006 T2).
 */

import { describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { locatePart, snippetOf } from "#coldlight/testing/parts.js";
import Button from "./Button.svelte";

const label = snippetOf("<span>Save</span>");

describe("button — ARIA and look", () => {
	test("a plain button: no aria-pressed, no data-state", async () => {
		const { getByRole } = render(Button, { props: { children: label } });
		const el = getByRole("button", { name: "Save" });
		await expect.element(el).toBeInTheDocument();
		await expect.element(el).not.toHaveAttribute("aria-pressed");
		await expect.element(el).not.toHaveAttribute("data-state");
	});

	test("its look is attributes: variant and size, no inline style", async () => {
		const { container } = render(Button, {
			props: { children: label, variant: "ghost", size: "sm" },
		});
		const root = locatePart(container, "button");
		await expect.element(root).toHaveAttribute("data-variant", "ghost");
		await expect.element(root).toHaveAttribute("data-size", "sm");
		expect(root.element().hasAttribute("style")).toBe(false);
	});

	test("disabled and loading mark the root (aria and data attributes)", async () => {
		const { container, rerender } = render(Button, {
			props: { children: label, disabled: true },
		});
		const root = locatePart(container, "button");
		await expect.element(root).toHaveAttribute("aria-disabled", "true");
		await expect.element(root).toHaveAttribute("data-disabled", "");
		await rerender({ disabled: false, loading: true });
		await expect.element(root).toHaveAttribute("aria-busy", "true");
		await expect.element(root).toHaveAttribute("data-loading", "");
		await expect.element(root).toHaveAttribute("data-disabled", "");
	});

	test("its id survives prop changes", async () => {
		const { container, rerender } = render(Button, { props: { children: label } });
		const root = locatePart(container, "button");
		const id = root.element().id;
		await rerender({ loading: true });
		expect(root.element().id).toBe(id);
	});
});

describe("button — toggle mode", () => {
	test("uncontrolled: defaultPressed makes it a toggle that holds its state", async () => {
		const onPressedChange = vi.fn();
		const { container } = render(Button, {
			props: { children: label, defaultPressed: false, onPressedChange },
		});
		const root = locatePart(container, "button");
		await expect.element(root).toHaveAttribute("aria-pressed", "false");
		await root.click();
		await expect.element(root).toHaveAttribute("aria-pressed", "true");
		await expect.element(root).toHaveAttribute("data-state", "on");
		expect(onPressedChange).toHaveBeenCalledWith(true);
	});

	test("controlled: follows pressed; a click only asks the owner", async () => {
		const onPressedChange = vi.fn();
		const { container, rerender } = render(Button, {
			props: { children: label, pressed: true, onPressedChange },
		});
		const root = locatePart(container, "button");
		await root.click();
		expect(onPressedChange).toHaveBeenCalledWith(false);
		await expect.element(root).toHaveAttribute("aria-pressed", "true");
		await rerender({ pressed: false });
		await expect.element(root).toHaveAttribute("aria-pressed", "false");
	});
});

describe("button — events", () => {
	test("keyboard: Enter toggles a toggle button once", async () => {
		const { container } = render(Button, { props: { children: label, defaultPressed: false } });
		const root = locatePart(container, "button");
		(root.element() as HTMLElement).focus();
		await userEvent.keyboard("{Enter}");
		await expect.element(root).toHaveAttribute("aria-pressed", "true");
	});

	test("a caller's onclick runs alongside the toggle, not instead of it", async () => {
		const onclick = vi.fn();
		const { container } = render(Button, {
			props: { children: label, defaultPressed: false, onclick },
		});
		const root = locatePart(container, "button");
		await root.click();
		expect(onclick).toHaveBeenCalledOnce();
		await expect.element(root).toHaveAttribute("aria-pressed", "true");
	});

	test("disabled: a caller's onclick does not run", async () => {
		const onclick = vi.fn();
		const { container } = render(Button, { props: { children: label, disabled: true, onclick } });
		const root = locatePart(container, "button");
		(root.element() as HTMLElement).click();
		expect(onclick).not.toHaveBeenCalled();
	});
});
