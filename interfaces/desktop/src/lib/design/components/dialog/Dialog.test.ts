/**
 * @file components/dialog/Dialog.test.ts
 * @kind dialog
 * @layer components
 * @package @devpulse/coldlight
 *
 * Dialog compound component browser tests.
 * Tests contract shape, ARIA attributes, sub-component rendering, and recipe application.
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

	test("contract requires slots 'trigger', 'content', 'overlay'", () => {
		expect(contract.slots.required).toContain("trigger");
		expect(contract.slots.required).toContain("content");
		expect(contract.slots.required).toContain("overlay");
	});

	test("contract has optional slots 'title', 'description', 'close', 'header', 'footer', 'portal'", () => {
		expect(contract.slots.optional).toContain("title");
		expect(contract.slots.optional).toContain("description");
		expect(contract.slots.optional).toContain("close");
		expect(contract.slots.optional).toContain("header");
		expect(contract.slots.optional).toContain("footer");
		expect(contract.slots.optional).toContain("portal");
	});

	test("content slot has role 'dialog'", () => {
		expect(contract.slotContracts.content.aria.role).toBe("dialog");
	});

	test("content slot has aria-modal as required ARIA", () => {
		const requiredAttrs = contract.slotContracts.content.aria.required.map((r) => r.attr);
		expect(requiredAttrs).toContain("aria-modal");
	});

	test("content slot has aria-labelledby relationship to title", () => {
		const rels = contract.slotContracts.content.aria.relationships ?? [];
		const labelledBy = rels.find((r) => r.attr === "aria-labelledby");
		expect(labelledBy).toBeDefined();
		expect(labelledBy?.targetSlot).toBe("title");
	});

	test("content slot has aria-describedby relationship to description", () => {
		const rels = contract.slotContracts.content.aria.relationships ?? [];
		const describedBy = rels.find((r) => r.attr === "aria-describedby");
		expect(describedBy).toBeDefined();
		expect(describedBy?.targetSlot).toBe("description");
	});

	test("trigger slot has role 'button'", () => {
		expect(contract.slotContracts.trigger.aria.role).toBe("button");
	});

	test("overlay slot has aria-hidden as required", () => {
		const requiredAttrs = contract.slotContracts.overlay.aria.required.map((r) => r.attr);
		expect(requiredAttrs).toContain("aria-hidden");
	});

	test("contract has Escape keyboard interaction", () => {
		expect(contract.keyboard.global.some((k) => k.key === "Escape")).toBe(true);
	});

	test("contract interactions — modal is true", () => {
		expect(contract.interactions.modal).toBe(true);
		expect(contract.interactions.selectable).toBe(false);
		expect(contract.interactions.editable).toBe(false);
		expect(contract.interactions.expandable).toBe(false);
	});

	test("contract focus strategy is 'trap'", () => {
		expect(contract.focus.strategy).toBe("trap");
	});

	test("contract primary state is 'open'", () => {
		expect(contract.states.primary).toBe("open");
	});

	test("contract states include 'open' and 'closed'", () => {
		expect(contract.states.all).toContain("open");
		expect(contract.states.all).toContain("closed");
	});
});

// =============================================================================
// SLOT CONTRACTS — per-slot ARIA enforcement
// =============================================================================

describe("dialog component — slot contracts", () => {
	test("content slot element is 'dialog'", () => {
		expect(contract.slotContracts.content.element).toBe("dialog");
	});

	test("trigger slot element is 'button'", () => {
		expect(contract.slotContracts.trigger.element).toBe("button");
	});

	test("overlay slot element is 'div'", () => {
		expect(contract.slotContracts.overlay.element).toBe("div");
	});

	test("title slot element is 'h2'", () => {
		expect(contract.slotContracts.title.element).toBe("h2");
	});

	test("description slot element is 'p'", () => {
		expect(contract.slotContracts.description.element).toBe("p");
	});

	test("close slot element is 'button'", () => {
		expect(contract.slotContracts.close.element).toBe("button");
	});

	test("close slot has keyboard Enter and Space", () => {
		const keys = (contract.slotContracts.close.keyboard ?? []).map((k) => k.key);
		expect(keys).toContain("Enter");
		expect(keys).toContain("Space");
	});

	test("content slot has keyboard Escape and Tab", () => {
		const keys = (contract.slotContracts.content.keyboard ?? []).map((k) => k.key);
		expect(keys).toContain("Escape");
		expect(keys).toContain("Tab");
	});

	test("trigger slot has aria-haspopup as optional", () => {
		const optionalAttrs = contract.slotContracts.trigger.aria.optional.map((o) => o.attr);
		expect(optionalAttrs).toContain("aria-haspopup");
	});

	test("trigger slot has aria-expanded as optional", () => {
		const optionalAttrs = contract.slotContracts.trigger.aria.optional.map((o) => o.attr);
		expect(optionalAttrs).toContain("aria-expanded");
	});

	test("trigger slot has aria-controls as optional", () => {
		const optionalAttrs = contract.slotContracts.trigger.aria.optional.map((o) => o.attr);
		expect(optionalAttrs).toContain("aria-controls");
	});
});
