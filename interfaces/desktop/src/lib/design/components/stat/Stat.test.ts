/**
 * @file components/stat/Stat.test.ts
 * @kind stat
 * @layer components
 * @package @devpulse/coldlight
 *
 * Stat component browser tests.
 * Tests ARIA compliance.
 * Visual/composition tests belong in ui/stat/ tests.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import Stat from "./Stat.svelte";

// =============================================================================
// ARIA ATTRIBUTES
// =============================================================================

describe("stat component — ARIA", () => {
	test("has role='group'", async () => {
		const { getByRole } = render(Stat);
		const el = getByRole("group");
		expect(el).toBeTruthy();
	});
});

// =============================================================================
// PROP PASSTHROUGH
// =============================================================================

describe("stat component — prop passthrough", () => {
	test("merges custom class prop", async () => {
		const { getByRole } = render(Stat, { props: { class: "my-custom" } });
		const el = getByRole("group");
		await expect.element(el).toHaveClass("my-custom");
	});
});
