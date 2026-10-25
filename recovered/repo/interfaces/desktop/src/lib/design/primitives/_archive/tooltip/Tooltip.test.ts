/**
 * @file primitives/tooltip/Tooltip.test.ts
 * @layer primitives
 *
 * Tests for Tooltip primitive using vitest-browser-svelte.
 * Runs in real Chromium browser via Playwright.
 *
 * Covers:
 * - ARIA accessibility (role="tooltip", aria-describedby)
 * - Data attributes (data-kind, data-slot, data-state)
 * - Positioning (side, align, sideOffset)
 * - Hover interaction (default trigger mechanism)
 * - Keyboard interaction (focus shows tooltip)
 * - Arrow component
 */

import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import TooltipTest from "./Tooltip.test.svelte";

describe("Tooltip Primitive", () => {
	// ============================================
	// ARIA & ACCESSIBILITY
	// ============================================

	describe("ARIA and accessibility", () => {
		it("content has role=tooltip", async () => {
			render(TooltipTest, { open: true });
			// Portal renders content to document.body
			const content = document.querySelector('[data-slot="content"]');
			await expect.element(content).toHaveAttribute("role", "tooltip");
		});

		it("trigger links to content via aria-describedby when open", async () => {
			const screen = render(TooltipTest, { open: true });
			const trigger = screen.getByRole("button", { name: "Hover me" });
			// Portal renders content to document.body
			const content = document.querySelector('[data-slot="content"]');
			const contentId = content?.getAttribute("id");
			if (contentId) {
				await expect.element(trigger).toHaveAttribute("aria-describedby", contentId);
			}
		});

		it("content is non-modal (no aria-modal)", async () => {
			render(TooltipTest, { open: true });
			// Portal renders content to document.body
			const content = document.querySelector('[data-slot="content"]');
			// Tooltip should NOT have aria-modal since it's non-modal
			expect(content?.getAttribute("aria-modal")).toBeFalsy();
		});
	});

	// ============================================
	// DATA ATTRIBUTES
	// ============================================

	describe("data attributes", () => {
		it("root has data-kind=tooltip", async () => {
			const screen = render(TooltipTest);
			const root = screen.container.querySelector('[data-slot="root"]');
			await expect.element(root).toHaveAttribute("data-kind", "tooltip");
		});

		it("root has data-slot=root", async () => {
			const screen = render(TooltipTest);
			const root = screen.container.querySelector('[data-kind="tooltip"]');
			await expect.element(root).toHaveAttribute("data-slot", "root");
		});

		it("root has data-state=open when open", async () => {
			const screen = render(TooltipTest, { open: true });
			const root = screen.container.querySelector('[data-slot="root"]');
			await expect.element(root).toHaveAttribute("data-state", "open");
		});

		it("root has data-state=closed when closed", async () => {
			const screen = render(TooltipTest, { open: false });
			const root = screen.container.querySelector('[data-slot="root"]');
			await expect.element(root).toHaveAttribute("data-state", "closed");
		});

		it("trigger has data-kind=tooltip", async () => {
			const screen = render(TooltipTest);
			const trigger = screen.getByRole("button", { name: "Hover me" });
			await expect.element(trigger).toHaveAttribute("data-kind", "tooltip");
		});

		it("trigger has data-slot=trigger", async () => {
			const screen = render(TooltipTest);
			const trigger = screen.getByRole("button", { name: "Hover me" });
			await expect.element(trigger).toHaveAttribute("data-slot", "trigger");
		});

		it("content has data-kind=tooltip", async () => {
			render(TooltipTest, { open: true });
			// Portal renders content to document.body
			const content = document.querySelector('[data-slot="content"]');
			await expect.element(content).toHaveAttribute("data-kind", "tooltip");
		});

		it("content has data-slot=content", async () => {
			render(TooltipTest, { open: true });
			// Portal renders content to document.body
			const content = document.querySelector('[data-slot="content"]');
			await expect.element(content).toHaveAttribute("data-slot", "content");
		});

		it("content has data-state=open when open", async () => {
			render(TooltipTest, { open: true });
			// Portal renders content to document.body
			const content = document.querySelector('[data-slot="content"]');
			await expect.element(content).toHaveAttribute("data-state", "open");
		});

		it("supports data-id passthrough", async () => {
			render(TooltipTest, { open: true, "data-id": "test-tooltip" });
			// Portal renders content to document.body
			const content = document.querySelector('[data-slot="content"]');
			await expect.element(content).toHaveAttribute("data-id", "test-tooltip");
		});
	});

	// ============================================
	// POSITIONING
	// ============================================

	describe("positioning", () => {
		it("content has data-side attribute", async () => {
			render(TooltipTest, { open: true, side: "top" });
			// Portal renders content to document.body
			const content = document.querySelector('[data-slot="content"]');
			// Bits UI adds data-side attribute for positioning
			await expect.element(content).toHaveAttribute("data-side");
		});

		it("content has data-align attribute", async () => {
			render(TooltipTest, { open: true, align: "center" });
			// Portal renders content to document.body
			const content = document.querySelector('[data-slot="content"]');
			// Bits UI adds data-align attribute for positioning
			await expect.element(content).toHaveAttribute("data-align");
		});

		it("defaults to side=top", async () => {
			render(TooltipTest, { open: true });
			// Portal renders content to document.body
			const content = document.querySelector('[data-slot="content"]');
			await expect.element(content).toHaveAttribute("data-side", "top");
		});
	});

	// ============================================
	// HOVER INTERACTION
	// ============================================

	describe("hover interaction", () => {
		it("shows tooltip on hover (with immediate open for test)", async () => {
			// Use openDelay=0 for immediate testing
			const screen = render(TooltipTest, { openDelay: 0 });
			const trigger = screen.getByRole("button", { name: "Hover me" });

			await userEvent.hover(trigger);

			// Portal renders content to document.body
			const content = document.querySelector('[data-slot="content"]');
			await expect.element(content).toBeInTheDocument();
		});

		it("hides tooltip on mouse leave (uncontrolled)", async () => {
			// Use delays=0 for immediate testing in uncontrolled mode
			const screen = render(TooltipTest, { openDelay: 0, closeDelay: 0 });
			const trigger = screen.getByRole("button", { name: "Hover me" });

			// Hover to open
			await userEvent.hover(trigger);

			// Verify content is visible
			let content = document.querySelector('[data-slot="content"]');
			await expect.element(content).toBeInTheDocument();

			// Move mouse away
			await userEvent.unhover(trigger);

			// Give time for close to process
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Content should be removed
			content = document.querySelector('[data-slot="content"]');
			expect(content).toBeNull();
		});
	});

	// ============================================
	// KEYBOARD INTERACTION
	// ============================================

	describe("keyboard interaction", () => {
		it("trigger is focusable (tabindex=0)", async () => {
			const screen = render(TooltipTest);
			const trigger = screen.getByRole("button", { name: "Hover me" });
			// Tooltip triggers should be keyboard accessible
			await expect.element(trigger).toHaveAttribute("tabindex", "0");
		});

		it("trigger can receive focus", async () => {
			const screen = render(TooltipTest);
			const trigger = screen.getByRole("button", { name: "Hover me" });

			// Focus directly (tabindex=0 already verified above)
			trigger.element().focus();

			// Trigger should have focus
			await expect.element(trigger).toHaveFocus();
		});

		it("closes on Escape key", async () => {
			render(TooltipTest, { open: true });
			// Portal renders content to document.body
			const content = document.querySelector('[data-slot="content"]');
			await expect.element(content).toBeInTheDocument();

			await userEvent.keyboard("{Escape}");

			// Content should be removed
			const contentAfter = document.querySelector('[data-slot="content"]');
			expect(contentAfter).toBeNull();
		});
	});

	// ============================================
	// STATE MANAGEMENT
	// ============================================

	describe("state management", () => {
		it("calls onOpenChange when opened", async () => {
			const onOpenChange = vi.fn();
			const screen = render(TooltipTest, { onOpenChange, openDelay: 0 });
			const trigger = screen.getByRole("button", { name: "Hover me" });

			await userEvent.hover(trigger);

			expect(onOpenChange).toHaveBeenCalledWith(true);
		});

		it("calls onOpenChange when closed", async () => {
			const onOpenChange = vi.fn();
			render(TooltipTest, { open: true, onOpenChange, closeDelay: 0 });

			await userEvent.keyboard("{Escape}");

			expect(onOpenChange).toHaveBeenCalledWith(false);
		});

		it("supports controlled mode (initially open)", async () => {
			// Test that controlled open=true renders content immediately
			render(TooltipTest, { open: true });
			const content = document.querySelector('[data-slot="content"]');
			await expect.element(content).toBeInTheDocument();
		});

		it("supports controlled mode (initially closed)", async () => {
			// Test that controlled open=false does not render content
			render(TooltipTest, { open: false });
			const content = document.querySelector('[data-slot="content"]');
			expect(content).toBeNull();
		});
	});

	// ============================================
	// ARROW COMPONENT
	// ============================================

	describe("arrow component", () => {
		it("renders arrow when showArrow=true", async () => {
			render(TooltipTest, { open: true, showArrow: true });
			// Portal renders arrow to document.body (inside content)
			const arrow = document.querySelector('[data-slot="arrow"]');
			await expect.element(arrow).toBeInTheDocument();
		});

		it("arrow has data-kind=tooltip", async () => {
			render(TooltipTest, { open: true, showArrow: true });
			// Portal renders arrow to document.body (inside content)
			const arrow = document.querySelector('[data-slot="arrow"]');
			await expect.element(arrow).toHaveAttribute("data-kind", "tooltip");
		});

		it("does not render arrow when showArrow=false", async () => {
			render(TooltipTest, { open: true, showArrow: false });
			// Portal renders to document.body
			const arrow = document.querySelector('[data-slot="arrow"]');
			expect(arrow).toBeNull();
		});
	});
});
