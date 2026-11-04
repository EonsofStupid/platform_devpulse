/**
 * TextField — composed on the field core: label, description and error linkage
 * (primitives/field spec), the value in both control modes (plan 0006 T2), and
 * the caller's attributes on the input with their handlers chained (C12).
 */

import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { locatePart } from "#coldlight/testing/parts.js";
import TextField from "./TextField.svelte";

describe("text-field — linkage", () => {
	test("the label names the input", async () => {
		const { getByRole } = await render(TextField, { props: { label: "Email" } });
		await expect.element(getByRole("textbox", { name: "Email" })).toBeInTheDocument();
	});

	test("description, then error, describe the input; the error is a polite alert", async () => {
		const { getByRole, getByText, rerender } = await render(TextField, {
			props: { label: "Email", description: "We never share it", error: "Enter an email" },
		});
		const input = getByRole("textbox", { name: "Email" });
		const descriptionId = getByText("We never share it").element().id;
		await expect.element(input).toHaveAttribute("aria-describedby", descriptionId);
		await rerender({ invalid: true });
		const error = getByText("Enter an email");
		await expect.element(error).toHaveAttribute("role", "alert");
		await expect.element(error).toHaveAttribute("aria-live", "polite");
		await expect.element(input).toHaveAttribute("aria-describedby", error.element().id);
		await expect.element(input).toHaveAttribute("aria-invalid", "true");
		await expect.element(input).toHaveAttribute("data-invalid", "");
	});

	test("without a label nothing points at one; aria-label names the input", async () => {
		const { getByRole } = await render(TextField, { props: { "aria-label": "Search" } });
		const input = getByRole("textbox", { name: "Search" });
		await expect.element(input).not.toHaveAttribute("aria-labelledby");
		await expect.element(input).not.toHaveAttribute("aria-describedby");
	});

	test("states are attributes: disabled, read-only, required", async () => {
		const { container } = await render(TextField, {
			props: { label: "Name", disabled: true, readonly: true, required: true },
		});
		const input = locatePart(container, "text-field", "input");
		await expect.element(input).toHaveAttribute("data-disabled", "");
		await expect.element(input).toHaveAttribute("data-readonly", "");
		await expect.element(locatePart(container, "text-field")).toHaveAttribute("data-required", "");
	});
});

describe("text-field — value", () => {
	test("uncontrolled: starts from defaultValue and takes typing", async () => {
		const onValueChange = vi.fn();
		const { getByRole } = await render(TextField, {
			props: { label: "Name", defaultValue: "Ada", onValueChange },
		});
		const input = getByRole("textbox", { name: "Name" });
		await expect.element(input).toHaveValue("Ada");
		await input.fill("Grace");
		await expect.element(input).toHaveValue("Grace");
		expect(onValueChange).toHaveBeenLastCalledWith("Grace");
	});

	test("controlled: shows value and follows the owner's changes", async () => {
		const { getByRole, rerender } = await render(TextField, {
			props: { label: "Name", value: "Ada" },
		});
		const input = getByRole("textbox", { name: "Name" });
		await expect.element(input).toHaveValue("Ada");
		await rerender({ value: "Grace" });
		await expect.element(input).toHaveValue("Grace");
	});

	test("a caller's oninput runs alongside the field's", async () => {
		const oninput = vi.fn();
		const onValueChange = vi.fn();
		const { getByRole } = await render(TextField, {
			props: { label: "Name", oninput, onValueChange },
		});
		await getByRole("textbox", { name: "Name" }).fill("x");
		expect(oninput).toHaveBeenCalled();
		expect(onValueChange).toHaveBeenLastCalledWith("x");
	});
});
