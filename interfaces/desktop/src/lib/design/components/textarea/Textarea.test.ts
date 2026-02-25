/**
 * @file components/textarea/Textarea.test.ts
 * @kind textarea
 * @layer components
 * @package @devpulse/coldlight
 *
 * Textarea component browser tests.
 * Tests ARIA application, data-state derivation, recipe class application,
 * and prop forwarding through the component layer.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { render } from "vitest-browser-svelte";
import { expect, test, describe } from "vitest";
import Textarea from "./Textarea.svelte";
import { contract } from "./contract.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("textarea component — contract", () => {
	test("contract.kind is 'textarea'", () => {
		expect(contract.kind).toBe("textarea");
	});

	test("contract.primitiveKind is 'textarea'", () => {
		expect(contract.primitiveKind).toBe("textarea");
	});

	test("contract.interactions.editable is true", () => {
		expect(contract.interactions.editable).toBe(true);
	});

	test("contract requires slot 'root'", () => {
		expect(contract.slots.required).toContain("root");
	});
});

// =============================================================================
// STRUCTURAL ATTRIBUTES — data-kind, data-slot
// =============================================================================

describe("textarea component — structural attributes", () => {
	test("renders a <textarea> element", async () => {
		const { getByRole } = render(Textarea);
		const textarea = getByRole("textbox");
		expect(textarea).toBeTruthy();
	});

	test("has data-kind='textarea'", async () => {
		const { getByRole } = render(Textarea);
		const textarea = getByRole("textbox");
		await expect.element(textarea).toHaveAttribute("data-kind", "textarea");
	});

	test("has data-slot='root'", async () => {
		const { getByRole } = render(Textarea);
		const textarea = getByRole("textbox");
		await expect.element(textarea).toHaveAttribute("data-slot", "root");
	});
});

// =============================================================================
// ARIA ATTRIBUTES — component layer owns ARIA
// =============================================================================

describe("textarea component — ARIA attributes", () => {
	test("has aria-multiline=true always", async () => {
		const { getByRole } = render(Textarea);
		const textarea = getByRole("textbox");
		await expect.element(textarea).toHaveAttribute("aria-multiline", "true");
	});

	test("does not emit aria-invalid when not invalid", async () => {
		const { getByRole } = render(Textarea);
		const textarea = getByRole("textbox");
		await expect.element(textarea).not.toHaveAttribute("aria-invalid");
	});

	test("sets aria-invalid when invalid=true", async () => {
		const { getByRole } = render(Textarea, { props: { invalid: true } });
		const textarea = getByRole("textbox");
		await expect.element(textarea).toHaveAttribute("aria-invalid", "true");
	});

	test("does not emit aria-required when not required", async () => {
		const { getByRole } = render(Textarea);
		const textarea = getByRole("textbox");
		await expect.element(textarea).not.toHaveAttribute("aria-required");
	});

	test("sets aria-required when required=true", async () => {
		const { getByRole } = render(Textarea, { props: { required: true } });
		const textarea = getByRole("textbox");
		await expect.element(textarea).toHaveAttribute("aria-required", "true");
	});

	test("does not emit aria-disabled when not disabled", async () => {
		const { getByRole } = render(Textarea);
		const textarea = getByRole("textbox");
		await expect.element(textarea).not.toHaveAttribute("aria-disabled");
	});

	test("sets aria-disabled when disabled=true", async () => {
		const { getByRole } = render(Textarea, { props: { disabled: true } });
		const textarea = getByRole("textbox");
		await expect.element(textarea).toHaveAttribute("aria-disabled", "true");
	});

	test("does not emit aria-readonly when not readonly", async () => {
		const { getByRole } = render(Textarea);
		const textarea = getByRole("textbox");
		await expect.element(textarea).not.toHaveAttribute("aria-readonly");
	});

	test("sets aria-readonly when readonly=true", async () => {
		const { getByRole } = render(Textarea, { props: { readonly: true } });
		const textarea = getByRole("textbox");
		await expect.element(textarea).toHaveAttribute("aria-readonly", "true");
	});
});

// =============================================================================
// DATA-STATE — computed state derivation
// =============================================================================

describe("textarea component — data-state", () => {
	test("no data-state by default", async () => {
		const { getByRole } = render(Textarea);
		const textarea = getByRole("textbox");
		await expect.element(textarea).not.toHaveAttribute("data-state");
	});

	test("data-state='invalid' when invalid", async () => {
		const { getByRole } = render(Textarea, { props: { invalid: true } });
		const textarea = getByRole("textbox");
		await expect.element(textarea).toHaveAttribute("data-state", "invalid");
	});

	test("data-state='disabled' when disabled", async () => {
		const { getByRole } = render(Textarea, { props: { disabled: true } });
		const textarea = getByRole("textbox");
		await expect.element(textarea).toHaveAttribute("data-state", "disabled");
	});

	test("data-state='readonly' when readonly", async () => {
		const { getByRole } = render(Textarea, { props: { readonly: true } });
		const textarea = getByRole("textbox");
		await expect.element(textarea).toHaveAttribute("data-state", "readonly");
	});

	test("invalid takes precedence over disabled", async () => {
		const { getByRole } = render(Textarea, { props: { invalid: true, disabled: true } });
		const textarea = getByRole("textbox");
		await expect.element(textarea).toHaveAttribute("data-state", "invalid");
	});
});

// =============================================================================
// PROP PASSTHROUGH — ...rest spread
// =============================================================================

describe("textarea component — prop passthrough", () => {
	test("passes class prop and applies recipe", async () => {
		const { getByRole } = render(Textarea, { props: { class: "custom-class" } });
		const textarea = getByRole("textbox");
		await expect.element(textarea).toHaveClass("custom-class");
	});

	test("passes rows prop", async () => {
		const { getByRole } = render(Textarea, { props: { rows: 5 } });
		const textarea = getByRole("textbox");
		await expect.element(textarea).toHaveAttribute("rows", "5");
	});

	test("passes placeholder prop", async () => {
		const { getByRole } = render(Textarea, { props: { placeholder: "Enter text..." } });
		const textarea = getByRole("textbox");
		await expect.element(textarea).toHaveAttribute("placeholder", "Enter text...");
	});
});
