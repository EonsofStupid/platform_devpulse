/**
 * @file components/stat/Stat.test.ts
 * @kind stat
 * @layer components
 * @package @devpulse/coldlight
 *
 * Stat component browser tests.
 * Tests ARIA compliance and contract shape.
 * Visual/composition tests belong in ui/stat/ tests.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import { contract } from "./contract.js";
import Stat from "./Stat.svelte";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("stat component — contract", () => {
	test("contract.kind is 'stat'", () => {
		expect(contract.kind).toBe("stat");
	});

	test("contract.primitiveKind is 'stat'", () => {
		expect(contract.primitiveKind).toBe("stat");
	});

	test("contract requires slot 'root'", () => {
		expect(contract.slots.required).toContain("root");
	});

	test("contract root slot has role 'group'", () => {
		expect(contract.slotContracts.root.aria.role).toBe("group");
	});

	test("contract has no required ARIA attrs on root", () => {
		expect(contract.slotContracts.root.aria.required).toHaveLength(0);
	});

	test("contract has no keyboard interactions", () => {
		expect(contract.keyboard.global).toHaveLength(0);
	});

	test("contract interactions are all false", () => {
		expect(contract.interactions.modal).toBe(false);
		expect(contract.interactions.selectable).toBe(false);
		expect(contract.interactions.editable).toBe(false);
		expect(contract.interactions.expandable).toBe(false);
	});
});

// =============================================================================
// ARIA ATTRIBUTES
// =============================================================================

describe("stat component — ARIA", () => {
	test("has role='group'", async () => {
		const { getByRole } = render(Stat);
		const el = getByRole("group");
		expect(el).toBeTruthy();
	});
});

// =============================================================================
// PROP PASSTHROUGH
// =============================================================================

describe("stat component — prop passthrough", () => {
	test("merges custom class prop", async () => {
		const { getByRole } = render(Stat, { props: { class: "my-custom" } });
		const el = getByRole("group");
		await expect.element(el).toHaveClass("my-custom");
	});
});
