/**
 * @file PresetDefinition — the shape of a saved preset
 * @package @devpulse/coldlight
 *
 * A preset is a saved collection of resolved token values across all axes.
 * Created via VPB (sliders, knobs, live preview). Saved to central library.
 * Available to any component of any kind.
 *
 * SD5 compiles these into CSS custom properties.
 * renderForge reads them at runtime via var() chains.
 */

import type { PresetFamily } from "./preset-families.js";
import type { PresetId, PresetVariant } from "./preset-id.js";

/** Shadow layer for multi-layer shadows */
export interface ShadowLayer {
	readonly offsetX: string;
	readonly offsetY: string;
	readonly blur: string;
	readonly spread: string;
	readonly color: string;
	readonly inset?: boolean;
}

/** Border composite */
export interface BorderValue {
	readonly width: string;
	readonly style: "solid" | "dashed" | "dotted" | "double" | "none";
	readonly color: string;
}

/** Typography composite */
export interface TypographyValue {
	readonly fontFamily: string;
	readonly fontSize: string;
	readonly fontWeight: number;
	readonly letterSpacing: string;
	readonly lineHeight: number;
}

/** Transition composite */
export interface TransitionValue {
	readonly duration: string;
	readonly delay: string;
	readonly timingFunction: string;
}

/** Animation definition — keyframe name + duration + easing + iteration */
export interface AnimationValue {
	/** CSS keyframe name (must be defined in motion tokens or global CSS) */
	readonly name: string;
	/** Animation duration */
	readonly duration: string;
	/** Timing function */
	readonly timingFunction: string;
	/** Iteration count — "infinite" for looping, number for finite */
	readonly iterationCount: string;
	/** Fill mode */
	readonly fillMode?: "none" | "forwards" | "backwards" | "both";
}

/** Background image with alpha */
export interface BackgroundImageValue {
	readonly url: string;
	readonly alpha: number;
	readonly blendMode: "normal" | "multiply" | "screen" | "overlay" | "soft-light";
}

/** State-specific overrides — only the axes that change */
export interface StateOverrides {
	readonly backgroundColor?: string;
	readonly shadow?: readonly ShadowLayer[];
	readonly border?: Partial<BorderValue>;
	readonly color?: string;
	readonly opacity?: number;
	readonly gradient?: string;
	readonly animation?: AnimationValue | "none";
	readonly backgroundImage?: BackgroundImageValue;
}

/** The complete preset definition — all axes + states */
export interface PresetAxes {
	readonly backgroundColor: string;
	readonly backgroundBlur: string;
	readonly shadow: readonly ShadowLayer[];
	readonly border: BorderValue;
	readonly animation: AnimationValue | "none";
	readonly transition: TransitionValue;
	readonly typography: TypographyValue;
	readonly gradient: string;
	readonly color: string;
	readonly borderRadius: string;
	readonly opacity: number;
	readonly backgroundImage?: BackgroundImageValue;
}

/** A named, saved preset — the unit of the central library */
export interface PresetDefinition {
	/** Compound ID: "{family}-{variant}" */
	readonly id: PresetId;
	/** Which family this belongs to */
	readonly family: PresetFamily;
	/** Which variant within the family */
	readonly variant: PresetVariant;
	/** Human-readable label for VPB */
	readonly label: string;
	/** One-line description */
	readonly description: string;
	/** The default state axes */
	readonly axes: PresetAxes;
	/** State-specific overrides */
	readonly states?: {
		readonly hover?: StateOverrides;
		readonly active?: StateOverrides;
		readonly focus?: StateOverrides;
		readonly disabled?: StateOverrides;
	};
}
