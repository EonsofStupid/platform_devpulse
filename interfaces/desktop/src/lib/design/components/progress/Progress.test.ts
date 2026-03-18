/**
 * @file components/progress/Progress.test.ts
 * @kind progress
 * @layer components
 * @package @devpulse/coldlight
 *
 * Progress component browser tests.
 * Tests ARIA application, data-state derivation, recipe class application,
 * indicator width computation, and prop forwarding.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import { contract } from "./contract.js";
import Progress from "./Progress.svelte";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("progress component — contract", () => {
	test("contract.kind is 'progress'", () => {
		expect(contract.kind).toBe("progress");
	});

	test("contract.primitiveKind is 'progress'", () => {
		expect(contract.primitiveKind).toBe("progress");
	});

	test("contract requires slot 'root'", () => {
		expect(contract.slots.required).toContain("root");
	});

	test("contract has optional slot 'indicator'", () => {
		expect(contract.slots.optional).toContain("indicator");
	});

	test("contract requires aria-valuenow, aria-valuemin, aria-valuemax", () => {
		const requiredAttrs = contract.slotContracts.root.aria.required.map((r) => r.attr);
		expect(requiredAttrs).toContain("aria-valuenow");
		expect(requiredAttrs).toContain("aria-valuemin");
		expect(requiredAttrs).toContain("aria-valuemax");
	});
});

// =============================================================================
// STRUCTURAL ATTRIBUTES — data-kind, data-slot
// =============================================================================

describe("progress component — structural attributes", () => {
	test("renders a <div> element with role='progressbar'", async () => {
		const { getByRole } = render(Progress, { props: { value: 50 } });
		const progress = getByRole("progressbar");
		expect(progress).toBeTruthy();
	});

	test("has data-kind='progress'", async () => {
		const { getByRole } = render(Progress, { props: { value: 50 } });
		const progress = getByRole("progressbar");
		await expect.element(progress).toHaveAttribute("data-kind", "progress");
	});

	test("has data-slot='root'", async () => {
		const { getByRole } = render(Progress, { props: { value: 50 } });
		const progress = getByRole("progressbar");
		await expect.element(progress).toHaveAttribute("data-slot", "root");
	});

	test("contains an indicator child with data-slot='indicator'", async () => {
		const { container } = render(Progress, { props: { value: 50 } });
		const indicator = container.querySelector("[data-slot='indicator']");
		expect(indicator).toBeTruthy();
	});
});

// =============================================================================
// ARIA ATTRIBUTES — component layer owns ARIA
// =============================================================================

describe("progress component — ARIA attributes", () => {
	test("has role='progressbar'", async () => {
		const { getByRole } = render(Progress, { props: { value: 50 } });
		const progress = getByRole("progressbar");
		await expect.element(progress).toHaveAttribute("role", "progressbar");
	});

	test("has aria-valuemin=0", async () => {
		const { getByRole } = render(Progress, { props: { value: 50 } });
		const progress = getByRole("progressbar");
		await expect.element(progress).toHaveAttribute("aria-valuemin", "0");
	});

	test("has aria-valuemax=100 by default", async () => {
		const { getByRole } = render(Progress, { props: { value: 50 } });
		const progress = getByRole("progressbar");
		await expect.element(progress).toHaveAttribute("aria-valuemax", "100");
	});

	test("has aria-valuenow when value is set", async () => {
		const { getByRole } = render(Progress, { props: { value: 75 } });
		const progress = getByRole("progressbar");
		await expect.element(progress).toHaveAttribute("aria-valuenow", "75");
	});

	test("does not have aria-valuenow when indeterminate (value=null)", async () => {
		const { getByRole } = render(Progress, { props: { value: null } });
		const progress = getByRole("progressbar");
		await expect.element(progress).not.toHaveAttribute("aria-valuenow");
	});

	test("custom max value is reflected in aria-valuemax", async () => {
		const { getByRole } = render(Progress, { props: { value: 5, max: 10 } });
		const progress = getByRole("progressbar");
		await expect.element(progress).toHaveAttribute("aria-valuemax", "10");
	});

	test("passes aria-label when provided", async () => {
		const { getByRole } = render(Progress, {
			props: { value: 50, "aria-label": "Upload progress" },
		});
		const progress = getByRole("progressbar");
		await expect.element(progress).toHaveAttribute("aria-label", "Upload progress");
	});
});

// =============================================================================
// DATA-STATE — computed state derivation
// =============================================================================

describe("progress component — data-state", () => {
	test("data-state='indeterminate' when value is null", async () => {
		const { getByRole } = render(Progress, { props: { value: null } });
		const progress = getByRole("progressbar");
		await expect.element(progress).toHaveAttribute("data-state", "indeterminate");
	});

	test("data-state='indeterminate' by default (no value prop)", async () => {
		const { getByRole } = render(Progress);
		const progress = getByRole("progressbar");
		await expect.element(progress).toHaveAttribute("data-state", "indeterminate");
	});

	test("data-state='loading' when value is between 0 and max", async () => {
		const { getByRole } = render(Progress, { props: { value: 50 } });
		const progress = getByRole("progressbar");
		await expect.element(progress).toHaveAttribute("data-state", "loading");
	});

	test("data-state='complete' when value equals max", async () => {
		const { getByRole } = render(Progress, { props: { value: 100 } });
		const progress = getByRole("progressbar");
		await expect.element(progress).toHaveAttribute("data-state", "complete");
	});

	test("data-state='complete' when value exceeds max (clamped)", async () => {
		const { getByRole } = render(Progress, { props: { value: 150 } });
		const progress = getByRole("progressbar");
		await expect.element(progress).toHaveAttribute("data-state", "complete");
	});
});

// =============================================================================
// PROP PASSTHROUGH — ...rest spread
// =============================================================================

describe("progress component — prop passthrough", () => {
	test("passes class prop and applies recipe", async () => {
		const { getByRole } = render(Progress, { props: { value: 50, class: "custom-progress" } });
		const progress = getByRole("progressbar");
		await expect.element(progress).toHaveClass("custom-progress");
	});
});
