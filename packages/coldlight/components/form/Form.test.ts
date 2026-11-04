import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import Form from "./Form.svelte";

describe("form component — ARIA", () => {
	test("renders a <form> element", async () => {
		const { container } = await render(Form, {
			label: "User registration",
		});
		const form = container.querySelector("form");
		expect(form).not.toBeNull();
	});

	test("renders aria-label from label prop", async () => {
		const { container } = await render(Form, {
			label: "Login form",
		});
		const form = container.querySelector("form");
		expect(form?.getAttribute("aria-label")).toBe("Login form");
	});

	test("renders data-state='pending' when pending", async () => {
		const { container } = await render(Form, {
			pending: true,
			label: "Test",
		});
		const form = container.querySelector("form");
		expect(form?.getAttribute("data-state")).toBe("pending");
	});

	test("renders aria-busy when pending", async () => {
		const { container } = await render(Form, {
			pending: true,
			label: "Test",
		});
		const form = container.querySelector("form");
		expect(form?.getAttribute("aria-busy")).toBe("true");
	});

	test("renders data-disabled when disabled", async () => {
		const { container } = await render(Form, {
			disabled: true,
			label: "Test",
		});
		const form = container.querySelector("form");
		expect(form?.hasAttribute("data-disabled")).toBe(true);
	});
});

describe("form component — composition", () => {
	test("applies composition base classes", async () => {
		const { container } = await render(Form, {
			label: "Test",
		});
		const form = container.querySelector("form");
		expect(form?.className).toContain("flex");
		expect(form?.className).toContain("flex-col");
	});

	test("applies size variant classes", async () => {
		const { container } = await render(Form, {
			size: "lg",
			label: "Test",
		});
		const form = container.querySelector("form");
		expect(form?.className).toContain("gap-6");
	});
});
