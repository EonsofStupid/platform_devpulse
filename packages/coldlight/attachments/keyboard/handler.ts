/**
 * @file attachments/keyboard/handler.ts
 * @package @devpulse/coldlight
 * @layer attachment
 * @category keyboard
 *
 * General-purpose keyboard event handler. Maps key names to callbacks.
 * Components define their key maps, this attachment wires them to the DOM.
 *
 * @example
 * ```svelte
 * <div {@attach keyboardHandler(() => ({
 *   Enter: () => activate(),
 *   Space: () => activate(),
 *   ArrowDown: () => next(),
 * }))}>
 * ```
 *
 * @consumers Tabs, Accordion, Menubar, Select, Combobox
 */

export type KeyMap = Record<string, (event: KeyboardEvent) => void>;

/**
 * Keyboard handler attachment.
 *
 * @param node - The element to listen for keyboard events on
 * @param keyMap - Reactive getter returning a key→callback map
 */
export function keyboardHandler(node: HTMLElement, keyMap: () => KeyMap): () => void {
	function handler(event: KeyboardEvent) {
		const map = keyMap();
		const fn = map[event.key];
		if (fn) {
			fn(event);
		}
	}

	node.addEventListener("keydown", handler);

	return () => {
		node.removeEventListener("keydown", handler);
	};
}
