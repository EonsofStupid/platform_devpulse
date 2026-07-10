/**
 * @file renderforge/resolve.test.ts
 * @package @devpulse/coldlight
 *
 * Tests for renderForge — the ONE styling path.
 * Verifies preset resolution, CSS var chains, data attributes.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 */

import { describe, expect, test } from "vitest";
import { resolveIntent } from "./intent.js";
import { renderForge } from "./render.js";

// ═══════════════════════════════════════════════════════════════
// INTENT RESOLUTION — semantic → compound preset ID
// ═══════════════════════════════════════════════════════════════

describe("resolveIntent — semantic intent mapping", () => {
	test("'primary' resolves to 'glass-deep'", () => {
		expect(resolveIntent("primary")).toBe("glass-deep");
	});

	test("'default' resolves to 'neuro-elevated'", () => {
		expect(resolveIntent("default")).toBe("neuro-elevated");
	});

	test("'ghost' resolves to 'flat-minimal'", () => {
		expect(resolveIntent("ghost")).toBe("flat-minimal");
	});

	test("'glass' resolves to 'glass-deep'", () => {
		expect(resolveIntent("glass")).toBe("glass-deep");
	});

	test("'danger' resolves to 'stark-glow'", () => {
		expect(resolveIntent("danger")).toBe("stark-glow");
	});

	test("compound ID 'neuro-elevated' passes through", () => {
		expect(resolveIntent("neuro-elevated")).toBe("neuro-elevated");
	});

	test("unknown intent falls back to 'neuro-elevated'", () => {
		expect(resolveIntent("nonexistent")).toBe("neuro-elevated");
	});
});

// ═══════════════════════════════════════════════════════════════
// RESOLVE MACRO — full pipeline
// ═══════════════════════════════════════════════════════════════

describe("renderForge — CSS var chains", () => {
	test("returns kind in result", () => {
		const m = renderForge({ kind: "button", preset: "primary" });
		expect(m.kind).toBe("button");
	});

	test("dataAttrs includes data-kind", () => {
		const m = renderForge({ kind: "card", preset: "default" });
		expect(m.dataAttrs["data-kind"]).toBe("card");
	});

	test("cssVars contains --background-color", () => {
		const m = renderForge({ kind: "button", preset: "primary" });
		expect(m.cssVars["--background-color"]).toBeDefined();
		expect(m.cssVars["--background-color"]).toContain("var(");
	});

	test("cssVars contains --box-shadow", () => {
		const m = renderForge({ kind: "card", preset: "glass" });
		expect(m.cssVars["--box-shadow"]).toBeDefined();
	});

	test("cssVars contains --color", () => {
		const m = renderForge({ kind: "text", preset: "default" });
		expect(m.cssVars["--color"]).toBeDefined();
	});

	test("cssVars contains --border-radius", () => {
		const m = renderForge({ kind: "card", preset: "default" });
		expect(m.cssVars["--border-radius"]).toBeDefined();
	});

	test("per-kind tier keys off the RAW preset; shared tier off the resolved intent", () => {
		const m = renderForge({ kind: "button", preset: "primary" });
		const bg = m.cssVars["--background-color"];
		// var(--style-button-primary-..., var(--preset-glass-deep-..., ...))
		expect(bg).toContain("--style-button-primary");
		expect(bg).toContain("--preset-glass-deep");
	});

	test("preset:'default' targets the per-kind default @defaults layer", () => {
		const m = renderForge({ kind: "card", preset: "default" });
		const bg = m.cssVars["--background-color"];
		// The emitted --style-card-default-* wins; shared neuro-elevated backs it.
		expect(bg).toContain("--style-card-default");
		expect(bg).toContain("--preset-neuro-elevated");
	});

	test("'glass' preset resolves through glass-deep shared tokens", () => {
		const m = renderForge({ kind: "card", preset: "glass" });
		const bg = m.cssVars["--background-color"];
		expect(bg).toContain("--preset-glass-deep");
	});
});

// ═══════════════════════════════════════════════════════════════
// STATE OVERRIDES
// ═══════════════════════════════════════════════════════════════

describe("renderForge — state overrides (4-tier option-b chain)", () => {
	test("state='disabled' layers per-kind state → per-kind base → shared state → shared base", () => {
		const m = renderForge({ kind: "button", preset: "primary", state: "disabled" });
		const bg = m.cssVars["--background-color"];
		// per-kind state outranks shared state; both appear in the chain
		expect(bg).toContain("--style-button-primary-disabled");
		expect(bg).toContain("--preset-glass-deep-disabled");
		expect(bg.indexOf("--style-button-primary-disabled")).toBeLessThan(
			bg.indexOf("--preset-glass-deep-disabled"),
		);
	});

	test("state='active' applies active-specific vars", () => {
		const m = renderForge({ kind: "button", preset: "primary", state: "active" });
		const bg = m.cssVars["--background-color"];
		expect(bg).toContain("--style-button-primary-active");
		expect(bg).toContain("--preset-glass-deep-active");
	});

	test("state='default' does NOT apply state overrides", () => {
		const m = renderForge({ kind: "button", preset: "primary", state: "default" });
		const bg = m.cssVars["--background-color"];
		expect(bg).not.toContain("-disabled-");
		expect(bg).not.toContain("-active-");
	});
});

// ═══════════════════════════════════════════════════════════════
// DATA ATTRIBUTES — family markers
// ═══════════════════════════════════════════════════════════════

describe("renderForge — data-cl-* family attributes", () => {
	test("includes at least one data-cl-* family attribute", () => {
		const m = renderForge({ kind: "button", preset: "primary" });
		const familyAttrs = Object.keys(m.dataAttrs).filter((k) => k.startsWith("data-cl-"));
		expect(familyAttrs.length).toBeGreaterThan(0);
	});
});
