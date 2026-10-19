/**
 * @file attachments/observer/media-query.ts
 * @package @devpulse/coldlight
 * @layer attachment
 * @category observer
 *
 * Media query listener attachment. Fires callback when a CSS media
 * query matches or unmatches. Used for responsive behavior.
 *
 * @example
 * ```svelte
 * <div {@attach mediaQuery(() => ({
 *   query: "(min-width: 768px)",
 *   onChange: (matches) => { isDesktop = matches; }
 * }))}>
 * ```
 *
 * @consumers Responsive layout, Sidebar collapse
 */

export interface MediaQueryOptions {
	query: string;
	onChange: (matches: boolean) => void;
}

/**
 * Media query attachment.
 *
 * @param _node - The element (unused — query is global)
 * @param options - Reactive getter returning query + callback
 */
export function mediaQuery(_node: HTMLElement, options: () => MediaQueryOptions): () => void {
	const { query, onChange } = options();
	const mql = window.matchMedia(query);

	function handler(event: MediaQueryListEvent) {
		onChange(event.matches);
	}

	// Fire initial state
	onChange(mql.matches);

	mql.addEventListener("change", handler);

	return () => {
		mql.removeEventListener("change", handler);
	};
}
