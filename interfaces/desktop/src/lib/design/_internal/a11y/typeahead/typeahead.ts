/**
 * Typeahead — character typing jumps to matching items in a list.
 *
 * Used by: select, combobox, listbox, menu.
 *
 * User types characters → buffer builds up → matches against item text
 * (case-insensitive, startsWith). After timeout, buffer resets.
 */

import type { TypeaheadConfig, TypeaheadReturn } from "./types.js";

export function useTypeahead(config: TypeaheadConfig): TypeaheadReturn {
	const timeout = config.timeout ?? 500;
	const getItemText = config.getItemText ?? ((el: HTMLElement) => el.textContent?.trim() ?? "");

	let buffer = "";
	let timer: ReturnType<typeof setTimeout> | null = null;

	function reset(): void {
		buffer = "";
		if (timer) {
			clearTimeout(timer);
			timer = null;
		}
	}

	function handleKeydown(e: KeyboardEvent): void {
		if (e.key.length !== 1 || e.ctrlKey || e.altKey || e.metaKey) return;

		buffer += e.key.toLowerCase();

		if (timer) clearTimeout(timer);
		timer = setTimeout(reset, timeout);

		const items = config.getItems();
		if (items.length === 0) return;

		const currentIndex = items.indexOf(document.activeElement as HTMLElement);
		const startIndex = currentIndex >= 0 ? currentIndex : 0;

		for (let i = 0; i < items.length; i++) {
			const index = (startIndex + i + (buffer.length === 1 ? 1 : 0)) % items.length;
			const text = getItemText(items[index]).toLowerCase();
			if (text.startsWith(buffer)) {
				config.onMatch(items[index]);
				return;
			}
		}
	}

	return { handleKeydown, reset };
}
