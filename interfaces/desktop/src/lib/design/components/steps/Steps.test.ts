/**
 * @file Steps Component Tests
 * @kind steps
 * @layer components
 *
 * Vitest browser tests — real Chromium via @vitest/browser-playwright.
 * Tests: recipe application, prop forwarding, ARIA attributes, builder integration.
 */

import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-svelte";
import Steps from "./Steps.svelte";

describe("Steps component", () => {
	it("renders with data-kind and role attributes", async () => {
		const screen = render(Steps, {
			props: { label: "Setup wizard" },
		});

		const el = screen.getByRole("navigation");
		await expect.element(el).toBeInTheDocument();
		await expect.element(el).toHaveAttribute("data-kind", "steps");
		await expect.element(el).toHaveAttribute("aria-label", "Setup wizard");
	});

	it("applies recipe classes for size", async () => {
		const screen = render(Steps, {
			props: { label: "Steps", size: "sm" },
		});

		const el = screen.getByRole("navigation");
		await expect.element(el).toHaveClass(/gap-2/);
		await expect.element(el).toHaveClass(/text-sm/);
	});

	it("applies horizontal orientation by default", async () => {
		const screen = render(Steps, {
			props: { label: "Steps" },
		});

		const el = screen.getByRole("navigation");
		await expect.element(el).toHaveClass(/flex-row/);
	});

	it("applies vertical orientation when set", async () => {
		const screen = render(Steps, {
			props: { label: "Steps", orientation: "vertical" },
		});

		const el = screen.getByRole("navigation");
		await expect.element(el).toHaveClass(/flex-col/);
	});

	it("applies disabled state", async () => {
		const screen = render(Steps, {
			props: { label: "Steps", disabled: true },
		});

		const el = screen.getByRole("navigation");
		await expect.element(el).toHaveAttribute("data-disabled", "");
	});

	it("merges custom className", async () => {
		const screen = render(Steps, {
			props: { label: "Steps", class: "custom-class" },
		});

		const el = screen.getByRole("navigation");
		await expect.element(el).toHaveClass(/custom-class/);
	});
});
