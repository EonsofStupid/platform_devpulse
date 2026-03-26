/**
 * @file attachments/observer/resize.ts
 * @package @devpulse/coldlight
 * @layer attachment
 * @category observer
 *
 * ResizeObserver attachment. Fires callback when the element's
 * dimensions change. Used for responsive components that need
 * to know their own size.
 *
 * @example
 * ```svelte
 * <div {@attach resize(() => ({
 *   onResize: (entry) => { width = entry.contentRect.width; }
 * }))}>
 *   Responsive content
 * </div>
 * ```
 *
 * @consumers RadialGauge (responsive sizing), DataTable, VPB
 */

export interface ResizeOptions {
	onResize: (entry: ResizeObserverEntry) => void;
	box?: ResizeObserverBoxOptions;
}

/**
 * Resize observer attachment.
 *
 * @param node - The element to observe
 * @param options - Reactive getter returning observer config
 */
export function resize(node: HTMLElement, options: () => ResizeOptions): () => void {
	const { onResize, box = "content-box" } = options();

	const observer = new ResizeObserver((entries) => {
		entries.forEach((entry) => onResize(entry));
	});

	observer.observe(node, { box });

	return () => {
		observer.disconnect();
	};
}
