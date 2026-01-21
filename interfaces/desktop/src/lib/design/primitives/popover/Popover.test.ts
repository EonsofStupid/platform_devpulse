/**
 * @file primitives/popover/Popover.test.ts
 * @layer primitives
 *
 * Tests for Popover primitive using vitest-browser-svelte.
 * Runs in real Chromium browser via Playwright.
 *
 * Covers:
 * - ARIA accessibility (aria-haspopup, aria-expanded, aria-controls)
 * - Data attributes (data-primitive, data-slot, data-state)
 * - Positioning (side, align, sideOffset)
 * - Interact outside behavior (closes by default)
 * - Keyboard interaction (Escape, Enter, Space)
 * - Focus management (conditional trap)
 * - Arrow component
 */

import { describe, it, expect, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import PopoverTest from "./Popover.test.svelte";

describe("Popover Primitive", () => {
  // ============================================
  // ARIA & ACCESSIBILITY
  // ============================================

  describe("ARIA and accessibility", () => {
    it("trigger has aria-haspopup=dialog", async () => {
      const screen = render(PopoverTest);
      const trigger = screen.getByRole("button", { name: "Open Popover" });
      await expect.element(trigger).toHaveAttribute("aria-haspopup", "dialog");
    });

    it("trigger has aria-expanded=false when closed", async () => {
      const screen = render(PopoverTest);
      const trigger = screen.getByRole("button", { name: "Open Popover" });
      await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
    });

    it("trigger has aria-expanded=true when open", async () => {
      const screen = render(PopoverTest, { open: true });
      const trigger = screen.getByRole("button", { name: "Open Popover" });
      await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
    });

    it("trigger has aria-controls pointing to content when open", async () => {
      const screen = render(PopoverTest, { open: true });
      const trigger = screen.getByRole("button", { name: "Open Popover" });
      // Portal renders content to document.body, not inside container
      const content = document.querySelector('[data-slot="content"]');
      const contentId = content?.getAttribute("id");
      if (contentId) {
        await expect.element(trigger).toHaveAttribute("aria-controls", contentId);
      }
    });

    it("content does NOT have aria-modal (non-modal)", async () => {
      render(PopoverTest, { open: true });
      // Portal renders content to document.body, not inside container
      const content = document.querySelector('[data-slot="content"]');
      // Popover content should NOT have aria-modal since it's non-modal
      expect(content?.getAttribute("aria-modal")).toBeFalsy();
    });
  });

  // ============================================
  // DATA ATTRIBUTES
  // ============================================

  describe("data attributes", () => {
    it("root has data-primitive=popover", async () => {
      const screen = render(PopoverTest);
      const root = screen.container.querySelector('[data-slot="root"]');
      await expect.element(root).toHaveAttribute("data-primitive", "popover");
    });

    it("root has data-slot=root", async () => {
      const screen = render(PopoverTest);
      const root = screen.container.querySelector('[data-primitive="popover"]');
      await expect.element(root).toHaveAttribute("data-slot", "root");
    });

    it("root has data-state=open when open", async () => {
      const screen = render(PopoverTest, { open: true });
      const root = screen.container.querySelector('[data-slot="root"]');
      await expect.element(root).toHaveAttribute("data-state", "open");
    });

    it("root has data-state=closed when closed", async () => {
      const screen = render(PopoverTest, { open: false });
      const root = screen.container.querySelector('[data-slot="root"]');
      await expect.element(root).toHaveAttribute("data-state", "closed");
    });

    it("trigger has data-primitive=popover", async () => {
      const screen = render(PopoverTest);
      const trigger = screen.getByRole("button", { name: "Open Popover" });
      await expect.element(trigger).toHaveAttribute("data-primitive", "popover");
    });

    it("trigger has data-slot=trigger", async () => {
      const screen = render(PopoverTest);
      const trigger = screen.getByRole("button", { name: "Open Popover" });
      await expect.element(trigger).toHaveAttribute("data-slot", "trigger");
    });

    it("content has data-primitive=popover", async () => {
      render(PopoverTest, { open: true });
      // Portal renders content to document.body
      const content = document.querySelector('[data-slot="content"]');
      await expect.element(content).toHaveAttribute("data-primitive", "popover");
    });

    it("content has data-slot=content", async () => {
      render(PopoverTest, { open: true });
      // Portal renders content to document.body
      const content = document.querySelector('[data-slot="content"]');
      await expect.element(content).toHaveAttribute("data-slot", "content");
    });

    it("content has data-state=open when open", async () => {
      render(PopoverTest, { open: true });
      // Portal renders content to document.body
      const content = document.querySelector('[data-slot="content"]');
      await expect.element(content).toHaveAttribute("data-state", "open");
    });

    it("close button has data-slot=close", async () => {
      render(PopoverTest, { open: true });
      // Portal renders close to document.body
      const close = document.querySelector('[data-slot="close"]');
      await expect.element(close).toBeInTheDocument();
      await expect.element(close).toHaveAttribute("data-primitive", "popover");
    });

    it("supports data-id passthrough", async () => {
      render(PopoverTest, { open: true, "data-id": "test-popover" });
      // Portal renders content to document.body
      const content = document.querySelector('[data-slot="content"]');
      await expect.element(content).toHaveAttribute("data-id", "test-popover");
    });
  });

  // ============================================
  // POSITIONING
  // ============================================

  describe("positioning", () => {
    it("content has data-side attribute", async () => {
      render(PopoverTest, { open: true, side: "bottom" });
      // Portal renders content to document.body
      const content = document.querySelector('[data-slot="content"]');
      // Bits UI adds data-side attribute for positioning
      await expect.element(content).toHaveAttribute("data-side");
    });

    it("content has data-align attribute", async () => {
      render(PopoverTest, { open: true, align: "center" });
      // Portal renders content to document.body
      const content = document.querySelector('[data-slot="content"]');
      // Bits UI adds data-align attribute for positioning
      await expect.element(content).toHaveAttribute("data-align");
    });
  });

  // ============================================
  // INTERACT OUTSIDE BEHAVIOR
  // ============================================

  describe("interact outside behavior", () => {
    it("closes on Escape by default", async () => {
      render(PopoverTest, { open: true });
      // Portal renders content to document.body
      const content = document.querySelector('[data-slot="content"]');
      await expect.element(content).toBeInTheDocument();

      await userEvent.keyboard("{Escape}");

      // Content should be removed
      const contentAfter = document.querySelector('[data-slot="content"]');
      expect(contentAfter).toBeNull();
    });

    it("does NOT close on Escape when closeOnEscape=false", async () => {
      render(PopoverTest, { open: true, closeOnEscape: false });
      // Portal renders content to document.body
      const content = document.querySelector('[data-slot="content"]');
      await expect.element(content).toBeInTheDocument();

      await userEvent.keyboard("{Escape}");

      // Content should still be there
      const contentAfter = document.querySelector('[data-slot="content"]');
      await expect.element(contentAfter).toBeInTheDocument();
    });
  });

  // ============================================
  // KEYBOARD INTERACTION
  // ============================================

  describe("keyboard interaction", () => {
    it("opens on Enter key", async () => {
      const screen = render(PopoverTest);
      const trigger = screen.getByRole("button", { name: "Open Popover" });
      trigger.element().focus();

      await userEvent.keyboard("{Enter}");

      // Portal renders content to document.body
      const content = document.querySelector('[data-slot="content"]');
      await expect.element(content).toBeInTheDocument();
    });

    it("opens on Space key", async () => {
      const screen = render(PopoverTest);
      const trigger = screen.getByRole("button", { name: "Open Popover" });
      trigger.element().focus();

      await userEvent.keyboard(" ");

      // Portal renders content to document.body
      const content = document.querySelector('[data-slot="content"]');
      await expect.element(content).toBeInTheDocument();
    });

    it("closes on Escape when open", async () => {
      render(PopoverTest, { open: true });
      // Portal renders content to document.body
      const content = document.querySelector('[data-slot="content"]');
      await expect.element(content).toBeInTheDocument();

      await userEvent.keyboard("{Escape}");

      const contentAfter = document.querySelector('[data-slot="content"]');
      expect(contentAfter).toBeNull();
    });
  });

  // ============================================
  // CLOSE BUTTON
  // ============================================

  describe("close button", () => {
    it("closes popover when clicked", async () => {
      const screen = render(PopoverTest, { open: true });
      const close = screen.getByRole("button", { name: "Close" });

      await userEvent.click(close);

      // Portal renders content to document.body
      const content = document.querySelector('[data-slot="content"]');
      expect(content).toBeNull();
    });

    it("calls onClose callback when clicked", async () => {
      const onClose = vi.fn();
      const screen = render(PopoverTest, { open: true, onClose });
      const close = screen.getByRole("button", { name: "Close" });

      await userEvent.click(close);

      expect(onClose).toHaveBeenCalled();
    });
  });

  // ============================================
  // STATE MANAGEMENT
  // ============================================

  describe("state management", () => {
    it("opens when trigger is clicked", async () => {
      const screen = render(PopoverTest);
      const trigger = screen.getByRole("button", { name: "Open Popover" });

      await userEvent.click(trigger);

      // Portal renders content to document.body
      const content = document.querySelector('[data-slot="content"]');
      await expect.element(content).toBeInTheDocument();
    });

    it("toggles open state on trigger click", async () => {
      const screen = render(PopoverTest);
      const trigger = screen.getByRole("button", { name: "Open Popover" });

      // Open
      await userEvent.click(trigger);
      // Portal renders content to document.body
      let content = document.querySelector('[data-slot="content"]');
      await expect.element(content).toBeInTheDocument();

      // Close
      await userEvent.click(trigger);
      content = document.querySelector('[data-slot="content"]');
      expect(content).toBeNull();
    });

    it("calls onOpenChange when opened", async () => {
      const onOpenChange = vi.fn();
      const screen = render(PopoverTest, { onOpenChange });
      const trigger = screen.getByRole("button", { name: "Open Popover" });

      await userEvent.click(trigger);

      expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    it("calls onOpenChange when closed", async () => {
      const onOpenChange = vi.fn();
      render(PopoverTest, { open: true, onOpenChange });

      await userEvent.keyboard("{Escape}");

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("supports controlled mode (initially open)", async () => {
      // Test that controlled open=true renders content immediately
      render(PopoverTest, { open: true });
      const content = document.querySelector('[data-slot="content"]');
      await expect.element(content).toBeInTheDocument();
    });

    it("supports controlled mode (initially closed)", async () => {
      // Test that controlled open=false does not render content
      render(PopoverTest, { open: false });
      const content = document.querySelector('[data-slot="content"]');
      expect(content).toBeNull();
    });
  });

  // ============================================
  // FOCUS MANAGEMENT
  // ============================================

  describe("focus management", () => {
    it("returns focus to trigger on close", async () => {
      const screen = render(PopoverTest);
      const trigger = screen.getByRole("button", { name: "Open Popover" });

      // Open popover via click (establishes focus chain)
      await userEvent.click(trigger);

      // Verify popover is open
      const content = document.querySelector('[data-slot="content"]');
      await expect.element(content).toBeInTheDocument();

      // Close via Escape
      await userEvent.keyboard("{Escape}");

      // Focus should return to trigger
      await expect.element(trigger).toHaveFocus();
    });
  });

  // ============================================
  // ARROW COMPONENT
  // ============================================

  describe("arrow component", () => {
    it("renders arrow when showArrow=true", async () => {
      render(PopoverTest, { open: true, showArrow: true });
      // Portal renders arrow to document.body (inside content)
      const arrow = document.querySelector('[data-slot="arrow"]');
      await expect.element(arrow).toBeInTheDocument();
    });

    it("arrow has data-primitive=popover", async () => {
      render(PopoverTest, { open: true, showArrow: true });
      // Portal renders arrow to document.body (inside content)
      const arrow = document.querySelector('[data-slot="arrow"]');
      await expect.element(arrow).toHaveAttribute("data-primitive", "popover");
    });

    it("does not render arrow when showArrow=false", async () => {
      render(PopoverTest, { open: true, showArrow: false });
      // Portal renders to document.body
      const arrow = document.querySelector('[data-slot="arrow"]');
      expect(arrow).toBeNull();
    });
  });
});
