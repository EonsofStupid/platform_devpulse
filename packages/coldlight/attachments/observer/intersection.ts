/**
 * @file attachments/observer/intersection.ts
 * @package @devpulse/coldlight
 * @layer attachment
 * @category observer
 *
 * IntersectionObserver attachment. Fires callback when the element
 * enters or exits the viewport (or a specified root).
 *
 * @example
 * ```svelte
 * <div {@attach intersection(() => ({
 *   onIntersect: (entry) => { visible = entry.isIntersecting; }
 * }))}>
 *   Lazy loaded content
 * </div>
 * ```
 *
 * @consumers VirtualList, LazyImage, InfiniteScroll
 */

export interface IntersectionOptions {
	onIntersect: (entry: IntersectionObserverEntry) => void;
	root?: Element | null;
	rootMargin?: string;
	threshold?: number | number[];
}

/**
 * Intersection observer attachment.
 *
 * @param node - The element to observe
 * @param options - Reactive getter returning observer config
 */
export function intersection(node: HTMLElement, options: () => IntersectionOptions): () => void {
	const { onIntersect, root = null, rootMargin = "0px", threshold = 0 } = options();

	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				onIntersect(entry);
			});
		},
		{ root, rootMargin, threshold },
	);

	observer.observe(node);

	return () => {
		observer.disconnect();
	};
}
