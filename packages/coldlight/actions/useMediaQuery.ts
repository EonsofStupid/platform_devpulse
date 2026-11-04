/**
 * @file actions/useMediaQuery.ts
 * @package @devpulse/coldlight
 *
 * Tracks a CSS media query via callback. Use: `use:mediaQuery={{ query, onChange }}`.
 */
export function mediaQuery(
	_node: HTMLElement,
	params: { query: string; onChange: (matches: boolean) => void },
) {
	let mql = window.matchMedia(params.query);
	const handler = (e: MediaQueryListEvent) => params.onChange(e.matches);

	params.onChange(mql.matches);
	mql.addEventListener("change", handler);

	return {
		update(p: { query: string; onChange: (matches: boolean) => void }) {
			mql.removeEventListener("change", handler);
			params = p;
			mql = window.matchMedia(p.query);
			p.onChange(mql.matches);
			mql.addEventListener("change", handler);
		},
		destroy() {
			mql.removeEventListener("change", handler);
		},
	};
}
