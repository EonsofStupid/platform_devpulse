/**
 * @file ColdLight SSOT Registry — Public API
 * @module @devpulse/coldlight/registry
 * @layer registry
 */

export {
	TOKEN_CATEGORY_REGISTRY,
	CODE_MAP,
	ENCODING_ORDER,
	CategoryDefinitionSchema,
	CategoryValueSchema,
	EncodingStringSchema,
	PresetSchema,
	categoryValueSchema,
	type CategoryDefinition,
	type CategoryValue,
	type Preset,
} from "./token-categories.js";

export {
	encodePreset,
	decodeEncoding,
	resolvePreset,
	emitEncoding,
	emitSegments,
} from "./encoding.js";
