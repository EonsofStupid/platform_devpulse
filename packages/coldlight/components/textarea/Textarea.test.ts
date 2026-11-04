/**
 * @file components/textarea/Textarea.test.ts
 * @kind textarea
 * @layer components
 * @package @devpulse/coldlight
 *
 * Textarea component browser tests.
 * Tests the field structure (anatomy: root container, input, label, description,
 * error, counter), ARIA, one attribute per state (plan 0006 §4), the value in both
 * control modes (T2), and the caller's attributes on the textarea (C9, C12).
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { locatePart } from "#coldlight/testing/parts.js";
import Textarea from "./Textarea.svelte";

// =============================================================================
// STRUCTURAL ATTRIBUTES — data-kind, data-slot
// =============================================================================

describe("textarea component — structural attributes", () => {
	test("renders a <textarea> element", async () => {
		const { getByRole } = await render(Textarea);
		const textarea = getByRole("textbox");
		await expect.element(textarea).toBeInTheDocument();
		expect(textarea.element().tagName).toBe("TEXTAREA");
	});

	test("has data-kind='textarea'", async () => {
		const { getByRole } = await render(Textarea);
		const textarea = getByRole("textbox");
		await expect.element(textarea).toHaveAttribute("data-kind", "textarea");
	});

	// Anatomy: the <textarea> is the input part; the root is the field container around it.
	test("the textarea is the input part inside the root container", async () => {
		const { container, getByRole } = await render(Textarea);
		await expect.element(getByRole("textbox")).toHaveAttribute("data-slot", "input");
		await expect.element(locatePart(container, "textarea")).toBeInTheDocument();
	});
});

// =============================================================================
// ARIA ATTRIBUTES — component layer owns ARIA
// =============================================================================

describe("textarea component — ARIA attributes", () => {
	// A native <textarea> is multi-line already; the anatomy lists no aria-multiline.
	test("is a native textarea, multi-line without aria-multiline", async () => {
		const { getByRole } = await render(Textarea);
		const textarea = getByRole("textbox");
		expect(textarea.element().tagName).toBe("TEXTAREA");
		await expect.element(textarea).not.toHaveAttribute("aria-multiline");
	});

	test("does not emit aria-invalid when not invalid", async () => {
		const { getByRole } = await render(Textarea);
		const textarea = getByRole("textbox");
		await expect.element(textarea).not.toHaveAttribute("aria-invalid");
	});

	test("sets aria-invalid when invalid=true", async () => {
		const { getByRole } = await render(Textarea, { props: { invalid: true } });
		const textarea = getByRole("textbox");
		await expect.element(textarea).toHaveAttribute("aria-invalid", "true");
	});

	test("does not emit aria-required when not required", async () => {
		const { getByRole } = await render(Textarea);
		const textarea = getByRole("textbox");
		await expect.element(textarea).not.toHaveAttribute("aria-required");
	});

	test("sets aria-required when required=true", async () => {
		const { getByRole } = await render(Textarea, { props: { required: true } });
		const textarea = getByRole("textbox");
		await expect.element(textarea).toHaveAttribute("aria-required", "true");
	});

	test("does not emit aria-disabled when not disabled", async () => {
		const { getByRole } = await render(Textarea);
		const textarea = getByRole("textbox");
		await expect.element(textarea).not.toHaveAttribute("aria-disabled");
	});

	test("sets aria-disabled when disabled=true", async () => {
		const { getByRole } = await render(Textarea, { props: { disabled: true } });
		const textarea = getByRole("textbox");
		await expect.element(textarea).toHaveAttribute("aria-disabled", "true");
	});

	test("does not emit aria-readonly when not readonly", async () => {
		const { getByRole } = await render(Textarea);
		const textarea = getByRole("textbox");
		await expect.element(textarea).not.toHaveAttribute("aria-readonly");
	});

	test("sets aria-readonly when readonly=true", async () => {
		const { getByRole } = await render(Textarea, { props: { readonly: true } });
		const textarea = getByRole("textbox");
		await expect.element(textarea).toHaveAttribute("aria-readonly", "true");
	});
});

// =============================================================================
// DATA-STATE — computed state derivation
// =============================================================================

describe("textarea component — state attributes (one per state)", () => {
	test("no state attributes by default", async () => {
		const { getByRole } = await render(Textarea);
		const textarea = getByRole("textbox");
		await expect.element(textarea).not.toHaveAttribute("data-invalid");
		await expect.element(textarea).not.toHaveAttribute("data-disabled");
		await expect.element(textarea).not.toHaveAttribute("data-readonly");
	});

	test("data-invalid when invalid", async () => {
		const { getByRole } = await render(Textarea, { props: { invalid: true } });
		await expect.element(getByRole("textbox")).toHaveAttribute("data-invalid", "");
	});

	test("data-disabled when disabled", async () => {
		const { getByRole } = await render(Textarea, { props: { disabled: true } });
		await expect.element(getByRole("textbox")).toHaveAttribute("data-disabled", "");
	});

	test("data-readonly when readonly", async () => {
		const { getByRole } = await render(Textarea, { props: { readonly: true } });
		await expect.element(getByRole("textbox")).toHaveAttribute("data-readonly", "");
	});

	test("states are independent: invalid and disabled together", async () => {
		const { getByRole } = await render(Textarea, { props: { invalid: true, disabled: true } });
		const textarea = getByRole("textbox");
		await expect.element(textarea).toHaveAttribute("data-invalid", "");
		await expect.element(textarea).toHaveAttribute("data-disabled", "");
	});
});

// =============================================================================
// PROP PASSTHROUGH — ...rest spread
// =============================================================================

describe("textarea component — prop passthrough", () => {
	test("class goes on the textarea, where callers have always put it", async () => {
		const { getByRole } = await render(Textarea, { props: { class: "custom-class" } });
		await expect.element(getByRole("textbox")).toHaveClass("custom-class");
	});

	test("the caller's attributes reach the textarea; its handlers add to the hook's", async () => {
		const onkeydown = vi.fn();
		const { getByRole } = await render(Textarea, {
			props: { "aria-label": "SQL", name: "sql", onkeydown },
		});
		const textarea = getByRole("textbox", { name: "SQL" });
		await expect.element(textarea).toHaveAttribute("name", "sql");
		(textarea.element() as HTMLElement).focus();
		await userEvent.keyboard("{Control>}{Enter}{/Control}");
		expect(onkeydown).toHaveBeenCalled();
	});

	test("passes rows prop", async () => {
		const { getByRole } = await render(Textarea, { props: { rows: 5 } });
		const textarea = getByRole("textbox");
		await expect.element(textarea).toHaveAttribute("rows", "5");
	});

	test("passes placeholder prop", async () => {
		const { getByRole } = await render(Textarea, { props: { placeholder: "Enter text..." } });
		const textarea = getByRole("textbox");
		await expect.element(textarea).toHaveAttribute("placeholder", "Enter text...");
	});
});

// =============================================================================
// FIELD PARTS AND VALUE
// =============================================================================

describe("textarea component — field parts", () => {
	test("label names it; description, then error, describe it; the counter counts", async () => {
		const { getByRole, getByText, rerender, container } = await render(Textarea, {
			props: { label: "Notes", description: "Markdown works", error: "Too long", maxLength: 10 },
		});
		const textarea = getByRole("textbox", { name: "Notes" });
		const descriptionId = getByText("Markdown works").element().id;
		await expect.element(textarea).toHaveAttribute("aria-describedby", descriptionId);
		await expect.element(locatePart(container, "textarea", "counter")).toMatchTextContent("0/10");
		await rerender({ invalid: true });
		const error = getByText("Too long");
		await expect.element(error).toHaveAttribute("role", "alert");
		await expect.element(textarea).toHaveAttribute("aria-describedby", error.element().id);
	});
});

describe("textarea component — value", () => {
	test("uncontrolled: starts from defaultValue and takes typing", async () => {
		const onValueChange = vi.fn();
		const { getByRole } = await render(Textarea, {
			props: { "aria-label": "Notes", defaultValue: "a", onValueChange },
		});
		const textarea = getByRole("textbox", { name: "Notes" });
		await expect.element(textarea).toHaveValue("a");
		await textarea.fill("abc");
		await expect.element(textarea).toHaveValue("abc");
		expect(onValueChange).toHaveBeenLastCalledWith("abc");
	});

	test("controlled: shows value and follows the owner's changes", async () => {
		const { getByRole, rerender } = await render(Textarea, {
			props: { "aria-label": "Notes", value: "a" },
		});
		const textarea = getByRole("textbox", { name: "Notes" });
		await expect.element(textarea).toHaveValue("a");
		await rerender({ value: "b" });
		await expect.element(textarea).toHaveValue("b");
	});
});
