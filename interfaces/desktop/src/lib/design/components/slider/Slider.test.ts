/**
 * @file Slider Component Tests
 * @kind slider
 * @layer components
 */

import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-svelte";
import Slider from "./Slider.svelte";
import { contract } from "./contract.js";
import { sliderRecipe } from "./recipe.js";

describe("Slider", () => {
	describe("contract", () => {
		it("declares correct kind", () => {
			expect(contract.kind).toBe("slider");
		});

		it("declares all required slots", () => {
			expect(contract.slots.required).toContain("root");
			expect(contract.slots.required).toContain("track");
			expect(contract.slots.required).toContain("thumb");
		});

		it("declares APG pattern", () => {
			expect(contract.apgPattern).toContain("slider");
		});

		it("requires aria-valuenow on thumb", () => {
			const thumbRequired = contract.slotContracts.thumb.aria.required.map((r) => r.attr);
			expect(thumbRequired).toContain("aria-valuenow");
			expect(thumbRequired).toContain("aria-valuemin");
			expect(thumbRequired).toContain("aria-valuemax");
		});
	});

	describe("recipe", () => {
		it("returns all slot class strings", () => {
			const classes = sliderRecipe();
			expect(classes.root).toBeTruthy();
			expect(classes.track).toBeTruthy();
			expect(classes.range).toBeTruthy();
			expect(classes.thumb).toBeTruthy();
		});
	});
});
