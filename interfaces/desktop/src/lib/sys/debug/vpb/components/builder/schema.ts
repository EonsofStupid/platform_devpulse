/**
 * @file src/lib/sys/debug/vpb/components/builder/schema.ts
 * @description What VPB adds to ColdLight's BlockNode schema.
 *
 * BlockNode is the core data structure that VPB manipulates. It references
 * taxonomy kinds, validated props, and recipe IDs. NO styling, NO CSS, NO
 * color values - just structure.
 *
 * ColdLight's `blocks/schema.ts` owns the node's type and its ArkType schema
 * (zod is gone). This file keeps what that one lacks: the factory that seeds a
 * kind's slots, and validation of slot names and child kinds.
 *
 * @since 1.0.0
 */

import {
	type BlockNode,
	type BlockNodeMeta,
	BlockNodeSchema,
	createBlockNode,
} from "@devpulse/coldlight/blocks";
import { type } from "arktype";
import { getKindSlots, isChildAllowed } from "../../registry/vpb-kinds.js";

// ===========================================
// VALIDATION FUNCTIONS
// ===========================================

/**
 * Validation result with detailed errors.
 */
export interface ValidationResult<T> {
	success: boolean;
	data?: T;
	errors?: Array<{
		path: string;
		message: string;
		code: string;
	}>;
}

/**
 * Validate a BlockNode against the schema, its kind's slots and their child kinds.
 */
export function validateBlockNode(node: BlockNode): ValidationResult<BlockNode> {
	const errors: NonNullable<ValidationResult<BlockNode>["errors"]> = [];

	// 1. Validate the node's shape against ColdLight's schema
	const shape = BlockNodeSchema(node);
	if (shape instanceof type.errors) {
		for (const issue of shape) {
			errors.push({
				path: issue.path.join("."),
				message: issue.message,
				code: "INVALID_NODE",
			});
		}
		return { success: false, errors };
	}

	// 2. Validate slot names are allowed for this kind
	const allowedSlots = getKindSlots(node.kind);
	for (const slotName of Object.keys(node.slots ?? {})) {
		if (!allowedSlots.includes(slotName)) {
			errors.push({
				path: `slots.${slotName}`,
				message: `Slot "${slotName}" is not allowed for kind "${node.kind}". Allowed: ${allowedSlots.join(", ")}`,
				code: "INVALID_SLOT",
			});
		}
	}

	// 3. Validate child kinds in each slot
	for (const [slotName, children] of Object.entries(node.slots ?? {})) {
		children.forEach((child, i) => {
			if (!isChildAllowed(node.kind, slotName, child.kind)) {
				errors.push({
					path: `slots.${slotName}[${i}]`,
					message: `Child kind "${child.kind}" is not allowed in slot "${slotName}" of "${node.kind}"`,
					code: "INVALID_CHILD",
				});
			}
		});
	}

	return errors.length > 0 ? { success: false, errors } : { success: true, data: node };
}

/**
 * Validate an entire block tree recursively.
 */
export function validateBlockTree(tree: BlockNode[]): ValidationResult<BlockNode[]> {
	const allErrors: NonNullable<ValidationResult<BlockNode[]>["errors"]> = [];

	function validateRecursive(nodes: BlockNode[], pathPrefix: string) {
		nodes.forEach((node, i) => {
			const nodePath = `${pathPrefix}[${i}]`;
			const result = validateBlockNode(node);
			for (const err of result.errors ?? []) {
				allErrors.push({ ...err, path: `${nodePath}.${err.path}` });
			}
			// Recurse into slots
			for (const [slotName, children] of Object.entries(node.slots ?? {})) {
				validateRecursive(children, `${nodePath}.slots.${slotName}`);
			}
		});
	}

	validateRecursive(tree, "root");

	return allErrors.length > 0
		? { success: false, errors: allErrors }
		: { success: true, data: tree };
}

// ===========================================
// FACTORY FUNCTIONS
// ===========================================

/**
 * Generate a unique block ID, as ColdLight's factory writes them.
 */
export function generateBlockId(): string {
	return `blk-${crypto.randomUUID()}`;
}

/**
 * Block creation options.
 */
export interface CreateBlockOptions {
	/** Recipe ID (falls back to `{kind}-default`) */
	recipe?: string;
	/** Props to merge with defaults */
	props?: BlockNode["props"];
	/** Pre-populated slots */
	slots?: Record<string, BlockNode[]>;
	/** Data bindings */
	binds?: Record<string, string>;
	/** Editor metadata */
	meta?: BlockNodeMeta;
}

/**
 * Create a BlockNode.
 *
 * Single factory function - handles defaults automatically. If recipe not
 * specified, uses `{kind}-default`. A kind's slots start empty.
 */
export function createBlock(kind: string, options?: CreateBlockOptions): BlockNode {
	// Initialize empty slots for this kind
	const slots: Record<string, BlockNode[]> = {};
	for (const slot of getKindSlots(kind)) {
		slots[slot] = [];
	}

	return {
		...createBlockNode(kind, options?.recipe),
		props: { ...(options?.props ?? {}) },
		slots: { ...slots, ...(options?.slots ?? {}) },
		// The schema's optional keys refuse an explicit undefined.
		...(options?.binds ? { binds: options.binds } : {}),
		...(options?.meta ? { meta: options.meta } : {}),
	};
}

// ===========================================
// TYPE HELPERS
// ===========================================

/**
 * Check if a node is a specific kind.
 */
export function isBlockKind(node: BlockNode, kind: string): boolean {
	return node.kind === kind;
}
