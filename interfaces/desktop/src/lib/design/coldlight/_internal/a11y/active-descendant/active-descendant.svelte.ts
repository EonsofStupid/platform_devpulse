/**
 * Active descendant — Container owns focus, arrows update highlighted item.
 *
 * Used by: combobox, select, listbox, autocomplete.
 *
 * Container has aria-activedescendant pointing to highlighted item's id.
 * Arrow keys update highlight without moving DOM focus.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_focus_activedescendant
 */

import { kbd } from "../../utils/kbd.js";
import type { ActiveDescendantConfig, ActiveDescendantReturn } from "./types.js";

export function useActiveDescendant(config: ActiveDescendantConfig): ActiveDescendantReturn {
	const idAttr = config.idAttr ?? "id";
	const disabledAttr = config.disabledAttr ?? "data-disabled";
	const loop = config.loop ?? true;

	let highlightedId = $state<string | null>(null);

	function getItems(): HTMLElement[] {
		const container = config.container();
		if (!container) return [];
		return Array.from(container.querySelectorAll<HTMLElement>(config.itemSelector)).filter(
			(el) => !el.hasAttribute(disabledAttr),
		);
	}

	function getItemId(el: HTMLElement): string | null {
		return el.getAttribute(idAttr);
	}

	function highlightByIndex(index: number): void {
		const items = getItems();
		if (index >= 0 && index < items.length) {
			const id = getItemId(items[index]);
			highlightedId = id;
			config.onHighlightChange(id);
			items[index].scrollIntoView({ block: "nearest" });
		}
	}

	$effect(() => {
		const container = config.container();
		if (!container) return;

		function onKeydown(e: KeyboardEvent): void {
			const items = getItems();
			if (items.length === 0) return;

			const currentIndex = highlightedId
				? items.findIndex((el) => getItemId(el) === highlightedId)
				: -1;

			if (e.key === kbd.ARROW_DOWN) {
				e.preventDefault();
				if (currentIndex < items.length - 1) highlightByIndex(currentIndex + 1);
				else if (loop) highlightByIndex(0);
			} else if (e.key === kbd.ARROW_UP) {
				e.preventDefault();
				if (currentIndex > 0) highlightByIndex(currentIndex - 1);
				else if (loop) highlightByIndex(items.length - 1);
			} else if (e.key === kbd.HOME) {
				e.preventDefault();
				highlightByIndex(0);
			} else if (e.key === kbd.END) {
				e.preventDefault();
				highlightByIndex(items.length - 1);
			} else if (e.key === kbd.ENTER) {
				e.preventDefault();
				if (highlightedId) config.onSelect?.(highlightedId);
			}
		}

		container.addEventListener("keydown", onKeydown);
		return () => container.removeEventListener("keydown", onKeydown);
	});

	return {
		get highlightedId() {
			return highlightedId;
		},
		highlightFirst() {
			highlightByIndex(0);
		},
		highlightLast() {
			const items = getItems();
			highlightByIndex(items.length - 1);
		},
		clear() {
			highlightedId = null;
			config.onHighlightChange(null);
		},
	};
}
