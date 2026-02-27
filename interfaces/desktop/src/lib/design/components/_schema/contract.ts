/**
 * @file Component Contract — Master Schema & Validation
 * @package @devpulse/coldlight
 *
 * ComponentContractSchema is THE master shape ALL components must satisfy.
 * Builds on PrimitiveContract — validates ARIA compliance at component level.
 * AI agents can introspect these contracts to understand component semantics.
 *
 * Layers:
 * 1. PrimitiveContract (primitives/_schema/) - SSOT for ARIA specs
 * 2. ComponentContract (this file) - Render-time enforcement + AI introspection
 * 3. Transport (adapters) - Actual ARIA attribute providers
 *
 * Reference: W3C WAI-ARIA 1.2 (https://www.w3.org/TR/wai-aria-1.2/)
 * Reference: W3C WAI-ARIA 1.3 Working Draft (https://w3c.github.io/aria/)
 * Reference: WAI-Adapt Content Module (https://w3c.github.io/adapt/)
 * Reference: WCAG 3.0 Working Draft (https://w3c.github.io/wcag3/guidelines/)
 */

import { z } from "zod";
import { FocusStrategySchema, KeyboardKeySchema, StateTokenSchema } from "../../primitives/_schema/schema.js";
import type { PrimitiveContract as PrimitiveContractInterface } from "../../primitives/_schema/types.js";
import type { PrimitiveContract as PrimitiveContractZod } from "../../primitives/_schema/contract.js";
import {
	AccessibleNameSourceSchema,
	AriaAttrValueSchemas,
	AriaVersionSchema,
	ComponentSlotContractSchema,
	LiveRegionContractSchema,
	WaiAdaptContractSchema,
	type ComponentSlotContract,
} from "./schema.js";

// =============================================================================
// COMPONENT CONTRACT — Full component ARIA contract
// =============================================================================

/**
 * Full component contract.
 * Declares complete ARIA semantics for AI introspection and validation.
 */
export const ComponentContractSchema = z.object({
	/** Component kind (e.g., "dialog", "combobox") */
	kind: z.string(),

	/** Human-readable description for AI agents */
	description: z.string(),

	/** W3C WAI-ARIA APG pattern reference URL */
	apgPattern: z.string().url().optional(),

	/** Slots this component provides */
	slots: z.object({
		required: z.array(z.string()).readonly(),
		optional: z.array(z.string()).readonly(),
	}),

	/** Per-slot contracts */
	slotContracts: z.record(z.string(), ComponentSlotContractSchema),

	/** Root accessible name requirement */
	accessibleName: z.object({
		required: z.boolean(),
		sources: z.array(AccessibleNameSourceSchema).readonly(),
		defaultSlot: z.string().optional(), // Slot that provides default label
	}),

	/** Focus management */
	focus: z.object({
		strategy: FocusStrategySchema,
		initialFocus: z.string().optional(), // Slot name
		returnFocus: z.string().optional(), // Slot name to return to on close
		trapContainer: z.string().optional(), // Slot name of focus trap
	}),

	/** Keyboard navigation model */
	keyboard: z.object({
		/** Global keys handled at component level */
		global: z
			.array(
				z.object({
					key: KeyboardKeySchema,
					action: z.string(),
					description: z.string(),
				}),
			)
			.readonly(),
		/** Slot-specific keys are in slotContracts */
	}),

	/** State semantics for AI */
	states: z.object({
		/** Primary state token (e.g., "open" for dialog) */
		primary: StateTokenSchema.optional(),
		/** All state tokens this component uses */
		all: z.array(StateTokenSchema).readonly(),
		/** State → ARIA attribute mappings */
		ariaMapping: z.record(z.string(), z.string()).optional(),
	}),

	/** Interaction semantics for AI */
	interactions: z.object({
		/** Can be opened/closed */
		modal: z.boolean(),
		/** User can select values */
		selectable: z.boolean(),
		/** User can input text */
		editable: z.boolean(),
		/** Component can be expanded/collapsed */
		expandable: z.boolean(),
	}),

	/** Linked primitive contract kind (for validation) */
	primitiveKind: z.string(),

	// =========================================================================
	// ARIA 1.3 — Spec version targeting (Working Draft)
	// https://w3c.github.io/aria/
	// =========================================================================

	/** ARIA spec version this contract targets. @default "1.2" */
	ariaVersion: AriaVersionSchema.optional(),

	/** ARIA 1.3 specific features used by this component */
	aria13: z.object({
		/** New ARIA 1.3 attributes this component uses */
		attributes: z.array(z.string()).readonly().optional(),
		/** New ARIA 1.3 roles this component uses */
		roles: z.array(z.string()).readonly().optional(),
	}).optional(),

	// =========================================================================
	// WAI-ADAPT — Machine-readable semantics for AI/AT
	// https://w3c.github.io/adapt/
	// =========================================================================

	/** WAI-Adapt Content Module semantics for AI agents */
	waiAdapt: WaiAdaptContractSchema.optional(),

	// =========================================================================
	// LIVE REGIONS — Dynamic content announcement config
	// =========================================================================

	/** Live regions for dynamic content announcements */
	liveRegions: z.array(LiveRegionContractSchema).readonly().optional(),
});
export type ComponentContract = z.infer<typeof ComponentContractSchema>;

// =============================================================================
// VALIDATION FUNCTIONS — Component-level ARIA enforcement
// =============================================================================

/**
 * Validate that a component contract is consistent with its primitive contract.
 */
export function validateComponentContract(
	component: ComponentContract,
	primitive: PrimitiveContractInterface | PrimitiveContractZod,
): { valid: boolean; errors: string[] } {
	const errors: string[] = [];

	// 1. Kind must match
	if (component.primitiveKind !== primitive.kind) {
		errors.push(
			`Component references primitive '${component.primitiveKind}' but got '${primitive.kind}'`,
		);
	}

	// 2. Required slots must exist in primitive
	const primitiveSlots = new Set([...primitive.slots.required, ...primitive.slots.optional]);
	for (const slot of component.slots.required) {
		if (!primitiveSlots.has(slot)) {
			errors.push(`Component requires slot '${slot}' not defined in primitive`);
		}
	}

	// 3. Slot ARIA must match primitive slotSpec
	for (const [slotName, slotContract] of Object.entries(component.slotContracts)) {
		const primitiveSlot = primitive.slotSpec[slotName];
		if (!primitiveSlot) {
			errors.push(`Slot '${slotName}' not found in primitive slotSpec`);
			continue;
		}

		// Role must match
		if (slotContract.aria.role !== primitiveSlot.aria.role) {
			errors.push(
				`Slot '${slotName}' role mismatch: component='${slotContract.aria.role}' primitive='${primitiveSlot.aria.role}'`,
			);
		}

		// Required ARIA must include primitive required
		const componentRequired = new Set(slotContract.aria.required.map((r) => r.attr));
		for (const attr of primitiveSlot.aria.required) {
			if (!componentRequired.has(attr)) {
				errors.push(`Slot '${slotName}' missing required ARIA attribute '${attr}' from primitive`);
			}
		}
	}

	// 4. Focus strategy must match
	if (component.focus.strategy !== primitive.focusStrategy) {
		errors.push(
			`Focus strategy mismatch: component='${component.focus.strategy}' primitive='${primitive.focusStrategy}'`,
		);
	}

	return { valid: errors.length === 0, errors };
}

/**
 * Validate slot attributes at runtime.
 * Call this with the actual attributes from transport.slots[slotName].
 */
export function validateSlotAttrs(
	slotContract: ComponentSlotContract,
	attrs: Record<string, unknown>,
): { valid: boolean; errors: string[]; warnings: string[] } {
	const errors: string[] = [];
	const warnings: string[] = [];

	// 1. Check required ARIA attributes
	for (const { attr } of slotContract.aria.required) {
		if (!(attr in attrs)) {
			errors.push(`Missing required ARIA attribute: ${attr}`);
		} else {
			// Validate value type
			const schema = AriaAttrValueSchemas[attr as keyof typeof AriaAttrValueSchemas];
			if (schema) {
				const result = schema.safeParse(attrs[attr]);
				if (!result.success) {
					errors.push(`Invalid value for ${attr}: ${result.error.message}`);
				}
			}
		}
	}

	// 2. Check role
	if (slotContract.aria.role && attrs.role !== slotContract.aria.role) {
		errors.push(`Role mismatch: expected '${slotContract.aria.role}' got '${attrs.role}'`);
	}

	// 3. Check relationship targets (warnings only — can't validate IDs exist at schema level)
	for (const rel of slotContract.aria.relationships ?? []) {
		if (rel.required && !(rel.attr in attrs)) {
			errors.push(`Missing required relationship attribute: ${rel.attr}`);
		}
		if (rel.attr in attrs && !attrs[rel.attr]) {
			warnings.push(`Relationship attribute ${rel.attr} is empty — target ID not set`);
		}
	}

	return { valid: errors.length === 0, errors, warnings };
}

/**
 * Build a ComponentSlotContract from a PrimitiveContract slot.
 * Convenience function to derive component schema from primitive.
 */
export function deriveSlotContract(
	primitive: PrimitiveContractZod,
	slotName: string,
): ComponentSlotContract | null {
	const slotSpec = primitive.slotSpec[slotName];
	if (!slotSpec) return null;

	const slotStates = primitive.slotStates[slotName] ?? [];

	return {
		name: slotName,
		element: slotSpec.element,
		aria: {
			role: slotSpec.aria.role,
			required: slotSpec.aria.required.map((attr) => ({
				attr,
				valueType: attr as string,
			})),
			optional: slotSpec.aria.optional.map((attr) => ({
				attr,
				valueType: attr as string,
			})),
			relationships: (primitive.slotRelationships ?? [])
				.filter((r) => r.sourceSlot === slotName)
				.map((r) => ({
					attr: r.attribute,
					targetSlot: r.targetSlot,
					required: r.required,
				})),
		},
		data: {
			kind: primitive.kind,
			slot: slotName,
			states: slotStates,
		},
		keyboard: (primitive.keyboardMap ?? [])
			.filter((k) => k.focusLocation === slotName)
			.map((k) => ({
				key: k.key,
				action: k.action,
				description: `${k.key} → ${k.action}`,
			})),
	};
}

/**
 * Parse and validate a component contract.
 */
export function parseComponentContract(data: unknown): ComponentContract {
	return ComponentContractSchema.parse(data);
}

/**
 * Safe parse a component contract.
 */
export function safeParseComponentContract(data: unknown) {
	return ComponentContractSchema.safeParse(data);
}
