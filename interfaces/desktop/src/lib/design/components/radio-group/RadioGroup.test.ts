/**
 * @file RadioGroup Component Tests
 * @kind radio-group
 * @layer components
 */

import { describe, expect, it } from "vitest";
import { contract } from "./contract.js";
import { radioGroupRecipe } from "./recipe.js";

describe("RadioGroup", () => {
	describe("contract", () => {
		it("declares correct kind", () => {
			expect(contract.kind).toBe("radio-group");
		});

		it("declares all required slots", () => {
			expect(contract.slots.required).toContain("root");
			expect(contract.slots.required).toContain("item");
		});

		it("declares APG pattern", () => {
			expect(contract.apgPattern).toContain("radio");
		});

		it("requires aria-checked on item", () => {
			const itemRequired = contract.slotContracts.item.aria.required.map((r) => r.attr);
			expect(itemRequired).toContain("aria-checked");
		});
	});

	describe("recipe", () => {
		it("returns all slot class strings", () => {
			const classes = radioGroupRecipe();
			expect(classes.root).toBeTruthy();
			expect(classes.item).toBeTruthy();
			expect(classes.label).toBeTruthy();
		});
	});
});
