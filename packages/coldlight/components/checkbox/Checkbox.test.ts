/**
 * @file components/checkbox/Checkbox.test.ts
 * @kind checkbox
 * @layer components
 * @package @devpulse/coldlight
 *
 * Checkbox component browser tests.
 * Tests ARIA compliance, data-state derivation, and composition application.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import Checkbox from "./Checkbox.svelte";

// =============================================================================
// ARIA ATTRIBUTES
// =============================================================================

describe("checkbox component — ARIA", () => {
	test("has role='checkbox'", async () => {
		const { getByRole } = render(Checkbox);
		const el = getByRole("checkbox");
		await expect.element(el).toBeInTheDocument();
	});

	test("aria-checked is 'false' by default", async () => {
		const { getByRole } = render(Checkbox);
		const el = getByRole("checkbox");
		await expect.element(el).toHaveAttribute("aria-checked", "false");
	});

	test("aria-checked is 'true' when checked", async () => {
		const { getByRole } = render(Checkbox, { props: { checked: true } });
		const el = getByRole("checkbox");
		await expect.element(el).toHaveAttribute("aria-checked", "true");
	});

	test("aria-checked is 'mixed' when indeterminate", async () => {
		const { getByRole } = render(Checkbox, { props: { indeterminate: true } });
		const el = getByRole("checkbox");
		await expect.element(el).toHaveAttribute("aria-checked", "mixed");
	});

	// HTML's :indeterminate and React Aria's isIndeterminate: mixed wins while it is set.
	test("indeterminate takes precedence over checked for aria-checked", async () => {
		const { getByRole } = render(Checkbox, { props: { checked: true, indeterminate: true } });
		const el = getByRole("checkbox");
		await expect.element(el).toHaveAttribute("aria-checked", "mixed");
	});

	test("aria-disabled is set when disabled", async () => {
		const { getByRole } = render(Checkbox, { props: { disabled: true } });
		const el = getByRole("checkbox");
		await expect.element(el).toHaveAttribute("aria-disabled", "true");
	});

	test("aria-disabled is not emitted when not disabled", async () => {
		const { getByRole } = render(Checkbox);
		const el = getByRole("checkbox");
		await expect.element(el).not.toHaveAttribute("aria-disabled");
	});
});

// =============================================================================
// DATA-STATE DERIVATION
// =============================================================================

describe("checkbox component — data-state", () => {
	test("data-state is 'unchecked' by default", async () => {
		const { getByRole } = render(Checkbox);
		const el = getByRole("checkbox");
		await expect.element(el).toHaveAttribute("data-state", "unchecked");
	});

	test("data-state is 'checked' when checked", async () => {
		const { getByRole } = render(Checkbox, { props: { checked: true } });
		const el = getByRole("checkbox");
		await expect.element(el).toHaveAttribute("data-state", "checked");
	});

	test("data-state is 'indeterminate' when indeterminate", async () => {
		const { getByRole } = render(Checkbox, { props: { indeterminate: true } });
		const el = getByRole("checkbox");
		await expect.element(el).toHaveAttribute("data-state", "indeterminate");
	});

	test("disabled is its own attribute; data-state stays the checked state", async () => {
		const { getByRole } = render(Checkbox, { props: { disabled: true } });
		const el = getByRole("checkbox");
		await expect.element(el).toHaveAttribute("data-disabled", "");
		await expect.element(el).toHaveAttribute("data-state", "unchecked");
	});
});

// =============================================================================
// CONTROLLED AND UNCONTROLLED STATE
// =============================================================================

describe("checkbox component — controlled and uncontrolled state", () => {
	test("uncontrolled: starts from defaultChecked and toggles itself", async () => {
		const onCheckedChange = vi.fn();
		const { getByRole } = render(Checkbox, { props: { defaultChecked: true, onCheckedChange } });
		const el = getByRole("checkbox");
		await el.click();
		await expect.element(el).toHaveAttribute("aria-checked", "false");
		expect(onCheckedChange).toHaveBeenCalledWith(false);
	});

	test("a click on an indeterminate checkbox clears it and checks", async () => {
		const onIndeterminateChange = vi.fn();
		const { getByRole } = render(Checkbox, {
			props: { defaultIndeterminate: true, onIndeterminateChange },
		});
		const el = getByRole("checkbox");
		await el.click();
		await expect.element(el).toHaveAttribute("aria-checked", "true");
		expect(onIndeterminateChange).toHaveBeenCalledWith(false);
	});

	test("controlled: follows checked; a click only asks the owner", async () => {
		const onCheckedChange = vi.fn();
		const { getByRole, rerender } = render(Checkbox, {
			props: { checked: false, onCheckedChange },
		});
		const el = getByRole("checkbox");
		await el.click();
		expect(onCheckedChange).toHaveBeenCalledWith(true);
		await expect.element(el).toHaveAttribute("aria-checked", "false");
		await rerender({ checked: true });
		await expect.element(el).toHaveAttribute("aria-checked", "true");
	});
});

// =============================================================================
// RECIPE CLASSES
// =============================================================================

describe("checkbox component — composition", () => {
	test("applies composition base classes", async () => {
		const { getByRole } = render(Checkbox);
		const el = getByRole("checkbox");
		await expect.element(el).toHaveClass("inline-flex");
		await expect.element(el).toHaveClass("items-center");
	});

	test("merges custom class prop", async () => {
		const { getByRole } = render(Checkbox, { props: { class: "my-custom" } });
		const el = getByRole("checkbox");
		await expect.element(el).toHaveClass("my-custom");
	});
});
