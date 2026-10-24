/**
 * @file Blocks — Public API
 * @layer blocks
 * @package @devpulse/coldlight
 */

export { createBlockDocument, createBlockNode } from "./factory.js";
export type { BlockCategory } from "./kinds.js";
export { ALL_BLOCK_KINDS, BLOCK_CATEGORIES } from "./kinds.js";
export type { BlockDocument, BlockNode, BlockNodeMeta } from "./schema.js";
export { BlockDocumentSchema, BlockNodeMetaSchema, BlockNodeSchema } from "./schema.js";
