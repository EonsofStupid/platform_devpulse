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
import { getDocumentDir } from "../../locale/use-locale.svelte.js";
import type { RovingFocusConfig, RovingHandlerConfig } from "./types.js";

/**
 * THE composite-widget keyboard implementation (tabs, toolbar, radio-group,
 * menu). Returns a keydown handler that moves focus with Arrow/Home/End,
 * RTL-aware per keystroke, skipping disabled items via the item selector.
 * Consolidated 2026-07-11 (a11y audit Gaps 5-6) — widgets previously each
 * hand-rolled this, most with hardcoded "ltr".
 */
function computeNextIndex(
	key: string,
	keys: { nextKey: string; prevKey: string },
	currentIndex: number,
	count: number,
	loop: boolean,
): number {
	if (currentIndex === -1) return 0;
	if (key === keys.nextKey) {
		if (currentIndex + 1 < count) return currentIndex + 1;
		return loop ? 0 : currentIndex;
	}
	if (key === keys.prevKey) {
		if (currentIndex - 1 >= 0) return currentIndex - 1;
		return loop ? count - 1 : currentIndex;
	}
	if (key === kbd.HOME) return 0;
	return count - 1; // END
}

export function createRovingHandler(config: RovingHandlerConfig): (e: KeyboardEvent) => void {
	const orientation = config.orientation ?? "horizontal";
	const loop = config.loop ?? true;
	const homeEnd = config.homeEnd ?? true;

	return (e: KeyboardEvent): void => {
		const dir = config.dir?.() ?? getDocumentDir();
		const keys = { nextKey: getNextKey(dir, orientation), prevKey: getPrevKey(dir, orientation) };

		const isHomeEnd = homeEnd && (e.key === kbd.HOME || e.key === kbd.END);
		if (e.key !== keys.nextKey && e.key !== keys.prevKey && !isHomeEnd) return;

		const target = e.currentTarget as HTMLElement;
		const container = target.closest<HTMLElement>(config.containerSelector);
		if (!container) return;

		const items = Array.from(container.querySelectorAll<HTMLElement>(config.itemSelector));
		if (items.length === 0) return;
		e.preventDefault();

		// Index off the focused element, not currentTarget — the handler may
		// be attached per-item (tabs, toolbar) or on the container (menu).
		const currentIndex = items.indexOf(document.activeElement as HTMLElement);
		const item = items[computeNextIndex(e.key, keys, currentIndex, items.length, loop)];
		if (!item) return;
		item.focus();
		config.onFocusItem?.(item);
	};
}

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
			return Array.from(container?.querySelectorAll<HTMLElement>(config.itemSelector) ?? []).filter(
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
