/**
 * @file PresetId — compound preset identifiers
 * @package @devpulse/coldlight
 *
 * A preset ID is "{family}-{variant}" — e.g., "neuro-elevated", "retro-solid".
 * The VPB uses these as keys to look up preset definitions.
 * SD5 compiles token groups keyed by kind + preset ID.
 */

import type { PresetFamily } from "./preset-families.js";

/** Variant within a family — the intensity/mood modifier */
export type PresetVariant = "elevated" | "deep" | "minimal" | "solid" | "glow" | "muted";

/** Runtime array for VPB variant selector */
export const PRESET_VARIANTS: readonly PresetVariant[] = [
	"elevated",
	"deep",
	"minimal",
	"solid",
	"glow",
	"muted",
] as const;

/** Full preset ID: "{family}-{variant}" */
export type PresetId = `${PresetFamily}-${PresetVariant}`;

/**
 * Semantic intent names — user-facing labels that map to preset IDs.
 * Components accept these as the `preset` prop value.
 * The intent map resolves them to concrete PresetIds.
 */
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

/** Runtime array for VPB intent picker */
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

/** Human-readable variant labels for VPB */
export const VARIANT_LABELS: Record<PresetVariant, string> = {
	elevated: "Elevated",
	deep: "Deep",
	minimal: "Minimal",
	solid: "Solid",
	glow: "Glow",
	muted: "Muted",
} as const;
