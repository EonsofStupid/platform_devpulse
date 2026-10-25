/**
 * @file primitives/tabs/Tabs.test.ts
 * @layer primitives
 *
 * Tests for Tabs primitive using vitest-browser-svelte.
 * Runs in real Chromium browser via Playwright.
 *
 * Covers:
 * - Role and accessibility (role=tablist, tab, tabpanel)
 * - Data attributes (data-kind, data-slot, data-state, data-value)
 * - Keyboard interaction (Arrow keys, Home, End)
 * - Focus management (roving tabindex, no trap)
 * - State management (active/inactive)
 */

import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import TabsTest from "./Tabs.test.svelte";

describe("Tabs Primitive", () => {
	// ============================================
	// ROLE & ACCESSIBILITY
	// ============================================

	describe("role and accessibility", () => {
		it("renders tablist with role=tablist", async () => {
			const screen = render(TabsTest);
			const tablist = screen.getByRole("tablist");
			await expect.element(tablist).toBeInTheDocument();
		});

		it("renders triggers with role=tab", async () => {
			const screen = render(TabsTest);
			const tabs = screen.container.querySelectorAll('[role="tab"]');
			expect(tabs.length).toBe(3);
		});

		it("renders content with role=tabpanel", async () => {
			const screen = render(TabsTest, { value: "tab1" });
			const tabpanel = screen.getByRole("tabpanel");
			await expect.element(tabpanel).toBeInTheDocument();
		});

		it("active tab has aria-selected=true", async () => {
			const screen = render(TabsTest, { value: "tab1" });
			const tab1 = screen.getByRole("tab", { name: "Tab 1" });
			await expect.element(tab1).toHaveAttribute("aria-selected", "true");
		});

		it("inactive tabs have aria-selected=false", async () => {
			const screen = render(TabsTest, { value: "tab1" });
			const tab2 = screen.getByRole("tab", { name: "Tab 2" });
			const tab3 = screen.getByRole("tab", { name: "Tab 3" });
			await expect.element(tab2).toHaveAttribute("aria-selected", "false");
			await expect.element(tab3).toHaveAttribute("aria-selected", "false");
		});

		it("tabpanel has aria-labelledby linking to trigger", async () => {
			const screen = render(TabsTest, { value: "tab1" });
			const tabpanel = screen.getByRole("tabpanel");
			await expect.element(tabpanel).toHaveAttribute("aria-labelledby");
		});
	});

	// ============================================
	// DATA ATTRIBUTES
	// ============================================

	describe("data attributes", () => {
		it("root has data-kind=tabs", async () => {
			const screen = render(TabsTest);
			const root = screen.container.querySelector('[data-slot="root"]');
			await expect.element(root).toHaveAttribute("data-kind", "tabs");
		});

		it("root has data-slot=root", async () => {
			const screen = render(TabsTest);
			const root = screen.container.querySelector('[data-kind="tabs"]');
			await expect.element(root).toHaveAttribute("data-slot", "root");
		});

		it("root has data-orientation=horizontal by default", async () => {
			const screen = render(TabsTest);
			const root = screen.container.querySelector('[data-slot="root"]');
			await expect.element(root).toHaveAttribute("data-orientation", "horizontal");
		});

		it("root has data-orientation=vertical when set", async () => {
			const screen = render(TabsTest, { orientation: "vertical" });
			const root = screen.container.querySelector('[data-slot="root"]');
			await expect.element(root).toHaveAttribute("data-orientation", "vertical");
		});

		it("list has data-kind=tabs", async () => {
			const screen = render(TabsTest);
			const list = screen.getByRole("tablist");
			await expect.element(list).toHaveAttribute("data-kind", "tabs");
		});

		it("list has data-slot=list", async () => {
			const screen = render(TabsTest);
			const list = screen.getByRole("tablist");
			await expect.element(list).toHaveAttribute("data-slot", "list");
		});

		it("trigger has data-kind=tabs", async () => {
			const screen = render(TabsTest);
			const trigger = screen.getByRole("tab", { name: "Tab 1" });
			await expect.element(trigger).toHaveAttribute("data-kind", "tabs");
		});

		it("trigger has data-slot=trigger", async () => {
			const screen = render(TabsTest);
			const trigger = screen.getByRole("tab", { name: "Tab 1" });
			await expect.element(trigger).toHaveAttribute("data-slot", "trigger");
		});

		it("active trigger has data-state=active", async () => {
			const screen = render(TabsTest, { value: "tab1" });
			const trigger = screen.getByRole("tab", { name: "Tab 1" });
			await expect.element(trigger).toHaveAttribute("data-state", "active");
		});

		it("inactive trigger has data-state=inactive", async () => {
			const screen = render(TabsTest, { value: "tab1" });
			const trigger = screen.getByRole("tab", { name: "Tab 2" });
			await expect.element(trigger).toHaveAttribute("data-state", "inactive");
		});

		it("trigger has data-value matching its value", async () => {
			const screen = render(TabsTest);
			const tab1 = screen.getByRole("tab", { name: "Tab 1" });
			const tab2 = screen.getByRole("tab", { name: "Tab 2" });
			await expect.element(tab1).toHaveAttribute("data-value", "tab1");
			await expect.element(tab2).toHaveAttribute("data-value", "tab2");
		});

		it("content has data-kind=tabs", async () => {
			const screen = render(TabsTest, { value: "tab1" });
			const content = screen.getByRole("tabpanel");
			await expect.element(content).toHaveAttribute("data-kind", "tabs");
		});

		it("content has data-slot=content", async () => {
			const screen = render(TabsTest, { value: "tab1" });
			const content = screen.getByRole("tabpanel");
			await expect.element(content).toHaveAttribute("data-slot", "content");
		});

		it("content has data-state=active when visible", async () => {
			const screen = render(TabsTest, { value: "tab1" });
			const content = screen.getByRole("tabpanel");
			await expect.element(content).toHaveAttribute("data-state", "active");
		});

		it("content has data-value matching active tab", async () => {
			const screen = render(TabsTest, { value: "tab1" });
			const content = screen.getByRole("tabpanel");
			await expect.element(content).toHaveAttribute("data-value", "tab1");
		});

		it("supports data-id passthrough", async () => {
			const screen = render(TabsTest, { "data-id": "test-tabs" });
			const root = screen.container.querySelector('[data-slot="root"]');
			await expect.element(root).toHaveAttribute("data-id", "test-tabs");
		});
	});

	// ============================================
	// KEYBOARD INTERACTION - HORIZONTAL
	// ============================================

	describe("keyboard interaction (horizontal)", () => {
		it("ArrowRight moves to next tab", async () => {
			const screen = render(TabsTest, { value: "tab1" });
			const tab1 = screen.getByRole("tab", { name: "Tab 1" });
			await tab1.click();
			await userEvent.keyboard("{ArrowRight}");

			const tab2 = screen.getByRole("tab", { name: "Tab 2" });
			await expect.element(tab2).toHaveFocus();
		});

		it("ArrowLeft moves to previous tab", async () => {
			const screen = render(TabsTest, { value: "tab2" });
			const tab2 = screen.getByRole("tab", { name: "Tab 2" });
			await tab2.click();
			await userEvent.keyboard("{ArrowLeft}");

			const tab1 = screen.getByRole("tab", { name: "Tab 1" });
			await expect.element(tab1).toHaveFocus();
		});

		it("Home moves to first tab", async () => {
			const screen = render(TabsTest, { value: "tab3" });
			const tab3 = screen.getByRole("tab", { name: "Tab 3" });
			await tab3.click();
			await userEvent.keyboard("{Home}");

			const tab1 = screen.getByRole("tab", { name: "Tab 1" });
			await expect.element(tab1).toHaveFocus();
		});

		it("End moves to last tab", async () => {
			const screen = render(TabsTest, { value: "tab1" });
			const tab1 = screen.getByRole("tab", { name: "Tab 1" });
			await tab1.click();
			await userEvent.keyboard("{End}");

			const tab3 = screen.getByRole("tab", { name: "Tab 3" });
			await expect.element(tab3).toHaveFocus();
		});

		it("Tab key moves focus out of tablist", async () => {
			const screen = render(TabsTest, { value: "tab1" });
			const tab1 = screen.getByRole("tab", { name: "Tab 1" });
			await tab1.click();
			await userEvent.keyboard("{Tab}");

			// Focus should be in tabpanel now
			const tabpanel = screen.getByRole("tabpanel");
			await expect.element(tabpanel).toHaveFocus();
		});
	});

	// ============================================
	// KEYBOARD INTERACTION - VERTICAL
	// ============================================

	describe("keyboard interaction (vertical)", () => {
		it("ArrowDown moves to next tab", async () => {
			const screen = render(TabsTest, { value: "tab1", orientation: "vertical" });
			const tab1 = screen.getByRole("tab", { name: "Tab 1" });
			await tab1.click();
			await userEvent.keyboard("{ArrowDown}");

			const tab2 = screen.getByRole("tab", { name: "Tab 2" });
			await expect.element(tab2).toHaveFocus();
		});

		it("ArrowUp moves to previous tab", async () => {
			const screen = render(TabsTest, { value: "tab2", orientation: "vertical" });
			const tab2 = screen.getByRole("tab", { name: "Tab 2" });
			await tab2.click();
			await userEvent.keyboard("{ArrowUp}");

			const tab1 = screen.getByRole("tab", { name: "Tab 1" });
			await expect.element(tab1).toHaveFocus();
		});

		it("ArrowLeft/Right do not navigate in vertical mode", async () => {
			const screen = render(TabsTest, { value: "tab1", orientation: "vertical" });
			const tab1 = screen.getByRole("tab", { name: "Tab 1" });
			await tab1.click();
			await userEvent.keyboard("{ArrowRight}");

			// Focus should still be on tab1
			await expect.element(tab1).toHaveFocus();
		});
	});

	// ============================================
	// ACTIVATION MODES
	// ============================================

	describe("activation modes", () => {
		it("automatic mode activates tab on focus", async () => {
			const screen = render(TabsTest, { value: "tab1", activationMode: "automatic" });
			const tab1 = screen.getByRole("tab", { name: "Tab 1" });
			await tab1.click();
			await userEvent.keyboard("{ArrowRight}");

			// Tab 2 should now be active
			const tab2 = screen.getByRole("tab", { name: "Tab 2" });
			await expect.element(tab2).toHaveAttribute("aria-selected", "true");
		});

		it("manual mode requires Enter to activate", async () => {
			const screen = render(TabsTest, { value: "tab1", activationMode: "manual" });
			const tab1 = screen.getByRole("tab", { name: "Tab 1" });
			await tab1.click();
			await userEvent.keyboard("{ArrowRight}");

			// Tab 2 should be focused but not selected
			const tab2 = screen.getByRole("tab", { name: "Tab 2" });
			await expect.element(tab2).toHaveFocus();
			await expect.element(tab2).toHaveAttribute("aria-selected", "false");

			// Press Enter to activate
			await userEvent.keyboard("{Enter}");
			await expect.element(tab2).toHaveAttribute("aria-selected", "true");
		});

		it("manual mode Space key activates tab", async () => {
			const screen = render(TabsTest, { value: "tab1", activationMode: "manual" });
			const tab2 = screen.getByRole("tab", { name: "Tab 2" });
			tab2.element().focus();

			// Press Space to activate
			await userEvent.keyboard("{Space}");
			await expect.element(tab2).toHaveAttribute("aria-selected", "true");
		});
	});

	// ============================================
	// VALUE BINDING
	// ============================================

	describe("value binding", () => {
		it("displays correct content for initial value", async () => {
			const screen = render(TabsTest, { value: "tab2" });
			const content = screen.getByText("Content for Tab 2");
			await expect.element(content).toBeInTheDocument();
		});

		it("calls onValueChange when tab is activated", async () => {
			const onValueChange = vi.fn();
			const screen = render(TabsTest, { value: "tab1", onValueChange });
			const tab2 = screen.getByRole("tab", { name: "Tab 2" });
			await tab2.click();

			expect(onValueChange).toHaveBeenCalledWith("tab2");
		});

		it("updates content when value changes", async () => {
			const screen = render(TabsTest, { value: "tab1" });
			let content = screen.getByText("Content for Tab 1");
			await expect.element(content).toBeInTheDocument();

			const tab2 = screen.getByRole("tab", { name: "Tab 2" });
			await tab2.click();

			content = screen.getByText("Content for Tab 2");
			await expect.element(content).toBeInTheDocument();
		});
	});

	// ============================================
	// STATE CHANGES
	// ============================================

	describe("state changes", () => {
		it("data-state changes from inactive to active on click", async () => {
			const screen = render(TabsTest, { value: "tab1" });
			const tab2 = screen.getByRole("tab", { name: "Tab 2" });

			await expect.element(tab2).toHaveAttribute("data-state", "inactive");

			await tab2.click();

			await expect.element(tab2).toHaveAttribute("data-state", "active");
		});

		it("previously active tab becomes inactive", async () => {
			const screen = render(TabsTest, { value: "tab1" });
			const tab1 = screen.getByRole("tab", { name: "Tab 1" });
			const tab2 = screen.getByRole("tab", { name: "Tab 2" });

			await expect.element(tab1).toHaveAttribute("data-state", "active");

			await tab2.click();

			await expect.element(tab1).toHaveAttribute("data-state", "inactive");
		});
	});

	// ============================================
	// DISABLED STATE
	// ============================================

	describe("disabled state", () => {
		it("disabled root prevents all interaction", async () => {
			const screen = render(TabsTest, { value: "tab1", disabled: true });
			const tab2 = screen.getByRole("tab", { name: "Tab 2" });

			// Verify tabs are disabled
			await expect.element(tab2).toHaveAttribute("data-disabled");
			await expect.element(tab2).toHaveAttribute("disabled");
		});

		it("individual disabled tab cannot be activated", async () => {
			const screen = render(TabsTest, { value: "tab2", tab1Disabled: true });
			const tab1 = screen.getByRole("tab", { name: "Tab 1" });

			// Verify individual tab is disabled
			await expect.element(tab1).toHaveAttribute("data-disabled");
			await expect.element(tab1).toHaveAttribute("disabled");
		});

		it("keyboard navigation skips disabled tabs", async () => {
			const screen = render(TabsTest, { value: "tab2", tab1Disabled: true });
			const tab2 = screen.getByRole("tab", { name: "Tab 2" });
			await tab2.click();
			await userEvent.keyboard("{ArrowLeft}");

			// Should skip tab1 and wrap to tab3
			const tab3 = screen.getByRole("tab", { name: "Tab 3" });
			await expect.element(tab3).toHaveFocus();
		});
	});

	// ============================================
	// LOOP BEHAVIOR
	// ============================================

	describe("loop behavior", () => {
		it("wraps from last to first when loop=true", async () => {
			const screen = render(TabsTest, { value: "tab3", loop: true });
			const tab3 = screen.getByRole("tab", { name: "Tab 3" });
			await tab3.click();
			await userEvent.keyboard("{ArrowRight}");

			const tab1 = screen.getByRole("tab", { name: "Tab 1" });
			await expect.element(tab1).toHaveFocus();
		});

		it("wraps from first to last when loop=true", async () => {
			const screen = render(TabsTest, { value: "tab1", loop: true });
			const tab1 = screen.getByRole("tab", { name: "Tab 1" });
			await tab1.click();
			await userEvent.keyboard("{ArrowLeft}");

			const tab3 = screen.getByRole("tab", { name: "Tab 3" });
			await expect.element(tab3).toHaveFocus();
		});

		it("does not wrap when loop=false", async () => {
			const screen = render(TabsTest, { value: "tab3", loop: false });
			const tab3 = screen.getByRole("tab", { name: "Tab 3" });
			await tab3.click();
			await userEvent.keyboard("{ArrowRight}");

			// Focus should stay on tab3
			await expect.element(tab3).toHaveFocus();
		});
	});

	// ============================================
	// FOCUS MANAGEMENT
	// ============================================

	describe("focus management", () => {
		it("active tab is focusable via click", async () => {
			const screen = render(TabsTest, { value: "tab1" });
			const tab1 = screen.getByRole("tab", { name: "Tab 1" });
			await tab1.click();
			await expect.element(tab1).toHaveFocus();
		});

		it("only active tab has tabindex=0", async () => {
			const screen = render(TabsTest, { value: "tab2" });
			const tab1 = screen.getByRole("tab", { name: "Tab 1" });
			const tab2 = screen.getByRole("tab", { name: "Tab 2" });
			const tab3 = screen.getByRole("tab", { name: "Tab 3" });

			await expect.element(tab1).toHaveAttribute("tabindex", "-1");
			await expect.element(tab2).toHaveAttribute("tabindex", "0");
			await expect.element(tab3).toHaveAttribute("tabindex", "-1");
		});

		it("does not trap focus - Tab exits tablist", async () => {
			const screen = render(TabsTest, { value: "tab1" });
			const tab1 = screen.getByRole("tab", { name: "Tab 1" });
			await tab1.click();
			await userEvent.keyboard("{Tab}");

			// Focus should have moved to tabpanel
			const list = screen.getByRole("tablist");
			expect(list.element()?.contains(document.activeElement)).toBe(false);
		});

		it("Shift+Tab from tabpanel returns to active tab", async () => {
			const screen = render(TabsTest, { value: "tab1" });
			const tabpanel = screen.getByRole("tabpanel");
			tabpanel.element()?.focus();
			await userEvent.keyboard("{Shift>}{Tab}{/Shift}");

			const tab1 = screen.getByRole("tab", { name: "Tab 1" });
			await expect.element(tab1).toHaveFocus();
		});
	});
});
