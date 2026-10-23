import { flushSync } from "svelte";
import { afterEach, describe, expect, test, vi } from "vitest";
import { logLevelTone } from "./log.levels.js";
import type { UseLogProps, UseLogReturn } from "./log.types.js";
import { useLog } from "./use-log.svelte.js";

/** A real scrolling region, 40px tall, so the hook measures actual geometry. */
function region(): HTMLElement {
	const el = document.createElement("div");
	el.style.cssText = "height: 40px; overflow: auto;";
	document.body.append(el);
	return el;
}

/** Lines 20px tall: two fit, the rest scroll. */
function addLines(el: HTMLElement, n: number): void {
	for (let i = 0; i < n; i++) {
		const line = document.createElement("div");
		line.style.cssText = "height: 20px;";
		el.append(line);
	}
}

/** The user scrolls: the position moves and the browser reports it. */
function scrollTo(el: HTMLElement, top: number): void {
	el.scrollTop = top;
	el.dispatchEvent(new Event("scroll"));
	flushSync();
}

const atEnd = (el: HTMLElement): boolean => el.scrollHeight - el.scrollTop - el.clientHeight <= 2;

let stop: (() => void) | undefined;

function mount(props: UseLogProps, node?: HTMLElement): UseLogReturn {
	let log: UseLogReturn | undefined;
	stop = $effect.root(() => {
		log = useLog(props);
		if (node) log.attachRoot(node);
	});
	flushSync();
	if (!log) throw new Error("useLog did not run");
	return log;
}

afterEach(() => {
	stop?.();
	stop = undefined;
	document.body.replaceChildren();
});

describe("useLog — the region", () => {
	test("the root is a named log the keyboard can scroll, following by default", () => {
		const log = mount({ label: "Today's actions", count: 0 });
		expect(log.root.role).toBe("log");
		expect(log.root["aria-label"]).toBe("Today's actions");
		expect(log.root.tabindex).toBe(0);
		expect(log.root["data-kind"]).toBe("log");
		expect(log.root["data-slot"]).toBe("root");
		expect(log.root["data-following"]).toBe("");
		expect(log.list["data-slot"]).toBe("list");
		expect(log.following).toBe(true);
	});

	test("a visible label can name it instead", () => {
		const log = mount({ "aria-labelledby": "log-title", count: 0 });
		expect(log.root["aria-labelledby"]).toBe("log-title");
		expect(log.root["aria-label"]).toBeUndefined();
	});
});

describe("useLog — following the end", () => {
	test("new lines keep it at the newest while it follows", () => {
		const node = region();
		let count = $state(0);
		mount(
			{
				label: "Log",
				get count() {
					return count;
				},
			},
			node,
		);
		addLines(node, 20);
		count = 20;
		flushSync();
		expect(node.scrollTop).toBeGreaterThan(0);
		expect(atEnd(node)).toBe(true);
	});

	test("scrolling away stops following; new lines leave the view where it is", () => {
		const node = region();
		let count = $state(0);
		const onFollowingChange = vi.fn();
		const log = mount(
			{
				label: "Log",
				onFollowingChange,
				get count() {
					return count;
				},
			},
			node,
		);
		addLines(node, 20);
		count = 20;
		flushSync();

		scrollTo(node, 0);
		expect(log.following).toBe(false);
		expect(log.root["data-following"]).toBeUndefined();
		expect(onFollowingChange).toHaveBeenLastCalledWith(false);

		addLines(node, 5);
		count = 25;
		flushSync();
		expect(node.scrollTop).toBe(0);
	});

	test("returning to the end resumes following", () => {
		const node = region();
		let count = $state(0);
		const log = mount(
			{
				label: "Log",
				get count() {
					return count;
				},
			},
			node,
		);
		addLines(node, 20);
		count = 20;
		flushSync();
		scrollTo(node, 0);
		expect(log.following).toBe(false);

		scrollTo(node, node.scrollHeight);
		expect(log.following).toBe(true);
		addLines(node, 5);
		count = 25;
		flushSync();
		expect(atEnd(node)).toBe(true);
	});

	test("controlled: the owner's value holds; a change is only reported", () => {
		const node = region();
		let count = $state(0);
		const onFollowingChange = vi.fn();
		const log = mount(
			{
				label: "Log",
				following: false,
				onFollowingChange,
				get count() {
					return count;
				},
			},
			node,
		);
		addLines(node, 20);
		count = 20;
		flushSync();
		expect(node.scrollTop).toBe(0);

		scrollTo(node, node.scrollHeight);
		expect(onFollowingChange).toHaveBeenLastCalledWith(true);
		expect(log.following).toBe(false);
	});
});

describe("logLevelTone", () => {
	test("each level has the tone it is drawn with", () => {
		expect(logLevelTone("error")).toBe("error");
		expect(logLevelTone("warn")).toBe("warning");
		expect(logLevelTone("info")).toBe("info");
		expect(logLevelTone("debug")).toBe("muted");
		expect(logLevelTone("trace")).toBe("muted");
	});
});
