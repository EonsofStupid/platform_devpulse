/**
 * @file components/divider/Divider.test.ts
 * @kind divider
 * @layer components
 * @package @devpulse/coldlight
 *
 * Divider component browser tests.
 * Tests ARIA application, builder attribute binding, recipe class application,
 * and prop forwarding through the component layer.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { render } from "vitest-browser-svelte";
import { expect, test, describe } from "vitest";
import Divider from "./Divider.svelte";
import { contract } from "./contract.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("divider component — contract", () => {
	test("contract.kind is 'divider'", () => {
		expect(contract.kind).toBe("divider");
	});

	test("contract.primitiveKind is 'divider'", () => {
		expect(contract.primitiveKind).toBe("divider");
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

describe("divider component — structural attributes", () => {
	test("renders an <hr> element with role='separator'", async () => {
		const { getByRole } = render(Divider);
		const divider = getByRole("separator");
		expect(divider).toBeTruthy();
	});

	test("has data-kind='divider'", async () => {
		const { getByRole } = render(Divider);
		const divider = getByRole("separator");
		await expect.element(divider).toHaveAttribute("data-kind", "divider");
	});

	test("has data-slot='root'", async () => {
		const { getByRole } = render(Divider);
		const divider = getByRole("separator");
		await expect.element(divider).toHaveAttribute("data-slot", "root");
	});
});

// =============================================================================
// ARIA ATTRIBUTES — component layer owns ARIA
// =============================================================================

describe("divider component — ARIA attributes", () => {
	test("has role='separator' by default (non-decorative)", async () => {
		const { getByRole } = render(Divider);
		const divider = getByRole("separator");
		await expect.element(divider).toHaveAttribute("role", "separator");
	});

	test("has aria-orientation='horizontal' by default", async () => {
		const { getByRole } = render(Divider);
		const divider = getByRole("separator");
		await expect.element(divider).toHaveAttribute("aria-orientation", "horizontal");
	});

	test("has aria-orientation='vertical' when orientation='vertical'", async () => {
		const { getByRole } = render(Divider, { props: { orientation: "vertical" } });
		const divider = getByRole("separator");
		await expect.element(divider).toHaveAttribute("aria-orientation", "vertical");
	});

	test("has role='none' when decorative", async () => {
		const { container } = render(Divider, { props: { decorative: true } });
		const hr = container.querySelector("hr");
		await expect.element(hr!).toHaveAttribute("role", "none");
	});

	test("has aria-hidden='true' when decorative", async () => {
		const { container } = render(Divider, { props: { decorative: true } });
		const hr = container.querySelector("hr");
		await expect.element(hr!).toHaveAttribute("aria-hidden", "true");
	});
});

// =============================================================================
// DATA-ORIENTATION — orientation attribute
// =============================================================================

describe("divider component — data-orientation", () => {
	test("has data-orientation='horizontal' by default", async () => {
		const { getByRole } = render(Divider);
		const divider = getByRole("separator");
		await expect.element(divider).toHaveAttribute("data-orientation", "horizontal");
	});

	test("has data-orientation='vertical' when vertical", async () => {
		const { getByRole } = render(Divider, { props: { orientation: "vertical" } });
		const divider = getByRole("separator");
		await expect.element(divider).toHaveAttribute("data-orientation", "vertical");
	});
});

// =============================================================================
// RECIPE CLASSES — orientation and variant
// =============================================================================

describe("divider component — recipe classes", () => {
	test("applies horizontal classes by default", async () => {
		const { getByRole } = render(Divider);
		const divider = getByRole("separator");
		await expect.element(divider).toHaveClass("w-full");
	});

	test("passes class prop and merges with recipe", async () => {
		const { getByRole } = render(Divider, { props: { class: "custom-divider" } });
		const divider = getByRole("separator");
		await expect.element(divider).toHaveClass("custom-divider");
	});
});

// =============================================================================
// PROP PASSTHROUGH — ...rest spread
// =============================================================================

describe("divider component — prop passthrough", () => {
	test("forwards id attribute", async () => {
		const { getByRole } = render(Divider, { props: { id: "my-divider" } });
		const divider = getByRole("separator");
		await expect.element(divider).toHaveAttribute("id", "my-divider");
	});
});
