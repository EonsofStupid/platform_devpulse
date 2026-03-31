/**
 * @file components/chat-sidebar/ChatSidebar.test.ts
 * @kind chat-sidebar
 * @layer components
 * @package @devpulse/coldlight
 *
 * ChatSidebar component browser tests.
 * Tests ARIA compliance, structural attributes, mode selection.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 */

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import ChatSidebar from "./ChatSidebar.svelte";

// ═══════════════════════════════════════════════════════════════
// ARIA — navigation pattern
// ═══════════════════════════════════════════════════════════════

describe("chat-sidebar — ARIA compliance", () => {
	test("renders nav element with aria-label='Chat modes'", async () => {
		const { getByRole } = render(ChatSidebar);
		const nav = getByRole("navigation");
		expect(nav).toBeTruthy();
		await expect.element(nav).toHaveAttribute("aria-label", "Chat modes");
	});

	test("renders buttons for all default modes", async () => {
		const { container } = render(ChatSidebar);
		const buttons = container.querySelectorAll("button");
		expect(buttons.length).toBe(4); // DEV, PLAN, IMG, GEN
	});

	test("active mode button has aria-pressed='true'", async () => {
		const { container } = render(ChatSidebar, { props: { mode: "developer" } });
		const buttons = container.querySelectorAll("button");
		const devButton = Array.from(buttons).find((b: Element) => b.textContent?.trim() === "DEV");
		expect(devButton).toBeTruthy();
		expect(devButton?.getAttribute("aria-pressed")).toBe("true");
	});
});

// ═══════════════════════════════════════════════════════════════
// STRUCTURAL — data-kind, data-slot
// ═══════════════════════════════════════════════════════════════

describe("chat-sidebar — structural attributes", () => {
	test("has data-kind='chat-sidebar'", async () => {
		const { getByRole } = render(ChatSidebar);
		const nav = getByRole("navigation");
		await expect.element(nav).toHaveAttribute("data-kind", "chat-sidebar");
	});

	test("has data-slot='mode-selector'", async () => {
		const { getByRole } = render(ChatSidebar);
		const nav = getByRole("navigation");
		await expect.element(nav).toHaveAttribute("data-slot", "mode-selector");
	});

	test("sets data-mode from mode prop", async () => {
		const { getByRole } = render(ChatSidebar, { props: { mode: "planning" } });
		const nav = getByRole("navigation");
		await expect.element(nav).toHaveAttribute("data-mode", "planning");
	});
});
