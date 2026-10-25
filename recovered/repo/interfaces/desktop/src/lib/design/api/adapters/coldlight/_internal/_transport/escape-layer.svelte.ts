import { extract, type MaybeGetter } from "./types.js";

const escapeStack: Set<symbol> = new Set();

export function useEscapeLayer(config: {
	enabled: MaybeGetter<boolean>;
	onEscape: () => void;
}): void {
	const id = Symbol();

	$effect(() => {
		const active = extract(config.enabled);
		if (!active) return;

		escapeStack.add(id);

		function onKeydown(e: KeyboardEvent): void {
			if (e.key !== "Escape") return;

			const layers = Array.from(escapeStack);
			if (layers[layers.length - 1] !== id) return;

			e.preventDefault();
			e.stopPropagation();
			config.onEscape();
		}

		document.addEventListener("keydown", onKeydown);

		return () => {
			escapeStack.delete(id);
			document.removeEventListener("keydown", onKeydown);
		};
	});
}
