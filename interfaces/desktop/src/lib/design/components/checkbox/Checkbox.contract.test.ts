/**
 * @file components/checkbox/Checkbox.contract.test.ts
 * @kind checkbox
 * @layer components
 * @package @devpulse/coldlight
 *
 * ANATOMY/ARIA contract enforcement — the first live consumer of
 * schema/enforce.ts (a11y audit Gap 7: "turn on the gate you already
 * own"). Renders the real component in Chromium and validates the
 * rendered DOM against checkbox.spec.ts via enforceAll(); also proves
 * the gate BITES (violations throw) and that spec ↔ anatomy agree on
 * slot names. Template for contract tests on the remaining kinds.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 */

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkboxAnatomy } from "../../behaviors/inputs/checkbox/checkbox.anatomy.js";
import { checkboxSpec } from "../../behaviors/inputs/checkbox/checkbox.spec.js";
import { ContractViolation, enforceAll, enforceSlot } from "../../schema/enforce.js";
import { validateAnatomyAlignment } from "../../schema/primitive.schema.js";
import Checkbox from "./Checkbox.svelte";

describe("checkbox — anatomy/ARIA contract", () => {
	test("rendered DOM satisfies the primitive spec (enforceAll)", async () => {
		const { container } = render(Checkbox, { checked: true });
		expect(() => enforceAll(container as HTMLElement, checkboxSpec)).not.toThrow();
	});

	test("indeterminate state still satisfies the contract", async () => {
		const { container } = render(Checkbox, { indeterminate: true });
		expect(() => enforceAll(container as HTMLElement, checkboxSpec)).not.toThrow();
		const root = (container as HTMLElement).querySelector('[data-slot="root"]');
		expect(root?.getAttribute("aria-checked")).toBe("mixed");
	});

	test("the gate bites: a non-conforming node throws ContractViolation", () => {
		const impostor = document.createElement("div");
		impostor.setAttribute("data-kind", "checkbox");
		impostor.setAttribute("data-slot", "root");
		expect(() => enforceSlot(impostor, checkboxSpec, "root")).toThrow(ContractViolation);
	});

	test("spec and anatomy agree on slot names", () => {
		const result = validateAnatomyAlignment(checkboxSpec, Object.keys(checkboxAnatomy.attrs));
		expect(result.errors).toEqual([]);
		expect(result.valid).toBe(true);
	});
});
