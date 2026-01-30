/**
 * @file primitives/button/Button.test.ts
 * @layer primitives
 *
 * Tests for Button primitive using vitest-browser-svelte.
 * Runs in real Chromium browser via Playwright.
 *
 * Covers:
 * - ColdLight data attributes (data-kind, data-slot, data-state, data-variant, data-size)
 * - ARIA (aria-disabled, aria-busy, aria-pressed, aria-label)
 * - Click behavior (fires onclick, blocked when disabled/loading)
 * - Slot rendering (icon, label)
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import ButtonTest from "./Button.test.svelte";

describe("Button Primitive", () => {
  // ==========================================================================
  // COLDLIGHT DATA ATTRIBUTES
  // ==========================================================================

  describe("ColdLight data attributes", () => {
    it("has data-kind=button and data-slot=root", async () => {
      const screen = render(ButtonTest);
      const btn = screen.getByRole("button");
      await expect.element(btn).toHaveAttribute("data-kind", "button");
      await expect.element(btn).toHaveAttribute("data-slot", "root");
    });

    it("has data-state=idle by default", async () => {
      const screen = render(ButtonTest);
      const btn = screen.getByRole("button");
      await expect.element(btn).toHaveAttribute("data-state", "idle");
    });

    it("has data-state=disabled when disabled", async () => {
      const screen = render(ButtonTest, { disabled: true });
      const btn = screen.getByRole("button");
      await expect.element(btn).toHaveAttribute("data-state", "disabled");
    });

    it("has data-state=loading when loading", async () => {
      const screen = render(ButtonTest, { loading: true });
      const btn = screen.getByRole("button");
      await expect.element(btn).toHaveAttribute("data-state", "loading");
    });

    it("has data-state=pressed when pressed", async () => {
      const screen = render(ButtonTest, { pressed: true });
      const btn = screen.getByRole("button");
      await expect.element(btn).toHaveAttribute("data-state", "pressed");
    });

    it("has data-variant matching prop", async () => {
      const screen = render(ButtonTest, { variant: "primary" });
      const btn = screen.getByRole("button");
      await expect.element(btn).toHaveAttribute("data-variant", "primary");
    });

    it("has data-size matching prop", async () => {
      const screen = render(ButtonTest, { size: "lg" });
      const btn = screen.getByRole("button");
      await expect.element(btn).toHaveAttribute("data-size", "lg");
    });

    it("label slot has data-slot=label", async () => {
      const screen = render(ButtonTest, { label: "Test" });
      const label = screen.container.querySelector('[data-slot="label"]') as HTMLElement | null;
      expect(label).not.toBeNull();
      await expect.element(label).toHaveAttribute("data-kind", "button");
    });

    it("icon slot has data-slot=icon when showIcon=true", async () => {
      const screen = render(ButtonTest, { showIcon: true });
      const icon = screen.container.querySelector('[data-slot="icon"]') as HTMLElement | null;
      expect(icon).not.toBeNull();
      await expect.element(icon).toHaveAttribute("data-kind", "button");
    });
  });

  // ==========================================================================
  // ARIA ATTRIBUTES (ColdLight-owned)
  // ==========================================================================

  describe("ARIA attributes", () => {
    it("has aria-disabled when disabled", async () => {
      const screen = render(ButtonTest, { disabled: true });
      const btn = screen.getByRole("button");
      await expect.element(btn).toHaveAttribute("aria-disabled", "true");
    });

    it("does not have aria-disabled when enabled", async () => {
      const screen = render(ButtonTest, { disabled: false });
      const btn = screen.getByRole("button");
      expect(btn.element()?.getAttribute("aria-disabled")).toBeNull();
    });

    it("has aria-busy when loading", async () => {
      const screen = render(ButtonTest, { loading: true });
      const btn = screen.getByRole("button");
      await expect.element(btn).toHaveAttribute("aria-busy", "true");
    });

    it("has aria-pressed when pressed is true", async () => {
      const screen = render(ButtonTest, { pressed: true });
      const btn = screen.getByRole("button");
      await expect.element(btn).toHaveAttribute("aria-pressed", "true");
    });

    it("has aria-pressed=false when pressed is false", async () => {
      const screen = render(ButtonTest, { pressed: false });
      const btn = screen.getByRole("button");
      await expect.element(btn).toHaveAttribute("aria-pressed", "false");
    });

    it("has aria-label when provided", async () => {
      const screen = render(ButtonTest, { "aria-label": "Settings" });
      const btn = screen.getByRole("button", { name: "Settings" });
      await expect.element(btn).toHaveAttribute("aria-label", "Settings");
    });

    it("has tabindex=-1 when disabled", async () => {
      const screen = render(ButtonTest, { disabled: true });
      const btn = screen.getByRole("button");
      await expect.element(btn).toHaveAttribute("tabindex", "-1");
    });

    it("has tabindex=0 when enabled", async () => {
      const screen = render(ButtonTest, { disabled: false });
      const btn = screen.getByRole("button");
      await expect.element(btn).toHaveAttribute("tabindex", "0");
    });
  });

  // ==========================================================================
  // CLICK BEHAVIOR
  // ==========================================================================

  describe("click behavior", () => {
    it("fires onclick when clicked", async () => {
      const handler = vi.fn();
      const screen = render(ButtonTest, { onclick: handler });
      const btn = screen.getByRole("button");
      await btn.click();
      expect(handler).toHaveBeenCalledOnce();
    });

    it("does not fire onclick when disabled", async () => {
      const handler = vi.fn();
      const screen = render(ButtonTest, { onclick: handler, disabled: true });
      const btn = screen.getByRole("button");
      await btn.click();
      expect(handler).not.toHaveBeenCalled();
    });

    it("does not fire onclick when loading", async () => {
      const handler = vi.fn();
      const screen = render(ButtonTest, { onclick: handler, loading: true });
      const btn = screen.getByRole("button");
      await btn.click();
      expect(handler).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // CONTENT RENDERING
  // ==========================================================================

  describe("content rendering", () => {
    it("renders label text", async () => {
      const screen = render(ButtonTest, { label: "Save Changes" });
      const text = screen.getByText("Save Changes");
      await expect.element(text).toBeInTheDocument();
    });

    it("renders icon when showIcon=true", async () => {
      const screen = render(ButtonTest, { showIcon: true });
      const icon = screen.container.querySelector('[data-testid="icon"]');
      expect(icon).not.toBeNull();
    });

    it("has button type=button by default", async () => {
      const screen = render(ButtonTest);
      const btn = screen.getByRole("button");
      await expect.element(btn).toHaveAttribute("type", "button");
    });
  });
});
