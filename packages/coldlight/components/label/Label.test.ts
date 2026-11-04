import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import { Label } from "./index.js";

describe("label component — ARIA", () => {
	test("renders a <label> element", async () => {
		const { container } = await render(Label);
		const label = container.querySelector("label");
		expect(label).not.toBeNull();
	});

	test("renders data-kind='label' and data-slot='root'", async () => {
		const { container } = await render(Label);
		const label = container.querySelector("[data-kind='label']");
		expect(label).not.toBeNull();
		expect(label?.getAttribute("data-slot")).toBe("root");
	});

	test("renders for attribute from htmlFor prop", async () => {
		const { container } = await render(Label, {
			htmlFor: "email-input",
		});
		const label = container.querySelector("label");
		expect(label?.getAttribute("for")).toBe("email-input");
	});

	test("renders data-disabled when disabled", async () => {
		const { container } = await render(Label, {
			disabled: true,
		});
		const label = container.querySelector("label");
		expect(label?.hasAttribute("data-disabled")).toBe(true);
	});
});

describe("label component — composition", () => {
	test("applies composition base classes", async () => {
		const { container } = await render(Label);
		const label = container.querySelector("label");
		expect(label?.className).toContain("font-medium");
	});

	test("applies size variant classes", async () => {
		const { container } = await render(Label, {
			size: "lg",
		});
		const label = container.querySelector("label");
		expect(label?.className).toContain("text-base");
	});

	test("applies sm size variant", async () => {
		const { container } = await render(Label, {
			size: "sm",
		});
		const label = container.querySelector("label");
		expect(label?.className).toContain("text-xs");
	});
});
