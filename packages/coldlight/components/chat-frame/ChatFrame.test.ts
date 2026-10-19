/**
 * @file components/chat-frame/ChatFrame.test.ts
 * @kind chat-frame
 * @layer components
 * @package @devpulse/coldlight
 *
 * ChatFrame component browser tests.
 * Tests ARIA compliance, structural attributes, state management.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 */

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import ChatFrame from "./ChatFrame.svelte";
import type { ChatFrameProps } from "./types.js";

// ═══════════════════════════════════════════════════════════════
// ARIA — WAI-ARIA dialog pattern
// ═══════════════════════════════════════════════════════════════

describe("chat-frame — ARIA compliance", () => {
	test("renders element with role='dialog'", async () => {
		const { getByRole } = render(ChatFrame);
		const frame = getByRole("dialog");
		expect(frame).toBeTruthy();
	});

	test("has aria-label='Clyffy Chat'", async () => {
		const { getByRole } = render(ChatFrame);
		const frame = getByRole("dialog");
		await expect.element(frame).toHaveAttribute("aria-label", "Clyffy Chat");
	});

	test("has aria-modal='false' (non-modal overlay)", async () => {
		const { getByRole } = render(ChatFrame);
		const frame = getByRole("dialog");
		await expect.element(frame).toHaveAttribute("aria-modal", "false");
	});
});

// ═══════════════════════════════════════════════════════════════
// STRUCTURAL — data-kind, data-slot, data-layout
// ═══════════════════════════════════════════════════════════════

describe("chat-frame — structural attributes", () => {
	test("has data-kind='chat-frame'", async () => {
		const { getByRole } = render(ChatFrame);
		const frame = getByRole("dialog");
		await expect.element(frame).toHaveAttribute("data-kind", "chat-frame");
	});

	test("has data-slot='root'", async () => {
		const { getByRole } = render(ChatFrame);
		const frame = getByRole("dialog");
		await expect.element(frame).toHaveAttribute("data-slot", "root");
	});

	test("has data-layout='chat'", async () => {
		const { getByRole } = render(ChatFrame);
		const frame = getByRole("dialog");
		await expect.element(frame).toHaveAttribute("data-layout", "chat");
	});
});

// ═══════════════════════════════════════════════════════════════
// STATE — data-state, data-engaged, data-context-collapsed
// ═══════════════════════════════════════════════════════════════

describe("chat-frame — state attributes", () => {
	test("defaults data-state to 'open'", async () => {
		const { getByRole } = render(ChatFrame);
		const frame = getByRole("dialog");
		await expect.element(frame).toHaveAttribute("data-state", "open");
	});

	test("sets data-state='minimized' when state prop is minimized", async () => {
		const { getByRole } = render(ChatFrame, {
			props: { state: "minimized" } as unknown as ChatFrameProps,
		});
		const frame = getByRole("dialog");
		await expect.element(frame).toHaveAttribute("data-state", "minimized");
	});

	test("sets data-engaged from engaged prop", async () => {
		const { getByRole } = render(ChatFrame, {
			props: { engaged: true } as unknown as ChatFrameProps,
		});
		const frame = getByRole("dialog");
		await expect.element(frame).toHaveAttribute("data-engaged", "true");
	});

	test("sets data-context-collapsed from contextCollapsed prop", async () => {
		const { getByRole } = render(ChatFrame, {
			props: { contextCollapsed: true } as unknown as ChatFrameProps,
		});
		const frame = getByRole("dialog");
		await expect.element(frame).toHaveAttribute("data-context-collapsed", "true");
	});
});

// ═══════════════════════════════════════════════════════════════
// STYLE MACRO — canonical CSS vars applied
// ═══════════════════════════════════════════════════════════════

describe("chat-frame — style macro integration", () => {
	test("has style attribute with -bg", async () => {
		const { getByRole } = render(ChatFrame);
		const frame = getByRole("dialog");
		const style = frame.element().getAttribute("style") ?? "";
		expect(style).toContain("-bg");
	});

	test("has data-cl-* family attributes", async () => {
		const { getByRole } = render(ChatFrame);
		const frame = getByRole("dialog");
		const attrs = frame.element().getAttributeNames();
		const familyAttrs = attrs.filter((a) => a.startsWith("data-cl-"));
		expect(familyAttrs.length).toBeGreaterThan(0);
	});
});
