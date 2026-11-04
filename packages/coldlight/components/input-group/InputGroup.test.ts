import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import InputGroup from "./InputGroup.svelte";

describe("input-group component — ARIA", () => {
	test("renders with role='group' on root", async () => {
		const { container } = await render(InputGroup, {
			"aria-label": "Email field",
		});
		const root = container.querySelector("[data-kind='input-group']");
		expect(root).not.toBeNull();
		expect(root?.getAttribute("role")).toBe("group");
	});

	test("renders aria-label on root", async () => {
		const { container } = await render(InputGroup, {
			"aria-label": "Email address",
		});
		const root = container.querySelector("[data-kind='input-group']");
		expect(root?.getAttribute("aria-label")).toBe("Email address");
	});

	test("renders data-disabled when disabled", async () => {
		const { container } = await render(InputGroup, {
			disabled: true,
			"aria-label": "Test",
		});
		const root = container.querySelector("[data-kind='input-group']");
		expect(root?.hasAttribute("data-disabled")).toBe(true);
	});
});

describe("input-group component — composition", () => {
	test("applies composition base classes", async () => {
		const { container } = await render(InputGroup, {
			"aria-label": "Test",
		});
		const root = container.querySelector("[data-kind='input-group']");
		expect(root?.className).toContain("inline-flex");
		expect(root?.className).toContain("rounded-md");
	});

	test("applies size variant classes", async () => {
		const { container } = await render(InputGroup, {
			size: "sm",
			"aria-label": "Test",
		});
		const root = container.querySelector("[data-kind='input-group']");
		expect(root?.className).toContain("h-8");
	});
});
