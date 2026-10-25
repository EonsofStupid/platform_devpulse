/**
 * @file primitives/button/Button.test.ts
 * @kind button
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Button primitive browser tests.
 * Tests the STRUCTURAL contract — data attributes, HTML semantics, slot passthrough.
 * NOT testing ARIA (that belongs in components/button/Button.test.ts).
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { render } from "vitest-browser-svelte";
import { expect, test, describe } from "vitest";
import ButtonRoot from "./Button.svelte";
import { contract } from "./contract.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("button primitive — contract", () => {
	test("contract.kind is 'button'", () => {
		expect(contract.kind).toBe("button");
	});

	test("contract.ariaStateProvider is 'coldlight'", () => {
		expect(contract.ariaStateProvider).toBe("coldlight");
	});

	test("contract.compound is false", () => {
		expect(contract.compound).toBe(false);
	});

	test("contract.focusStrategy is 'none'", () => {
		expect(contract.focusStrategy).toBe("none");
	});

	test("contract requires slot 'root'", () => {
		expect(contract.slots.required).toContain("root");
	});

	test("contract has keyboard keys Enter and Space", () => {
		expect(contract.keyboard).toContain("Enter");
		expect(contract.keyboard).toContain("Space");
	});

	test("contract aria.role is 'button'", () => {
		expect(contract.aria.role).toBe("button");
	});
});

// =============================================================================
// STRUCTURAL ATTRIBUTES — data-kind, data-slot
// =============================================================================

describe("button primitive — structural attributes", () => {
	test("renders a <button> element", async () => {
		const { getByRole } = render(ButtonRoot);
		const button = getByRole("button");
		expect(button).toBeTruthy();
	});

	test("has data-kind='button'", async () => {
		const { getByRole } = render(ButtonRoot);
		const button = getByRole("button");
		await expect.element(button).toHaveAttribute("data-kind", "button");
	});

	test("has data-slot='root'", async () => {
		const { getByRole } = render(ButtonRoot);
		const button = getByRole("button");
		await expect.element(button).toHaveAttribute("data-slot", "root");
	});
});

// =============================================================================
// ZERO ARIA — primitive must not apply any ARIA attributes
// =============================================================================

describe("button primitive — zero ARIA enforcement", () => {
	test("does not have aria-pressed by default", async () => {
		const { getByRole } = render(ButtonRoot);
		const button = getByRole("button");
		await expect.element(button).not.toHaveAttribute("aria-pressed");
	});

	test("does not have aria-disabled by default", async () => {
		const { getByRole } = render(ButtonRoot);
		const button = getByRole("button");
		await expect.element(button).not.toHaveAttribute("aria-disabled");
	});

	test("does not have aria-busy by default", async () => {
		const { getByRole } = render(ButtonRoot);
		const button = getByRole("button");
		await expect.element(button).not.toHaveAttribute("aria-busy");
	});

	test("does not apply data-state by default", async () => {
		const { getByRole } = render(ButtonRoot);
		const button = getByRole("button");
		await expect.element(button).not.toHaveAttribute("data-state");
	});
});

// =============================================================================
// PROP PASSTHROUGH — ...rest spread
// =============================================================================

describe("button primitive — prop passthrough", () => {
	test("passes class prop to element", async () => {
		const { getByRole } = render(ButtonRoot, { props: { class: "test-class" } });
		const button = getByRole("button");
		await expect.element(button).toHaveClass("test-class");
	});

	test("passes disabled prop to element", async () => {
		const { getByRole } = render(ButtonRoot, { props: { disabled: true } });
		const button = getByRole("button");
		await expect.element(button).toBeDisabled();
	});

	test("passes type prop to element", async () => {
		const { getByRole } = render(ButtonRoot, { props: { type: "submit" } });
		const button = getByRole("button");
		await expect.element(button).toHaveAttribute("type", "submit");
	});
});
