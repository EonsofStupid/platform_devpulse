/**
 * @file ColdLight Visual System — Public API
 * @package @devpulse/coldlight
 *
 * Central typed registry for the entire visual system.
 * The VPB imports from here to enumerate kinds, families, presets, sizes, axes.
 * Components import PresetId and SemanticIntent for their preset prop types.
 */

// Visual axes
export type { AxisControl, VisualAxis } from "./axes.js";
export { AXIS_CONTROLS, AXIS_DTCG_TYPE, AXIS_LABELS, VISUAL_AXES } from "./axes.js";
// Intent resolution
export { INTENT_MAP, resolvePresetId } from "./intent-map.js";
// Kind registry
export type { KindName } from "./kind-names.js";
export { KIND_NAMES } from "./kind-names.js";
// Preset definitions
export type {
	BackgroundImageValue,
	BorderValue,
	PresetAxes,
	PresetDefinition,
	ShadowLayer,
	TransitionValue,
	TypographyValue,
} from "./preset-definition.js";
// Preset families
export type { PresetFamily } from "./preset-families.js";
export { FAMILY_DESCRIPTIONS, FAMILY_LABELS, PRESET_FAMILIES } from "./preset-families.js";
// Preset identifiers
export type { PresetId, PresetVariant, SemanticIntent } from "./preset-id.js";
export { PRESET_VARIANTS, SEMANTIC_INTENTS, VARIANT_LABELS } from "./preset-id.js";
// Sizes
export type { SizeName } from "./sizes.js";
export { SIZE_LABELS, SIZE_NAMES } from "./sizes.js";
