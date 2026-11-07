/**
 * @file Renderer Types
 * @layer renderers
 * @package @devpulse/coldlight
 */

/** Renderer context passed through the block tree. */
export interface RendererContext {
	/** Current nesting depth (0 = root level) */
	depth: number;
}
