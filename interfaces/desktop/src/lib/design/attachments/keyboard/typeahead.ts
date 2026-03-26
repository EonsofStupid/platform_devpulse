/**
 * @file attachments/keyboard/typeahead.ts
 * @package @devpulse/coldlight
 * @layer attachment
 * @category keyboard
 *
 * Type-to-select in list-like components. Buffers keystrokes and
 * finds the first matching item by text content. Clears buffer
 * after 500ms of inactivity.
 *
 * @example
 * ```svelte
 * <ul {@attach typeahead(() => ({ onMatch: (el) => el.focus() }))}>
 *   <li>Apple</li>
 *   <li>Banana</li>
 *   <li>Cherry</li>
 * </ul>
 * ```
 *
 * @consumers Select, Combobox, Menubar, ListBox
 */

export interface TypeaheadOptions {
	/** Callback when a match is found */
	onMatch: (element: HTMLElement) => void;
	/** Selector for searchable items. Default: '[role="option"], [role="menuitem"], li' */
	itemSelector?: string;
	/** Buffer clear timeout in ms. Default: 500 */
	timeout?: number;
}

/**
 * Typeahead attachment.
 *
 * @param node - The container element
 * @param options - Reactive getter returning typeahead config
 */
export function typeahead(node: HTMLElement, options: () => TypeaheadOptions): () => void {
	let buffer = "";
	let timer: ReturnType<typeof setTimeout> | null = null;

	function handler(event: KeyboardEvent) {
		// Only handle printable characters
		if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;

		const { onMatch, itemSelector = '[role="option"], [role="menuitem"], li', timeout = 500 } = options();

		buffer += event.key.toLowerCase();

		if (timer) clearTimeout(timer);
		timer = setTimeout(() => { buffer = ""; }, timeout);

		const items = Array.from(node.querySelectorAll<HTMLElement>(itemSelector));
		const match = items.find((item) => {
			const text = item.textContent?.trim().toLowerCase() ?? "";
			return text.startsWith(buffer);
		});

		if (match) {
			onMatch(match);
		}
	}

	node.addEventListener("keydown", handler);

	return () => {
		node.removeEventListener("keydown", handler);
		if (timer) clearTimeout(timer);
	};
}
