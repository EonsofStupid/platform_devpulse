/**
 * @file actions/useResizeObserver.ts
 * @package @devpulse/coldlight
 *
 * ResizeObserver action. Use: `use:resizeObserver={callback}`.
 */
export function resizeObserver(
	node: HTMLElement,
	callback: (entry: ResizeObserverEntry) => void,
) {
	const observer = new ResizeObserver((entries) => {
		for (const entry of entries) callback(entry);
	});

	observer.observe(node);

	return {
		update(newCallback: (entry: ResizeObserverEntry) => void) {
			callback = newCallback;
		},
		destroy() {
			observer.disconnect();
		},
	};
}
