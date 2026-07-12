/**
 * @file components/card/Card.test.ts
 * @kind card
 * @layer components
 * @package @devpulse/coldlight
 *
 * Card component browser tests — full renderForge chain proof.
 * Loads the REAL generated CSS (glue + emitted presets) and asserts
 * COMPUTED styles in Chromium, not string expectations: token source →
 * SD5 emission → renderForge var chain → family markers → glue CSS →
 * painted surface.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 */

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import Card from "./Card.svelte";

// The runtime chain the resolver depends on: family-gated glue consumers
// + the full emitted token barrel (primitives + semantic + components) —
// wizard presets COMPOSE designed tokens via var(), so the primitives
// (glass surfaces, depth/glow stacks, gradient fields) must be loaded for
// computed styles to resolve exactly as they do in the app.
import "../../generated/render-base.css";
import "../../styles/index.css";

function root(container: HTMLElement): HTMLElement {
	const el = container.querySelector<HTMLElement>('[data-kind="card"]');
	if (!el) throw new Error("Card root with data-kind not rendered");
	return el;
}

// ═══════════════════════════════════════════════════════════════
// Family markers — KIND_FAMILIES[card] ∪ PRESET_FAMILIES[preset]
// ═══════════════════════════════════════════════════════════════

describe("card — family markers", () => {
	test("wizard-elevated grants overlay (union with worn preset)", async () => {
		const { container } = render(Card, { preset: "wizard-elevated" });
		const el = root(container as HTMLElement);
		expect(el.hasAttribute("data-cl-surface")).toBe(true);
		expect(el.hasAttribute("data-cl-frame")).toBe(true);
		expect(el.hasAttribute("data-cl-text")).toBe(true);
		// The load-bearing fix: a worn preset that carries backdrop-filter
		// grants the overlay family, so blur can actually apply.
		expect(el.hasAttribute("data-cl-overlay")).toBe(true);
	});

	test("default preset has no overlay (card-default carries no blur)", async () => {
		const { container } = render(Card, { preset: "default" });
		const el = root(container as HTMLElement);
		expect(el.hasAttribute("data-cl-surface")).toBe(true);
		expect(el.hasAttribute("data-cl-overlay")).toBe(false);
	});
});

// ═══════════════════════════════════════════════════════════════
// Resolution chain — inline var chain wiring
// ═══════════════════════════════════════════════════════════════

describe("card — var chain", () => {
	test("wizard-elevated resolves per-kind first, shared preset second", async () => {
		const { container } = render(Card, { preset: "wizard-elevated" });
		const style = root(container as HTMLElement).getAttribute("style") ?? "";
		expect(style).toContain("--style-card-wizard-elevated-background-color");
		expect(style).toContain("--preset-wizard-elevated-background-color");
	});
});

// ═══════════════════════════════════════════════════════════════
// Painted surface — COMPUTED styles from the real generated CSS
// ═══════════════════════════════════════════════════════════════

describe("card — wizard-elevated computed surface", () => {
	test("renders the DESIGNED teal glass composition, fully resolved", async () => {
		const { container } = render(Card, { preset: "wizard-elevated" });
		const cs = getComputedStyle(root(container as HTMLElement));

		// Fill: var(--glass-teal) — the DESIGNED teal glass surface, not an
		// invented literal, not black, and not the transparent fallback
		// renderForge uses on a resolution miss.
		expect(cs.backgroundColor).toContain("oklch");
		expect(cs.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");

		// Crisp edge: hairline (--border-width-hairline = 1px) mixed from
		// the designed cyan accent; radius from the scale (--radius-md = 8px).
		expect(cs.borderTopWidth).toBe("1px");
		expect(cs.borderStyle).toBe("solid");
		expect(cs.borderTopColor).not.toBe("rgba(0, 0, 0, 0)");
		expect(cs.borderRadius).toBe("8px");

		// Depth: var(--depth-z1) + var(--glow-teal) — designed stacks.
		expect(cs.boxShadow).not.toBe("none");
		expect(cs.boxShadow.split(",").length).toBeGreaterThanOrEqual(2);

		// Color field: var(--gradient-surface-brand-cyan) — the designed
		// gradient field, resolved to a paintable image.
		expect(cs.backgroundImage).toContain("linear-gradient");

		// Glass: blur(var(--blur-sm)) = blur(4px) — dead app-wide before
		// the family union fix; this assertion is the regression guard.
		expect(cs.backdropFilter).toBe("blur(4px)");
	});

	test("as=button keeps the identical chrome (mode-card case)", async () => {
		const { container } = render(Card, { as: "button", preset: "wizard-elevated" });
		const el = root(container as HTMLElement);
		expect(el.tagName).toBe("BUTTON");
		const cs = getComputedStyle(el);
		expect(cs.backgroundColor).toContain("oklch");
		expect(cs.backdropFilter).toBe("blur(4px)");
		expect(cs.borderRadius).toBe("8px");
	});
});

// ═══════════════════════════════════════════════════════════════
// Per-kind default — the @defaults layer end-to-end
// ═══════════════════════════════════════════════════════════════

describe("card — default computed surface", () => {
	test("default preset paints the component's own @defaults", async () => {
		const { container } = render(Card, { preset: "default" });
		const cs = getComputedStyle(root(container as HTMLElement));
		// @defaults: oklch(0.0901 0.017 224.61 / 0.8) + 0.75rem radius.
		expect(cs.backgroundColor).toContain("oklch");
		expect(cs.borderRadius).toBe("12px");
		expect(cs.boxShadow).not.toBe("none");
	});
});
