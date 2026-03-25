/**
 * @file StyleMacro Mappings — Static Token Property Dictionary
 * @package @devpulse/coldlight
 *
 * Maps camelCase TypeScript properties to CSS custom property names
 * and DTCG token categories. Lives in module scope — instantiated ONCE.
 *
 * 11-AXIS VISUAL SYSTEM (each maps to a real DTCG type):
 *
 *   Axis              DTCG $type     CSS Property
 *   ───────────────── ────────────── ────────────────────────────
 *   backgroundColor   color          background-color
 *   backgroundBlur    dimension      backdrop-filter: blur()
 *   shadow            shadow         box-shadow (depth+bevel+glow)
 *   border            border         border (color+width+style)
 *   animation         duration       animation
 *   transition        transition     transition (dur+delay+easing)
 *   typography        typography     font-family/size/weight/spacing/height
 *   gradient          gradient       background-image: linear-gradient()
 *   color             color          color (foreground/text)
 *   borderRadius      dimension      border-radius
 *   opacity           number         opacity
 *
 * All DTCG compliant. All produce SAFE CSS. No UNSAFE escape hatch.
 */

// =============================================================================
// STYLE MACRO PROPS — The type every visual declaration satisfies
// =============================================================================

export interface StyleMacroProps {
	// ── 11 Visual Axes (each = 1 DTCG type) ─────────────────

	/** Surface color. DTCG type: color. */
	backgroundColor: string;
	/** Material clarity/blur. DTCG type: dimension. */
	backgroundBlur: string;
	/** Depth + bevel + glow composed as shadow layers. DTCG type: shadow. */
	shadow: string;
	/** Frame/border treatment. DTCG type: border (color + width + style). */
	border: string;
	/** Ambient motion. DTCG type: duration. */
	animation: string;
	/** User-triggered transitions. DTCG type: transition (duration + delay + timingFunction). */
	transition: string;
	/** Text styling. DTCG type: typography (fontFamily + fontSize + fontWeight + letterSpacing + lineHeight). */
	typography: string;
	/** Gradient fill. DTCG type: gradient (array of color stops). */
	gradient: string;
	/** Foreground/text/icon color. DTCG type: color. */
	color: string;
	/** Corner shape. DTCG type: dimension. */
	borderRadius: string;
	/** Layer transparency. DTCG type: number. */
	opacity: string;
}

// =============================================================================
// TOKEN MAPPING
// =============================================================================

export interface TokenMapping {
	/** The --cl- CSS custom property name. */
	varName: string;
	/** The DTCG $type this axis maps to. */
	dtcgType: string;
	/** Whether this is a composite DTCG type (expands to multiple CSS properties). */
	composite?: boolean;
	/** For composite types: the sub-property CSS var names SD5 expand produces. */
	expandsTo?: Record<string, string>;
}

export const propMappings: Record<keyof StyleMacroProps, TokenMapping> = {
	// ── Simple axes (1 token → 1 CSS property) ──────────────
	backgroundColor: { varName: "--cl-bg", dtcgType: "color" },
	backgroundBlur: { varName: "--cl-blur", dtcgType: "dimension" },
	animation: { varName: "--cl-animation", dtcgType: "duration" },
	color: { varName: "--cl-color", dtcgType: "color" },
	borderRadius: { varName: "--cl-radius", dtcgType: "dimension" },
	opacity: { varName: "--cl-opacity", dtcgType: "number" },

	// ── Composite axes (1 token → multiple CSS properties) ──
	shadow: {
		varName: "--cl-shadow",
		dtcgType: "shadow",
		composite: true,
		expandsTo: {
			color: "--cl-shadow-color",
			offsetX: "--cl-shadow-offset-x",
			offsetY: "--cl-shadow-offset-y",
			blur: "--cl-shadow-blur",
			spread: "--cl-shadow-spread",
		},
	},
	border: {
		varName: "--cl-border",
		dtcgType: "border",
		composite: true,
		expandsTo: {
			color: "--cl-border-color",
			width: "--cl-border-width",
			style: "--cl-border-style",
		},
	},
	transition: {
		varName: "--cl-transition",
		dtcgType: "transition",
		composite: true,
		expandsTo: {
			duration: "--cl-transition-duration",
			delay: "--cl-transition-delay",
			timingFunction: "--cl-transition-easing",
		},
	},
	typography: {
		varName: "--cl-typography",
		dtcgType: "typography",
		composite: true,
		expandsTo: {
			fontFamily: "--cl-font-family",
			fontSize: "--cl-font-size",
			fontWeight: "--cl-font-weight",
			letterSpacing: "--cl-letter-spacing",
			lineHeight: "--cl-line-height",
		},
	},
	gradient: {
		varName: "--cl-gradient",
		dtcgType: "gradient",
		composite: true,
		expandsTo: {
			// Per-stop expansion: --cl-gradient-{index}-color, --cl-gradient-{index}-position
			// Glue CSS assembles into linear-gradient()
		},
	},
};

// Pre-compute keys array for fast iteration
export const macroKeys = Object.keys(propMappings) as Array<keyof StyleMacroProps>;

// All axes are visual axes — the macro only handles visual concerns
export const visualAxisKeys = macroKeys;
