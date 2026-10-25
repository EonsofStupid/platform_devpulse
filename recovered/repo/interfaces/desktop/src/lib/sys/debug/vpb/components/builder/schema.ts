/**
 * @file src/lib/sys/debug/vpb/components/builder/schema.ts
 * @description Strictly typed BlockNode schema for VPB.
 *
 * BlockNode<K> is the core data structure that VPB manipulates.
 * It references taxonomy kinds, validated props, and recipe IDs.
 * NO styling, NO CSS, NO color values - just structure.
 *
 * @since 1.0.0
 */

import { z } from "zod";
import {
	type BlockKind,
	blockKindKeys,
	getKindDefinition,
	getKindSchema,
	getKindSlots,
	isChildAllowed,
	type KindContract,
	type kindContracts,
} from "$lib/design/taxonomy/vpb";

// ===========================================
// BLOCK NODE SCHEMA
// ===========================================

/**
 * Editor metadata (not persisted to DB, transient state).
 */
export interface BlockMetadata {
	/** Canvas X position */
	x?: number;
	/** Canvas Y position */
	y?: number;
	/** Currently selected in editor */
	selected?: boolean;
	/** Locked from editing */
	locked?: boolean;
	/** Collapsed in tree view */
	collapsed?: boolean;
}

/**
 * BlockNode<K> - Strictly typed block representation.
 *
 * @template K - The block kind (constrained to BlockKind)
 *
 * @example
 * ```typescript
 * const panelBlock: BlockNode<"panel"> = {
 *   id: "panel-1",
 *   kind: "panel",
 *   recipe: "panel.glass.default",
 *   props: { panel: { padding: "md" } },
 *   slots: { body: [] },
 * };
 * ```
 */
export interface BlockNode<K extends BlockKind = BlockKind> {
	/** Unique identifier */
	id: string;

	/** Block kind from taxonomy (e.g., "panel", "appShell", "chatDock") */
	kind: K;

	/** Recipe ID from recipe registry (e.g., "panel.glass.default") */
	recipe: string;

	/**
	 * Props validated against kindContracts[K].
	 * Uses z.infer<typeof kindContracts[K]> at runtime.
	 */
	props: K extends KindContract ? z.infer<(typeof kindContracts)[K]> : unknown;

	/**
	 * Children organized by slot name.
	 * Slot names are constrained by getKindSlots(kind).
	 */
	slots?: Partial<Record<string, BlockNode[]>>;

	/**
	 * Data bindings for dynamic content.
	 * Maps slot/prop paths to data source refs.
	 */
	binds?: Record<string, string>;

	/** Transient editor metadata (not persisted) */
	meta?: BlockMetadata;
}

// ===========================================
// BLOCK NODE ZOD SCHEMA (Runtime Validation)
// ===========================================

/**
 * Zod schema for BlockMetadata.
 */
export const BlockMetadataSchema = z.object({
	x: z.number().optional(),
	y: z.number().optional(),
	selected: z.boolean().optional(),
	locked: z.boolean().optional(),
	collapsed: z.boolean().optional(),
});

/**
 * Base Zod schema for BlockNode (kind-agnostic).
 * For kind-specific validation, use validateBlockNode().
 */
export const BlockNodeSchema: z.ZodType<BlockNode> = z.lazy(() =>
	z.object({
		id: z.string().min(1),
		kind: z.enum(blockKindKeys as [BlockKind, ...BlockKind[]]),
		recipe: z.string().min(1),
		props: z.record(z.string(), z.unknown()),
		slots: z.record(z.string(), z.array(BlockNodeSchema)).optional(),
		binds: z.record(z.string(), z.string()).optional(),
		meta: BlockMetadataSchema.optional(),
	}),
);

/**
 * Schema for an array of BlockNodes (tree structure).
 */
export const BlockTreeSchema = z.array(BlockNodeSchema);

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
 * Validate a BlockNode against its kind's contract.
 */
export function validateBlockNode<K extends BlockKind>(
	node: BlockNode<K>,
): ValidationResult<BlockNode<K>> {
	const errors: ValidationResult<BlockNode<K>>["errors"] = [];

	// 1. Validate kind exists
	if (!blockKindKeys.includes(node.kind)) {
		errors.push({
			path: "kind",
			message: `Unknown block kind: ${node.kind}`,
			code: "UNKNOWN_KIND",
		});
		return { success: false, errors };
	}

	// 2. Validate props against kind contract
	const kindSchema = getKindSchema(node.kind as KindContract);
	if (kindSchema) {
		const propsResult = kindSchema.safeParse(node.props);
		if (!propsResult.success) {
			propsResult.error.issues.forEach((issue) => {
				errors.push({
					path: `props.${issue.path.join(".")}`,
					message: issue.message,
					code: "INVALID_PROP",
				});
			});
		}
	}

	// 3. Validate slot names are allowed for this kind
	const allowedSlots = getKindSlots(node.kind);
	if (node.slots) {
		for (const slotName of Object.keys(node.slots)) {
			if (!allowedSlots.includes(slotName)) {
				errors.push({
					path: `slots.${slotName}`,
					message: `Slot "${slotName}" is not allowed for kind "${node.kind}". Allowed: ${allowedSlots.join(", ")}`,
					code: "INVALID_SLOT",
				});
			}
		}
	}

	// 4. Validate child kinds in each slot
	if (node.slots) {
		for (const [slotName, children] of Object.entries(node.slots)) {
			if (!children) continue;
			for (let i = 0; i < children.length; i++) {
				const child = children[i];
				if (!isChildAllowed(node.kind, slotName, child.kind)) {
					errors.push({
						path: `slots.${slotName}[${i}]`,
						message: `Child kind "${child.kind}" is not allowed in slot "${slotName}" of "${node.kind}"`,
						code: "INVALID_CHILD",
					});
				}
			}
		}
	}

	if (errors.length > 0) {
		return { success: false, errors };
	}

	return { success: true, data: node };
}

/**
 * Validate an entire block tree recursively.
 */
export function validateBlockTree(tree: BlockNode[]): ValidationResult<BlockNode[]> {
	const allErrors: ValidationResult<BlockNode>["errors"] = [];

	function validateRecursive(nodes: BlockNode[], pathPrefix: string) {
		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i];
			const nodePath = `${pathPrefix}[${i}]`;

			const result = validateBlockNode(node);
			if (!result.success && result.errors) {
				result.errors.forEach((err) => {
					allErrors?.push({
						...err,
						path: `${nodePath}.${err.path}`,
					});
				});
			}

			// Recurse into slots
			if (node.slots) {
				for (const [slotName, children] of Object.entries(node.slots)) {
					if (children) {
						validateRecursive(children, `${nodePath}.slots.${slotName}`);
					}
				}
			}
		}
	}

	validateRecursive(tree, "root");

	if (allErrors.length > 0) {
		return { success: false, errors: allErrors };
	}

	return { success: true, data: tree };
}

// ===========================================
// FACTORY FUNCTIONS
// ===========================================

/**
 * Generate a unique block ID.
 */
export function generateBlockId(kind: BlockKind): string {
	const timestamp = Date.now().toString(36);
	const random = Math.random().toString(36).substring(2, 6);
	return `${kind}-${timestamp}-${random}`;
}

/**
 * Block creation options.
 */
export interface CreateBlockOptions {
	/** Recipe ID (falls back to kind.default) */
	recipe?: string;
	/** Props to merge with defaults */
	props?: Record<string, unknown>;
	/** Pre-populated slots */
	slots?: Record<string, BlockNode[]>;
	/** Data bindings */
	binds?: Record<string, string>;
	/** Editor metadata */
	meta?: BlockMetadata;
}

/**
 * Create a BlockNode.
 *
 * Single factory function - handles defaults automatically.
 * If recipe not specified, uses `{kind}.default`.
 * Props are merged with schema defaults.
 */
export function createBlock<K extends BlockKind>(
	kind: K,
	options?: CreateBlockOptions,
): BlockNode<K> {
	// Get schema defaults
	const kindSchema = getKindSchema(kind as KindContract);
	const schemaDefaults = kindSchema ? kindSchema.parse({}) : {};

	// Initialize empty slots for this kind
	const kindDef = getKindDefinition(kind);
	const emptySlots: Record<string, BlockNode[]> = {};
	for (const slot of kindDef.slots) {
		emptySlots[slot] = [];
	}

	// Merge props: schema defaults < user overrides
	const mergedProps = {
		...(schemaDefaults as object),
		...(options?.props ?? {}),
	};

	return {
		id: generateBlockId(kind),
		kind,
		recipe: options?.recipe ?? `${kind}.default`,
		props: mergedProps,
		slots: { ...emptySlots, ...(options?.slots ?? {}) },
		binds: options?.binds,
		meta: options?.meta,
	} as BlockNode<K>;
}

// ===========================================
// TYPE HELPERS
// ===========================================

/**
 * Extract the props type for a specific kind.
 */
export type KindProps<K extends BlockKind> = K extends KindContract
	? z.infer<(typeof kindContracts)[K]>
	: unknown;

/**
 * Extract allowed slot names for a kind (as type).
 */
export type KindSlots<K extends BlockKind> =
	typeof import("$lib/design/taxonomy/vpb").blockKinds[K]["slots"][number];

/**
 * Type guard for checking if a node is a specific kind.
 */
export function isBlockKind<K extends BlockKind>(node: BlockNode, kind: K): node is BlockNode<K> {
	return node.kind === kind;
}
