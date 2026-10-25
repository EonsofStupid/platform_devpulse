/**
 * @file actions/usePortal.ts
 * @package @devpulse/coldlight
 *
 * Moves element to a target container (default: document.body). Use: `use:portal` or `use:portal={target}`.
 */
export function portal(node: HTMLElement, target: string | HTMLElement = "body") {
	let targetEl: HTMLElement;

	function move() {
		targetEl =
			typeof target === "string"
				? (document.querySelector<HTMLElement>(target) ?? document.body)
				: target;
		targetEl.appendChild(node);
	}

	move();

	return {
		update(newTarget: string | HTMLElement) {
			target = newTarget;
			move();
		},
		destroy() {
			node.remove();
		},
	};
}
