/**
 * @file actions/useIntersection.ts
 * @package @devpulse/coldlight
 *
 * IntersectionObserver action. Use: `use:intersection={{ onChange, options }}`.
 */
export function intersection(
	node: HTMLElement,
	params: {
		onChange: (entry: IntersectionObserverEntry) => void;
		options?: IntersectionObserverInit;
	},
) {
	const observer = new IntersectionObserver((entries) => {
		for (const entry of entries) params.onChange(entry);
	}, params.options);

	observer.observe(node);

	return {
		destroy() {
			observer.disconnect();
		},
	};
}
