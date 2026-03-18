/**
 * @file components/input/Input.test.ts
 * @kind input
 * @layer components
 * @package @devpulse/coldlight
 *
 * Input component browser tests.
 * Tests ARIA compliance, data-state derivation, recipe application, and contract shape.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import { contract } from "./contract.js";
import Input from "./Input.svelte";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("input component — contract", () => {
	test("contract.kind is 'input'", () => {
		expect(contract.kind).toBe("input");
	});

	test("contract.primitiveKind is 'input'", () => {
		expect(contract.primitiveKind).toBe("input");
	});

	test("contract requires slot 'root'", () => {
		expect(contract.slots.required).toContain("root");
	});

	test("contract root slot has role 'textbox'", () => {
		expect(contract.slotContracts.root.aria.role).toBe("textbox");
	});

	test("contract has no required ARIA attrs on root", () => {
		expect(contract.slotContracts.root.aria.required).toHaveLength(0);
	});

	test("contract has Enter keyboard interaction", () => {
		expect(contract.keyboard.global.some((k) => k.key === "Enter")).toBe(true);
	});

	test("contract editable interaction is true", () => {
		expect(contract.interactions.editable).toBe(true);
	});

	test("contract other interactions are false", () => {
		expect(contract.interactions.modal).toBe(false);
		expect(contract.interactions.selectable).toBe(false);
		expect(contract.interactions.expandable).toBe(false);
	});
});

// =============================================================================
// ARIA ATTRIBUTES
// =============================================================================

describe("input component — ARIA", () => {
	test("renders an <input> element", async () => {
		const { container } = render(Input);
		const el = container.querySelector("input");
		expect(el).toBeTruthy();
	});

	test("aria-invalid is not emitted by default", async () => {
		const { container } = render(Input);
		// biome-ignore lint/style/noNonNullAssertion: test assertion — input element always rendered
		const el = container.querySelector("input")!;
		await expect.element(el).not.toHaveAttribute("aria-invalid");
	});

	test("aria-invalid is set when invalid", async () => {
		const { container } = render(Input, { props: { invalid: true } });
		// biome-ignore lint/style/noNonNullAssertion: test assertion — input element always rendered
		const el = container.querySelector("input")!;
		await expect.element(el).toHaveAttribute("aria-invalid", "true");
	});

	test("aria-disabled is set when disabled", async () => {
		const { container } = render(Input, { props: { disabled: true } });
		// biome-ignore lint/style/noNonNullAssertion: test assertion — input element always rendered
		const el = container.querySelector("input")!;
		await expect.element(el).toHaveAttribute("aria-disabled", "true");
	});

	test("aria-disabled is not emitted when not disabled", async () => {
		const { container } = render(Input);
		// biome-ignore lint/style/noNonNullAssertion: test assertion — input element always rendered
		const el = container.querySelector("input")!;
		await expect.element(el).not.toHaveAttribute("aria-disabled");
	});

	test("aria-required is set when required", async () => {
		const { container } = render(Input, { props: { required: true } });
		// biome-ignore lint/style/noNonNullAssertion: test assertion — input element always rendered
		const el = container.querySelector("input")!;
		await expect.element(el).toHaveAttribute("aria-required", "true");
	});

	test("aria-required is not emitted when not required", async () => {
		const { container } = render(Input);
		// biome-ignore lint/style/noNonNullAssertion: test assertion — input element always rendered
		const el = container.querySelector("input")!;
		await expect.element(el).not.toHaveAttribute("aria-required");
	});

	test("aria-readonly is set when readonly", async () => {
		const { container } = render(Input, { props: { readonly: true } });
		// biome-ignore lint/style/noNonNullAssertion: test assertion — input element always rendered
		const el = container.querySelector("input")!;
		await expect.element(el).toHaveAttribute("aria-readonly", "true");
	});

	test("aria-readonly is not emitted when not readonly", async () => {
		const { container } = render(Input);
		// biome-ignore lint/style/noNonNullAssertion: test assertion — input element always rendered
		const el = container.querySelector("input")!;
		await expect.element(el).not.toHaveAttribute("aria-readonly");
	});
});

// =============================================================================
// DATA-STATE DERIVATION
// =============================================================================

describe("input component — data-state", () => {
	test("data-state is not set by default", async () => {
		const { container } = render(Input);
		// biome-ignore lint/style/noNonNullAssertion: test assertion — input element always rendered
		const el = container.querySelector("input")!;
		await expect.element(el).not.toHaveAttribute("data-state");
	});

	test("data-state is 'invalid' when invalid", async () => {
		const { container } = render(Input, { props: { invalid: true } });
		// biome-ignore lint/style/noNonNullAssertion: test assertion — input element always rendered
		const el = container.querySelector("input")!;
		await expect.element(el).toHaveAttribute("data-state", "invalid");
	});

	test("data-state is 'disabled' when disabled", async () => {
		const { container } = render(Input, { props: { disabled: true } });
		// biome-ignore lint/style/noNonNullAssertion: test assertion — input element always rendered
		const el = container.querySelector("input")!;
		await expect.element(el).toHaveAttribute("data-state", "disabled");
	});

	test("data-state is 'readonly' when readonly", async () => {
		const { container } = render(Input, { props: { readonly: true } });
		// biome-ignore lint/style/noNonNullAssertion: test assertion — input element always rendered
		const el = container.querySelector("input")!;
		await expect.element(el).toHaveAttribute("data-state", "readonly");
	});

	test("disabled takes precedence over invalid for data-state", async () => {
		const { container } = render(Input, { props: { disabled: true, invalid: true } });
		// biome-ignore lint/style/noNonNullAssertion: test assertion — input element always rendered
		const el = container.querySelector("input")!;
		await expect.element(el).toHaveAttribute("data-state", "disabled");
	});
});

// =============================================================================
// RECIPE CLASSES
// =============================================================================

describe("input component — recipe", () => {
	test("applies recipe base classes", async () => {
		const { container } = render(Input);
		// biome-ignore lint/style/noNonNullAssertion: test assertion — input element always rendered
		const el = container.querySelector("input")!;
		await expect.element(el).toHaveClass("flex");
		await expect.element(el).toHaveClass("rounded-md");
	});

	test("merges custom class prop", async () => {
		const { container } = render(Input, { props: { class: "my-custom" } });
		// biome-ignore lint/style/noNonNullAssertion: test assertion — input element always rendered
		const el = container.querySelector("input")!;
		await expect.element(el).toHaveClass("my-custom");
	});
});

// =============================================================================
// SELF-CLOSING — no children
// =============================================================================

describe("input component — self-closing", () => {
	test("input element has no children", async () => {
		const { container } = render(Input);
		// biome-ignore lint/style/noNonNullAssertion: test assertion — input element always rendered
		const el = container.querySelector("input")!;
		expect((el as unknown as HTMLInputElement).childNodes.length).toBe(0);
	});
});
