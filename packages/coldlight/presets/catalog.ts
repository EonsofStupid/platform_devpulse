/**
 * @file Preset Catalog — canonical preset library API
 * @package @devpulse/coldlight
 *
 * `presets/` is the public owner of preset schema, families, IDs and query
 * helpers. The catalog is generated from the one preset source, the DTCG
 * family files `tokens/src/presets/*.tokens.json` (plan 0006 0s.2), so it
 * lists every preset there — chat included — and nothing else.
 *
 * The family value arrays re-exported below are the TS copy of those
 * presets; plan 0006 0s.7 retires them once nothing reads them.
 */

import type { PresetFamily } from "./families.js";
import { PRESET_ENTRIES } from "./generated/catalog.js";
import type { PresetEntry } from "./schema.js";

export { CHROME_PRESETS } from "../visual/presets/chrome.js";
export { FLAT_PRESETS } from "../visual/presets/flat.js";
export { GLASS_PRESETS } from "../visual/presets/glass.js";
export { NEURO_PRESETS } from "../visual/presets/neuro.js";
export { RETRO_PRESETS } from "../visual/presets/retro.js";
export { STARK_PRESETS } from "../visual/presets/stark.js";

/** Every preset, in the order the family files list them. */
export const ALL_PRESETS: readonly PresetEntry[] = PRESET_ENTRIES;

export const PRESET_LIBRARY: ReadonlyMap<string, PresetEntry> = new Map(
	ALL_PRESETS.map((preset) => [preset.id, preset]),
);

export function getPresetsByFamily(family: PresetFamily): readonly PresetEntry[] {
	return ALL_PRESETS.filter((preset) => preset.family === family);
}

export function getPreset(id: string): PresetEntry | undefined {
	return PRESET_LIBRARY.get(id);
}

export function getPresetIds(): readonly string[] {
	return ALL_PRESETS.map((preset) => preset.id);
}

export function getPresetsByVariant(variant: string): readonly PresetEntry[] {
	return ALL_PRESETS.filter((preset) => preset.variant === variant);
}
