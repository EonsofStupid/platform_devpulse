/**
 * @file attachments/observer/overflow.ts
 * @package @devpulse/coldlight
 * @layer attachment
 * @category observer
 *
 * Detects whether the element's content overflows its container.
 * Fires callback with overflow state. Used for showing scroll
 * indicators, collapse triggers, or "more" buttons.
 *
 * @example
 * ```svelte
 * <div {@attach overflow(() => ({
 *   onChange: (state) => { hasOverflow = state.horizontal; }
 * }))}>
 *   <div class="flex gap-2">...many tabs...</div>
 * </div>
 * ```
 *
 * @consumers Tabs (scroll arrows), Breadcrumbs (collapse)
 */

export interface OverflowState {
	horizontal: boolean;
	vertical: boolean;
}

export interface OverflowOptions {
	onChange: (state: OverflowState) => void;
}

/**
 * Overflow detection attachment.
 *
 * @param node - The container element to check for overflow
 * @param options - Reactive getter returning callback
 */
export function overflow(node: HTMLElement, options: () => OverflowOptions): () => void {
	const { onChange } = options();

	function check() {
		onChange({
			horizontal: node.scrollWidth > node.clientWidth,
			vertical: node.scrollHeight > node.clientHeight,
		});
	}

	const observer = new ResizeObserver(() => check());
	observer.observe(node);

	// Also check children changes
	const mutation = new MutationObserver(() => check());
	mutation.observe(node, { childList: true, subtree: true });

	// Initial check
	check();

	return () => {
		observer.disconnect();
		mutation.disconnect();
	};
}
