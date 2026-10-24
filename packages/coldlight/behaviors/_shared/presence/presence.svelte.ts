/**
 * Presence — mount/unmount with transition/animation awareness.
 *
 * Used by: dialog, popover, tooltip, sheet, collapsible.
 *
 * When closing, waits for CSS transitions or animations to complete
 * before reporting present=false. Prevents content from disappearing
 * before exit animations finish.
 */

import type { PresenceConfig, PresenceReturn } from "./types.js";

export function usePresence(config: PresenceConfig): PresenceReturn {
	let present = $state(config.open());

	$effect(() => {
		const isOpen = config.open();

		if (isOpen) {
			present = true;
			return;
		}

		const node = config.node();
		if (!node) {
			present = false;
			config.onExitComplete?.();
			return;
		}

		const styles = getComputedStyle(node);
		const hasTransition = styles.transitionDuration !== "0s" && styles.transitionDuration !== "";
		const hasAnimation = styles.animationName !== "none" && styles.animationName !== "";

		if (!hasTransition && !hasAnimation) {
			present = false;
			config.onExitComplete?.();
			return;
		}

		function onEnd(): void {
			present = false;
			config.onExitComplete?.();
			node?.removeEventListener("transitionend", onEnd);
			node?.removeEventListener("animationend", onEnd);
		}

		node.addEventListener("transitionend", onEnd, { once: true });
		node.addEventListener("animationend", onEnd, { once: true });

		return () => {
			node.removeEventListener("transitionend", onEnd);
			node.removeEventListener("animationend", onEnd);
		};
	});

	return {
		get present() {
			return present;
		},
	};
}
