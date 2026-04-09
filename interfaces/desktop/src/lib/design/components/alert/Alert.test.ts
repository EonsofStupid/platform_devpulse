/**
 * @file components/alert/Alert.test.ts
 * @kind alert
 * @layer components
 * @package @devpulse/coldlight
 *
 * Alert component tests.
 * Validates catalog entry, exports, hook ARIA.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 */

import { describe, expect, test } from "vitest";
import { useAlert } from "$lib/design/behaviors/display/alert/index.js";

// =============================================================================
// HOOK ARIA
// =============================================================================

describe("alert — hook ARIA", () => {
	test("root has role=alert and aria-live=assertive", () => {
		const alert = useAlert({ variant: "info" });
		expect(alert.root.role).toBe("alert");
		expect(alert.root["aria-live"]).toBe("assertive");
	});

	test("dismiss has aria-label", () => {
		const alert = useAlert({ dismissible: true });
		expect(alert.dismiss["aria-label"]).toBe("Dismiss alert");
	});
});

// =============================================================================
// EXPORTS
// =============================================================================

describe("alert — exports", () => {
	test("exports Root component", async () => {
		const mod = await import("./index.js");
		expect(mod.Root).toBeDefined();
	});

	test("exports Icon component", async () => {
		const mod = await import("./index.js");
		expect(mod.Icon).toBeDefined();
	});

	test("exports Title component", async () => {
		const mod = await import("./index.js");
		expect(mod.Title).toBeDefined();
	});

	test("exports Description component", async () => {
		const mod = await import("./index.js");
		expect(mod.Description).toBeDefined();
	});
});
