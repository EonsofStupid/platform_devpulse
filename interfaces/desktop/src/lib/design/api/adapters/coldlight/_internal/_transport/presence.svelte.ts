import { extract, type MaybeGetter } from "./types.js";

export function usePresence(config: {
	open: MaybeGetter<boolean>;
	node: () => HTMLElement | null;
	onExitComplete?: () => void;
}): { readonly present: boolean } {
	let present = $state(extract(config.open));

	$effect(() => {
		const isOpen = extract(config.open);

		if (isOpen) {
			present = true;
			return;
		}

		// Closing — check for transitions
		const node = config.node();
		if (!node) {
			present = false;
			config.onExitComplete?.();
			return;
		}

		const styles = getComputedStyle(node);
		const hasTransition =
			styles.transitionDuration !== "0s" && styles.transitionDuration !== "";
		const hasAnimation =
			styles.animationName !== "none" && styles.animationName !== "";

		if (!hasTransition && !hasAnimation) {
			present = false;
			config.onExitComplete?.();
			return;
		}

		function onEnd(): void {
			present = false;
			config.onExitComplete?.();
			node!.removeEventListener("transitionend", onEnd);
			node!.removeEventListener("animationend", onEnd);
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
