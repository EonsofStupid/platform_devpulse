/**
 * @file Renderer Types
 * @layer renderers
 * @package @devpulse/coldlight
 */

import type { BlockNode } from "$lib/design/blocks/schema.js";

/** Renderer context passed through the block tree. */
export interface RendererContext {
	/** Current nesting depth (0 = root level) */
	depth: number;
}
