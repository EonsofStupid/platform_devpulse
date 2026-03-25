import { describe, expect, test } from "vitest";

describe("avatar — exports", () => {
	test("exports Avatar", async () => {
		const mod = await import("./index.js");
		expect(mod.Avatar).toBeDefined();
	});

	test("exports AvatarSchema", async () => {
		const mod = await import("./index.js");
		expect(mod.AvatarSchema).toBeDefined();
	});

	test("exports avatarTokens", async () => {
		const mod = await import("./index.js");
		expect(mod.avatarTokens).toBeDefined();
	});
});
