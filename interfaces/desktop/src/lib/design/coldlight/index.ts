/**
 * @coldlight/primitives — public API
 *
 * ColdLight primitive hooks. Each hook returns reactive ARIA attributes,
 * keyboard handlers, and data attributes for a specific UI pattern.
 *
 * Usage:
 *   import { useButton } from '$lib/design/coldlight';
 *   const button = useButton({ disabled: false });
 *   <button {...button.root}>Save</button>
 */

// ── Primitives ──────────────────────────────────────────────────
export { useButton } from "./primitives/button/index.js";

// ── Schema ──────────────────────────────────────────────────────
export { createAnatomy, BasePrimitiveSchema } from "./schema/index.js";

// ── Types ───────────────────────────────────────────────────────
export type { UseButtonProps, UseButtonReturn } from "./primitives/button/index.js";
export type { Anatomy, PrimitiveSpec, A11ySpec } from "./schema/index.js";
