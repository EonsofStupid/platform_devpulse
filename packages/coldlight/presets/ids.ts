/**
 * @file Preset IDs — canonical preset identifiers
 * @package @devpulse/coldlight
 */

import type { PresetFamily } from "./families.js";

export type PresetVariant = "elevated" | "deep" | "minimal" | "solid" | "glow" | "muted";

export const PRESET_VARIANTS: readonly PresetVariant[] = [
	"elevated",
	"deep",
	"minimal",
	"solid",
	"glow",
	"muted",
] as const;

export type PresetId = `${PresetFamily}-${PresetVariant}`;

export type SemanticIntent =
	| "primary"
	| "secondary"
	| "ghost"
	| "danger"
	| "neutral"
	| "accent"
	| "info"
	| "success"
	| "warning"
	| "default"
	| "glass"
	| "matte"
	| "flat"
	| "stark";

export const SEMANTIC_INTENTS: readonly SemanticIntent[] = [
	"primary",
	"secondary",
	"ghost",
	"danger",
	"neutral",
	"accent",
	"info",
	"success",
	"warning",
	"default",
	"glass",
	"matte",
	"flat",
	"stark",
] as const;

export const VARIANT_LABELS: Record<PresetVariant, string> = {
	elevated: "Elevated",
	deep: "Deep",
	minimal: "Minimal",
	solid: "Solid",
	glow: "Glow",
	muted: "Muted",
} as const;
