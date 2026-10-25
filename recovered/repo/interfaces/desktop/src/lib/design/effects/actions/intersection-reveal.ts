/**
 * @file Intersection Reveal — Svelte Action
 * @layer effects/actions
 * @package @devpulse/coldlight
 *
 * Svelte 5 action that reveals elements when they enter the viewport.
 * Uses IntersectionObserver for performant scroll-triggered animations.
 *
 * Respects prefers-reduced-motion: if reduced motion is preferred,
 * the element is revealed immediately without animation.
 *
 * Usage:
 *   <div use:intersectionReveal={{ threshold: 0.1, rootMargin: "0px" }}>
 *     Content fades in when scrolled into view
 *   </div>
 */

export interface IntersectionRevealParams {
	/** Visibility threshold (0-1). @default 0.1 */
	threshold?: number;
	/** Root margin for early/late trigger. @default "0px" */
	rootMargin?: string;
	/** CSS class to remove when revealed. @default "opacity-0" */
	hiddenClass?: string;
	/** CSS class to add when revealed. @default "opacity-100" */
	revealedClass?: string;
	/** Only trigger once. @default true */
	once?: boolean;
}

export function intersectionReveal(node: HTMLElement, params: IntersectionRevealParams = {}) {
	const {
		threshold = 0.1,
		rootMargin = "0px",
		hiddenClass = "opacity-0",
		revealedClass = "opacity-100",
		once = true,
	} = params;

	// Respect reduced motion preference
	const prefersReduced = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

	if (prefersReduced) {
		node.classList.remove(hiddenClass);
		node.classList.add(revealedClass);
		return { destroy() {} };
	}

	// Set initial hidden state
	node.classList.add(hiddenClass);

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					node.classList.remove(hiddenClass);
					node.classList.add(revealedClass);
					if (once) observer.unobserve(node);
				} else if (!once) {
					node.classList.add(hiddenClass);
					node.classList.remove(revealedClass);
				}
			}
		},
		{ threshold, rootMargin },
	);

	observer.observe(node);

	return {
		destroy() {
			observer.disconnect();
		},
	};
}
