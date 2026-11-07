/**
 * @file Primitive Contract — Zod Schema
 * @package @devpulse/coldlight
 *
 * Zod schema version of PrimitiveContract for runtime validation.
 * Component contracts validate against this.
 */

import { z } from "zod";
import {
	AriaAttributeSchema,
	AriaRoleSchema,
	FocusStrategySchema,
	KeyboardKeySchema,
	StateTokenSchema,
} from "./schema.js";

export const PrimitiveSlotSpecSchema = z.object({
	element: z.string(),
	aria: z.object({
		role: AriaRoleSchema.optional(),
		required: z.array(AriaAttributeSchema),
		optional: z.array(AriaAttributeSchema),
	}),
});

export const PrimitiveContractSchema = z.object({
	kind: z.string(),

	slots: z.object({
		required: z.array(z.string()).readonly(),
		optional: z.array(z.string()).readonly(),
	}),

	slotSpec: z.record(z.string(), PrimitiveSlotSpecSchema),

	slotStates: z.record(z.string(), z.array(StateTokenSchema).readonly()),

	focusStrategy: FocusStrategySchema,

	keyboardMap: z
		.array(
			z.object({
				key: KeyboardKeySchema,
				action: z.string(),
				focusLocation: z.string(),
			}),
		)
		.readonly()
		.optional(),

	slotRelationships: z
		.array(
			z.object({
				sourceSlot: z.string(),
				targetSlot: z.string(),
				attribute: AriaAttributeSchema,
				required: z.boolean(),
			}),
		)
		.readonly()
		.optional(),
});

export type PrimitiveContract = z.infer<typeof PrimitiveContractSchema>;
