/**
 * @file Tabs Component Layer — Vitest Browser Tests
 *
 * Tests the FULL component stack: ColdLight-native tabs transport →
 * spread attrs → ARIA → roving tabindex → recipe classes → blueprint defaults.
 *
 * Categories:
 *   1. Contract: data-kind, data-slot, data-state on every slot
 *   2. ARIA: role=tablist, role=tab, role=tabpanel, aria-selected, aria-controls, aria-labelledby
 *   3. Recipe: glass-void classes applied via blueprint defaults
 *   4. Selection: click trigger selects, value updates, content visibility, data-state
 *   5. Keyboard: ArrowRight/Left navigates, Home/End, disabled skipped, loop, activateOnFocus
 *   6. Disabled: disabled trigger not selectable, skipped in kb nav, data-disabled present
 *   7. Orientation: horizontal uses ArrowRight/Left, vertical uses ArrowDown/Up, aria-orientation
 *   8. Roving tabindex: selected trigger tabindex=0, others -1
 *   9. Transport: IDs generated, aria-controls → panel ID, aria-labelledby → trigger ID
 */

import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import TabsTest from "./Tabs.test.svelte";

// =============================================================================
// Helpers
// =============================================================================

const wait = (ms = 50) => new Promise((r) => setTimeout(r, ms));

function querySlot(slot: string): Element | null {
	return document.querySelector(`[data-slot="${slot}"]`);
}

function queryAllSlot(slot: string): Element[] {
	return Array.from(document.querySelectorAll(`[data-slot="${slot}"]`));
}

function getTriggers(): Element[] {
	return queryAllSlot("trigger");
}

function getContents(): Element[] {
	return queryAllSlot("content");
}

// =============================================================================
// 1. Contract — data-kind, data-slot, data-state
// =============================================================================

describe("Tabs: contract (data attributes)", () => {
	it("list: data-kind=tabs, data-slot=list", async () => {
		render(TabsTest);
		await wait();
		const list = querySlot("list");
		expect(list).not.toBeNull();
		expect(list?.getAttribute("data-kind")).toBe("tabs");
		expect(list?.getAttribute("data-slot")).toBe("list");
	});

	it("triggers: data-kind=tabs, data-slot=trigger", async () => {
		render(TabsTest);
		await wait();
		const triggers = getTriggers();
		expect(triggers.length).toBe(3);
		for (const t of triggers) {
			expect(t.getAttribute("data-kind")).toBe("tabs");
			expect(t.getAttribute("data-slot")).toBe("trigger");
		}
	});

	it("contents: data-kind=tabs, data-slot=content", async () => {
		render(TabsTest);
		await wait();
		const contents = getContents();
		expect(contents.length).toBe(3);
		for (const c of contents) {
			expect(c.getAttribute("data-kind")).toBe("tabs");
			expect(c.getAttribute("data-slot")).toBe("content");
		}
	});

	it("selected trigger has data-state=active", async () => {
		render(TabsTest, { value: "settings" });
		await wait();
		const triggers = getTriggers();
		const settings = triggers.find((t) => t.textContent?.trim() === "Settings");
		expect(settings?.getAttribute("data-state")).toBe("active");
	});

	it("non-selected triggers have data-state=inactive", async () => {
		render(TabsTest, { value: "settings" });
		await wait();
		const triggers = getTriggers();
		const others = triggers.filter((t) => t.textContent?.trim() !== "Settings");
		for (const t of others) {
			expect(t.getAttribute("data-state")).toBe("inactive");
		}
	});

	it("selected content has data-state=visible", async () => {
		render(TabsTest, { value: "settings" });
		await wait();
		const contents = getContents();
		const visible = contents.filter((c) => c.getAttribute("data-state") === "visible");
		expect(visible.length).toBe(1);
		expect(visible[0].textContent?.trim()).toBe("Settings panel content");
	});

	it("non-selected contents have data-state=hidden", async () => {
		render(TabsTest, { value: "settings" });
		await wait();
		const contents = getContents();
		const hidden = contents.filter((c) => c.getAttribute("data-state") === "hidden");
		expect(hidden.length).toBe(2);
	});
});

// =============================================================================
// 2. ARIA
// =============================================================================

describe("Tabs: ARIA", () => {
	it("list has role=tablist", async () => {
		render(TabsTest);
		await wait();
		expect(querySlot("list")?.getAttribute("role")).toBe("tablist");
	});

	it("triggers have role=tab", async () => {
		render(TabsTest);
		await wait();
		for (const t of getTriggers()) {
			expect(t.getAttribute("role")).toBe("tab");
		}
	});

	it("contents have role=tabpanel", async () => {
		render(TabsTest);
		await wait();
		for (const c of getContents()) {
			expect(c.getAttribute("role")).toBe("tabpanel");
		}
	});

	it("selected trigger has aria-selected=true", async () => {
		render(TabsTest, { value: "settings" });
		await wait();
		const triggers = getTriggers();
		const settings = triggers.find((t) => t.textContent?.trim() === "Settings");
		expect(settings?.getAttribute("aria-selected")).toBe("true");
	});

	it("non-selected triggers have aria-selected=false", async () => {
		render(TabsTest, { value: "settings" });
		await wait();
		const triggers = getTriggers();
		const others = triggers.filter((t) => t.textContent?.trim() !== "Settings");
		for (const t of others) {
			expect(t.getAttribute("aria-selected")).toBe("false");
		}
	});

	it("list has aria-orientation=horizontal by default", async () => {
		render(TabsTest);
		await wait();
		expect(querySlot("list")?.getAttribute("aria-orientation")).toBe("horizontal");
	});

	it("trigger aria-controls points to content panel id", async () => {
		render(TabsTest);
		await wait();
		const triggers = getTriggers();
		const contents = getContents();
		for (const t of triggers) {
			const ariaControls = t.getAttribute("aria-controls");
			expect(ariaControls).toBeTruthy();
			const panel = contents.find((c) => c.getAttribute("id") === ariaControls);
			expect(panel).not.toBeUndefined();
		}
	});

	it("content aria-labelledby points to trigger id", async () => {
		render(TabsTest);
		await wait();
		const triggers = getTriggers();
		const contents = getContents();
		for (const c of contents) {
			const labelledBy = c.getAttribute("aria-labelledby");
			expect(labelledBy).toBeTruthy();
			const trigger = triggers.find((t) => t.getAttribute("id") === labelledBy);
			expect(trigger).not.toBeUndefined();
		}
	});

	it("disabled trigger has aria-disabled", async () => {
		render(TabsTest);
		await wait();
		const triggers = getTriggers();
		const notifications = triggers.find((t) => t.textContent?.trim() === "Notifications");
		expect(notifications?.getAttribute("aria-disabled")).toBeTruthy();
	});
});

// =============================================================================
// 3. Recipe classes
// =============================================================================

describe("Tabs: recipe classes", () => {
	it("list has glass-void class", async () => {
		render(TabsTest);
		await wait();
		expect(querySlot("list")?.classList.contains("glass-void")).toBe(true);
	});

	it("list has rounded-lg from radius token", async () => {
		render(TabsTest);
		await wait();
		expect(querySlot("list")?.classList.contains("rounded-lg")).toBe(true);
	});

	it("triggers have text-sm class", async () => {
		render(TabsTest);
		await wait();
		for (const t of getTriggers()) {
			expect(t.classList.contains("text-sm")).toBe(true);
		}
	});

	it("contents have p-4 class", async () => {
		render(TabsTest);
		await wait();
		for (const c of getContents()) {
			expect(c.classList.contains("p-4")).toBe(true);
		}
	});
});

// =============================================================================
// 4. Selection
// =============================================================================

describe("Tabs: selection", () => {
	it("clicking a trigger selects its tab", async () => {
		render(TabsTest, { value: "settings" });
		await wait();
		const triggers = getTriggers();
		const profile = triggers.find((t) => t.textContent?.trim() === "Profile") as HTMLElement;
		await userEvent.click(profile);
		await wait();
		expect(profile.getAttribute("data-state")).toBe("active");
		expect(profile.getAttribute("aria-selected")).toBe("true");
	});

	it("clicking trigger changes visible content", async () => {
		render(TabsTest, { value: "settings" });
		await wait();
		const triggers = getTriggers();
		const profile = triggers.find((t) => t.textContent?.trim() === "Profile") as HTMLElement;
		await userEvent.click(profile);
		await wait();
		const contents = getContents();
		const visibleContent = contents.find((c) => c.getAttribute("data-state") === "visible");
		expect(visibleContent?.textContent?.trim()).toBe("Profile panel content");
	});

	it("previous trigger becomes inactive after new selection", async () => {
		render(TabsTest, { value: "settings" });
		await wait();
		const triggers = getTriggers();
		const profile = triggers.find((t) => t.textContent?.trim() === "Profile") as HTMLElement;
		await userEvent.click(profile);
		await wait();
		const settings = triggers.find((t) => t.textContent?.trim() === "Settings");
		expect(settings?.getAttribute("data-state")).toBe("inactive");
		expect(settings?.getAttribute("aria-selected")).toBe("false");
	});

	it("non-selected content panels are hidden", async () => {
		render(TabsTest, { value: "profile" });
		await wait();
		const contents = getContents();
		const hidden = contents.filter((c) => c.hasAttribute("hidden"));
		expect(hidden.length).toBe(2);
	});
});

// =============================================================================
// 5. Keyboard navigation
// =============================================================================

describe("Tabs: keyboard", () => {
	it("ArrowRight moves to next trigger", async () => {
		render(TabsTest, { value: "settings" });
		await wait();
		const triggers = getTriggers();
		const settings = triggers.find((t) => t.textContent?.trim() === "Settings") as HTMLElement;
		settings.focus();
		await userEvent.keyboard("{ArrowRight}");
		await wait();
		const profile = triggers.find((t) => t.textContent?.trim() === "Profile") as HTMLElement;
		expect(document.activeElement).toBe(profile);
	});

	it("ArrowRight with activateOnFocus selects the focused trigger", async () => {
		render(TabsTest, { value: "settings", activateOnFocus: true });
		await wait();
		const triggers = getTriggers();
		const settings = triggers.find((t) => t.textContent?.trim() === "Settings") as HTMLElement;
		settings.focus();
		await userEvent.keyboard("{ArrowRight}");
		await wait();
		const profile = triggers.find((t) => t.textContent?.trim() === "Profile");
		expect(profile?.getAttribute("data-state")).toBe("active");
	});

	it("ArrowLeft moves to previous trigger", async () => {
		render(TabsTest, { value: "profile" });
		await wait();
		const triggers = getTriggers();
		const profile = triggers.find((t) => t.textContent?.trim() === "Profile") as HTMLElement;
		profile.focus();
		await userEvent.keyboard("{ArrowLeft}");
		await wait();
		const settings = triggers.find((t) => t.textContent?.trim() === "Settings") as HTMLElement;
		expect(document.activeElement).toBe(settings);
	});

	it("Home jumps to first enabled trigger", async () => {
		render(TabsTest, { value: "profile" });
		await wait();
		const triggers = getTriggers();
		const profile = triggers.find((t) => t.textContent?.trim() === "Profile") as HTMLElement;
		profile.focus();
		await userEvent.keyboard("{Home}");
		await wait();
		const settings = triggers.find((t) => t.textContent?.trim() === "Settings") as HTMLElement;
		expect(document.activeElement).toBe(settings);
	});

	it("End jumps to last enabled trigger", async () => {
		render(TabsTest, { value: "settings" });
		await wait();
		const triggers = getTriggers();
		const settings = triggers.find((t) => t.textContent?.trim() === "Settings") as HTMLElement;
		settings.focus();
		await userEvent.keyboard("{End}");
		await wait();
		// Last enabled is Profile (Notifications is disabled)
		const profile = triggers.find((t) => t.textContent?.trim() === "Profile") as HTMLElement;
		expect(document.activeElement).toBe(profile);
	});

	it("ArrowRight loops to first trigger (loop=true)", async () => {
		render(TabsTest, { value: "profile", loop: true });
		await wait();
		const triggers = getTriggers();
		const profile = triggers.find((t) => t.textContent?.trim() === "Profile") as HTMLElement;
		profile.focus();
		await userEvent.keyboard("{ArrowRight}");
		await wait();
		// Skips disabled Notifications, loops to Settings
		const settings = triggers.find((t) => t.textContent?.trim() === "Settings") as HTMLElement;
		expect(document.activeElement).toBe(settings);
	});
});

// =============================================================================
// 6. Disabled triggers
// =============================================================================

describe("Tabs: disabled", () => {
	it("disabled trigger has data-disabled attribute", async () => {
		render(TabsTest);
		await wait();
		const triggers = getTriggers();
		const notifications = triggers.find((t) => t.textContent?.trim() === "Notifications");
		expect(notifications?.hasAttribute("data-disabled")).toBe(true);
	});

	it("clicking disabled trigger does not select it", async () => {
		render(TabsTest, { value: "settings" });
		await wait();
		const triggers = getTriggers();
		const notifications = triggers.find(
			(t) => t.textContent?.trim() === "Notifications",
		) as HTMLElement;
		// Use DOM click directly — Playwright's userEvent respects aria-disabled
		notifications.click();
		await wait();
		expect(notifications.getAttribute("data-state")).toBe("inactive");
		// Settings should still be active
		const settings = triggers.find((t) => t.textContent?.trim() === "Settings");
		expect(settings?.getAttribute("data-state")).toBe("active");
	});

	it("keyboard navigation skips disabled triggers", async () => {
		render(TabsTest, { value: "profile" });
		await wait();
		const triggers = getTriggers();
		const profile = triggers.find((t) => t.textContent?.trim() === "Profile") as HTMLElement;
		profile.focus();
		await userEvent.keyboard("{ArrowRight}");
		await wait();
		// Should skip Notifications (disabled) and loop to Settings
		const settings = triggers.find((t) => t.textContent?.trim() === "Settings") as HTMLElement;
		expect(document.activeElement).toBe(settings);
	});
});

// =============================================================================
// 7. Orientation
// =============================================================================

describe("Tabs: orientation", () => {
	it("horizontal tabs use ArrowRight/Left", async () => {
		render(TabsTest, { value: "settings", orientation: "horizontal" });
		await wait();
		const triggers = getTriggers();
		const settings = triggers.find((t) => t.textContent?.trim() === "Settings") as HTMLElement;
		settings.focus();
		await userEvent.keyboard("{ArrowRight}");
		await wait();
		const profile = triggers.find((t) => t.textContent?.trim() === "Profile") as HTMLElement;
		expect(document.activeElement).toBe(profile);
	});

	it("vertical tabs use ArrowDown/Up", async () => {
		render(TabsTest, { value: "settings", orientation: "vertical" });
		await wait();
		const triggers = getTriggers();
		const settings = triggers.find((t) => t.textContent?.trim() === "Settings") as HTMLElement;
		settings.focus();
		await userEvent.keyboard("{ArrowDown}");
		await wait();
		const profile = triggers.find((t) => t.textContent?.trim() === "Profile") as HTMLElement;
		expect(document.activeElement).toBe(profile);
	});

	it("vertical tabs ignore ArrowRight/Left", async () => {
		render(TabsTest, { value: "settings", orientation: "vertical" });
		await wait();
		const triggers = getTriggers();
		const settings = triggers.find((t) => t.textContent?.trim() === "Settings") as HTMLElement;
		settings.focus();
		await userEvent.keyboard("{ArrowRight}");
		await wait();
		// Focus should NOT move
		expect(document.activeElement).toBe(settings);
	});

	it("aria-orientation reflects vertical", async () => {
		render(TabsTest, { orientation: "vertical" });
		await wait();
		expect(querySlot("list")?.getAttribute("aria-orientation")).toBe("vertical");
	});
});

// =============================================================================
// 8. Roving tabindex
// =============================================================================

describe("Tabs: roving tabindex", () => {
	it("selected trigger has tabindex=0", async () => {
		render(TabsTest, { value: "settings" });
		await wait();
		const triggers = getTriggers();
		const settings = triggers.find((t) => t.textContent?.trim() === "Settings");
		expect(settings?.getAttribute("tabindex")).toBe("0");
	});

	it("non-selected triggers have tabindex=-1", async () => {
		render(TabsTest, { value: "settings" });
		await wait();
		const triggers = getTriggers();
		const others = triggers.filter((t) => t.textContent?.trim() !== "Settings");
		for (const t of others) {
			expect(t.getAttribute("tabindex")).toBe("-1");
		}
	});

	it("after selection change, new trigger gets tabindex=0", async () => {
		render(TabsTest, { value: "settings" });
		await wait();
		const triggers = getTriggers();
		const profile = triggers.find((t) => t.textContent?.trim() === "Profile") as HTMLElement;
		await userEvent.click(profile);
		await wait();
		expect(profile.getAttribute("tabindex")).toBe("0");
		const settings = triggers.find((t) => t.textContent?.trim() === "Settings");
		expect(settings?.getAttribute("tabindex")).toBe("-1");
	});
});

// =============================================================================
// 9. Transport integrity — IDs, attrs, wiring
// =============================================================================

describe("Tabs: transport integrity", () => {
	it("triggers have unique ids", async () => {
		render(TabsTest);
		await wait();
		const triggers = getTriggers();
		const ids = triggers.map((t) => t.getAttribute("id")).filter(Boolean);
		expect(ids.length).toBe(triggers.length);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it("content panels have unique ids", async () => {
		render(TabsTest);
		await wait();
		const contents = getContents();
		const ids = contents.map((c) => c.getAttribute("id")).filter(Boolean);
		expect(ids.length).toBe(contents.length);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it("trigger aria-controls matches corresponding content id", async () => {
		render(TabsTest);
		await wait();
		const triggers = getTriggers();
		for (const t of triggers) {
			const controlsId = t.getAttribute("aria-controls");
			if (!controlsId) continue;
			const panel = document.getElementById(controlsId);
			expect(panel).not.toBeNull();
			expect(panel?.getAttribute("role")).toBe("tabpanel");
		}
	});

	it("content aria-labelledby matches corresponding trigger id", async () => {
		render(TabsTest);
		await wait();
		const contents = getContents();
		for (const c of contents) {
			const labelledById = c.getAttribute("aria-labelledby");
			if (!labelledById) continue;
			const trigger = document.getElementById(labelledById);
			expect(trigger).not.toBeNull();
			expect(trigger?.getAttribute("role")).toBe("tab");
		}
	});

	it("two tabs instances get different id bases", async () => {
		const screen1 = render(TabsTest);
		await wait();
		const ids1 = getTriggers().map((t) => t.getAttribute("id"));
		screen1.unmount();

		const screen2 = render(TabsTest);
		await wait();
		const ids2 = getTriggers().map((t) => t.getAttribute("id"));
		screen2.unmount();

		// No overlap between instances
		for (const id of ids1) {
			expect(ids2).not.toContain(id);
		}
	});
});
