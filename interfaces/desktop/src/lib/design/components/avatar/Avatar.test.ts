import { describe, expect, test } from "vitest";

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
