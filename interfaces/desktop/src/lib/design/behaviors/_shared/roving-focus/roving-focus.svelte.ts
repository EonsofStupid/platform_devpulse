/**
 * Roving tabindex — Arrow key navigation with managed tabindex.
 *
 * Used by: tabs, radio-group, toolbar, menubar, toggle-group.
 *
 * Only the active item has tabindex=0. Arrow keys move focus.
 * Home/End jump to first/last. Disabled items are skipped.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_roving_tabindex
 */

import { getNextKey, getPrevKey, kbd } from "../../_internal/utils/kbd.js";
import type { RovingFocusConfig } from "./types.js";

export function useRovingFocus(config: RovingFocusConfig): void {
	const orientation = config.orientation ?? "horizontal";
	const dir = config.dir ?? "ltr";
	const loop = config.loop ?? true;
	const valueAttr = config.valueAttr ?? "data-value";
	const disabledAttr = config.disabledAttr ?? "data-disabled";

	$effect(() => {
		const container = config.container();
		if (!container) return;

		function getItems(): HTMLElement[] {
			return Array.from(container!.querySelectorAll<HTMLElement>(config.itemSelector)).filter(
				(el) => !el.hasAttribute(disabledAttr),
			);
		}

		function focusItem(item: HTMLElement): void {
			const value = item.getAttribute(valueAttr);
			if (value != null) config.onActiveChange(value);
			item.focus();
		}

		function onKeydown(e: KeyboardEvent): void {
			const items = getItems();
			if (items.length === 0) return;

			const nextKey = getNextKey(dir, orientation);
			const prevKey = getPrevKey(dir, orientation);
			const currentIndex = items.indexOf(document.activeElement as HTMLElement);

			let nextIndex: number | null = null;

			if (e.key === nextKey) {
				e.preventDefault();
				nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : loop ? 0 : null;
			} else if (e.key === prevKey) {
				e.preventDefault();
				nextIndex = currentIndex > 0 ? currentIndex - 1 : loop ? items.length - 1 : null;
			} else if (e.key === kbd.HOME) {
				e.preventDefault();
				nextIndex = 0;
			} else if (e.key === kbd.END) {
				e.preventDefault();
				nextIndex = items.length - 1;
			}

			if (nextIndex !== null && items[nextIndex]) focusItem(items[nextIndex]);
		}

		container.addEventListener("keydown", onKeydown);
		return () => container.removeEventListener("keydown", onKeydown);
	});
}
