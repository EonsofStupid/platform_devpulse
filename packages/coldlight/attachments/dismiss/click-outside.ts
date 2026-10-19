/**
 * @file attachments/dismiss/click-outside.ts
 * @package @devpulse/coldlight
 * @layer attachment
 * @category dismiss
 *
 * Detects clicks outside the attached element and fires a callback.
 * Used for dismiss-on-outside-click patterns in overlays.
 *
 * @example
 * ```svelte
 * <div {@attach clickOutside(() => close)}>
 *   <p>Popover content</p>
 * </div>
 * ```
 *
 * @consumers Dialog, Popover, Select, Combobox, DatePicker
 */

/**
 * Click outside attachment.
 *
 * @param node - The element to detect outside clicks for
 * @param callback - Reactive getter returning the dismiss callback
 */
export function clickOutside(node: HTMLElement, callback: () => () => void): () => void {
	function handler(event: MouseEvent) {
		if (!node.contains(event.target as Node)) {
			callback()();
		}
	}

	// Delay to avoid catching the click that opened the element
	requestAnimationFrame(() => {
		document.addEventListener("click", handler, true);
	});

	return () => {
		document.removeEventListener("click", handler, true);
	};
}
