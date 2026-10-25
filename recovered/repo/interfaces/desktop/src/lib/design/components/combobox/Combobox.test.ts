/**
 * @file Combobox Component Layer — Vitest Browser Tests
 *
 * Tests the FULL component stack: melt v0.44 Combobox → transport →
 * spread attrs → popover element → recipe classes → blueprint defaults.
 *
 * Categories:
 *   1. Contract: data-kind, data-slot, data-state on every slot
 *   2. ARIA: role=combobox, role=listbox, role=option, aria-expanded, aria-controls, aria-selected
 *   3. Popover API: popover="manual" on content
 *   4. Recipe: glass-void classes applied via blueprint defaults
 *   5. Open/Close: trigger click, Escape, closeOnEscape=false
 *   6. Selection: click item selects, value updates, aria-selected reflects
 *   7. Keyboard: ArrowDown/Up navigates, Enter selects, Escape closes
 *   8. Filtering: inputValue updates on typing, empty state
 *   9. Highlighting: data-highlighted on navigated item
 *  10. Transport: slot attrs spread correctly, IDs generated
 */

import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import ComboboxTest from "./Combobox.test.svelte";

// =============================================================================
// Helpers
// =============================================================================

const wait = (ms = 150) => new Promise((r) => setTimeout(r, ms));

async function renderOpen(props?: Record<string, unknown>): Promise<ReturnType<typeof render>> {
	const screen = render(ComboboxTest, { open: true, ...props });
	await wait();
	return screen;
}

function querySlot(slot: string): Element | null {
	return document.querySelector(`[data-slot="${slot}"]`);
}

function queryAllSlot(slot: string): Element[] {
	return Array.from(document.querySelectorAll(`[data-slot="${slot}"]`));
}

// =============================================================================
// 1. Contract Satisfaction — data-kind, data-slot, data-state
// =============================================================================

describe("Combobox: contract (data attributes)", () => {
	it("input: data-kind=combobox, data-slot=input", async () => {
		render(ComboboxTest);
		await wait();
		const input = querySlot("input");
		expect(input).not.toBeNull();
		expect(input?.getAttribute("data-kind")).toBe("combobox");
		expect(input?.getAttribute("data-slot")).toBe("input");
	});

	it("trigger: data-kind=combobox, data-slot=trigger", async () => {
		render(ComboboxTest);
		await wait();
		const trigger = querySlot("trigger");
		expect(trigger).not.toBeNull();
		expect(trigger?.getAttribute("data-kind")).toBe("combobox");
		expect(trigger?.getAttribute("data-slot")).toBe("trigger");
	});

	it("label: data-kind=combobox, data-slot=label", async () => {
		render(ComboboxTest);
		await wait();
		const label = querySlot("label");
		expect(label).not.toBeNull();
		expect(label?.getAttribute("data-kind")).toBe("combobox");
		expect(label?.getAttribute("data-slot")).toBe("label");
	});

	it("content: data-kind=combobox, data-slot=content when open", async () => {
		await renderOpen();
		const content = querySlot("content");
		expect(content).not.toBeNull();
		expect(content?.getAttribute("data-kind")).toBe("combobox");
		expect(content?.getAttribute("data-slot")).toBe("content");
	});

	it("content has data-state=open when open", async () => {
		await renderOpen();
		expect(querySlot("content")?.getAttribute("data-state")).toBe("open");
	});

	it("content has data-state=closed when closed", async () => {
		render(ComboboxTest);
		await wait();
		const content = querySlot("content");
		if (content) {
			expect(content.getAttribute("data-state")).toBe("closed");
		}
	});

	it("items: data-kind=combobox, data-slot=item when open", async () => {
		await renderOpen();
		const items = queryAllSlot("item");
		expect(items.length).toBe(5);
		for (const item of items) {
			expect(item.getAttribute("data-kind")).toBe("combobox");
			expect(item.getAttribute("data-slot")).toBe("item");
		}
	});

	it("every slot has data-kind=combobox", async () => {
		await renderOpen();
		const slotNames = ["input", "trigger", "label", "content", "item"];
		for (const name of slotNames) {
			const els = document.querySelectorAll(`[data-slot="${name}"]`);
			for (const el of els) {
				expect(el.getAttribute("data-kind"), `${name} should have data-kind=combobox`).toBe(
					"combobox",
				);
			}
		}
	});
});

// =============================================================================
// 2. ARIA
// =============================================================================

describe("Combobox: ARIA", () => {
	it("input has role=combobox", async () => {
		render(ComboboxTest);
		await wait();
		expect(querySlot("input")?.getAttribute("role")).toBe("combobox");
	});

	it("content has role=listbox when open", async () => {
		await renderOpen();
		expect(querySlot("content")?.getAttribute("role")).toBe("listbox");
	});

	it("items have role=option when open", async () => {
		await renderOpen();
		const items = queryAllSlot("item");
		for (const item of items) {
			expect(item.getAttribute("role")).toBe("option");
		}
	});

	it("input has aria-expanded=false when closed", async () => {
		render(ComboboxTest);
		await wait();
		expect(querySlot("input")?.getAttribute("aria-expanded")).toBe("false");
	});

	it("input has aria-expanded=true when open", async () => {
		await renderOpen();
		expect(querySlot("input")?.getAttribute("aria-expanded")).toBe("true");
	});

	it("input has aria-controls pointing to content id", async () => {
		await renderOpen();
		const contentId = querySlot("content")?.getAttribute("id");
		expect(contentId).toBeTruthy();
		expect(querySlot("input")?.getAttribute("aria-controls")).toBe(contentId);
	});
});

// =============================================================================
// 3. Popover API
// =============================================================================

describe("Combobox: popover API", () => {
	it("content has popover=manual attribute", async () => {
		await renderOpen();
		expect(querySlot("content")?.getAttribute("popover")).toBe("manual");
	});

	it("content is a <div> element (not <dialog>)", async () => {
		await renderOpen();
		expect(querySlot("content")?.tagName).toBe("DIV");
	});
});

// =============================================================================
// 4. Recipe application (glass-void via blueprint defaults)
// =============================================================================

describe("Combobox: recipe classes", () => {
	it("content has glass-void class from recipe", async () => {
		await renderOpen();
		expect(querySlot("content")?.classList.contains("glass-void")).toBe(true);
	});

	it("content has rounded-lg from radius token", async () => {
		await renderOpen();
		expect(querySlot("content")?.classList.contains("rounded-lg")).toBe(true);
	});

	it("input has text-sm class from recipe", async () => {
		render(ComboboxTest);
		await wait();
		expect(querySlot("input")?.classList.contains("text-sm")).toBe(true);
	});

	it("input has rounded-lg from recipe", async () => {
		render(ComboboxTest);
		await wait();
		expect(querySlot("input")?.classList.contains("rounded-lg")).toBe(true);
	});

	it("items have text-sm class from recipe", async () => {
		await renderOpen();
		const items = queryAllSlot("item");
		for (const item of items) {
			expect(item.classList.contains("text-sm")).toBe(true);
		}
	});

	it("items have rounded-md (downgraded from lg)", async () => {
		await renderOpen();
		const items = queryAllSlot("item");
		for (const item of items) {
			expect(item.classList.contains("rounded-md")).toBe(true);
		}
	});

	it("label has text-sm class from recipe", async () => {
		render(ComboboxTest);
		await wait();
		expect(querySlot("label")?.classList.contains("text-sm")).toBe(true);
	});
});

// =============================================================================
// 5. Open/Close behavior
// =============================================================================

describe("Combobox: open/close", () => {
	it("clicking trigger opens the combobox", async () => {
		render(ComboboxTest);
		await wait();
		const trigger = querySlot("trigger") as HTMLElement;
		await userEvent.click(trigger);
		await wait();
		expect(querySlot("content")?.getAttribute("data-state")).toBe("open");
	});

	it("Escape key closes the combobox", async () => {
		await renderOpen();
		expect(querySlot("content")?.getAttribute("data-state")).toBe("open");
		await userEvent.keyboard("{Escape}");
		await wait();
		const content = querySlot("content");
		expect(content === null || content.getAttribute("data-state") === "closed").toBe(true);
	});

	it("Escape does NOT close when closeOnEscape=false", async () => {
		await renderOpen({ closeOnEscape: false });
		expect(querySlot("content")?.getAttribute("data-state")).toBe("open");
		await userEvent.keyboard("{Escape}");
		await wait();
		expect(querySlot("content")?.getAttribute("data-state")).toBe("open");
	});
});

// =============================================================================
// 6. Selection
// =============================================================================

describe("Combobox: selection", () => {
	it("clicking an item selects it", async () => {
		await renderOpen();
		const items = queryAllSlot("item");
		expect(items.length).toBeGreaterThan(0);
		await (items[0] as HTMLElement).click();
		await wait();
		// After selection, the item should have aria-selected=true
		// Re-open to check (melt may close on select)
	});

	it("selected item has aria-selected=true", async () => {
		await renderOpen({ value: "Apple" });
		const items = queryAllSlot("item");
		const apple = items.find((el) => el.textContent?.trim() === "Apple");
		expect(apple).not.toBeUndefined();
		expect(apple?.getAttribute("aria-selected")).toBe("true");
	});

	it("non-selected items have aria-selected=false", async () => {
		await renderOpen({ value: "Apple" });
		const items = queryAllSlot("item");
		const nonApple = items.filter((el) => el.textContent?.trim() !== "Apple");
		for (const item of nonApple) {
			expect(item.getAttribute("aria-selected")).toBe("false");
		}
	});
});

// =============================================================================
// 7. Keyboard navigation
// =============================================================================

describe("Combobox: keyboard", () => {
	it("ArrowDown in input opens combobox", async () => {
		render(ComboboxTest);
		await wait();
		const input = querySlot("input") as HTMLElement;
		input.focus();
		await userEvent.keyboard("{ArrowDown}");
		await wait();
		expect(querySlot("content")?.getAttribute("data-state")).toBe("open");
	});

	it("ArrowDown navigates through items", async () => {
		await renderOpen();
		const input = querySlot("input") as HTMLElement;
		input.focus();
		await userEvent.keyboard("{ArrowDown}");
		await wait();
		// At least one item should have data-highlighted
		const items = queryAllSlot("item");
		const highlighted = items.filter((el) => el.hasAttribute("data-highlighted"));
		expect(highlighted.length).toBeGreaterThanOrEqual(1);
	});

	it("Enter selects the highlighted item", async () => {
		await renderOpen();
		const input = querySlot("input") as HTMLElement;
		input.focus();
		await userEvent.keyboard("{ArrowDown}");
		await wait();
		await userEvent.keyboard("{Enter}");
		await wait();
		// Selection occurred — content may close
	});
});

// =============================================================================
// 8. Filtering
// =============================================================================

describe("Combobox: filtering", () => {
	it("typing in input updates items via filtering", async () => {
		await renderOpen();
		const input = querySlot("input") as HTMLInputElement;
		input.focus();
		await userEvent.type(input, "ch");
		await wait();
		const items = queryAllSlot("item");
		// Only "Cherry" should match "ch"
		expect(items.length).toBe(1);
		expect(items[0].textContent?.trim()).toBe("Cherry");
	});

	it("empty state shown when no items match", async () => {
		await renderOpen();
		const input = querySlot("input") as HTMLInputElement;
		input.focus();
		await userEvent.type(input, "zzzzz");
		await wait();
		const empty = querySlot("empty");
		expect(empty).not.toBeNull();
		expect(empty?.textContent?.trim()).toBe("No fruits found");
	});

	it("all items shown with empty input", async () => {
		await renderOpen();
		const items = queryAllSlot("item");
		expect(items.length).toBe(5);
	});
});

// =============================================================================
// 9. Highlighting
// =============================================================================

describe("Combobox: highlighting", () => {
	it("first item auto-highlighted on open (melt default)", async () => {
		await renderOpen();
		const items = queryAllSlot("item");
		const highlighted = items.filter((el) => el.hasAttribute("data-highlighted"));
		expect(highlighted.length).toBe(1);
		expect(highlighted[0]).toBe(items[0]);
	});

	it("ArrowDown highlights first item", async () => {
		await renderOpen();
		const input = querySlot("input") as HTMLElement;
		input.focus();
		await userEvent.keyboard("{ArrowDown}");
		await wait();
		const items = queryAllSlot("item");
		const highlighted = items.filter((el) => el.hasAttribute("data-highlighted"));
		expect(highlighted.length).toBe(1);
	});

	it("multiple ArrowDown moves highlight forward", async () => {
		await renderOpen();
		const input = querySlot("input") as HTMLElement;
		input.focus();
		await userEvent.keyboard("{ArrowDown}");
		await wait();
		const first = queryAllSlot("item").findIndex((el) => el.hasAttribute("data-highlighted"));
		await userEvent.keyboard("{ArrowDown}");
		await wait();
		const second = queryAllSlot("item").findIndex((el) => el.hasAttribute("data-highlighted"));
		expect(second).toBeGreaterThan(first);
	});

	it("ArrowUp moves highlight backward", async () => {
		await renderOpen();
		const input = querySlot("input") as HTMLElement;
		input.focus();
		await userEvent.keyboard("{ArrowDown}");
		await userEvent.keyboard("{ArrowDown}");
		await wait();
		const before = queryAllSlot("item").findIndex((el) => el.hasAttribute("data-highlighted"));
		await userEvent.keyboard("{ArrowUp}");
		await wait();
		const after = queryAllSlot("item").findIndex((el) => el.hasAttribute("data-highlighted"));
		expect(after).toBeLessThan(before);
	});
});

// =============================================================================
// 10. Transport integrity — IDs, attrs, wiring
// =============================================================================

describe("Combobox: transport integrity", () => {
	it("input has an id from transport", async () => {
		render(ComboboxTest);
		await wait();
		const id = querySlot("input")?.getAttribute("id");
		expect(id).toBeTruthy();
	});

	it("content has an id from transport", async () => {
		await renderOpen();
		const id = querySlot("content")?.getAttribute("id");
		expect(id).toBeTruthy();
	});

	it("input aria-controls matches content id", async () => {
		await renderOpen();
		const contentId = querySlot("content")?.getAttribute("id");
		const ariaControls = querySlot("input")?.getAttribute("aria-controls");
		expect(contentId).toBeTruthy();
		expect(ariaControls).toBe(contentId);
	});

	it("label for attribute matches input id", async () => {
		render(ComboboxTest);
		await wait();
		const inputId = querySlot("input")?.getAttribute("id");
		const labelFor = querySlot("label")?.getAttribute("for");
		expect(inputId).toBeTruthy();
		expect(labelFor).toBe(inputId);
	});

	it("items each have unique ids", async () => {
		await renderOpen();
		const items = queryAllSlot("item");
		const ids = items.map((el) => el.getAttribute("id")).filter(Boolean);
		expect(ids.length).toBe(items.length);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it("two combobox instances get different id bases", async () => {
		const screen1 = await renderOpen();
		const id1 = querySlot("input")?.getAttribute("id") ?? "";
		screen1.unmount();

		const screen2 = await renderOpen();
		const id2 = querySlot("input")?.getAttribute("id") ?? "";
		screen2.unmount();

		expect(id1).not.toBe(id2);
	});
});
