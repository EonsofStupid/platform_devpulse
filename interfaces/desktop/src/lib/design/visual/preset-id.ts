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
export type CorePresetVariant = "elevated" | "deep" | "minimal" | "solid" | "glow" | "muted";

/** Chat golden-pattern variants (family is always `chat`) */
export type ChatPresetVariant =
	| "bubble-user"
	| "bubble-ai-developer"
	| "bubble-ai-planning"
	| "bubble-ai-image"
	| "bubble-ai-general"
	| "bubble-system"
	| "mode-pill-active"
	| "mode-pill-idle"
	| "decision-card"
	| "voice-orb-idle"
	| "voice-orb-listening"
	| "cortex-node"
	| "session-row-active"
	| "frame-shell";

/** Union of all preset variant segments */
export type PresetVariant = CorePresetVariant | ChatPresetVariant;

/** Runtime array for VPB variant selector (core families only) */
export const PRESET_VARIANTS: readonly CorePresetVariant[] = [
	"elevated",
	"deep",
	"minimal",
	"solid",
	"glow",
	"muted",
] as const;

/** Full preset ID: "{family}-{variant}" */
export type PresetId =
	| `${Exclude<PresetFamily, "chat">}-${CorePresetVariant}`
	| `chat-${ChatPresetVariant}`;

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
	| "error"
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
	"error",
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

/** Human-readable variant labels for VPB (core variants; chat uses preset labels) */
export const VARIANT_LABELS: Record<CorePresetVariant, string> = {
	elevated: "Elevated",
	deep: "Deep",
	minimal: "Minimal",
	solid: "Solid",
	glow: "Glow",
	muted: "Muted",
} as const;
