/**
 * @file components/badge/Badge.test.ts
 * @kind badge
 * @layer components
 * @package @devpulse/coldlight
 *
 * Badge component browser tests.
 * Tests ARIA application, data-state derivation, recipe class application,
 * and prop forwarding through the component layer.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { render } from "vitest-browser-svelte";
import { expect, test, describe } from "vitest";
import Badge from "./Badge.svelte";
import { contract } from "./contract.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("badge component — contract", () => {
	test("contract.kind is 'badge'", () => {
		expect(contract.kind).toBe("badge");
	});

	test("contract.primitiveKind is 'badge'", () => {
		expect(contract.primitiveKind).toBe("badge");
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

describe("badge component — structural attributes", () => {
	test("renders a <span> element with role='status'", async () => {
		const { getByRole } = render(Badge);
		const badge = getByRole("status");
		expect(badge).toBeTruthy();
	});

	test("has data-kind='badge'", async () => {
		const { getByRole } = render(Badge);
		const badge = getByRole("status");
		await expect.element(badge).toHaveAttribute("data-kind", "badge");
	});

	test("has data-slot='root'", async () => {
		const { getByRole } = render(Badge);
		const badge = getByRole("status");
		await expect.element(badge).toHaveAttribute("data-slot", "root");
	});
});

// =============================================================================
// ARIA ATTRIBUTES — component layer owns ARIA
// =============================================================================

describe("badge component — ARIA attributes", () => {
	test("has role='status'", async () => {
		const { getByRole } = render(Badge);
		const badge = getByRole("status");
		await expect.element(badge).toHaveAttribute("role", "status");
	});

	test("passes aria-label when provided", async () => {
		const { getByRole } = render(Badge, { props: { "aria-label": "3 notifications" } });
		const badge = getByRole("status");
		await expect.element(badge).toHaveAttribute("aria-label", "3 notifications");
	});
});

// =============================================================================
// DATA-STATE — intent-driven state
// =============================================================================

describe("badge component — data-state", () => {
	test("data-state='default' by default", async () => {
		const { getByRole } = render(Badge);
		const badge = getByRole("status");
		await expect.element(badge).toHaveAttribute("data-state", "default");
	});

	test("data-state='info' when intent='info'", async () => {
		const { getByRole } = render(Badge, { props: { intent: "info" } });
		const badge = getByRole("status");
		await expect.element(badge).toHaveAttribute("data-state", "info");
	});

	test("data-state='success' when intent='success'", async () => {
		const { getByRole } = render(Badge, { props: { intent: "success" } });
		const badge = getByRole("status");
		await expect.element(badge).toHaveAttribute("data-state", "success");
	});

	test("data-state='warning' when intent='warning'", async () => {
		const { getByRole } = render(Badge, { props: { intent: "warning" } });
		const badge = getByRole("status");
		await expect.element(badge).toHaveAttribute("data-state", "warning");
	});

	test("data-state='error' when intent='error'", async () => {
		const { getByRole } = render(Badge, { props: { intent: "error" } });
		const badge = getByRole("status");
		await expect.element(badge).toHaveAttribute("data-state", "error");
	});
});

// =============================================================================
// PROP PASSTHROUGH — ...rest spread
// =============================================================================

describe("badge component — prop passthrough", () => {
	test("passes class prop and applies recipe", async () => {
		const { getByRole } = render(Badge, { props: { class: "custom-badge" } });
		const badge = getByRole("status");
		await expect.element(badge).toHaveClass("custom-badge");
	});

	test("applies recipe classes for size variants", async () => {
		const { getByRole } = render(Badge, { props: { size: "sm" } });
		const badge = getByRole("status");
		await expect.element(badge).toHaveClass("text-xs");
	});
});
