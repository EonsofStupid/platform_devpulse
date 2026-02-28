/**
 * @file Blocks — Public API
 * @layer blocks
 * @package @devpulse/coldlight
 */

export { BlockNodeSchema, BlockDocumentSchema, BlockNodeMetaSchema } from "./schema.js";
export type { BlockNode, BlockNodeMeta, BlockDocument } from "./schema.js";
export { BLOCK_CATEGORIES, ALL_BLOCK_KINDS } from "./kinds.js";
export type { BlockCategory } from "./kinds.js";
export { createBlockNode, createBlockDocument } from "./factory.js";
