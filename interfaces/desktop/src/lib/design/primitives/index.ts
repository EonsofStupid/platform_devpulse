/**
 * @file src/lib/design/primitives/index.ts
 * @layer primitives
 *
 * Barrel export for ColdLight primitives.
 * All primitives are pure behavior/accessibility components with NO styling.
 * Styling comes from recipe classes applied by components/renderers.
 *
 * @since 1.0.0
 */

// ============================================
// FOUNDATION
// ============================================
export {
  type OmitStyle,
  type BaseProps,
  DATA_ATTRS,
  PrimitiveStates,
  type PrimitiveState,
  stripStyleProp,
} from "./types.js";

export {
  type RouteMetadata,
  getRouteMetadata,
  setRouteRegistry,
  clearRouteRegistry,
} from "./route-metadata.js";

// ============================================
// UTILITY PRIMITIVES
// ============================================
export { default as VisuallyHidden } from "./VisuallyHidden.svelte";
export { default as Portal } from "./Portal.svelte";
export { default as Presence, type PresenceState } from "./Presence.svelte";

// ============================================
// BITS UI NAMESPACE RE-EXPORTS
// ============================================
// Usage: import { Dialog } from "$lib/design/primitives";
//        <Dialog.Root>, <Dialog.Trigger>, <Dialog.Content>, etc.

export { Accordion } from "./Accordion.js";
export { AlertDialog } from "./AlertDialog.js";
export { AspectRatio } from "./AspectRatio.js";
export { Avatar } from "./Avatar.js";
// Button - ColdLight wrapped primitive (nested folder)
export { Button, type ButtonProps, type ButtonState, type ButtonSlot, ButtonSlots } from "./button/index.js";
export { Calendar } from "./Calendar.js";
export { Checkbox } from "./Checkbox.js";
export { Collapsible } from "./Collapsible.js";
export { Combobox } from "./Combobox.js";
export { Command } from "./Command.js";
export { ContextMenu } from "./ContextMenu.js";
export { DateField } from "./DateField.js";
export { DatePicker } from "./DatePicker.js";
// Dialog - ColdLight wrapped primitive (nested folder)
export * as Dialog from "./dialog/index.js";
export type {
  DialogRootProps,
  DialogTriggerProps,
  DialogPortalProps,
  DialogOverlayProps,
  DialogContentProps,
  DialogTitleProps,
  DialogDescriptionProps,
  DialogCloseProps,
  DialogState,
  DialogSlot,
} from "./dialog/index.js";
export { DialogSlots } from "./dialog/index.js";
export { DropdownMenu } from "./DropdownMenu.js";
export { HoverCard } from "./HoverCard.js";
export { Label } from "./Label.js";
export { Menubar } from "./Menubar.js";
export { NavigationMenu } from "./NavigationMenu.js";
export { Pagination } from "./Pagination.js";
export { Popover } from "./Popover.js";
export { Progress } from "./Progress.js";
export { RadioGroup } from "./RadioGroup.js";
export { ScrollArea } from "./ScrollArea.js";
export { Select } from "./Select.js";
export { Separator } from "./Separator.js";
export { Slider } from "./Slider.js";
export { Switch } from "./Switch.js";
export { Tabs } from "./Tabs.js";
export { TimeField } from "./TimeField.js";
export { Toggle } from "./Toggle.js";
export { ToggleGroup } from "./ToggleGroup.js";
export { Tooltip } from "./Tooltip.js";

// ============================================
// CUSTOM ARIA PRIMITIVES
// ============================================
export { default as Alert } from "./Alert.svelte";
export { default as Badge } from "./Badge.svelte";
export { default as ButtonGroup } from "./ButtonGroup.svelte";
export { default as Card } from "./Card.svelte";
export { default as Chart } from "./Chart.svelte";
export { default as Empty } from "./Empty.svelte";
export { default as Field } from "./Field.svelte";
export { default as FocusTrap } from "./FocusTrap.svelte";
export { default as Form } from "./Form.svelte";
export { default as InputEmail } from "./InputEmail.svelte";
export { default as InputGroup } from "./InputGroup.svelte";
export { default as InputNumber } from "./InputNumber.svelte";
export { default as InputOTP } from "./InputOTP.svelte";
export { default as InputPassword } from "./InputPassword.svelte";
export { default as InputText } from "./InputText.svelte";
export { default as Kbd } from "./Kbd.svelte";
export { default as LiveStatus } from "./LiveStatus.svelte";
export { default as NativeSelect } from "./NativeSelect.svelte";
export { default as Skeleton } from "./Skeleton.svelte";
export { default as Spinner } from "./Spinner.svelte";
export { default as Table } from "./Table.svelte";
export { default as Textarea } from "./Textarea.svelte";
export { default as Typography } from "./Typography.svelte";

// ============================================
// SMART/ROUTE-AWARE PRIMITIVES
// ============================================
export {
  default as Breadcrumb,
  type BreadcrumbItem,
} from "./Breadcrumb.svelte";

export {
  default as Sidebar,
  type SidebarItem,
} from "./Sidebar.svelte";

export {
  default as NavMenu,
  type NavMenuItem,
} from "./NavMenu.svelte";

export {
  default as Carousel,
  type CarouselItem,
} from "./Carousel.svelte";

// ============================================
// FEATURE PRIMITIVES
// ============================================
export {
  default as DataTable,
  type Table as DataTableInstance,
  type ColumnDef,
  type Row,
  type Header,
  type Cell,
  type SortDirection,
} from "./DataTable.svelte";

// TanStack Table Svelte 5 Adapter
export {
  createSvelteTable,
  renderComponent,
  renderSnippet,
  FlexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  createColumnHelper,
} from "./tanstack/index.js";

// ============================================
// INTEGRATION PRIMITIVES
// ============================================
export { default as Toast, toast } from "./Toast.svelte";
export { default as Sheet, type SheetSide } from "./Sheet.svelte";
