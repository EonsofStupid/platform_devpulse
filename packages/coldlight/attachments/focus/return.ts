/**
 * @file attachments/focus/return.ts
 * @package @devpulse/coldlight
 * @layer attachment
 * @category focus
 *
 * Returns focus to the previously focused element when the attached
 * element is destroyed. Essential for modal patterns — when a dialog
 * closes, focus returns to the button that opened it.
 *
 * @example
 * ```svelte
 * {#if open}
 *   <div {@attach focusReturn()}>
 *     <p>Dialog content</p>
 *   </div>
 * {/if}
 * ```
 *
 * @consumers Dialog, Sheet, AlertDialog, Popover
 */

/**
 * Focus return attachment.
 * Captures the active element on mount, restores it on destroy.
 *
 * @param node - The element that will capture focus
 */
export function focusReturn(node: HTMLElement): () => void {
	const previouslyFocused = document.activeElement as HTMLElement | null;

	// Move focus into the container on mount
	node.focus({ preventScroll: true });

	return () => {
		if (previouslyFocused && typeof previouslyFocused.focus === "function") {
			previouslyFocused.focus({ preventScroll: true });
		}
	};
}
