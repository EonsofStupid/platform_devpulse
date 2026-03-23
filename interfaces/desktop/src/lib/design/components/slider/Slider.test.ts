/**
 * @file Slider Component Tests
 * @kind slider
 * @layer components
 */

import { describe, expect, it } from "vitest";
import { contract } from "./contract.js";
import { sliderComposition } from "./composition.js";

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

	describe("composition", () => {
		it("returns all slot class strings", () => {
			const classes = sliderComposition();
			expect(classes.root).toBeTruthy();
			expect(classes.track).toBeTruthy();
			expect(classes.range).toBeTruthy();
			expect(classes.thumb).toBeTruthy();
		});
	});
});
