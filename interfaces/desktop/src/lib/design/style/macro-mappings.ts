/**
 * @file StyleMacro Mappings — Static Token Property Dictionary
 * @package @devpulse/coldlight
 *
 * Maps camelCase TypeScript properties to CSS custom property names
 * and DTCG token categories. Lives in module scope — instantiated ONCE.
 *
 * 6-AXIS VISUAL SYSTEM:
 *   backgroundColor — color — background-color
 *   backgroundBlur  — dimension — backdrop-filter: blur()
 *   shadow          — shadow (array) — box-shadow (depth + bevel + glow composed)
 *   border          — border — border
 *   animation       — duration — animation
 *   transition      — transition — transition
 *
 * Plus structural layout props (spacing, sizing, typography, z-index).
 * All DTCG compliant. All produce SAFE CSS. No UNSAFE escape hatch.
 */

// =============================================================================
// STYLE MACRO PROPS — The type every visual declaration satisfies
// =============================================================================

export interface StyleMacroProps {
	// ── 6 Visual Axes (DTCG composite token values) ─────────────
	/** Surface color/gradient. DTCG type: color. */
	backgroundColor: string;
	/** Material clarity/blur. DTCG type: dimension. */
	backgroundBlur: string;
	/** Depth + bevel + glow composed as shadow layers. DTCG type: shadow. */
	shadow: string;
	/** Frame/border treatment. DTCG type: border. */
	border: string;
	/** Ambient motion. DTCG type: duration. */
	animation: string;
	/** User-triggered transitions. DTCG type: transition. */
	transition: string;

	// ── Text / Color ────────────────────────────────────────────
	/** Text color. */
	color: string;
	/** Accent color (links, focus rings, interactive). */
	accentColor: string;

	// ── Spacing ─────────────────────────────────────────────────
	padding: string;
	paddingX: string;
	paddingY: string;
	gap: string;
	margin: string;

	// ── Sizing ──────────────────────────────────────────────────
	width: string;
	height: string;
	minWidth: string;
	minHeight: string;
	maxWidth: string;

	// ── Border Radius ───────────────────────────────────────────
	borderRadius: string;

	// ── Typography ──────────────────────────────────────────────
	fontSize: string;
	fontWeight: string;
	fontFamily: string;
	lineHeight: string;
	letterSpacing: string;
	textAlign: string;

	// ── Layout ──────────────────────────────────────────────────
	display: string;
	flexDirection: string;
	alignItems: string;
	justifyContent: string;
	overflow: string;

	// ── Opacity ─────────────────────────────────────────────────
	opacity: string;

	// ── Z-Index ─────────────────────────────────────────────────
	zIndex: string;
}

// =============================================================================
// TOKEN MAPPING
// =============================================================================

export interface TokenMapping {
	/** The --cl- CSS custom property name. */
	varName: string;
	/** The DTCG token category for var() resolution. */
	category: string;
	/** Whether this is one of the 6 visual axes. */
	visualAxis?: boolean;
}

export const propMappings: Record<keyof StyleMacroProps, TokenMapping> = {
	// ── 6 Visual Axes ───────────────────────────────────────────
	backgroundColor: { varName: "--cl-bg", category: "color", visualAxis: true },
	backgroundBlur: { varName: "--cl-blur", category: "blur", visualAxis: true },
	shadow: { varName: "--cl-shadow", category: "shadow", visualAxis: true },
	border: { varName: "--cl-border", category: "border", visualAxis: true },
	animation: { varName: "--cl-animation", category: "animation", visualAxis: true },
	transition: { varName: "--cl-transition", category: "transition", visualAxis: true },

	// ── Text / Color ────────────────────────────────────────────
	color: { varName: "--cl-text", category: "color" },
	accentColor: { varName: "--cl-accent", category: "color" },

	// ── Spacing ─────────────────────────────────────────────────
	padding: { varName: "--cl-p", category: "spacing" },
	paddingX: { varName: "--cl-px", category: "spacing" },
	paddingY: { varName: "--cl-py", category: "spacing" },
	gap: { varName: "--cl-gap", category: "spacing" },
	margin: { varName: "--cl-m", category: "spacing" },

	// ── Sizing ──────────────────────────────────────────────────
	width: { varName: "--cl-w", category: "size" },
	height: { varName: "--cl-h", category: "size" },
	minWidth: { varName: "--cl-min-w", category: "size" },
	minHeight: { varName: "--cl-min-h", category: "size" },
	maxWidth: { varName: "--cl-max-w", category: "size" },

	// ── Border Radius ───────────────────────────────────────────
	borderRadius: { varName: "--cl-radius", category: "radius" },

	// ── Typography ──────────────────────────────────────────────
	fontSize: { varName: "--cl-text-size", category: "text" },
	fontWeight: { varName: "--cl-font-weight", category: "font-weight" },
	fontFamily: { varName: "--cl-font", category: "font" },
	lineHeight: { varName: "--cl-leading", category: "leading" },
	letterSpacing: { varName: "--cl-tracking", category: "tracking" },
	textAlign: { varName: "--cl-text-align", category: "text-align" },

	// ── Layout ──────────────────────────────────────────────────
	display: { varName: "--cl-display", category: "display" },
	flexDirection: { varName: "--cl-flex-dir", category: "flex" },
	alignItems: { varName: "--cl-align", category: "align" },
	justifyContent: { varName: "--cl-justify", category: "justify" },
	overflow: { varName: "--cl-overflow", category: "overflow" },

	// ── Opacity ─────────────────────────────────────────────────
	opacity: { varName: "--cl-opacity", category: "opacity" },

	// ── Z-Index ─────────────────────────────────────────────────
	zIndex: { varName: "--cl-z", category: "z" },
};

// Pre-compute keys array for fast iteration
export const macroKeys = Object.keys(propMappings) as Array<keyof StyleMacroProps>;

// Pre-compute visual axis keys for encoding serialization
export const visualAxisKeys = macroKeys.filter(
	(key) => propMappings[key].visualAxis,
);
