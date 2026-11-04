/**
 * Log — the ARIA contract of role="log", the lines and their parts, a tone per
 * level, the empty state, the look attributes, the caller's attributes, and
 * following the end inside the component (plan 0006 LG3).
 */

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import { logLevelTone } from "#coldlight/behaviors/display/log/index.js";
import { locatePart, partOf, snippetOf } from "#coldlight/testing/parts.js";
import Log from "./Log.svelte";
import { LOG_LEVEL_TONES } from "./log.generated.js";
import type { LogLine } from "./types.js";

const lines: LogLine[] = [
	{ id: 1, time: "10:02:01", level: "info", source: "models", text: "refresh ok" },
	{ id: 2, time: "10:02:03", level: "error", text: "download failed" },
	{ id: 3, text: "a bare line" },
];

describe("log — ARIA", () => {
	test("a named log region the keyboard can scroll", async () => {
		const { getByRole } = await render(Log, { props: { lines, label: "Today's actions" } });
		const region = getByRole("log", { name: "Today's actions" });
		await expect.element(region).toBeInTheDocument();
		await expect.element(region).toHaveAttribute("tabindex", "0");
		await expect.element(region).toHaveAttribute("data-following", "");
	});

	test("a visible heading can name it", async () => {
		const { getByRole } = await render(Log, { props: { lines, "aria-labelledby": "log-title" } });
		await expect.element(getByRole("log")).toHaveAttribute("aria-labelledby", "log-title");
	});
});

describe("log — lines", () => {
	test("each entry is a list item, oldest first, with only the parts it has", async () => {
		const { container } = await render(Log, { props: { lines, label: "Log" } });
		const items = container.querySelectorAll('[data-kind="log"][data-slot="line"]');
		expect(items.length).toBe(3);
		expect(items[0].tagName).toBe("LI");
		expect(items[0].querySelector('[data-slot="time"]')?.textContent).toBe("10:02:01");
		expect(items[0].querySelector('[data-slot="source"]')?.textContent).toBe("models");
		expect(items[0].querySelector('[data-slot="text"]')?.textContent).toBe("refresh ok");
		expect(items[2].querySelector('[data-slot="time"]')).toBeNull();
		expect(items[2].querySelector('[data-slot="level"]')).toBeNull();
		expect(items[2].querySelector('[data-slot="text"]')?.textContent).toBe("a bare line");
		await expect.element(locatePart(container, "log", "list")).toBeInTheDocument();
	});

	test("a level is drawn with its tone", async () => {
		const { container } = await render(Log, { props: { lines, label: "Log" } });
		const levels = container.querySelectorAll('[data-kind="log"][data-slot="level"]');
		expect(levels[0].getAttribute("data-tone")).toBe("info");
		expect(levels[1].getAttribute("data-tone")).toBe("error");
	});

	test("every tone a level maps to is one the kind file draws", () => {
		const levels = ["error", "warn", "info", "debug", "trace"] as const;
		for (const level of levels) {
			expect(LOG_LEVEL_TONES).toContain(logLevelTone(level));
		}
	});
});

describe("log — empty", () => {
	test("with no lines it shows the empty snippet instead of the list", async () => {
		const { container, getByText } = await render(Log, {
			props: { lines: [], label: "Log", empty: snippetOf("<p>No actions yet</p>") },
		});
		await expect.element(getByText("No actions yet")).toBeInTheDocument();
		expect(partOf(container, "log", "list")).toBeNull();
	});
});

describe("log — look", () => {
	test("its panel takes the kind's default variant, and a family when given", async () => {
		const { getByRole, rerender } = await render(Log, { props: { lines, label: "Log" } });
		await expect.element(getByRole("log")).toHaveAttribute("data-variant", "elevated");
		await rerender({ variant: "deep", surface: "glass" });
		await expect.element(getByRole("log")).toHaveAttribute("data-variant", "deep");
		await expect.element(getByRole("log")).toHaveAttribute("data-surface", "glass");
	});

	test("the caller's attributes reach the region", async () => {
		const { getByRole } = await render(Log, {
			props: { lines, label: "Log", id: "action-log", class: "h-64", "data-testid": "log" },
		});
		const region = getByRole("log");
		await expect.element(region).toHaveAttribute("id", "action-log");
		await expect.element(region).toHaveAttribute("data-testid", "log");
		await expect.element(region).toHaveClass("h-64");
	});
});

describe("log — following", () => {
	test("new entries keep it at the newest while it follows", async () => {
		const many = (n: number): LogLine[] =>
			Array.from({ length: n }, (_, i) => ({ id: i, text: `line ${i}` }));
		// ColdLight's test runner compiles no Tailwind, so the region's scrolling
		// (`overflow-y-auto` in the app) is given inline; what is tested is that
		// the component wires following to its root.
		const { getByRole, rerender } = await render(Log, {
			props: { lines: many(3), label: "Log", style: "height: 60px; overflow-y: auto" },
		});
		await rerender({ lines: many(60) });
		const node = getByRole("log").element() as HTMLElement;
		expect(node.scrollTop).toBeGreaterThan(0);
		expect(node.scrollHeight - node.scrollTop - node.clientHeight).toBeLessThanOrEqual(2);
	});
});
