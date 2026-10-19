/**
 * @file Block Schema — ArkType-validated BlockNode + BlockDocument
 * @layer blocks
 * @package @devpulse/coldlight
 *
 * The core data model for VPB. BlockNodes are serializable typed data
 * validated by ArkType — no CSS, no DOM refs, no functions.
 *
 * VPB stores: kind + recipe + props + slots
 * VPB NEVER stores: class names, raw colors, inline styles
 */

import { type } from "arktype";
import type { VisualAxisProps } from "#coldlight/components/types.js";

/** ArkType schema for visual axis props — validated at VPB boundaries */
const VisualAxisPropsSchema = type({
	"surface?": "string",
	"depth?": "string",
	"bevel?": "string",
	"glow?": "string",
	"frame?": "string",
	"radius?": "string",
	"motion?": "string",
	"transition?": "string",
	"preset?": "string",
});

// =============================================================================
// BlockNode — the atomic unit VPB stores
// =============================================================================

/** Metadata for VPB UI only — does not affect rendering. */
export const BlockNodeMetaSchema = type({
	"label?": "string",
	"locked?": "boolean",
	"collapsed?": "boolean",
});

export type BlockNodeMeta = typeof BlockNodeMetaSchema.infer;

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

/** Recursive BlockNode schema — a node in the block tree. */
const blockNodeDef = type.module({
	node: {
		id: "string > 0",
		kind: "string > 0",
		recipe: "string > 0",
		props: VisualAxisPropsSchema,
		"slots?": "Record<string, node[]>",
		"binds?": "Record<string, string>",
		"meta?": BlockNodeMetaSchema,
	},
});

export const BlockNodeSchema = blockNodeDef.node;

// =============================================================================
// BlockDocument — a complete VPB document (page/layout)
// =============================================================================

export const BlockDocumentSchema = type({
	id: "string > 0",
	version: "'1'",
	label: "string > 0",
	root: BlockNodeSchema.array(),
	createdAt: "string.date.iso",
	updatedAt: "string.date.iso",
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
