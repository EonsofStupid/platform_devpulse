/**
 * @file ColdLight SSOT Registry — Public API
 * @module @devpulse/coldlight/registry
 * @layer registry
 */

export {
	TOKEN_CATEGORY_REGISTRY,
	CODE_MAP,
	ENCODING_ORDER,
	CODE_TO_NAME,
	NAME_TO_CODE,
	CategoryDefinitionSchema,
	CategoryValueSchema,
	EncodingStringSchema,
	EncodingIndicesSchema,
	PresetSchema,
	SurfaceIdSchema,
	MaterialIdSchema,
	DepthIdSchema,
	BevelIdSchema,
	GlowIdSchema,
	FrameIdSchema,
	MotionIdSchema,
	TransitionIdSchema,
	categoryValueSchema,
	resolveToIndices,
	resolveToPreset,
	type CategoryDefinition,
	type CategoryValue,
	type EncodingIndices,
	type Preset,
	type SurfaceId,
	type MaterialId,
	type DepthId,
	type BevelId,
	type GlowId,
	type FrameId,
	type MotionId,
	type TransitionId,
} from "./token-categories.js";

export {
	encodePreset,
	decodeEncoding,
	resolvePreset,
	emitEncoding,
	emitSegments,
} from "./encoding.js";
