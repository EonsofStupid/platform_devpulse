/**
 * Field — links its label, control, description and error (primitives/field spec):
 * the control is named by the label and described by what is rendered, and no
 * reference points at a part that is not rendered.
 */

import { createRawSnippet } from "svelte";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import type { FieldControlAttrs } from "#coldlight/behaviors/inputs/field/field.types.js";
import { locatePart } from "#coldlight/testing/parts.js";
import Field from "./Field.svelte";

/** A text input that takes the attributes Field hands its control. */
const control = createRawSnippet((attrs: () => FieldControlAttrs) => ({
	render: () => "<input />",
	setup(node: Element) {
		for (const [key, value] of Object.entries(attrs())) {
			if (value !== undefined && typeof value !== "function") node.setAttribute(key, String(value));
		}
	},
}));

/** Every id an element's aria-* attribute names exists in the document. */
function referencesResolve(element: Element): boolean {
	return ["aria-labelledby", "aria-describedby", "aria-errormessage"]
		.flatMap((name) => (element.getAttribute(name) ?? "").split(" ").filter(Boolean))
		.every((id) => document.getElementById(id) !== null);
}

describe("field — linkage", () => {
	test("the label names the control; the group is labelled by it", async () => {
		const { container, getByRole } = await render(Field, {
			props: { label: "Email", children: control },
		});
		// Both the group and the input are named by the label (spec); the input is the textbox.
		await expect.element(getByRole("textbox", { name: "Email" })).toBeInTheDocument();
		const root = locatePart(container, "field");
		await expect.element(root).toHaveAttribute("role", "group");
		expect(referencesResolve(root.element())).toBe(true);
	});

	test("the description describes the control", async () => {
		const { getByRole, getByText } = await render(Field, {
			props: { label: "Email", description: "We never share it", children: control },
		});
		const input = getByRole("textbox", { name: "Email" });
		const descriptionId = getByText("We never share it").element().id;
		await expect.element(input).toHaveAttribute("aria-describedby", descriptionId);
	});

	test("invalid: the error replaces the description, as an alert", async () => {
		const { getByRole, getByText } = await render(Field, {
			props: {
				label: "Email",
				description: "We never share it",
				error: "Enter an email",
				invalid: true,
				children: control,
			},
		});
		const input = getByRole("textbox", { name: "Email" });
		const error = getByText("Enter an email");
		await expect.element(error).toHaveAttribute("role", "alert");
		await expect.element(error).toHaveAttribute("aria-live", "polite");
		await expect.element(input).toHaveAttribute("aria-describedby", error.element().id);
		await expect.element(input).toHaveAttribute("aria-invalid", "true");
	});

	test("without a label or description nothing points at them", async () => {
		const { container } = await render(Field, { props: { children: control } });
		const root = locatePart(container, "field");
		await expect.element(root).not.toHaveAttribute("aria-labelledby");
		const input = locatePart(container, "field", "control");
		await expect.element(input).not.toHaveAttribute("aria-describedby");
	});
});
