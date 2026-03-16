/**
 * Escape key handling with layer stacking.
 *
 * Only the top layer responds to Escape — nested overlays
 * close innermost first.
 */

const escapeStack: Set<symbol> = new Set();

export function useEscapeLayer(config: {
	enabled: () => boolean;
	onEscape: () => void;
}): void {
	const id = Symbol();

	$effect(() => {
		if (!config.enabled()) return;

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
