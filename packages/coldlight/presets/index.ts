/**
 * @file Presets — canonical preset bounded context
 * @package @devpulse/coldlight
 *
 * This folder is the single public API for preset families, IDs, schema,
 * and catalog queries. Runtime resolvers can depend on it; feature code
 * should not import preset ownership concepts from `design/visual`.
 */

export {
	ALL_PRESETS,
	CHROME_PRESETS,
	FLAT_PRESETS,
	GLASS_PRESETS,
	getPreset,
	getPresetIds,
	getPresetsByFamily,
	getPresetsByVariant,
	NEURO_PRESETS,
	PRESET_LIBRARY,
	RETRO_PRESETS,
	STARK_PRESETS,
} from "./catalog.js";
export type { PresetFamily } from "./families.js";
export { FAMILY_DESCRIPTIONS, FAMILY_LABELS, PRESET_FAMILIES } from "./families.js";
export type { PresetId, PresetVariant, SemanticIntent } from "./ids.js";
export { PRESET_VARIANTS, SEMANTIC_INTENTS, VARIANT_LABELS } from "./ids.js";
export type {
	AnimationValue,
	BackgroundImageValue,
	BorderValue,
	PresetAxes,
	PresetDefinition,
	PresetEntry,
	ShadowLayer,
	StateOverrides,
	TransitionValue,
	TypographyValue,
} from "./schema.js";
