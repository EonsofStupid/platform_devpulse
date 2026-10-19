/**
 * @file Sidebar Component Tests
 * @kind sidebar
 * @layer components
 *
 * Vitest browser tests — real Chromium via @vitest/browser-playwright.
 * Tests: composition application, prop forwarding, ARIA attributes, builder integration.
 */

import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import Sidebar from "./Sidebar.svelte";

describe("Sidebar component", () => {
	it("renders with role=navigation and data-kind", async () => {
		const screen = render(Sidebar, {
			props: { label: "Main navigation" },
		});

		const el = screen.getByRole("navigation");
		await expect.element(el).toBeInTheDocument();
		await expect.element(el).toHaveAttribute("data-kind", "sidebar");
		await expect.element(el).toHaveAttribute("aria-label", "Main navigation");
	});

	it("applies expanded state by default", async () => {
		const screen = render(Sidebar, {
			props: { label: "Nav" },
		});

		const el = screen.getByRole("navigation");
		await expect.element(el).toHaveAttribute("data-state", "expanded");
	});

	it("applies collapsed state when expanded=false", async () => {
		const screen = render(Sidebar, {
			props: { label: "Nav", expanded: false },
		});

		const el = screen.getByRole("navigation");
		await expect.element(el).toHaveAttribute("data-state", "collapsed");
	});

	it("applies composition classes for size", async () => {
		const screen = render(Sidebar, {
			props: { label: "Nav", size: "lg" },
		});

		const el = screen.getByRole("navigation");
		await expect.element(el).toHaveClass(/w-80/);
	});

	it("applies collapsed width when not expanded", async () => {
		const screen = render(Sidebar, {
			props: { label: "Nav", expanded: false },
		});

		const el = screen.getByRole("navigation");
		await expect.element(el).toHaveClass(/w-16/);
	});

	it("renders content slot", async () => {
		const screen = render(Sidebar, {
			props: { label: "Nav" },
		});

		const content = screen.baseElement.querySelector("[data-slot='content']");
		expect(content).not.toBeNull();
		expect(content?.getAttribute("data-kind")).toBe("sidebar");
	});

	it("merges custom className", async () => {
		const screen = render(Sidebar, {
			props: { label: "Nav", class: "custom-class" },
		});

		const el = screen.getByRole("navigation");
		await expect.element(el).toHaveClass(/custom-class/);
	});
});
