/**
 * @file components/text/Text.test.ts
 * @kind text
 * @layer components
 * @package @devpulse/coldlight
 *
 * Text component browser tests — ARIA + structural only. ZERO visual.
 * Composition/visual tests live in ui/text/Text.test.ts.
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import Heading from "../heading/Heading.svelte";
import Text from "./Text.svelte";

// Render-truth guard needs the REAL generated CSS so computed styles
// resolve exactly as in the app.
import "../../generated/render-base.css";
import "../../styles/index.css";

// =============================================================================
// RENDER TRUTH — typography must never paint a surface
// =============================================================================
// The mass-stamped card-look @defaults regression rendered every Text and
// Heading as a dark pill (wizard screenshot, 2026-07-11). These computed-
// style assertions are the standing guard against that class.

describe("typography — default paints color only, never a surface", () => {
	test("Text: transparent bg, no shadow, no border; owns its color", async () => {
		const { container } = render(Text);
		const el = container.querySelector("[data-kind='text']") as HTMLElement;
		const cs = getComputedStyle(el);
		expect(cs.backgroundColor).toBe("rgba(0, 0, 0, 0)");
		expect(cs.boxShadow).toBe("none");
		expect(cs.borderTopWidth).toBe("0px");
		expect(cs.color).toContain("oklch");
	});

	test("Heading: transparent bg, no shadow, no border; owns its color", async () => {
		const { container } = render(Heading, { level: 2 });
		const el = container.querySelector("[data-kind='heading']") as HTMLElement;
		const cs = getComputedStyle(el);
		expect(cs.backgroundColor).toBe("rgba(0, 0, 0, 0)");
		expect(cs.boxShadow).toBe("none");
		expect(cs.borderTopWidth).toBe("0px");
		expect(cs.color).toContain("oklch");
	});
});

// =============================================================================
// STRUCTURAL ATTRIBUTES
// =============================================================================

describe("text component — structural attributes", () => {
	test("renders with data-kind='text'", async () => {
		const { container } = render(Text);
		const el = container.querySelector("[data-kind='text']") as HTMLElement;
		expect(el).toBeTruthy();
	});

	test("has data-slot='root'", async () => {
		const { container } = render(Text);
		const el = container.querySelector("[data-kind='text']") as HTMLElement;
		await expect.element(el).toHaveAttribute("data-slot", "root");
	});

	test("renders as <span> by default", async () => {
		const { container } = render(Text);
		const el = container.querySelector("[data-kind='text']") as HTMLElement;
		expect(el.tagName.toLowerCase()).toBe("span");
	});

	test("renders as <p> when as='p'", async () => {
		const { container } = render(Text, { props: { as: "p" } });
		const el = container.querySelector("[data-kind='text']") as HTMLElement;
		expect(el.tagName.toLowerCase()).toBe("p");
	});

	test("passes custom class", async () => {
		const { container } = render(Text, { props: { class: "custom-text" } });
		const el = container.querySelector("[data-kind='text']") as HTMLElement;
		await expect.element(el).toHaveClass("custom-text");
	});
});
