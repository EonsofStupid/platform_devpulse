/**
 * Escape key handling with layer stacking.
 *
 * Used by: dialog, popover, dropdown-menu, select, combobox, sheet.
 *
 * Only the top layer responds — nested overlays close innermost first.
 */

import type { EscapeLayerConfig } from "./types.js";

const escapeStack: Set<symbol> = new Set();

export function useEscapeLayer(config: EscapeLayerConfig): void {
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
