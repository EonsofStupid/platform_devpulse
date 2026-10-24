/**
 * @file ScrollArea Component Tests
 * @kind scroll-area
 * @layer components
 *
 * Vitest browser tests — real Chromium via @vitest/browser-playwright.
 * Tests: composition application, prop forwarding, ARIA attributes, builder integration.
 */

import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import ScrollArea from "./ScrollArea.svelte";

describe("ScrollArea component", () => {
	it("renders root with data-kind attribute", async () => {
		const screen = render(ScrollArea, {
			props: { label: "Scrollable content" },
		});

		const root = screen.baseElement.querySelector("[data-kind='scroll-area'][data-slot='root']");
		expect(root).not.toBeNull();
	});

	it("renders viewport with role=region and aria-label", async () => {
		const screen = render(ScrollArea, {
			props: { label: "Scrollable content" },
		});

		const viewport = screen.getByRole("region");
		await expect.element(viewport).toBeInTheDocument();
		await expect.element(viewport).toHaveAttribute("aria-label", "Scrollable content");
		await expect.element(viewport).toHaveAttribute("data-kind", "scroll-area");
		await expect.element(viewport).toHaveAttribute("data-slot", "viewport");
	});

	it("renders scrollbar with role=scrollbar and ARIA attributes", async () => {
		const screen = render(ScrollArea, {
			props: { label: "Content" },
		});

		const scrollbar = screen.getByRole("scrollbar");
		await expect.element(scrollbar).toBeInTheDocument();
		await expect.element(scrollbar).toHaveAttribute("aria-orientation", "vertical");
		await expect.element(scrollbar).toHaveAttribute("data-kind", "scroll-area");
		await expect.element(scrollbar).toHaveAttribute("data-slot", "scrollbar");
	});

	it("renders thumb element", async () => {
		const screen = render(ScrollArea, {
			props: { label: "Content" },
		});

		const thumb = screen.baseElement.querySelector("[data-slot='thumb']");
		expect(thumb).not.toBeNull();
		expect(thumb?.getAttribute("data-kind")).toBe("scroll-area");
	});

	it("applies horizontal orientation", async () => {
		const screen = render(ScrollArea, {
			props: { label: "Content", orientation: "horizontal" },
		});

		const scrollbar = screen.getByRole("scrollbar");
		await expect.element(scrollbar).toHaveAttribute("aria-orientation", "horizontal");
		await expect.element(scrollbar).toHaveAttribute("data-orientation", "horizontal");
	});

	it("applies composition classes", async () => {
		const screen = render(ScrollArea, {
			props: { label: "Content" },
		});

		const root = screen.baseElement.querySelector("[data-kind='scroll-area'][data-slot='root']");
		expect(root?.classList.contains("relative")).toBe(true);
		expect(root?.classList.contains("overflow-hidden")).toBe(true);
	});

	it("merges custom className on root", async () => {
		const screen = render(ScrollArea, {
			props: { label: "Content", class: "custom-class" },
		});

		const root = screen.baseElement.querySelector("[data-kind='scroll-area'][data-slot='root']");
		expect(root?.classList.contains("custom-class")).toBe(true);
	});
});
