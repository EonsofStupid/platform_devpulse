/**
 * @file Preset Schema — canonical preset data contract
 * @package @devpulse/coldlight
 */

import type { PresetFamily } from "./families.js";
import type { PresetId, PresetVariant } from "./ids.js";

export interface ShadowLayer {
	readonly offsetX: string;
	readonly offsetY: string;
	readonly blur: string;
	readonly spread: string;
	readonly color: string;
	readonly inset?: boolean;
}

export interface BorderValue {
	readonly width: string;
	readonly style: "solid" | "dashed" | "dotted" | "double" | "none";
	readonly color: string;
}

export interface TypographyValue {
	readonly fontFamily: string;
	readonly fontSize: string;
	readonly fontWeight: number;
	readonly letterSpacing: string;
	readonly lineHeight: number;
}

export interface TransitionValue {
	readonly duration: string;
	readonly delay: string;
	readonly timingFunction: string;
}

export interface AnimationValue {
	readonly name: string;
	readonly duration: string;
	readonly timingFunction: string;
	readonly iterationCount: string;
	readonly fillMode?: "none" | "forwards" | "backwards" | "both";
}

export interface BackgroundImageValue {
	readonly url: string;
	readonly alpha: number;
	readonly blendMode: "normal" | "multiply" | "screen" | "overlay" | "soft-light";
}

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

export interface PresetDefinition {
	readonly id: PresetId;
	readonly family: PresetFamily;
	readonly variant: PresetVariant;
	readonly label: string;
	readonly description: string;
	readonly axes: PresetAxes;
	readonly states?: {
		readonly hover?: StateOverrides;
		readonly active?: StateOverrides;
		readonly focus?: StateOverrides;
		readonly disabled?: StateOverrides;
	};
}
