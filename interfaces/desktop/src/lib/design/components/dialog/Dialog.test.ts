/**
 * @file components/dialog/Dialog.test.ts
 * @kind dialog
 * @layer components
 * @package @devpulse/coldlight
 *
 * Dialog compound component browser tests.
 * Tests contract shape, ARIA, exports.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";
import { contract } from "./contract.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("dialog component — contract", () => {
	test("contract.kind is 'dialog'", () => {
		expect(contract.kind).toBe("dialog");
	});

	test("contract.primitiveKind is 'dialog'", () => {
		expect(contract.primitiveKind).toBe("dialog");
	});

	test("content slot has role='dialog'", () => {
		expect(contract.slotContracts.content.aria.role).toBe("dialog");
	});

	test("content requires aria-modal", () => {
		const attrs = contract.slotContracts.content.aria.required.map((r) => r.attr);
		expect(attrs).toContain("aria-modal");
	});

	test("content requires aria-labelledby", () => {
		const attrs = contract.slotContracts.content.aria.required.map((r) => r.attr);
		expect(attrs).toContain("aria-labelledby");
	});

	test("trigger requires aria-haspopup", () => {
		const attrs = contract.slotContracts.trigger.aria.required.map((r) => r.attr);
		expect(attrs).toContain("aria-haspopup");
	});

	test("focus strategy is trap", () => {
		expect(contract.focus.strategy).toBe("trap");
	});

	test("interactions.modal is true", () => {
		expect(contract.interactions.modal).toBe(true);
	});

	test("keyboard includes Escape", () => {
		const keys = contract.keyboard.global.map((k) => k.key);
		expect(keys).toContain("Escape");
	});
});

// =============================================================================
// EXPORTS
// =============================================================================

describe("dialog component — exports", () => {
	test("exports Root", async () => {
		const mod = await import("./index.js");
		expect(mod.Root).toBeDefined();
	});

	test("exports Trigger", async () => {
		const mod = await import("./index.js");
		expect(mod.Trigger).toBeDefined();
	});

	test("exports Content", async () => {
		const mod = await import("./index.js");
		expect(mod.Content).toBeDefined();
	});

	test("exports Overlay", async () => {
		const mod = await import("./index.js");
		expect(mod.Overlay).toBeDefined();
	});

	test("exports Close", async () => {
		const mod = await import("./index.js");
		expect(mod.Close).toBeDefined();
	});
});
