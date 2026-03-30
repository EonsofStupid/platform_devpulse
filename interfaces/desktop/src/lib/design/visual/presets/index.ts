/**
 * @file Central Preset Library — ALL presets, queryable by ID/family/variant
 * @package @devpulse/coldlight
 *
 * The VPB reads this at runtime to populate preset pickers.
 * SD5 reads this at build time to generate token groups.
 * Components never import this directly — they use resolveMacro.
 */

import type { PresetDefinition } from "../preset-definition.js";
import type { PresetFamily } from "../preset-families.js";
import type { PresetId, PresetVariant } from "../preset-id.js";
import { CHROME_PRESETS } from "./chrome.js";
import { FLAT_PRESETS } from "./flat.js";
import { GLASS_PRESETS } from "./glass.js";
// Family imports
import { NEURO_PRESETS } from "./neuro.js";
import { RETRO_PRESETS } from "./retro.js";
import { STARK_PRESETS } from "./stark.js";

// Re-export family arrays
export { CHROME_PRESETS } from "./chrome.js";
export { FLAT_PRESETS } from "./flat.js";
export { GLASS_PRESETS } from "./glass.js";
export { NEURO_PRESETS } from "./neuro.js";
export { RETRO_PRESETS } from "./retro.js";
export { STARK_PRESETS } from "./stark.js";

/** All presets as a flat array — 36 total (6 families × 6 variants) */
export const ALL_PRESETS: readonly PresetDefinition[] = [
	...NEURO_PRESETS,
	...GLASS_PRESETS,
	...RETRO_PRESETS,
	...CHROME_PRESETS,
	...FLAT_PRESETS,
	...STARK_PRESETS,
] as const;

/** Lookup by PresetId — O(1) access for resolveMacro and VPB */
export const PRESET_LIBRARY: ReadonlyMap<PresetId, PresetDefinition> = new Map(
	ALL_PRESETS.map((p) => [p.id, p]),
);

/** Get all presets for a family — VPB family tab content */
export function getPresetsByFamily(family: PresetFamily): readonly PresetDefinition[] {
	return ALL_PRESETS.filter((p) => p.family === family);
}

/** Get a specific preset by ID — returns undefined if not found */
export function getPreset(id: PresetId): PresetDefinition | undefined {
	return PRESET_LIBRARY.get(id);
}

/** Get all available PresetIds — VPB dropdown options */
export function getPresetIds(): readonly PresetId[] {
	return ALL_PRESETS.map((p) => p.id);
}

/** Get presets by variant across all families — compare variants */
export function getPresetsByVariant(variant: PresetVariant): readonly PresetDefinition[] {
	return ALL_PRESETS.filter((p) => p.variant === variant);
}
