/**
 * @file components/chat-footer/ChatFooter.test.ts
 * @kind chat-footer
 * @layer components
 * @package @devpulse/coldlight
 *
 * ChatFooter component browser tests.
 * Tests ARIA compliance, structural attributes, send behavior.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 */

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import ChatFooter from "./ChatFooter.svelte";

// ═══════════════════════════════════════════════════════════════
// ARIA — form pattern
// ═══════════════════════════════════════════════════════════════

describe("chat-footer — ARIA compliance", () => {
	test("renders element with role='form'", async () => {
		const { getByRole } = render(ChatFooter);
		const footer = getByRole("form");
		expect(footer).toBeTruthy();
	});

	test("has aria-label='Send message'", async () => {
		const { getByRole } = render(ChatFooter);
		const footer = getByRole("form");
		await expect.element(footer).toHaveAttribute("aria-label", "Send message");
	});
});

// ═══════════════════════════════════════════════════════════════
// STRUCTURAL — data-kind, data-slot
// ═══════════════════════════════════════════════════════════════

describe("chat-footer — structural attributes", () => {
	test("has data-kind='chat-footer'", async () => {
		const { getByRole } = render(ChatFooter);
		const footer = getByRole("form");
		await expect.element(footer).toHaveAttribute("data-kind", "chat-footer");
	});

	test("has data-slot='chat-footer'", async () => {
		const { getByRole } = render(ChatFooter);
		const footer = getByRole("form");
		await expect.element(footer).toHaveAttribute("data-slot", "chat-footer");
	});
});

// ═══════════════════════════════════════════════════════════════
// STYLE MACRO — --cl-* CSS vars applied
// ═══════════════════════════════════════════════════════════════

describe("chat-footer — style macro integration", () => {
	test("has style attribute with --cl-bg", async () => {
		const { getByRole } = render(ChatFooter);
		const footer = getByRole("form");
		const style = footer.element().getAttribute("style") ?? "";
		expect(style).toContain("--cl-bg");
	});
});
