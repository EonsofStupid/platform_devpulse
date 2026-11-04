import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import FormField from "./FormField.svelte";

describe("form-field component — ARIA", () => {
	test("renders with role='group' on root", async () => {
		const { container } = await render(FormField, {
			name: "email",
			label: "Email",
		});
		const root = container.querySelector("[data-kind='form-field']");
		expect(root).not.toBeNull();
		expect(root?.getAttribute("role")).toBe("group");
	});

	test("renders label element", async () => {
		const { container } = await render(FormField, {
			name: "username",
			label: "Username",
		});
		const label = container.querySelector("label");
		expect(label).not.toBeNull();
		expect(label?.textContent).toBe("Username");
	});

	test("renders description text", async () => {
		const { container } = await render(FormField, {
			name: "email",
			label: "Email",
			description: "We will never share your email.",
		});
		const desc = container.querySelector("p");
		expect(desc).not.toBeNull();
		expect(desc?.textContent).toBe("We will never share your email.");
	});

	test("renders error message when invalid", async () => {
		const { container } = await render(FormField, {
			name: "email",
			label: "Email",
			invalid: true,
			error: "Email is required",
		});
		const errorEl = container.querySelector("[role='alert']");
		expect(errorEl).not.toBeNull();
		expect(errorEl?.textContent).toBe("Email is required");
	});

	test("error has role='alert' and aria-live='polite'", async () => {
		const { container } = await render(FormField, {
			name: "name",
			label: "Name",
			invalid: true,
			error: "Required field",
		});
		const errorEl = container.querySelector("[role='alert']");
		expect(errorEl?.getAttribute("aria-live")).toBe("polite");
	});

	test("renders data-required on root when required", async () => {
		const { container } = await render(FormField, {
			name: "name",
			label: "Name",
			required: true,
		});
		const root = container.querySelector("[data-kind='form-field']");
		expect(root?.hasAttribute("data-required")).toBe(true);
	});
});

describe("form-field component — composition", () => {
	test("applies composition base classes", async () => {
		const { container } = await render(FormField, {
			name: "test",
			label: "Test",
		});
		const root = container.querySelector("[data-kind='form-field']");
		expect(root?.className).toContain("flex");
		expect(root?.className).toContain("flex-col");
	});

	test("applies size variant classes", async () => {
		const { container } = await render(FormField, {
			name: "test",
			size: "sm",
			label: "Test",
		});
		const root = container.querySelector("[data-kind='form-field']");
		expect(root?.className).toContain("gap-1");
	});
});
