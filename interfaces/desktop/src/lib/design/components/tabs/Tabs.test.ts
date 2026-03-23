/**
 * @file components/tabs/Tabs.test.ts
 * @kind tabs
 * @layer components
 * @package @devpulse/coldlight
 *
 * Tabs compound component browser tests.
 * Tests contract shape, ARIA attributes, sub-component rendering, and composition application.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";
import { contract } from "./contract.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("tabs component — contract", () => {
	test("contract.kind is 'tabs'", () => {
		expect(contract.kind).toBe("tabs");
	});

	test("contract.primitiveKind is 'tabs'", () => {
		expect(contract.primitiveKind).toBe("tabs");
	});

	test("contract requires slots 'root', 'list', 'trigger', 'content'", () => {
		expect(contract.slots.required).toContain("root");
		expect(contract.slots.required).toContain("list");
		expect(contract.slots.required).toContain("trigger");
		expect(contract.slots.required).toContain("content");
	});

	test("contract has no optional slots", () => {
		expect(contract.slots.optional).toHaveLength(0);
	});

	test("list slot has role 'tablist'", () => {
		expect(contract.slotContracts.list.aria.role).toBe("tablist");
	});

	test("trigger slot has role 'tab'", () => {
		expect(contract.slotContracts.trigger.aria.role).toBe("tab");
	});

	test("content slot has role 'tabpanel'", () => {
		expect(contract.slotContracts.content.aria.role).toBe("tabpanel");
	});

	test("trigger slot has aria-selected as required ARIA", () => {
		const requiredAttrs = contract.slotContracts.trigger.aria.required.map((r) => r.attr);
		expect(requiredAttrs).toContain("aria-selected");
	});

	test("trigger slot has aria-controls relationship to content", () => {
		const rels = contract.slotContracts.trigger.aria.relationships ?? [];
		const controls = rels.find((r) => r.attr === "aria-controls");
		expect(controls).toBeDefined();
		expect(controls?.targetSlot).toBe("content");
		expect(controls?.required).toBe(true);
	});

	test("content slot has aria-labelledby relationship to trigger", () => {
		const rels = contract.slotContracts.content.aria.relationships ?? [];
		const labelledBy = rels.find((r) => r.attr === "aria-labelledby");
		expect(labelledBy).toBeDefined();
		expect(labelledBy?.targetSlot).toBe("trigger");
		expect(labelledBy?.required).toBe(true);
	});

	test("contract has arrow keyboard interactions", () => {
		const keys = contract.keyboard.global.map((k) => k.key);
		expect(keys).toContain("ArrowRight");
		expect(keys).toContain("ArrowLeft");
		expect(keys).toContain("Home");
		expect(keys).toContain("End");
	});

	test("contract interactions — selectable is true, modal is false", () => {
		expect(contract.interactions.modal).toBe(false);
		expect(contract.interactions.selectable).toBe(true);
		expect(contract.interactions.editable).toBe(false);
		expect(contract.interactions.expandable).toBe(false);
	});

	test("contract focus strategy is 'roving'", () => {
		expect(contract.focus.strategy).toBe("roving");
	});
});

// =============================================================================
// SLOT CONTRACTS — per-slot element and ARIA enforcement
// =============================================================================

describe("tabs component — slot contracts", () => {
	test("root slot element is 'div'", () => {
		expect(contract.slotContracts.root.element).toBe("div");
	});

	test("list slot element is 'div'", () => {
		expect(contract.slotContracts.list.element).toBe("div");
	});

	test("trigger slot element is 'button'", () => {
		expect(contract.slotContracts.trigger.element).toBe("button");
	});

	test("content slot element is 'div'", () => {
		expect(contract.slotContracts.content.element).toBe("div");
	});

	test("list slot has aria-orientation as optional", () => {
		const optionalAttrs = contract.slotContracts.list.aria.optional.map((o) => o.attr);
		expect(optionalAttrs).toContain("aria-orientation");
	});

	test("trigger slot has keyboard navigation keys", () => {
		const keys = (contract.slotContracts.trigger.keyboard ?? []).map((k) => k.key);
		expect(keys).toContain("ArrowRight");
		expect(keys).toContain("ArrowLeft");
		expect(keys).toContain("ArrowDown");
		expect(keys).toContain("ArrowUp");
		expect(keys).toContain("Home");
		expect(keys).toContain("End");
	});

	test("trigger slot has aria-disabled as optional", () => {
		const optionalAttrs = contract.slotContracts.trigger.aria.optional.map((o) => o.attr);
		expect(optionalAttrs).toContain("aria-disabled");
	});

	test("content slot states include 'visible' and 'hidden'", () => {
		expect(contract.slotContracts.content.data.states).toContain("visible");
		expect(contract.slotContracts.content.data.states).toContain("hidden");
	});

	test("trigger slot states include 'active', 'selected', 'disabled'", () => {
		expect(contract.slotContracts.trigger.data.states).toContain("active");
		expect(contract.slotContracts.trigger.data.states).toContain("selected");
		expect(contract.slotContracts.trigger.data.states).toContain("disabled");
	});
});

// =============================================================================
// STATE SEMANTICS
// =============================================================================

describe("tabs component — state semantics", () => {
	test("states include active, selected, visible, hidden, disabled", () => {
		expect(contract.states.all).toContain("active");
		expect(contract.states.all).toContain("selected");
		expect(contract.states.all).toContain("visible");
		expect(contract.states.all).toContain("hidden");
		expect(contract.states.all).toContain("disabled");
	});

	test("ariaMapping maps active to aria-selected", () => {
		expect(contract.states.ariaMapping?.active).toBe("aria-selected");
	});

	test("ariaMapping maps disabled to aria-disabled", () => {
		expect(contract.states.ariaMapping?.disabled).toBe("aria-disabled");
	});
});
