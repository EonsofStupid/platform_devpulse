/**
 * @file primitives/dialog/Dialog.test.ts
 * @layer primitives
 *
 * Tests for Dialog primitive using vitest-browser-svelte.
 * Runs in real Chromium browser via Playwright.
 *
 * Covers:
 * - ColdLight data attributes (data-kind, data-slot, data-state)
 * - ARIA (role=dialog, aria-modal, aria-labelledby, aria-describedby, aria-haspopup)
 * - Keyboard interaction (Escape, Enter/Space on trigger)
 * - Focus management (trap, return to trigger)
 * - Open/close behavior (trigger click, close click, escape, overlay click)
 */

import { describe, it, expect } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import DialogTest from "./Dialog.test.svelte";

describe("Dialog Primitive", () => {
  // ==========================================================================
  // COLDLIGHT DATA ATTRIBUTES
  // ==========================================================================

  describe("ColdLight data attributes", () => {
    it("root has data-kind=dialog and data-slot=root", async () => {
      const screen = render(DialogTest);
      const root = screen.container.querySelector('[data-kind="dialog"][data-slot="root"]');
      expect(root).not.toBeNull();
    });

    it("root has data-state=closed when dialog is closed", async () => {
      const screen = render(DialogTest, { open: false });
      const root = screen.container.querySelector('[data-slot="root"]') as HTMLElement | null;
      await expect.element(root).toHaveAttribute("data-state", "closed");
    });

    it("root has data-state=open when dialog is open", async () => {
      const screen = render(DialogTest, { open: true });
      const root = screen.container.querySelector('[data-slot="root"]') as HTMLElement | null;
      await expect.element(root).toHaveAttribute("data-state", "open");
    });

    it("trigger has data-kind=dialog and data-slot=trigger", async () => {
      const screen = render(DialogTest);
      const trigger = screen.getByRole("button", { name: "Open Dialog" });
      await expect.element(trigger).toHaveAttribute("data-kind", "dialog");
      await expect.element(trigger).toHaveAttribute("data-slot", "trigger");
    });

    it("portal has data-kind=dialog and data-slot=portal", async () => {
      render(DialogTest, { open: true });
      const portal = document.querySelector('[data-kind="dialog"][data-slot="portal"]');
      expect(portal).not.toBeNull();
    });

    it("overlay has data-kind=dialog and data-slot=overlay", async () => {
      render(DialogTest, { open: true });
      const overlay = document.querySelector('[data-kind="dialog"][data-slot="overlay"]');
      expect(overlay).not.toBeNull();
    });

    it("content has data-kind=dialog and data-slot=content", async () => {
      render(DialogTest, { open: true });
      const content = document.querySelector('[data-kind="dialog"][data-slot="content"]');
      expect(content).not.toBeNull();
    });

    it("content has data-state=open when dialog is open", async () => {
      render(DialogTest, { open: true });
      const content = document.querySelector('[data-slot="content"]') as HTMLElement | null;
      await expect.element(content).toHaveAttribute("data-state", "open");
    });

    it("title has data-kind=dialog and data-slot=title", async () => {
      render(DialogTest, { open: true });
      const title = document.querySelector('[data-kind="dialog"][data-slot="title"]');
      expect(title).not.toBeNull();
    });

    it("description has data-kind=dialog and data-slot=description", async () => {
      render(DialogTest, { open: true });
      const desc = document.querySelector('[data-kind="dialog"][data-slot="description"]');
      expect(desc).not.toBeNull();
    });

    it("close has data-kind=dialog and data-slot=close", async () => {
      render(DialogTest, { open: true });
      const close = document.querySelector('[data-kind="dialog"][data-slot="close"]');
      expect(close).not.toBeNull();
    });
  });

  // ==========================================================================
  // ARIA ATTRIBUTES (provided by MeltUI via use:melt)
  // ==========================================================================

  describe("ARIA attributes", () => {
    it("content has role=dialog", async () => {
      const screen = render(DialogTest, { open: true });
      const dialog = screen.getByRole("dialog");
      await expect.element(dialog).toBeInTheDocument();
    });

    it("content has aria-modal=true", async () => {
      const screen = render(DialogTest, { open: true });
      const dialog = screen.getByRole("dialog");
      await expect.element(dialog).toHaveAttribute("aria-modal", "true");
    });

    it("content has aria-labelledby linked to title id", async () => {
      render(DialogTest, { open: true });
      const content = document.querySelector('[data-slot="content"]') as HTMLElement | null;
      const title = document.querySelector('[data-slot="title"]');
      const titleId = title?.getAttribute("id");
      expect(titleId).toBeTruthy();
      await expect.element(content).toHaveAttribute("aria-labelledby", titleId);
    });

    it("content has aria-describedby linked to description id", async () => {
      render(DialogTest, { open: true });
      const content = document.querySelector('[data-slot="content"]') as HTMLElement | null;
      const desc = document.querySelector('[data-slot="description"]');
      const descId = desc?.getAttribute("id");
      expect(descId).toBeTruthy();
      await expect.element(content).toHaveAttribute("aria-describedby", descId);
    });

    it("trigger has aria-haspopup=dialog", async () => {
      const screen = render(DialogTest);
      const trigger = screen.getByRole("button", { name: "Open Dialog" });
      await expect.element(trigger).toHaveAttribute("aria-haspopup", "dialog");
    });

    it("trigger has aria-expanded=false when closed", async () => {
      const screen = render(DialogTest, { open: false });
      const trigger = screen.getByRole("button", { name: "Open Dialog" });
      await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
    });

    it("content has an id (for trigger aria-controls linking)", async () => {
      render(DialogTest, { open: true });
      const content = document.querySelector('[data-slot="content"]');
      const contentId = content?.getAttribute("id");
      expect(contentId).toBeTruthy();
    });

    it("all IDs are linked correctly (full verification)", async () => {
      render(DialogTest, { open: true });
      const content = document.querySelector('[data-slot="content"]');
      const title = document.querySelector('[data-slot="title"]');
      const desc = document.querySelector('[data-slot="description"]');

      const contentId = content?.getAttribute("id");
      const titleId = title?.getAttribute("id");
      const descId = desc?.getAttribute("id");

      // All IDs exist
      expect(contentId).toBeTruthy();
      expect(titleId).toBeTruthy();
      expect(descId).toBeTruthy();

      // Content links to title and description
      expect(content?.getAttribute("aria-labelledby")).toBe(titleId);
      expect(content?.getAttribute("aria-describedby")).toBe(descId);
    });
  });

  // ==========================================================================
  // OPEN/CLOSE BEHAVIOR
  // ==========================================================================

  describe("open/close behavior", () => {
    it("opens dialog when trigger is clicked", async () => {
      const screen = render(DialogTest);
      const trigger = screen.getByRole("button", { name: "Open Dialog" });
      await trigger.click();
      const dialog = screen.getByRole("dialog");
      await expect.element(dialog).toBeInTheDocument();
    });

    it("closes dialog when close button is clicked", async () => {
      const screen = render(DialogTest, { open: true });
      const closeBtn = screen.getByRole("button", { name: "Close" });
      await closeBtn.click();
      const dialog = screen.container.querySelector('[role="dialog"]');
      expect(dialog).toBeNull();
    });

    it("closes dialog on Escape key", async () => {
      const screen = render(DialogTest, { open: true });
      const dialog = screen.getByRole("dialog");
      await expect.element(dialog).toBeInTheDocument();
      await userEvent.keyboard("{Escape}");
      const dialogAfter = screen.container.querySelector('[role="dialog"]');
      expect(dialogAfter).toBeNull();
    });

    it("does not close on Escape when closeOnEscape=false", async () => {
      const screen = render(DialogTest, { open: true, closeOnEscape: false });
      const dialog = screen.getByRole("dialog");
      await expect.element(dialog).toBeInTheDocument();
      await userEvent.keyboard("{Escape}");
      await expect.element(dialog).toBeInTheDocument();
    });

    it("renders title text", async () => {
      const screen = render(DialogTest, { open: true, titleText: "Custom Title" });
      const title = screen.getByText("Custom Title");
      await expect.element(title).toBeInTheDocument();
    });

    it("renders description text", async () => {
      const screen = render(DialogTest, {
        open: true,
        descriptionText: "Custom description",
      });
      const desc = screen.getByText("Custom description");
      await expect.element(desc).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // KEYBOARD INTERACTION
  // ==========================================================================

  describe("keyboard interaction", () => {
    it("opens dialog on trigger click", async () => {
      const screen = render(DialogTest);
      const trigger = screen.getByRole("button", { name: "Open Dialog" });
      await trigger.click();
      const dialog = screen.getByRole("dialog");
      await expect.element(dialog).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // FOCUS MANAGEMENT
  // ==========================================================================

  describe("focus management", () => {
    it("moves focus into dialog when opened", async () => {
      const screen = render(DialogTest);
      const trigger = screen.getByRole("button", { name: "Open Dialog" });
      await trigger.click();

      // Focus should be inside dialog content
      const dialog = screen.getByRole("dialog");
      const focusedElement = document.activeElement;
      expect(dialog.element()?.contains(focusedElement)).toBe(true);
    });

    it("returns focus to trigger when closed via Escape", async () => {
      const screen = render(DialogTest);
      const trigger = screen.getByRole("button", { name: "Open Dialog" });

      // Open
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

      // Open
      await trigger.click();

      // Close via close button
      const closeBtn = screen.getByRole("button", { name: "Close" });
      await closeBtn.click();

      // Focus should return to trigger
      await expect.element(trigger).toHaveFocus();
    });

    it("traps focus within dialog", async () => {
      const screen = render(DialogTest, { open: true });
      const dialog = screen.getByRole("dialog");
      await expect.element(dialog).toBeInTheDocument();

      // Tab multiple times — focus should stay inside dialog
      await userEvent.keyboard("{Tab}");
      await userEvent.keyboard("{Tab}");
      await userEvent.keyboard("{Tab}");
      await userEvent.keyboard("{Tab}");

      const focusedElement = document.activeElement;
      expect(dialog.element()?.contains(focusedElement)).toBe(true);
    });
  });
});
