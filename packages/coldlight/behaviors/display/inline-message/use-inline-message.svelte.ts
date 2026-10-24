/**
 * @file useInlineMessage — behavior hook
 * @kind inline-message
 * @layer primitives
 *
 * Returns ARIA attrs for inline contextual feedback.
 * role="status" with polite live region — NOT assertive like Alert.
 */

export interface UseInlineMessageOptions {
	tone?: string;
}

export function useInlineMessage(_opts: UseInlineMessageOptions) {
	return {
		root: {
			role: "status" as const,
			"aria-live": "polite" as const,
		},
	};
}
