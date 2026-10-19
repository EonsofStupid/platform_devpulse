/**
 * @file attachments/dismiss/escape-key.ts
 * @package @devpulse/coldlight
 * @layer attachment
 * @category dismiss
 *
 * Fires a callback when Escape is pressed while the element or its
 * descendants have focus. Used for dismiss-on-escape patterns.
 *
 * @example
 * ```svelte
 * <div {@attach escapeKey(() => close)}>
 *   <input />
 * </div>
 * ```
 *
 * @consumers Dialog, Sheet, Popover, Select, Tooltip
 */

/**
 * Escape key attachment.
 *
 * @param node - The element to listen for Escape within
 * @param callback - Reactive getter returning the dismiss callback
 */
export function escapeKey(node: HTMLElement, callback: () => () => void): () => void {
	function handler(event: KeyboardEvent) {
		if (event.key === "Escape") {
			event.stopPropagation();
			callback()();
		}
	}

	node.addEventListener("keydown", handler);

	return () => {
		node.removeEventListener("keydown", handler);
	};
}
