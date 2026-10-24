import { flushSync } from "svelte";
import { afterEach, describe, expect, test, vi } from "vitest";
import { useDismissLayer } from "./dismiss-layer.svelte.js";
import type { DismissLayerConfig } from "./types.js";

/** A laid-out block, so the layer's bounds check sees real geometry. */
function block(): HTMLElement {
	const el = document.createElement("div");
	el.style.cssText = "width: 50px; height: 50px;";
	document.body.append(el);
	return el;
}

/** A full press (down + up) inside `target`'s box. */
function press(target: Element): void {
	const r = target.getBoundingClientRect();
	const init = { bubbles: true, clientX: r.left + 5, clientY: r.top + 5 };
	target.dispatchEvent(new PointerEvent("pointerdown", init));
	target.dispatchEvent(new PointerEvent("pointerup", init));
}

let stop: (() => void) | undefined;

function mount(config: DismissLayerConfig): void {
	stop = $effect.root(() => useDismissLayer(config));
	flushSync();
}

afterEach(() => {
	stop?.();
	stop = undefined;
	document.body.replaceChildren();
});

describe("useDismissLayer", () => {
	test("a press outside the layer dismisses it", () => {
		const layer = block();
		const outside = block();
		const onDismiss = vi.fn();
		mount({ enabled: () => true, node: () => layer, onDismiss });
		press(outside);
		expect(onDismiss).toHaveBeenCalledOnce();
	});

	test("a press inside the layer does not", () => {
		const layer = block();
		const onDismiss = vi.fn();
		mount({ enabled: () => true, node: () => layer, onDismiss });
		press(layer);
		expect(onDismiss).not.toHaveBeenCalled();
	});

	test("a press on an excluded element (the toggling control) does not", () => {
		const layer = block();
		const toggle = block();
		const onDismiss = vi.fn();
		mount({ enabled: () => true, node: () => layer, exclude: () => [toggle, null], onDismiss });
		press(toggle);
		expect(onDismiss).not.toHaveBeenCalled();
	});

	test("while disabled it does nothing", () => {
		const layer = block();
		const outside = block();
		const onDismiss = vi.fn();
		mount({ enabled: () => false, node: () => layer, onDismiss });
		press(outside);
		expect(onDismiss).not.toHaveBeenCalled();
	});
});
