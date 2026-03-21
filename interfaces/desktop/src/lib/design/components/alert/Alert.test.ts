/**
 * @file components/alert/Alert.test.ts
 * @kind alert
 * @layer components
 * @package @devpulse/coldlight
 *
 * Alert component browser tests.
 * Tests contract shape, ARIA, variant, dismiss.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";
import { contract } from "./contract.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("alert component — contract", () => {
	test("contract.kind is 'alert'", () => {
		expect(contract.kind).toBe("alert");
	});

	test("contract root slot has role='alert'", () => {
		expect(contract.slotContracts.root.aria.role).toBe("alert");
	});

	test("contract has optional slots", () => {
		expect(contract.slots.optional).toContain("icon");
		expect(contract.slots.optional).toContain("title");
		expect(contract.slots.optional).toContain("description");
		expect(contract.slots.optional).toContain("dismiss");
	});

	test("contract interactions are non-modal", () => {
		expect(contract.interactions.modal).toBe(false);
	});
});

// =============================================================================
// EXPORTS
// =============================================================================

describe("alert component — exports", () => {
	test("exports Root component", async () => {
		const mod = await import("./index.js");
		expect(mod.Root).toBeDefined();
	});

	test("exports Icon component", async () => {
		const mod = await import("./index.js");
		expect(mod.Icon).toBeDefined();
	});

	test("exports Title component", async () => {
		const mod = await import("./index.js");
		expect(mod.Title).toBeDefined();
	});

	test("exports Description component", async () => {
		const mod = await import("./index.js");
		expect(mod.Description).toBeDefined();
	});
});
