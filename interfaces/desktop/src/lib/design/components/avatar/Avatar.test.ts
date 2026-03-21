import { describe, expect, test } from "vitest";
import { contract } from "./contract.js";

describe("avatar — contract", () => {
	test("contract.kind is 'avatar'", () => {
		expect(contract.kind).toBe("avatar");
	});

	test("root has role img", () => {
		expect(contract.slotContracts.root.aria.role).toBe("img");
	});

	test("root requires aria-label", () => {
		const attrs = contract.slotContracts.root.aria.required.map((r) => r.attr);
		expect(attrs).toContain("aria-label");
	});

	test("states include loading/loaded/error", () => {
		expect(contract.states.all).toContain("loading");
		expect(contract.states.all).toContain("loaded");
		expect(contract.states.all).toContain("error");
	});
});

describe("avatar — exports", () => {
	test("exports Root", async () => {
		const mod = await import("./index.js");
		expect(mod.Root).toBeDefined();
	});

	test("exports Image", async () => {
		const mod = await import("./index.js");
		expect(mod.Image).toBeDefined();
	});

	test("exports Fallback", async () => {
		const mod = await import("./index.js");
		expect(mod.Fallback).toBeDefined();
	});
});
