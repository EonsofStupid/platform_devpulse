/**
 * @file attachments/layout/scroll-lock.ts
 * @package @devpulse/coldlight
 * @layer attachment
 * @category layout
 *
 * Prevents body scroll when the attached element is mounted.
 * Restores original scroll behavior on destroy. Preserves
 * scroll position to prevent layout shift.
 *
 * @example
 * ```svelte
 * {#if dialogOpen}
 *   <div {@attach scrollLock()}>
 *     <div class="overlay">Modal</div>
 *   </div>
 * {/if}
 * ```
 *
 * @consumers Dialog, Sheet
 */

/**
 * Scroll lock attachment.
 *
 * @param _node - The element triggering the lock (unused — lock is on body)
 */
export function scrollLock(_node: HTMLElement): () => void {
	const scrollY = window.scrollY;
	const originalOverflow = document.body.style.overflow;
	const originalPosition = document.body.style.position;
	const originalTop = document.body.style.top;
	const originalWidth = document.body.style.width;

	document.body.style.overflow = "hidden";
	document.body.style.position = "fixed";
	document.body.style.top = `-${scrollY}px`;
	document.body.style.width = "100%";

	return () => {
		document.body.style.overflow = originalOverflow;
		document.body.style.position = originalPosition;
		document.body.style.top = originalTop;
		document.body.style.width = originalWidth;
		window.scrollTo(0, scrollY);
	};
}
