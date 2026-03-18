/**
 * @file components/badge/Badge.test.ts
 * @kind badge
 * @layer components
 * @package @devpulse/coldlight
 *
 * Badge component browser tests.
 * Tests ARIA application, structural attributes, and prop forwarding.
 * Visual/recipe tests (intent, size) belong in ui/badge/ tests.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
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
// PROP PASSTHROUGH — ...rest spread
// =============================================================================

describe("badge component — prop passthrough", () => {
	test("passes class prop", async () => {
		const { getByRole } = render(Badge, { props: { class: "custom-badge" } });
		const badge = getByRole("status");
		await expect.element(badge).toHaveClass("custom-badge");
	});
});
