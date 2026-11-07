/**
 * @file primitives/dialog — Structural contract for modal overlay interactions.
 * @package @devpulse/coldlight
 * @layer primitive
 *
 * The dialog primitive defines the 6-slot structure for modal windows:
 * trigger, overlay, content, title, description, close.
 * Focus trapping, scroll lock, and escape dismissal are behavioral concerns
 * handled by the useDialog hook.
 */

export { dialogAnatomy } from "./anatomy.js";
export type { DialogPrimitiveProps } from "./types.js";
