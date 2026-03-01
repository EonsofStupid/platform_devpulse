/**
 * @file Animation Tokens — named keyframe animations
 * @module @devpulse/coldlight/tokens/motion/keyframes
 * @layer tokens/tier-1
 *
 * Each key is a @keyframes name. Values are shorthand animation strings.
 * The SD5 pipeline generates both @keyframes definitions and --animate-* vars.
 */

/** Named animation shorthands — reference @keyframes by name */
export const animation = {
	"pulse-glow": "pulse-glow 4s ease-in-out infinite",
	breathe: "cl-breathe 4s ease-in-out infinite",
	shimmer: "cl-shimmer 8s linear infinite",
	drift: "cl-drift 8s ease-in-out infinite",
	pulse: "cl-pulse 3s ease-in-out infinite",
} as const;

/**
 * @keyframes definitions — the actual keyframe rules.
 * SD5 generates these into keyframes.css.
 * Keys = @keyframes name, values = CSS @keyframes body.
 */
export const keyframesDef = {
	"pulse-glow": `
		0%, 100% { opacity: 1; }
		50% { opacity: 0.6; }`,
	"cl-breathe": `
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.85; transform: scale(0.98); }`,
	"cl-shimmer": `
		0% { background-position: -200% 0; }
		100% { background-position: 200% 0; }`,
	"cl-drift": `
		0%, 100% { transform: translateY(0) translateX(0); }
		25% { transform: translateY(-2px) translateX(1px); }
		50% { transform: translateY(-4px) translateX(-1px); }
		75% { transform: translateY(-2px) translateX(2px); }`,
	"cl-pulse": `
		0%, 100% { box-shadow: 0 0 0 0 currentColor; }
		50% { box-shadow: 0 0 12px 4px currentColor; }`,
} as const;
