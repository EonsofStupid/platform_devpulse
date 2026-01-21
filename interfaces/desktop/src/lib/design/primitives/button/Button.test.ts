/**
 * @file primitives/button/Button.test.ts
 * @layer primitives
 *
 * Tests for Button primitive using vitest-browser-svelte.
 * Runs in real Chromium browser via Playwright.
 *
 * Covers:
 * - Role and accessibility (role=button, data attributes)
 * - Keyboard/click activation (Enter, Space)
 * - Focus management
 * - State management (disabled, pressed)
 * - Button types
 */

import { describe, it, expect, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import ButtonWithChildren from "./Button.test.svelte";

describe("Button Primitive", () => {
  // ============================================
  // ROLE & ACCESSIBILITY
  // ============================================

  describe("role and accessibility", () => {
    it("renders with role=button and accessible name", async () => {
      const screen = render(ButtonWithChildren, { label: "Click me" });

      const button = screen.getByRole("button", { name: "Click me" });
      await expect.element(button).toBeInTheDocument();
    });

    it("emits data-primitive=button attribute", async () => {
      const screen = render(ButtonWithChildren, { label: "Test" });

      const button = screen.getByRole("button");
      await expect.element(button).toHaveAttribute("data-primitive", "button");
    });

    it("emits data-slot=root attribute", async () => {
      const screen = render(ButtonWithChildren, { label: "Test" });

      const button = screen.getByRole("button");
      await expect.element(button).toHaveAttribute("data-slot", "root");
    });

    it("supports data-id for stable identification", async () => {
      const screen = render(ButtonWithChildren, {
        label: "Test",
        "data-id": "submit-btn",
      });

      const button = screen.getByRole("button");
      await expect.element(button).toHaveAttribute("data-id", "submit-btn");
    });
  });

  // ============================================
  // ACTIVATION (Click + Keyboard)
  // ============================================

  describe("activation", () => {
    it("activates on click", async () => {
      const handleClick = vi.fn();
      const screen = render(ButtonWithChildren, {
        label: "Submit",
        onclick: handleClick,
      });

      const button = screen.getByRole("button");
      await button.click();

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("activates on Enter key", async () => {
      const handleClick = vi.fn();
      const screen = render(ButtonWithChildren, {
        label: "Submit",
        onclick: handleClick,
      });

      const button = screen.getByRole("button");
      // Click to focus (realistic user interaction)
      await button.click();
      handleClick.mockClear(); // Clear the click activation
      // Press Enter while focused - userEvent.keyboard operates on focused element
      await userEvent.keyboard("{Enter}");

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("activates on Space key", async () => {
      const handleClick = vi.fn();
      const screen = render(ButtonWithChildren, {
        label: "Submit",
        onclick: handleClick,
      });

      const button = screen.getByRole("button");
      // Click to focus
      await button.click();
      handleClick.mockClear();
      // Press Space while focused
      await userEvent.keyboard("{Space}");

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("does not activate on click when disabled", async () => {
      const handleClick = vi.fn();
      const screen = render(ButtonWithChildren, {
        label: "Disabled",
        onclick: handleClick,
        disabled: true,
      });

      const button = screen.getByRole("button");
      // Force click bypasses Playwright's enabled check
      await button.click({ force: true });

      expect(handleClick).not.toHaveBeenCalled();
    });

    it("does not activate on Enter when disabled", async () => {
      const handleClick = vi.fn();
      const screen = render(ButtonWithChildren, {
        label: "Disabled",
        onclick: handleClick,
        disabled: true,
      });

      // Tab to focus the disabled button
      await userEvent.keyboard("{Tab}");
      await userEvent.keyboard("{Enter}");

      expect(handleClick).not.toHaveBeenCalled();
    });

    it("does not activate on Space when disabled", async () => {
      const handleClick = vi.fn();
      const screen = render(ButtonWithChildren, {
        label: "Disabled",
        onclick: handleClick,
        disabled: true,
      });

      // Tab to focus the disabled button
      await userEvent.keyboard("{Tab}");
      await userEvent.keyboard("{Space}");

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // FOCUS MANAGEMENT
  // ============================================

  describe("focus management", () => {
    it("is focusable", async () => {
      const screen = render(ButtonWithChildren, { label: "Focusable" });

      const button = screen.getByRole("button");
      await button.click();

      await expect.element(button).toHaveFocus();
    });

    it("is disabled when disabled prop is true", async () => {
      const screen = render(ButtonWithChildren, {
        label: "Disabled",
        disabled: true,
      });

      const button = screen.getByRole("button");
      await expect.element(button).toBeDisabled();
    });
  });

  // ============================================
  // STATE MANAGEMENT
  // ============================================

  describe("state management", () => {
    it("has data-state=disabled when disabled", async () => {
      const screen = render(ButtonWithChildren, {
        label: "Disabled",
        disabled: true,
      });

      const button = screen.getByRole("button");
      await expect.element(button).toHaveAttribute("data-state", "disabled");
    });

    it("has no data-state when enabled and idle", async () => {
      const screen = render(ButtonWithChildren, { label: "Enabled" });

      const button = screen.getByRole("button");
      await expect.element(button).not.toHaveAttribute("data-state");
    });

    it("has data-state=pressed during pointer down", async () => {
      const screen = render(ButtonWithChildren, { label: "Press me" });

      const button = screen.getByRole("button");
      const buttonEl = button.element() as HTMLButtonElement;

      // Dispatch pointerdown - should set pressed state
      buttonEl.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));

      // Check pressed state is applied
      await expect.element(button).toHaveAttribute("data-state", "pressed");

      // Dispatch pointerup - should clear pressed state
      buttonEl.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));

      // Check pressed state is cleared
      await expect.element(button).not.toHaveAttribute("data-state");
    });

    it("clears pressed state on pointer leave", async () => {
      const screen = render(ButtonWithChildren, { label: "Press me" });

      const button = screen.getByRole("button");
      const buttonEl = button.element() as HTMLButtonElement;

      // Press down
      buttonEl.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      await expect.element(button).toHaveAttribute("data-state", "pressed");

      // Leave button while pressed (drag away)
      buttonEl.dispatchEvent(new PointerEvent("pointerleave", { bubbles: true }));

      // Pressed state should be cleared
      await expect.element(button).not.toHaveAttribute("data-state");
    });
  });

  // ============================================
  // BUTTON TYPES
  // ============================================

  describe("button types", () => {
    it("defaults to type=button", async () => {
      const screen = render(ButtonWithChildren, { label: "Default" });

      const button = screen.getByRole("button");
      await expect.element(button).toHaveAttribute("type", "button");
    });

    it("supports type=submit", async () => {
      const screen = render(ButtonWithChildren, {
        label: "Submit",
        type: "submit",
      });

      const button = screen.getByRole("button");
      await expect.element(button).toHaveAttribute("type", "submit");
    });

    it("supports type=reset", async () => {
      const screen = render(ButtonWithChildren, {
        label: "Reset",
        type: "reset",
      });

      const button = screen.getByRole("button");
      await expect.element(button).toHaveAttribute("type", "reset");
    });
  });
});
