// Schema exports (Zod schemas + derived types)
export {
	AriaAttributeSchema,
	AriaRoleSchema,
	FocusStrategySchema,
	KeyboardKeySchema,
	StateTokenSchema,
} from "./schema.js";
export type {
	AriaAttribute,
	AriaRole,
	KeyboardKey,
	StateToken,
} from "./schema.js";

// Contract exports (Zod schema for runtime validation)
export { PrimitiveContractSchema } from "./contract.js";
export type { PrimitiveContract as PrimitiveContractZod } from "./contract.js";

// Type exports (interfaces + union types)
export type {
	AriaRequirements,
	AriaStateProvider,
	DismissBehavior,
	DsAdapterId,
	FocusStrategy,
	Orientation,
	PrimitiveContract,
	ScanErrorCode,
	SlotAction,
	SlotSpec,
} from "./types.js";
