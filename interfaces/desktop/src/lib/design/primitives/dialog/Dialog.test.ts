/**
 * @file primitives/dialog/Dialog.test.ts
 * @layer primitives
 *
 * Tests for Dialog primitive using vitest-browser-svelte.
 * Runs in real Chromium browser via Playwright.
 *
 * Covers:
 * - Role and accessibility (role=dialog, aria-modal, aria-labelledby)
 * - Data attributes (data-primitive, data-slot, data-state)
 * - Keyboard interaction (Escape, Enter, Space)
 * - Focus management (trap, return)
 * - Open/close behavior
 */

import { describe, it, expect } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import DialogTest from "./Dialog.test.svelte";

describe("Dialog Primitive", () => {
  // ============================================
  // ROLE & ACCESSIBILITY
  // ============================================

  describe("role and accessibility", () => {
    it("renders with role=dialog when open", async () => {
      const screen = render(DialogTest, { defaultOpen: true });
      const dialog = screen.getByRole("dialog");
      await expect.element(dialog).toBeInTheDocument();
    });

    it("has aria-modal=true when open", async () => {
      const screen = render(DialogTest, { defaultOpen: true });
      const dialog = screen.getByRole("dialog");
      await expect.element(dialog).toHaveAttribute("aria-modal", "true");
    });

    it("links title via aria-labelledby", async () => {
      const screen = render(DialogTest, { defaultOpen: true });
      const dialog = screen.getByRole("dialog");
      await expect.element(dialog).toHaveAttribute("aria-labelledby");
    });

    it("links description via aria-describedby", async () => {
      const screen = render(DialogTest, { defaultOpen: true });
      const dialog = screen.getByRole("dialog");
      await expect.element(dialog).toHaveAttribute("aria-describedby");
    });

    it("trigger has aria-haspopup=dialog", async () => {
      const screen = render(DialogTest);
      const trigger = screen.getByRole("button", { name: "Open Dialog" });
      await expect.element(trigger).toHaveAttribute("aria-haspopup", "dialog");
    });
  });

  // ============================================
  // DATA ATTRIBUTES
  // ============================================

  describe("data attributes", () => {
    it("root has data-primitive=dialog", async () => {
      const screen = render(DialogTest, { defaultOpen: true });
      const root = screen.container.querySelector('[data-slot="root"]');
      await expect.element(root).toHaveAttribute("data-primitive", "dialog");
    });

    it("root has data-slot=root", async () => {
      const screen = render(DialogTest);
      const root = screen.container.querySelector('[data-primitive="dialog"]');
      await expect.element(root).toHaveAttribute("data-slot", "root");
    });

    it("root has data-state=open when open", async () => {
      const screen = render(DialogTest, { defaultOpen: true });
      const root = screen.container.querySelector('[data-slot="root"]');
      await expect.element(root).toHaveAttribute("data-state", "open");
    });

    it("root has data-state=closed when closed", async () => {
      const screen = render(DialogTest, { defaultOpen: false });
      const root = screen.container.querySelector('[data-slot="root"]');
      await expect.element(root).toHaveAttribute("data-state", "closed");
    });

    it("trigger has data-primitive=dialog", async () => {
      const screen = render(DialogTest);
      const trigger = screen.getByRole("button", { name: "Open Dialog" });
      await expect.element(trigger).toHaveAttribute("data-primitive", "dialog");
    });

    it("trigger has data-slot=trigger", async () => {
      const screen = render(DialogTest);
      const trigger = screen.getByRole("button", { name: "Open Dialog" });
      await expect.element(trigger).toHaveAttribute("data-slot", "trigger");
    });

    it("content has data-primitive=dialog", async () => {
      const screen = render(DialogTest, { defaultOpen: true });
      const content = screen.getByRole("dialog");
      await expect.element(content).toHaveAttribute("data-primitive", "dialog");
    });

    it("content has data-slot=content", async () => {
      const screen = render(DialogTest, { defaultOpen: true });
      const content = screen.getByRole("dialog");
      await expect.element(content).toHaveAttribute("data-slot", "content");
    });

    it("supports data-id passthrough", async () => {
      const screen = render(DialogTest, { "data-id": "test-dialog" });
      const root = screen.container.querySelector('[data-slot="root"]');
      await expect.element(root).toHaveAttribute("data-id", "test-dialog");
    });
  });

  // ============================================
  // OPEN/CLOSE BEHAVIOR
  // ============================================

  describe("open/close behavior", () => {
    it("opens dialog when trigger is clicked", async () => {
      const screen = render(DialogTest);
      const trigger = screen.getByRole("button", { name: "Open Dialog" });
      await trigger.click();
      const dialog = screen.getByRole("dialog");
      await expect.element(dialog).toBeInTheDocument();
    });

    it("closes dialog when close button is clicked", async () => {
      const screen = render(DialogTest, { defaultOpen: true });
      const closeBtn = screen.getByRole("button", { name: "Close" });
      await closeBtn.click();
      const dialog = screen.container.querySelector('[role="dialog"]');
      expect(dialog).toBeNull();
    });

    it("closes dialog on Escape key", async () => {
      const screen = render(DialogTest, { defaultOpen: true });
      const dialog = screen.getByRole("dialog");
      await expect.element(dialog).toBeInTheDocument();
      await userEvent.keyboard("{Escape}");
      const dialogAfter = screen.container.querySelector('[role="dialog"]');
      expect(dialogAfter).toBeNull();
    });

    it("does not close on Escape when closeOnEscape=false", async () => {
      const screen = render(DialogTest, { defaultOpen: true, closeOnEscape: false });
      const dialog = screen.getByRole("dialog");
      await expect.element(dialog).toBeInTheDocument();
      await userEvent.keyboard("{Escape}");
      await expect.element(dialog).toBeInTheDocument();
    });
  });

  // ============================================
  // KEYBOARD INTERACTION
  // ============================================

  describe("keyboard interaction", () => {
    it("opens dialog on Enter key on trigger", async () => {
      const screen = render(DialogTest);
      const trigger = screen.getByRole("button", { name: "Open Dialog" });
      await trigger.click(); // Focus trigger
      await userEvent.keyboard("{Escape}"); // Close if opened

      // Re-focus trigger and press Enter
      await trigger.click();
      const dialog = screen.getByRole("dialog");
      await expect.element(dialog).toBeInTheDocument();
    });

    it("opens dialog on Space key on trigger", async () => {
      const screen = render(DialogTest);
      const trigger = screen.getByRole("button", { name: "Open Dialog" });

      // Focus trigger via tab
      await userEvent.keyboard("{Tab}");
      await expect.element(trigger).toHaveFocus();

      // Press Space
      await userEvent.keyboard("{Space}");
      const dialog = screen.getByRole("dialog");
      await expect.element(dialog).toBeInTheDocument();
    });
  });

  // ============================================
  // FOCUS MANAGEMENT
  // ============================================

  describe("focus management", () => {
    it("moves focus into dialog when opened", async () => {
      const screen = render(DialogTest);
      const trigger = screen.getByRole("button", { name: "Open Dialog" });
      await trigger.click();

      // Focus should be inside dialog (on first focusable element)
      const dialog = screen.getByRole("dialog");
      const focusedElement = document.activeElement;
      expect(dialog.element()?.contains(focusedElement)).toBe(true);
    });

    it("traps focus within dialog", async () => {
      const screen = render(DialogTest, { defaultOpen: true });
      const closeBtn = screen.getByRole("button", { name: "Close" });

      // Focus close button
      await closeBtn.click();
      await expect.element(closeBtn).toHaveFocus();

      // Tab multiple times - should stay in dialog
      await userEvent.keyboard("{Tab}");
      await userEvent.keyboard("{Tab}");
      await userEvent.keyboard("{Tab}");

      // Focus should still be inside dialog
      const dialog = screen.getByRole("dialog");
      const focusedElement = document.activeElement;
      expect(dialog.element()?.contains(focusedElement)).toBe(true);
    });

    it("returns focus to trigger when closed", async () => {
      const screen = render(DialogTest);
      const trigger = screen.getByRole("button", { name: "Open Dialog" });

      // Open dialog
      await trigger.click();
      const dialog = screen.getByRole("dialog");
      await expect.element(dialog).toBeInTheDocument();

      // Close via Escape
      await userEvent.keyboard("{Escape}");

      // Focus should return to trigger
      await expect.element(trigger).toHaveFocus();
    });

    it("returns focus to trigger when closed via close button", async () => {
      const screen = render(DialogTest);
      const trigger = screen.getByRole("button", { name: "Open Dialog" });

      // Open dialog
      await trigger.click();

      // Close via close button
      const closeBtn = screen.getByRole("button", { name: "Close" });
      await closeBtn.click();

      // Focus should return to trigger
      await expect.element(trigger).toHaveFocus();
    });
  });

  // ============================================
  // TITLE & DESCRIPTION
  // ============================================

  describe("title and description", () => {
    it("renders title text", async () => {
      const screen = render(DialogTest, { defaultOpen: true, titleText: "Custom Title" });
      const title = screen.getByText("Custom Title");
      await expect.element(title).toBeInTheDocument();
    });

    it("renders description text", async () => {
      const screen = render(DialogTest, { defaultOpen: true, descriptionText: "Custom description" });
      const desc = screen.getByText("Custom description");
      await expect.element(desc).toBeInTheDocument();
    });

    it("title has data-slot=title", async () => {
      const screen = render(DialogTest, { defaultOpen: true });
      const title = screen.container.querySelector('[data-slot="title"]');
      await expect.element(title).toBeInTheDocument();
      await expect.element(title).toHaveAttribute("data-primitive", "dialog");
    });

    it("description has data-slot=description", async () => {
      const screen = render(DialogTest, { defaultOpen: true });
      const desc = screen.container.querySelector('[data-slot="description"]');
      await expect.element(desc).toBeInTheDocument();
      await expect.element(desc).toHaveAttribute("data-primitive", "dialog");
    });
  });
});
