/**
 * @file Transition Composite Tokens — named transition presets
 * @module @devpulse/coldlight/tokens/motion/transitions
 * @layer tokens/tier-1
 *
 * DTCG composite type "transition" — SD5 auto-expands each into:
 *   --transitionStyle-{name}-duration
 *   --transitionStyle-{name}-delay
 *   --transitionStyle-{name}-timingFunction
 *
 * Components consume individual expanded properties or the full composite.
 */

export interface TransitionComposite {
	duration: string;
	delay: string;
	timingFunction: string;
}

export const transitionStyle: Record<string, TransitionComposite> = {
	/** Instant feedback — micro-interactions */
	instant: {
		duration: "50ms",
		delay: "0ms",
		timingFunction: "cubic-bezier(0, 0, 0.2, 1)",
	},
	/** Fast response — hover, focus states */
	fast: {
		duration: "150ms",
		delay: "0ms",
		timingFunction: "cubic-bezier(0, 0, 0.2, 1)",
	},
	/** Normal transitions — most UI changes */
	normal: {
		duration: "250ms",
		delay: "0ms",
		timingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
	},
	/** Smooth transitions — panel slides, modal entrances */
	smooth: {
		duration: "400ms",
		delay: "0ms",
		timingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
	},
	/** Glacial transitions — page-level animations */
	glacial: {
		duration: "700ms",
		delay: "0ms",
		timingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
	},
	/** Spring-feel transitions — playful interactions */
	spring: {
		duration: "300ms",
		delay: "0ms",
		timingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
	},
	/** Bounce transitions — attention-grabbing */
	bounce: {
		duration: "400ms",
		delay: "0ms",
		timingFunction: "cubic-bezier(0.68, -0.55, 0.27, 1.55)",
	},
} as const;
