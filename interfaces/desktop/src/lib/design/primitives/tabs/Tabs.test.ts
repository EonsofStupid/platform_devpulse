/**
 * @file primitives/tabs/Tabs.test.ts
 * @layer primitives
 *
 * Tests for Tabs primitive using vitest-browser-svelte.
 * Runs in real Chromium browser via Playwright.
 *
 * Covers:
 * - ColdLight data attributes (data-kind, data-slot, data-state)
 * - ARIA (role=tablist, role=tab, role=tabpanel, aria-selected, aria-orientation)
 * - ARIA linking (aria-controls on trigger → tabpanel id, aria-labelledby on panel → tab id)
 * - Keyboard interaction (Arrow keys, Home, End)
 * - Tab selection (click trigger changes content)
 * - Disabled trigger (skipped in keyboard nav)
 */

import { describe, it, expect } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import TabsTest from "./Tabs.test.svelte";

describe("Tabs Primitive", () => {
  // ==========================================================================
  // COLDLIGHT DATA ATTRIBUTES
  // ==========================================================================

  describe("ColdLight data attributes", () => {
    it("root has data-kind=tabs and data-slot=root", async () => {
      const screen = render(TabsTest);
      const root = screen.container.querySelector(
        '[data-kind="tabs"][data-slot="root"]',
      );
      expect(root).not.toBeNull();
    });

    it("list has data-kind=tabs and data-slot=list", async () => {
      const screen = render(TabsTest);
      const list = screen.container.querySelector(
        '[data-kind="tabs"][data-slot="list"]',
      );
      expect(list).not.toBeNull();
    });

    it("triggers have data-kind=tabs and data-slot=trigger", async () => {
      const screen = render(TabsTest);
      const triggers = screen.container.querySelectorAll(
        '[data-kind="tabs"][data-slot="trigger"]',
      );
      expect(triggers.length).toBe(3);
    });

    it("content panels have data-kind=tabs and data-slot=content", async () => {
      const screen = render(TabsTest);
      const panels = screen.container.querySelectorAll(
        '[data-kind="tabs"][data-slot="content"]',
      );
      expect(panels.length).toBe(3);
    });

    it("selected trigger has data-state=selected", async () => {
      const screen = render(TabsTest, { defaultValue: "tab1" });
      const selectedTrigger = screen.container.querySelector(
        '[data-slot="trigger"][data-state="selected"]',
      ) as HTMLElement | null;
      await expect.element(selectedTrigger).toHaveTextContent("Tab One");
    });

    it("non-selected triggers have data-state=idle", async () => {
      const screen = render(TabsTest, { defaultValue: "tab1" });
      const idleTriggers = screen.container.querySelectorAll(
        '[data-slot="trigger"][data-state="idle"]',
      );
      expect(idleTriggers.length).toBe(2);
    });

    it("active content has data-state=visible", async () => {
      const screen = render(TabsTest, { defaultValue: "tab1" });
      const visiblePanel = screen.container.querySelector(
        '[data-slot="content"][data-state="visible"]',
      ) as HTMLElement | null;
      await expect.element(visiblePanel).toHaveTextContent(
        "Content for tab one",
      );
    });

    it("inactive content has data-state=hidden", async () => {
      const screen = render(TabsTest, { defaultValue: "tab1" });
      const hiddenPanels = screen.container.querySelectorAll(
        '[data-slot="content"][data-state="hidden"]',
      );
      expect(hiddenPanels.length).toBe(2);
    });
  });

  // ==========================================================================
  // ARIA ATTRIBUTES (provided by MeltUI via use:melt)
  // ==========================================================================

  describe("ARIA attributes", () => {
    it("list has role=tablist", async () => {
      const screen = render(TabsTest);
      const tablist = screen.getByRole("tablist");
      await expect.element(tablist).toBeInTheDocument();
    });

    it("list has aria-orientation=horizontal by default", async () => {
      const screen = render(TabsTest);
      const tablist = screen.getByRole("tablist");
      await expect
        .element(tablist)
        .toHaveAttribute("aria-orientation", "horizontal");
    });

    it("list has aria-orientation=vertical when vertical", async () => {
      const screen = render(TabsTest, { orientation: "vertical" });
      const tablist = screen.getByRole("tablist");
      await expect
        .element(tablist)
        .toHaveAttribute("aria-orientation", "vertical");
    });

    it("triggers have role=tab", async () => {
      const screen = render(TabsTest);
      const tabs = screen.container.querySelectorAll('[role="tab"]');
      expect(tabs.length).toBe(3);
    });

    it("selected trigger has aria-selected=true", async () => {
      const screen = render(TabsTest, { defaultValue: "tab1" });
      const tab = screen.getByRole("tab", { name: "Tab One" });
      await expect.element(tab).toHaveAttribute("aria-selected", "true");
    });

    it("non-selected triggers have aria-selected=false", async () => {
      const screen = render(TabsTest, { defaultValue: "tab1" });
      const tab2 = screen.getByRole("tab", { name: "Tab Two" });
      const tab3 = screen.getByRole("tab", { name: "Tab Three" });
      await expect.element(tab2).toHaveAttribute("aria-selected", "false");
      await expect.element(tab3).toHaveAttribute("aria-selected", "false");
    });

    it("content panels have role=tabpanel", async () => {
      const screen = render(TabsTest);
      const panels = screen.container.querySelectorAll('[role="tabpanel"]');
      // MeltUI only renders the active panel as visible; at least 1 should be present
      expect(panels.length).toBeGreaterThanOrEqual(1);
    });

    it("selected trigger has tabindex=0", async () => {
      const screen = render(TabsTest, { defaultValue: "tab1" });
      const tab = screen.getByRole("tab", { name: "Tab One" });
      await expect.element(tab).toHaveAttribute("tabindex", "0");
    });

    it("non-selected triggers have tabindex=-1", async () => {
      const screen = render(TabsTest, { defaultValue: "tab1" });
      const tab2 = screen.getByRole("tab", { name: "Tab Two" });
      await expect.element(tab2).toHaveAttribute("tabindex", "-1");
    });

    it("trigger aria-controls links to content panel id", async () => {
      const screen = render(TabsTest, { defaultValue: "tab1" });
      const tab = screen.getByRole("tab", { name: "Tab One" });
      const panelId = tab.element()?.getAttribute("aria-controls");
      expect(panelId).toBeTruthy();
      const panel = document.getElementById(panelId!);
      expect(panel).not.toBeNull();
      expect(panel?.getAttribute("role")).toBe("tabpanel");
    });

    it("content panel aria-labelledby links to trigger id", async () => {
      const screen = render(TabsTest, { defaultValue: "tab1" });
      const panel = screen.container.querySelector('[role="tabpanel"]');
      expect(panel).not.toBeNull();
      const triggerId = panel?.getAttribute("aria-labelledby");
      expect(triggerId).toBeTruthy();
      const trigger = document.getElementById(triggerId!);
      expect(trigger).not.toBeNull();
      expect(trigger?.getAttribute("role")).toBe("tab");
    });
  });

  // ==========================================================================
  // TAB SELECTION
  // ==========================================================================

  describe("tab selection", () => {
    it("clicking a trigger selects that tab", async () => {
      const screen = render(TabsTest, { defaultValue: "tab1" });
      const tab2 = screen.getByRole("tab", { name: "Tab Two" });

      await tab2.click();

      // Tab 2 should now be selected
      await expect.element(tab2).toHaveAttribute("aria-selected", "true");

      // Tab 2 content should be visible
      const visiblePanel = screen.container.querySelector(
        '[data-slot="content"][data-state="visible"]',
      ) as HTMLElement | null;
      await expect.element(visiblePanel).toHaveTextContent(
        "Content for tab two",
      );
    });

    it("clicking a trigger deselects the previous tab", async () => {
      const screen = render(TabsTest, { defaultValue: "tab1" });
      const tab1 = screen.getByRole("tab", { name: "Tab One" });
      const tab2 = screen.getByRole("tab", { name: "Tab Two" });

      // Initially tab1 is selected
      await expect.element(tab1).toHaveAttribute("aria-selected", "true");

      // Click tab2
      await tab2.click();

      // Tab1 should no longer be selected
      await expect.element(tab1).toHaveAttribute("aria-selected", "false");
    });

    it("default selected tab shows correct content", async () => {
      const screen = render(TabsTest, { defaultValue: "tab2" });
      const tab2 = screen.getByRole("tab", { name: "Tab Two" });
      await expect.element(tab2).toHaveAttribute("aria-selected", "true");

      const visiblePanel = screen.container.querySelector(
        '[data-slot="content"][data-state="visible"]',
      ) as HTMLElement | null;
      await expect.element(visiblePanel).toHaveTextContent(
        "Content for tab two",
      );
    });
  });

  // ==========================================================================
  // KEYBOARD INTERACTION
  // ==========================================================================

  describe("keyboard interaction", () => {
    it("ArrowRight moves to next tab in horizontal mode", async () => {
      const screen = render(TabsTest, { defaultValue: "tab1" });
      const tab1 = screen.getByRole("tab", { name: "Tab One" });

      // Focus the first tab
      await tab1.click();
      await expect.element(tab1).toHaveFocus();

      // Press ArrowRight
      await userEvent.keyboard("{ArrowRight}");

      // Tab 2 should now be focused and selected (automatic activation)
      const tab2 = screen.getByRole("tab", { name: "Tab Two" });
      await expect.element(tab2).toHaveFocus();
    });

    it("ArrowLeft moves to previous tab in horizontal mode", async () => {
      const screen = render(TabsTest, { defaultValue: "tab2" });
      const tab2 = screen.getByRole("tab", { name: "Tab Two" });

      // Focus tab 2
      await tab2.click();

      // Press ArrowLeft
      await userEvent.keyboard("{ArrowLeft}");

      // Tab 1 should now be focused
      const tab1 = screen.getByRole("tab", { name: "Tab One" });
      await expect.element(tab1).toHaveFocus();
    });

    it("ArrowRight wraps to first tab when loop=true", async () => {
      const screen = render(TabsTest, { defaultValue: "tab3", loop: true });
      const tab3 = screen.getByRole("tab", { name: "Tab Three" });

      // Focus last tab
      await tab3.click();

      // Press ArrowRight — should wrap to first
      await userEvent.keyboard("{ArrowRight}");

      const tab1 = screen.getByRole("tab", { name: "Tab One" });
      await expect.element(tab1).toHaveFocus();
    });

    it("Home moves to first tab", async () => {
      const screen = render(TabsTest, { defaultValue: "tab3" });
      const tab3 = screen.getByRole("tab", { name: "Tab Three" });

      await tab3.click();
      await userEvent.keyboard("{Home}");

      const tab1 = screen.getByRole("tab", { name: "Tab One" });
      await expect.element(tab1).toHaveFocus();
    });

    it("End moves to last tab", async () => {
      const screen = render(TabsTest, { defaultValue: "tab1" });
      const tab1 = screen.getByRole("tab", { name: "Tab One" });

      await tab1.click();
      await userEvent.keyboard("{End}");

      const tab3 = screen.getByRole("tab", { name: "Tab Three" });
      await expect.element(tab3).toHaveFocus();
    });

    it("ArrowDown moves to next tab in vertical mode", async () => {
      const screen = render(TabsTest, {
        defaultValue: "tab1",
        orientation: "vertical",
      });
      const tab1 = screen.getByRole("tab", { name: "Tab One" });

      await tab1.click();
      await userEvent.keyboard("{ArrowDown}");

      const tab2 = screen.getByRole("tab", { name: "Tab Two" });
      await expect.element(tab2).toHaveFocus();
    });

    it("ArrowUp moves to previous tab in vertical mode", async () => {
      const screen = render(TabsTest, {
        defaultValue: "tab2",
        orientation: "vertical",
      });
      const tab2 = screen.getByRole("tab", { name: "Tab Two" });

      await tab2.click();
      await userEvent.keyboard("{ArrowUp}");

      const tab1 = screen.getByRole("tab", { name: "Tab One" });
      await expect.element(tab1).toHaveFocus();
    });
  });

  // ==========================================================================
  // DISABLED STATE
  // ==========================================================================

  describe("disabled state", () => {
    it("disabled trigger has data-disabled attribute", async () => {
      const screen = render(TabsTest, { withDisabled: true });
      const tab3 = screen.getByRole("tab", { name: "Tab Three" });
      await expect.element(tab3).toHaveAttribute("data-disabled");
    });

    it("disabled trigger is skipped in keyboard navigation", async () => {
      const screen = render(TabsTest, {
        defaultValue: "tab2",
        withDisabled: true,
      });
      const tab2 = screen.getByRole("tab", { name: "Tab Two" });

      // Focus tab 2
      await tab2.click();

      // Press ArrowRight — should skip disabled tab3 and wrap to tab1
      await userEvent.keyboard("{ArrowRight}");

      const tab1 = screen.getByRole("tab", { name: "Tab One" });
      await expect.element(tab1).toHaveFocus();
    });
  });
});
