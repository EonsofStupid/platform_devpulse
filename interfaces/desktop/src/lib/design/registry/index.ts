/**
 * @file ColdLight SSOT Registry — Public API
 * @module @devpulse/coldlight/registry
 * @layer registry
 */

export {
	decodeEncoding,
	emitEncoding,
	emitSegments,
	encodePreset,
	resolvePreset,
} from "./encoding.js";
export {
	getAllPresets,
	getPreset,
	getPresetKinds,
	getPresetsForKind,
	getPresetValues,
	type PresetDefinition,
} from "./presets.js";

export {
	type ColdLightProps,
	ColdLightPropsSchema,
	type ResolvedVisual,
	resolveClasses,
	resolveVisual,
} from "./resolve-visual.js";
export {
	type BevelId,
	BevelIdSchema,
	type CategoryDefinition,
	CategoryDefinitionSchema,
	type CategoryValue,
	CategoryValueSchema,
	CODE_MAP,
	CODE_TO_NAME,
	categoryValueSchema,
	type DepthId,
	DepthIdSchema,
	ENCODING_ORDER,
	type EncodingIndices,
	EncodingIndicesSchema,
	EncodingStringSchema,
	type FrameId,
	FrameIdSchema,
	type GlowId,
	GlowIdSchema,
	IdSchemaMap,
	type MaterialId,
	MaterialIdSchema,
	type MotionId,
	MotionIdSchema,
	NAME_TO_CODE,
	type Preset,
	PresetSchema,
	resolveToIndices,
	resolveToPreset,
	type SurfaceId,
	SurfaceIdSchema,
	TOKEN_CATEGORY_REGISTRY,
	type TransitionId,
	TransitionIdSchema,
} from "./token-categories.js";
