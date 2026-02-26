/**
 * @file Sheet Component Tests
 * @kind sheet
 * @layer components
 *
 * Vitest browser tests — real Chromium via @vitest/browser-playwright.
 * Tests: recipe application, prop forwarding, ARIA attributes, builder integration.
 */

import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-svelte";
import Sheet from "./Sheet.svelte";

describe("Sheet component", () => {
	it("renders trigger button with ARIA attributes", async () => {
		const screen = render(Sheet, {
			props: { label: "Settings panel" },
		});

		const trigger = screen.getByRole("button");
		await expect.element(trigger).toBeInTheDocument();
		await expect.element(trigger).toHaveAttribute("aria-haspopup", "dialog");
		await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
		await expect.element(trigger).toHaveAttribute("data-kind", "sheet");
		await expect.element(trigger).toHaveAttribute("data-slot", "trigger");
	});

	it("does not render content when closed", async () => {
		const screen = render(Sheet, {
			props: { label: "Settings panel" },
		});

		const dialogs = screen.baseElement.querySelectorAll("[role='dialog']");
		expect(dialogs.length).toBe(0);
	});

	it("renders content when open", async () => {
		const screen = render(Sheet, {
			props: { label: "Settings panel", open: true },
		});

		const content = screen.getByRole("dialog");
		await expect.element(content).toBeInTheDocument();
		await expect.element(content).toHaveAttribute("aria-modal", "true");
		await expect.element(content).toHaveAttribute("aria-label", "Settings panel");
		await expect.element(content).toHaveAttribute("data-kind", "sheet");
		await expect.element(content).toHaveAttribute("data-slot", "content");
	});

	it("renders overlay when open", async () => {
		const screen = render(Sheet, {
			props: { label: "Settings panel", open: true },
		});

		const overlay = screen.baseElement.querySelector("[data-slot='overlay']");
		expect(overlay).not.toBeNull();
		expect(overlay?.getAttribute("role")).toBe("presentation");
		expect(overlay?.getAttribute("aria-hidden")).toBe("true");
	});

	it("renders close button when open", async () => {
		const screen = render(Sheet, {
			props: { label: "Settings panel", open: true },
		});

		const close = screen.baseElement.querySelector("[data-slot='close']");
		expect(close).not.toBeNull();
		expect(close?.getAttribute("aria-label")).toBe("Close");
	});

	it("applies side data attribute", async () => {
		const screen = render(Sheet, {
			props: { label: "Settings", open: true, side: "left" },
		});

		const content = screen.getByRole("dialog");
		await expect.element(content).toHaveAttribute("data-side", "left");
	});

	it("applies recipe content classes with size and side", async () => {
		const screen = render(Sheet, {
			props: { label: "Settings", open: true, size: "lg", side: "right" },
		});

		const content = screen.getByRole("dialog");
		await expect.element(content).toHaveClass(/fixed/);
		await expect.element(content).toHaveClass(/border-l/);
	});

	it("merges custom className on content", async () => {
		const screen = render(Sheet, {
			props: { label: "Settings", open: true, class: "custom-class" },
		});

		const content = screen.getByRole("dialog");
		await expect.element(content).toHaveClass(/custom-class/);
	});
});
