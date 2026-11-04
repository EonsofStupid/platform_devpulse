/**
 * @file Toolbar Component Tests
 * @kind toolbar
 * @layer components
 *
 * Vitest browser tests — real Chromium via @vitest/browser-playwright.
 * Tests: composition application, prop forwarding, ARIA attributes, builder integration.
 */

import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import Toolbar from "./Toolbar.svelte";

describe("Toolbar component", () => {
	it("renders with data-kind and role attributes", async () => {
		const screen = await render(Toolbar, {
			props: { label: "Actions" },
		});

		const el = screen.getByRole("toolbar");
		await expect.element(el).toBeInTheDocument();
		await expect.element(el).toHaveAttribute("data-kind", "toolbar");
		await expect.element(el).toHaveAttribute("aria-label", "Actions");
	});

	it("applies composition classes for size", async () => {
		const screen = await render(Toolbar, {
			props: { label: "Actions", size: "sm" },
		});

		const el = screen.getByRole("toolbar");
		await expect.element(el).toHaveClass(/gap-1/);
		await expect.element(el).toHaveClass(/p-1/);
	});

	it("applies horizontal orientation by default", async () => {
		const screen = await render(Toolbar, {
			props: { label: "Actions" },
		});

		const el = screen.getByRole("toolbar");
		await expect.element(el).toHaveAttribute("aria-orientation", "horizontal");
		await expect.element(el).toHaveAttribute("data-orientation", "horizontal");
	});

	it("applies vertical orientation when set", async () => {
		const screen = await render(Toolbar, {
			props: { label: "Actions", orientation: "vertical" },
		});

		const el = screen.getByRole("toolbar");
		await expect.element(el).toHaveAttribute("aria-orientation", "vertical");
	});

	it("applies disabled state", async () => {
		const screen = await render(Toolbar, {
			props: { label: "Actions", disabled: true },
		});

		const el = screen.getByRole("toolbar");
		await expect.element(el).toHaveAttribute("data-disabled", "");
	});

	it("merges custom className", async () => {
		const screen = await render(Toolbar, {
			props: { label: "Actions", class: "custom-class" },
		});

		const el = screen.getByRole("toolbar");
		await expect.element(el).toHaveClass(/custom-class/);
	});
});
