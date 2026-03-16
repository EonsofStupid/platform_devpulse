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

// ── Primitive hooks ─────────────────────────────────────────
export { useButton } from "./primitives/button/index.js";
export { useDialog } from "./primitives/dialog/index.js";
export { useCheckbox } from "./primitives/checkbox/index.js";

// ── Schema utilities ────────────────────────────────────────
export { createAnatomy, BasePrimitiveSchema } from "./schema/index.js";

// ── Types ───────────────────────────────────────────────────
export type { UseButtonProps, UseButtonReturn } from "./primitives/button/index.js";
export type { UseDialogProps, UseDialogReturn } from "./primitives/dialog/index.js";
export type { UseCheckboxProps, UseCheckboxReturn, CheckboxState } from "./primitives/checkbox/index.js";
export type { Anatomy, PrimitiveSpec, A11ySpec } from "./schema/index.js";
