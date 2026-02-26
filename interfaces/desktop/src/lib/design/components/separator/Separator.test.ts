/**
 * @file components/separator/Separator.test.ts
 * @kind separator
 * @layer components
 * @package @devpulse/coldlight
 *
 * Separator component browser tests.
 * Tests ARIA application, builder attribute binding, recipe class application,
 * and prop forwarding through the component layer.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { render } from "vitest-browser-svelte";
import { expect, test, describe } from "vitest";
import Separator from "./Separator.svelte";
import { contract } from "./contract.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("separator component — contract", () => {
	test("contract.kind is 'separator'", () => {
		expect(contract.kind).toBe("separator");
	});

	test("contract.primitiveKind is 'separator'", () => {
		expect(contract.primitiveKind).toBe("separator");
	});

	test("contract requires slot 'root'", () => {
		expect(contract.slots.required).toContain("root");
	});

	test("contract.interactions.modal is false", () => {
		expect(contract.interactions.modal).toBe(false);
	});
});

// =============================================================================
// STRUCTURAL ATTRIBUTES — data-kind, data-slot
// =============================================================================

describe("separator component — structural attributes", () => {
	test("renders an <hr> element with role='separator'", async () => {
		const { getByRole } = render(Separator);
		const separator = getByRole("separator");
		expect(separator).toBeTruthy();
	});

	test("has data-kind='separator'", async () => {
		const { getByRole } = render(Separator);
		const separator = getByRole("separator");
		await expect.element(separator).toHaveAttribute("data-kind", "separator");
	});

	test("has data-slot='root'", async () => {
		const { getByRole } = render(Separator);
		const separator = getByRole("separator");
		await expect.element(separator).toHaveAttribute("data-slot", "root");
	});
});

// =============================================================================
// ARIA ATTRIBUTES — component layer owns ARIA
// =============================================================================

describe("separator component — ARIA attributes", () => {
	test("has role='separator' by default (non-decorative)", async () => {
		const { getByRole } = render(Separator);
		const separator = getByRole("separator");
		await expect.element(separator).toHaveAttribute("role", "separator");
	});

	test("has aria-orientation='horizontal' by default", async () => {
		const { getByRole } = render(Separator);
		const separator = getByRole("separator");
		await expect.element(separator).toHaveAttribute("aria-orientation", "horizontal");
	});

	test("has aria-orientation='vertical' when orientation='vertical'", async () => {
		const { getByRole } = render(Separator, { props: { orientation: "vertical" } });
		const separator = getByRole("separator");
		await expect.element(separator).toHaveAttribute("aria-orientation", "vertical");
	});

	test("has role='none' when decorative", async () => {
		const { container } = render(Separator, { props: { decorative: true } });
		const hr = container.querySelector("hr");
		await expect.element(hr!).toHaveAttribute("role", "none");
	});

	test("has aria-hidden='true' when decorative", async () => {
		const { container } = render(Separator, { props: { decorative: true } });
		const hr = container.querySelector("hr");
		await expect.element(hr!).toHaveAttribute("aria-hidden", "true");
	});
});

// =============================================================================
// DATA-ORIENTATION — orientation attribute
// =============================================================================

describe("separator component — data-orientation", () => {
	test("has data-orientation='horizontal' by default", async () => {
		const { getByRole } = render(Separator);
		const separator = getByRole("separator");
		await expect.element(separator).toHaveAttribute("data-orientation", "horizontal");
	});

	test("has data-orientation='vertical' when vertical", async () => {
		const { getByRole } = render(Separator, { props: { orientation: "vertical" } });
		const separator = getByRole("separator");
		await expect.element(separator).toHaveAttribute("data-orientation", "vertical");
	});
});

// =============================================================================
// RECIPE CLASSES — orientation and variant
// =============================================================================

describe("separator component — recipe classes", () => {
	test("applies horizontal classes by default", async () => {
		const { getByRole } = render(Separator);
		const separator = getByRole("separator");
		await expect.element(separator).toHaveClass("w-full");
	});

	test("applies dashed variant classes", async () => {
		const { getByRole } = render(Separator, { props: { variant: "dashed" } });
		const separator = getByRole("separator");
		await expect.element(separator).toHaveClass("border-dashed");
	});

	test("passes class prop and merges with recipe", async () => {
		const { getByRole } = render(Separator, { props: { class: "custom-sep" } });
		const separator = getByRole("separator");
		await expect.element(separator).toHaveClass("custom-sep");
	});
});

// =============================================================================
// PROP PASSTHROUGH — ...rest spread
// =============================================================================

describe("separator component — prop passthrough", () => {
	test("forwards id attribute", async () => {
		const { getByRole } = render(Separator, { props: { id: "my-separator" } });
		const separator = getByRole("separator");
		await expect.element(separator).toHaveAttribute("id", "my-separator");
	});
});
