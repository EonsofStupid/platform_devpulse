import { describe, expect, test } from "vitest";
import { readFields } from "./schema-form.types.js";

// The shape schemars generates for the engine's "You" form.
const schema = {
	type: "object",
	required: ["displayName"],
	properties: {
		displayName: { type: "string", minLength: 1, maxLength: 80 },
		email: { type: ["string", "null"], format: "email", maxLength: 254 },
		projectsRoot: { type: ["string", "null"], "x-devpulse-input": "folder" },
	},
};

describe("readFields", () => {
	test("reads fields in the given order with their input kind", () => {
		expect(readFields(schema, ["displayName", "email", "projectsRoot"])).toEqual([
			{ name: "displayName", input: "text", required: true, maxLength: 80 },
			{ name: "email", input: "email", required: false, maxLength: 254 },
			{ name: "projectsRoot", input: "folder", required: false, maxLength: undefined },
		]);
	});

	test("skips names the schema does not have and tolerates a non-schema", () => {
		expect(readFields(schema, ["nope", "email"]).map((f) => f.name)).toEqual(["email"]);
		expect(readFields(null, ["email"])).toEqual([]);
	});
});
