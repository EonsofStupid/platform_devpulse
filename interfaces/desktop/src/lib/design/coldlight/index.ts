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

// ── Component Primitive Hooks ───────────────────────────────
export { useAccordion } from "./primitives/accordion/index.js";
export { useAlertDialog } from "./primitives/alert-dialog/index.js";
export { useBreadcrumbs } from "./primitives/breadcrumbs/index.js";
export { useButton } from "./primitives/button/index.js";
export { useCheckbox } from "./primitives/checkbox/index.js";
export { useColorField } from "./primitives/color-field/index.js";
export { useColorSlider } from "./primitives/color-slider/index.js";
export { useComboBox } from "./primitives/combobox/index.js";
export { useDialog } from "./primitives/dialog/index.js";
export { useField } from "./primitives/field/index.js";
export { useGridList } from "./primitives/grid-list/index.js";
export { useLabel } from "./primitives/label/index.js";
export { useLink } from "./primitives/link/index.js";
export { useListBox } from "./primitives/listbox/index.js";
export { useMenu } from "./primitives/menu/index.js";
export { useMeter } from "./primitives/meter/index.js";
export { useNumberField } from "./primitives/number-field/index.js";
export { usePopover } from "./primitives/popover/index.js";
export { useProgress } from "./primitives/progress/index.js";
export { useRadioGroup } from "./primitives/radio-group/index.js";
export { useSearchField } from "./primitives/search-field/index.js";
export { useSelect } from "./primitives/select/index.js";
export { useSeparator } from "./primitives/separator/index.js";
export { useSheet } from "./primitives/sheet/index.js";
export { useSlider } from "./primitives/slider/index.js";
export { useSwitch } from "./primitives/switch/index.js";
export { useTabs } from "./primitives/tabs/index.js";
export { useTable } from "./primitives/table/index.js";
export { useTagGroup } from "./primitives/tag-group/index.js";
export { useTextField } from "./primitives/text-field/index.js";
export { useToggle } from "./primitives/toggle/index.js";
export { useToolbar } from "./primitives/toolbar/index.js";
export { useTooltip } from "./primitives/tooltip/index.js";
export { useTree } from "./primitives/tree/index.js";

// ── Interaction Hooks ───────────────────────────────────────
export { usePress } from "./primitives/press/index.js";
export { useLongPress } from "./primitives/long-press/index.js";
export { useHover } from "./primitives/hover/index.js";
export { useFocus } from "./primitives/focus/index.js";
export { useFocusRing } from "./primitives/focus-ring/index.js";
export { useFocusWithin } from "./primitives/focus-within/index.js";
export { useKeyboard } from "./primitives/keyboard-handler/index.js";
export { useMove } from "./primitives/move/index.js";

// ── Layout Hooks ────────────────────────────────────────────
export { useBox } from "./primitives/box/index.js";
export { useFlex } from "./primitives/flex/index.js";
export { useGridLayout } from "./primitives/grid-layout/index.js";
export { useStack } from "./primitives/stack/index.js";
export { useHstack } from "./primitives/hstack/index.js";
export { useCenter } from "./primitives/center/index.js";
export { useSpacer } from "./primitives/spacer/index.js";
export { useContainer } from "./primitives/container/index.js";
export { useDivider } from "./primitives/divider/index.js";
export { useAspectRatio } from "./primitives/aspect-ratio/index.js";

// ── Utility Hooks ───────────────────────────────────────────
export { useLocale } from "./primitives/locale/index.js";
export { useFilter } from "./primitives/filter/index.js";

// ── Schema ──────────────────────────────────────────────────
export { createAnatomy, BasePrimitiveSchema } from "./schema/index.js";
export type { Anatomy, PrimitiveSpec, A11ySpec } from "./schema/index.js";
