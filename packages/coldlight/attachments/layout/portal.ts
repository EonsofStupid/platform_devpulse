/**
 * @file attachments/layout/portal.ts
 * @package @devpulse/coldlight
 * @layer attachment
 * @category layout
 *
 * Moves the attached element to a target container (default: document.body).
 * Essential for overlays that need to escape stacking context.
 *
 * @example
 * ```svelte
 * <div {@attach portal()}>
 *   <div class="overlay">Modal content</div>
 * </div>
 * ```
 *
 * @consumers Dialog, Sheet, Popover, Tooltip, Toast
 */

/**
 * Portal attachment.
 *
 * @param node - The element to move
 * @param target - Reactive getter returning the target container. Default: document.body
 */
export function portal(node: HTMLElement, target?: () => HTMLElement): () => void {
	const container = target ? target() : document.body;
	container.appendChild(node);

	return () => {
		if (node.parentNode === container) {
			container.removeChild(node);
		}
	};
}
