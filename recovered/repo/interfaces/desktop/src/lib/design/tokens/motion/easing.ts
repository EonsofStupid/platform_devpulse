/**
 * @file Easing Tokens — timing functions
 * @module @devpulse/coldlight/tokens/motion/easing
 * @layer tokens/tier-1
 */

export const ease = {
	linear: "linear",
	in: "cubic-bezier(0.4, 0, 1, 1)",
	out: "cubic-bezier(0, 0, 0.2, 1)",
	inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
	spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
	bounce: "cubic-bezier(0.68, -0.55, 0.27, 1.55)",
} as const;
