/**
 * @file Preset Catalog — canonical preset library API
 * @package @devpulse/coldlight
 *
 * `design/presets` is the public owner of preset schema, families, IDs,
 * and query helpers. Family-authored definitions are still sourced from
 * the existing visual library modules while the runtime layer is reduced
 * to resolution concerns.
 */

// `PresetDefinition` is sourced from `visual/preset-definition.ts` (the
// same module the value preset modules below are typed against). The
// parallel definition under `./schema.ts` is structurally identical
// but is its own nominal-ish identity in TS once its supporting types
// (PresetFamily/PresetId/PresetVariant from `./families.js` / `./ids.js`)
// don't match the visual side's `./preset-families.js` / `./preset-id.js`
// counterparts. Pinning the type import here to the visual source aligns
// the assignment in `ALL_PRESETS` below with what the spread value
// modules actually export.
import type { PresetDefinition } from "../visual/preset-definition.js";
import type { PresetFamily } from "../visual/preset-families.js";
import type { PresetId, PresetVariant } from "../visual/preset-id.js";
import { CHROME_PRESETS } from "../visual/presets/chrome.js";
import { FLAT_PRESETS } from "../visual/presets/flat.js";
import { GLASS_PRESETS } from "../visual/presets/glass.js";
import { NEURO_PRESETS } from "../visual/presets/neuro.js";
import { RETRO_PRESETS } from "../visual/presets/retro.js";
import { STARK_PRESETS } from "../visual/presets/stark.js";

export { CHROME_PRESETS } from "../visual/presets/chrome.js";
export { FLAT_PRESETS } from "../visual/presets/flat.js";
export { GLASS_PRESETS } from "../visual/presets/glass.js";
export { NEURO_PRESETS } from "../visual/presets/neuro.js";
export { RETRO_PRESETS } from "../visual/presets/retro.js";
export { STARK_PRESETS } from "../visual/presets/stark.js";

export const ALL_PRESETS: readonly PresetDefinition[] = [
	...NEURO_PRESETS,
	...GLASS_PRESETS,
	...RETRO_PRESETS,
	...CHROME_PRESETS,
	...FLAT_PRESETS,
	...STARK_PRESETS,
] as const;

export const PRESET_LIBRARY: ReadonlyMap<PresetId, PresetDefinition> = new Map(
	ALL_PRESETS.map((preset) => [preset.id, preset]),
);

export function getPresetsByFamily(family: PresetFamily): readonly PresetDefinition[] {
	return ALL_PRESETS.filter((preset) => preset.family === family);
}

export function getPreset(id: PresetId): PresetDefinition | undefined {
	return PRESET_LIBRARY.get(id);
}

export function getPresetIds(): readonly PresetId[] {
	return ALL_PRESETS.map((preset) => preset.id);
}

export function getPresetsByVariant(variant: PresetVariant): readonly PresetDefinition[] {
	return ALL_PRESETS.filter((preset) => preset.variant === variant);
}
