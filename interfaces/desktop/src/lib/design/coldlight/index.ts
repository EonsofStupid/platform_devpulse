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
export { useCheckbox } from "./primitives/checkbox/index.js";
export { useDialog } from "./primitives/dialog/index.js";
export { useField } from "./primitives/field/index.js";
export { useLabel } from "./primitives/label/index.js";
export { useLink } from "./primitives/link/index.js";
export { useNumberField } from "./primitives/number-field/index.js";
export { useSearchField } from "./primitives/search-field/index.js";
export { useSeparator } from "./primitives/separator/index.js";
export { useSwitch } from "./primitives/switch/index.js";
export { useTextField } from "./primitives/text-field/index.js";
export { useToggle } from "./primitives/toggle/index.js";

// ── Schema utilities ────────────────────────────────────────
export { createAnatomy, BasePrimitiveSchema } from "./schema/index.js";

// ── Types ───────────────────────────────────────────────────
export type { UseButtonProps, UseButtonReturn } from "./primitives/button/index.js";
export type { UseCheckboxProps, UseCheckboxReturn, CheckboxState } from "./primitives/checkbox/index.js";
export type { UseDialogProps, UseDialogReturn } from "./primitives/dialog/index.js";
export type { UseFieldProps, UseFieldReturn } from "./primitives/field/index.js";
export type { UseLabelProps, UseLabelReturn } from "./primitives/label/index.js";
export type { UseLinkProps, UseLinkReturn } from "./primitives/link/index.js";
export type { UseNumberFieldProps, UseNumberFieldReturn } from "./primitives/number-field/index.js";
export type { UseSearchFieldProps, UseSearchFieldReturn } from "./primitives/search-field/index.js";
export type { UseSeparatorProps, UseSeparatorReturn } from "./primitives/separator/index.js";
export type { UseSwitchProps, UseSwitchReturn } from "./primitives/switch/index.js";
export type { UseTextFieldProps, UseTextFieldReturn } from "./primitives/text-field/index.js";
export type { UseToggleProps, UseToggleReturn } from "./primitives/toggle/index.js";
export type { Anatomy, PrimitiveSpec, A11ySpec } from "./schema/index.js";
