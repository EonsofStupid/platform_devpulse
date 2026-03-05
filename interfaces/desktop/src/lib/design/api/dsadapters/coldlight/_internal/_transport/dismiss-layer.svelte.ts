import { extract, type MaybeGetter } from "./types.js";

const layerStack: Set<symbol> = new Set();

export function useDismissLayer(config: {
	enabled: MaybeGetter<boolean>;
	node: () => HTMLElement | null;
	onDismiss: () => void;
}): void {
	const id = Symbol();

	$effect(() => {
		const active = extract(config.enabled);
		if (!active) return;

		layerStack.add(id);

		function isTopLayer(): boolean {
			const layers = Array.from(layerStack);
			return layers[layers.length - 1] === id;
		}

		let pointerDownOutside = false;

		function onPointerDown(e: PointerEvent): void {
			const node = config.node();
			if (!node || !isTopLayer()) return;

			// Check if click is outside the node
			const rect = node.getBoundingClientRect();
			const inside =
				e.clientX >= rect.left &&
				e.clientX <= rect.right &&
				e.clientY >= rect.top &&
				e.clientY <= rect.bottom;

			if (!inside && !node.contains(e.target as Node)) {
				pointerDownOutside = true;
			}
		}

		function onPointerUp(e: PointerEvent): void {
			if (!pointerDownOutside || !isTopLayer()) {
				pointerDownOutside = false;
				return;
			}

			const node = config.node();
			if (!node) return;

			// Check for text selection (don't dismiss during selection)
			const selection = window.getSelection();
			if (selection && selection.toString().length > 0) {
				pointerDownOutside = false;
				return;
			}

			// Check if target is inside a child dialog
			const target = e.target as HTMLElement;
			if (target.closest("dialog[open]") && !node.contains(target)) {
				pointerDownOutside = false;
				return;
			}

			pointerDownOutside = false;
			config.onDismiss();
		}

		document.addEventListener("pointerdown", onPointerDown, true);
		document.addEventListener("pointerup", onPointerUp, true);

		return () => {
			layerStack.delete(id);
			document.removeEventListener("pointerdown", onPointerDown, true);
			document.removeEventListener("pointerup", onPointerUp, true);
		};
	});
}
