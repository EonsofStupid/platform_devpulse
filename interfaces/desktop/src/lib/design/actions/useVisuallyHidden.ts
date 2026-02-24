/**
 * @file actions/useVisuallyHidden.ts
 * @package @devpulse/coldlight
 *
 * Applies visually-hidden styles for screen reader content. Use: `use:visuallyHidden`.
 */
export function visuallyHidden(node: HTMLElement) {
	const prev = node.style.cssText;
	node.style.cssText +=
		";position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0";

	return {
		destroy() {
			node.style.cssText = prev;
		},
	};
}
