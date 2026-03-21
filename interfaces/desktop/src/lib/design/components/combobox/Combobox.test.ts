/**
 * @file Combobox component tests
 * @kind combobox
 * @layer components
 *
 * Tests contract shape, exports, ARIA.
 * Runner: Vitest browser mode (Chromium via Playwright)
 */

import { describe, expect, test } from "vitest";
import { contract } from "./contract.js";

describe("combobox component — contract", () => {
	test("contract.kind is 'combobox'", () => {
		expect(contract.kind).toBe("combobox");
	});

	test("contract requires input slot with role combobox", () => {
		expect(contract.slotContracts.input.aria.role).toBe("combobox");
	});

	test("input requires aria-expanded", () => {
		const attrs = contract.slotContracts.input.aria.required.map((r) => r.attr);
		expect(attrs).toContain("aria-expanded");
	});

	test("input requires aria-controls", () => {
		const attrs = contract.slotContracts.input.aria.required.map((r) => r.attr);
		expect(attrs).toContain("aria-controls");
	});

	test("content has role listbox", () => {
		expect(contract.slotContracts.content.aria.role).toBe("listbox");
	});

	test("option has role option", () => {
		expect(contract.slotContracts.option.aria.role).toBe("option");
	});

	test("option requires aria-selected", () => {
		const attrs = contract.slotContracts.option.aria.required.map((r) => r.attr);
		expect(attrs).toContain("aria-selected");
	});
});

describe("combobox component — exports", () => {
	test("exports Root", async () => {
		const mod = await import("./index.js");
		expect(mod.Root).toBeDefined();
	});

	test("exports Input", async () => {
		const mod = await import("./index.js");
		expect(mod.Input).toBeDefined();
	});

	test("exports Trigger", async () => {
		const mod = await import("./index.js");
		expect(mod.Trigger).toBeDefined();
	});

	test("exports Content", async () => {
		const mod = await import("./index.js");
		expect(mod.Content).toBeDefined();
	});

	test("exports Item", async () => {
		const mod = await import("./index.js");
		expect(mod.Item).toBeDefined();
	});

	test("exports Group", async () => {
		const mod = await import("./index.js");
		expect(mod.Group).toBeDefined();
	});

	test("exports a11y utilities", async () => {
		const mod = await import("./index.js");
		expect(mod.comboboxKeyboardMap).toBeDefined();
		expect(mod.comboboxFocusConfig).toBeDefined();
		expect(mod.comboboxAnnouncements).toBeDefined();
	});
});
