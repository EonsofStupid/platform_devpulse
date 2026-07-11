/**
 * @file Intent Map — typed semantic intent → preset ID resolution
 * @package @devpulse/coldlight
 *
 * Components accept `preset` as SemanticIntent | PresetId.
 * This map resolves semantic names to concrete preset IDs.
 * The VPB can override this mapping per-app or per-domain.
 */

import type { PresetId, SemanticIntent } from "./preset-id.js";

/** Default intent → preset mapping. Overridable per domain. */
export const INTENT_MAP: Record<SemanticIntent, PresetId> = {
	primary: "glass-deep",
	secondary: "neuro-minimal",
	ghost: "flat-minimal",
	danger: "stark-glow",
	// `error` = alias of danger — consumers pass variant strings verbatim
	// (Alert passes "error"); without the alias they silently fell back to
	// neuro-elevated instead of the danger skin.
	error: "stark-glow",
	neutral: "neuro-muted",
	accent: "chrome-glow",
	info: "glass-minimal",
	success: "neuro-elevated",
	warning: "stark-elevated",
	default: "neuro-elevated",
	glass: "glass-deep",
	matte: "neuro-solid",
	flat: "flat-minimal",
	// High-contrast structural intent — NOT the danger skin. stark-glow
	// (red glow) is reachable only via `danger`/`error` or an explicit
	// compound id; the wizard's inner panel wearing red was this mapping.
	stark: "stark-elevated",
} as const;

/**
 * Resolve a preset string to a concrete PresetId.
 * If it's already a PresetId (contains "-"), pass through.
 * If it's a SemanticIntent, look up in INTENT_MAP.
 * Unknown values fall back to "neuro-elevated".
 */
export function resolvePresetId(preset: string): PresetId {
	// Already a compound ID (family-variant)
	if (preset.includes("-") && !["primary", "secondary"].includes(preset)) {
		return preset as PresetId;
	}
	// Semantic intent lookup
	return INTENT_MAP[preset as SemanticIntent] ?? ("neuro-elevated" as PresetId);
}
