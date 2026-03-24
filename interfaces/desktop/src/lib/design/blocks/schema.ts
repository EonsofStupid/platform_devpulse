/**
 * @file Block Schema — Zod-validated BlockNode + BlockDocument
 * @layer blocks
 * @package @devpulse/coldlight
 *
 * The core data model for VPB. BlockNodes are serializable typed data
 * validated by Zod — no CSS, no DOM refs, no functions.
 *
 * VPB stores: kind + recipe + props + slots
 * VPB NEVER stores: class names, raw colors, inline styles
 */

import { z } from "zod";
import type { VisualAxisProps } from "$lib/design/components/types.js";

/** Zod schema for visual axis props — validated at VPB boundaries */
const VisualAxisPropsSchema = z.object({
	surface: z.string().optional(),
	depth: z.string().optional(),
	bevel: z.string().optional(),
	glow: z.string().optional(),
	frame: z.string().optional(),
	radius: z.string().optional(),
	motion: z.string().optional(),
	transition: z.string().optional(),
	preset: z.string().optional(),
});

// =============================================================================
// BlockNode — the atomic unit VPB stores
// =============================================================================

/** Metadata for VPB UI only — does not affect rendering. */
export const BlockNodeMetaSchema = z.object({
	label: z.string().optional(),
	locked: z.boolean().optional(),
	collapsed: z.boolean().optional(),
});

export type BlockNodeMeta = z.infer<typeof BlockNodeMetaSchema>;

/** Recursive BlockNode schema — a node in the block tree. */
export const BlockNodeSchema: z.ZodType = z.lazy(() =>
	z.object({
		id: z.string().min(1),
		kind: z.string().min(1),
		recipe: z.string().min(1),
		props: VisualAxisPropsSchema.partial(),
		slots: z.record(z.string(), z.array(BlockNodeSchema)).optional(),
		binds: z.record(z.string(), z.string()).optional(),
		meta: BlockNodeMetaSchema.optional(),
	}),
);

/** A node in the VPB block tree. */
export interface BlockNode {
	id: string;
	kind: string;
	recipe: string;
	props: Partial<VisualAxisProps>;
	slots?: Record<string, BlockNode[]>;
	binds?: Record<string, string>;
	meta?: BlockNodeMeta;
}

// =============================================================================
// BlockDocument — a complete VPB document (page/layout)
// =============================================================================

export const BlockDocumentSchema = z.object({
	id: z.string().min(1),
	version: z.literal(1),
	label: z.string().min(1),
	root: z.array(BlockNodeSchema),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

/** A complete VPB document (page/layout). */
export interface BlockDocument {
	id: string;
	version: 1;
	label: string;
	root: BlockNode[];
	createdAt: string;
	updatedAt: string;
}
