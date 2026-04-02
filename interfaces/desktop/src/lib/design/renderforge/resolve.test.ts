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

	test("cssVars contains -bg", () => {
		const m = renderForge({ kind: "button", preset: "primary" });
		expect(m.cssVars["-bg"]).toBeDefined();
		expect(m.cssVars["-bg"]).toContain("var(");
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

	test("cssVars uses two-tier var() chain (per-kind → shared → fallback)", () => {
		const m = renderForge({ kind: "button", preset: "primary" });
		const bg = m.cssVars["-bg"];
		// Should contain var(--style-button-glass-deep-..., var(--preset-glass-deep-..., ...))
		expect(bg).toContain("--style-button-glass-deep");
		expect(bg).toContain("--preset-glass-deep");
	});

	test("'default' preset resolves through neuro-elevated tokens", () => {
		const m = renderForge({ kind: "card", preset: "default" });
		const bg = m.cssVars["-bg"];
		expect(bg).toContain("--preset-neuro-elevated");
	});

	test("'glass' preset resolves through glass-deep tokens", () => {
		const m = renderForge({ kind: "card", preset: "glass" });
		const bg = m.cssVars["-bg"];
		expect(bg).toContain("--preset-glass-deep");
	});
});

// ═══════════════════════════════════════════════════════════════
// STATE OVERRIDES
// ═══════════════════════════════════════════════════════════════

describe("renderForge — state overrides", () => {
	test("state='disabled' applies state-specific vars", () => {
		const m = renderForge({ kind: "button", preset: "primary", state: "disabled" });
		const bg = m.cssVars["-bg"];
		expect(bg).toContain("disabled");
	});

	test("state='active' applies active-specific vars", () => {
		const m = renderForge({ kind: "button", preset: "primary", state: "active" });
		const bg = m.cssVars["-bg"];
		expect(bg).toContain("active");
	});

	test("state='default' does NOT apply state overrides", () => {
		const m = renderForge({ kind: "button", preset: "primary", state: "default" });
		const bg = m.cssVars["-bg"];
		expect(bg).not.toContain("default-background");
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
