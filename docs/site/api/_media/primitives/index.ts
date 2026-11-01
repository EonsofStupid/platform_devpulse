/**
 * @file primitives/index.ts
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * ColdLight Primitives — Structureless Shells
 *
 * Zero ARIA. Zero behavior. Zero styling.
 * data-kind, data-slot, typed props, snippet children, class merging.
 * Component layer adds ARIA, state, and recipes.
 *
 * 87 primitives total:
 *   - 21 ColdLight-owned P0 (interactive + layout + typography + form + feedback + nav)
 *   - 17 Melt-backed P0 (via dsAdapter transport)
 *   - 21 P1 (layout, display, interactive, navigation, overlay)
 *   - 28 P1-P3 (menus, dates, data display, misc)
 */

// =============================================================================
// FOUNDATION
// =============================================================================

export {
	type BaseProps,
	cn,
	DATA_ATTRS,
	type OmitStyle,
	type PrimitiveState,
	PrimitiveStates,
	stripStyleProp,
} from "./types.js";

// =============================================================================
// LAYOUT PRIMITIVES — ColdLight-owned, token-driven spacing/sizing
// =============================================================================

export { Box, type BoxProps } from "./box/index.js";
export { Flex, type FlexProps } from "./flex/index.js";
export { Stack, type StackProps } from "./stack/index.js";
export { HStack, type HStackProps } from "./hstack/index.js";
export { Grid, type GridProps } from "./grid/index.js";
export { Container, type ContainerProps } from "./container/index.js";

// =============================================================================
// TYPOGRAPHY PRIMITIVES — ColdLight-owned, token-driven scale
// =============================================================================

export { Text, type TextProps } from "./text/index.js";
export { Heading, type HeadingProps, type HeadingLevel } from "./heading/index.js";

// =============================================================================
// INTERACTIVE PRIMITIVES — ColdLight-owned
// =============================================================================

export { ButtonRoot, type ButtonRootProps } from "./button/index.js";
export { CheckboxRoot, type CheckboxRootProps } from "./checkbox/index.js";
export { SwitchRoot, type SwitchRootProps } from "./switch/index.js";
export { Label, type LabelProps } from "./label/index.js";

// =============================================================================
// FORM PRIMITIVES — ColdLight-owned
// =============================================================================

export { Input, type InputProps } from "./input/index.js";
export { Textarea, type TextareaProps } from "./textarea/index.js";
export { FormField, type FormFieldProps } from "./form-field/index.js";
export { Form, type FormProps } from "./form/index.js";

// =============================================================================
// DATA DISPLAY PRIMITIVES — ColdLight-owned
// =============================================================================

export { Badge, type BadgeProps } from "./badge/index.js";

// =============================================================================
// FEEDBACK PRIMITIVES — ColdLight-owned
// =============================================================================

export { Alert, type AlertProps } from "./alert/index.js";
export { Spinner, type SpinnerProps } from "./spinner/index.js";
export { InlineMessage, type InlineMessageProps } from "./inline-message/index.js";

// =============================================================================
// NAVIGATION PRIMITIVES — ColdLight-owned
// =============================================================================

export { SkipLink, type SkipLinkProps } from "./skip-link/index.js";

// =============================================================================
// LAYOUT PRIMITIVES — P1 ColdLight-owned
// =============================================================================

export { Card, type CardProps } from "./card/index.js";
export { AspectRatio, type AspectRatioProps } from "./aspect-ratio/index.js";
export { Sticky, type StickyProps } from "./sticky/index.js";
export { ScrollArea, type ScrollAreaRootProps } from "./scroll-area/index.js";

// =============================================================================
// TYPOGRAPHY PRIMITIVES — P1 ColdLight-owned
// =============================================================================

export { Kbd, type KbdProps } from "./kbd/index.js";
export { Prose, type ProseProps } from "./prose/index.js";

// =============================================================================
// DATA DISPLAY PRIMITIVES — P1 ColdLight-owned
// =============================================================================

export { Table, type TableProps } from "./table/index.js";
export { DataTable, type DataTableProps } from "./data-table/index.js";
export { EmptyState, type EmptyStateProps } from "./empty-state/index.js";

// =============================================================================
// FEEDBACK PRIMITIVES — P1 ColdLight-owned
// =============================================================================

export { LoadingOverlay, type LoadingOverlayProps } from "./loading-overlay/index.js";

// =============================================================================
// FORM PRIMITIVES — P1 ColdLight-owned
// =============================================================================

export { ColorInput, type ColorInputRootProps } from "./color-input/index.js";

// =============================================================================
// NAVIGATION PRIMITIVES — P1 ColdLight-owned
// =============================================================================

export { TableOfContents, type TableOfContentsRootProps } from "./table-of-contents/index.js";
export { Sidebar, type SidebarProps } from "./sidebar/index.js";

// =============================================================================
// OVERLAY PRIMITIVES — P1 ColdLight-owned
// =============================================================================

export { NotificationCenter, type NotificationCenterProps } from "./notification-center/index.js";

// =============================================================================
// CONTRACTS — All primitive contracts re-exported for scanner/registry
// =============================================================================

export { contract as buttonContract } from "./button/contract.js";
export { contract as checkboxContract } from "./checkbox/contract.js";
export { contract as switchContract } from "./switch/contract.js";
export { contract as labelContract } from "./label/contract.js";
export { contract as inputContract } from "./input/contract.js";
export { contract as textareaContract } from "./textarea/contract.js";
export { contract as formFieldContract } from "./form-field/contract.js";
export { contract as formContract } from "./form/contract.js";
export { contract as badgeContract } from "./badge/contract.js";
export { contract as alertContract } from "./alert/contract.js";
export { contract as spinnerContract } from "./spinner/contract.js";
export { contract as inlineMessageContract } from "./inline-message/contract.js";
export { contract as skipLinkContract } from "./skip-link/contract.js";
export { contract as boxContract } from "./box/contract.js";
export { contract as flexContract } from "./flex/contract.js";
export { contract as stackContract } from "./stack/contract.js";
export { contract as hstackContract } from "./hstack/contract.js";
export { contract as gridContract } from "./grid/contract.js";
export { contract as containerContract } from "./container/contract.js";
export { contract as textContract } from "./text/contract.js";
export { contract as headingContract } from "./heading/contract.js";

// Melt-backed contracts
export { contract as accordionContract } from "./accordion/contract.js";
export { contract as dialogContract } from "./dialog/contract.js";
export { contract as tabsContract } from "./tabs/contract.js";
export { contract as comboboxContract } from "./combobox/contract.js";
export { contract as selectContract } from "./select/contract.js";
export { contract as popoverContract } from "./popover/contract.js";
export { contract as tooltipContract } from "./tooltip/contract.js";
export { contract as toggleContract } from "./toggle/contract.js";
export { contract as progressContract } from "./progress/contract.js";
export { contract as radioGroupContract } from "./radio-group/contract.js";
export { contract as collapsibleContract } from "./collapsible/contract.js";
export { contract as avatarContract } from "./avatar/contract.js";
export { contract as sliderContract } from "./slider/contract.js";
export { contract as fileUploadContract } from "./file-upload/contract.js";
export { contract as pinInputContract } from "./pin-input/contract.js";
export { contract as toasterContract } from "./toaster/contract.js";
export { contract as treeContract } from "./tree/contract.js";

// P1 contracts
export { contract as separatorContract } from "./separator/contract.js";
export { contract as toggleGroupContract } from "./toggle-group/contract.js";
export { contract as toolbarContract } from "./toolbar/contract.js";
export { contract as breadcrumbContract } from "./breadcrumb/contract.js";
export { contract as navContract } from "./nav/contract.js";
export { contract as navItemContract } from "./nav-item/contract.js";
export { contract as centerContract } from "./center/contract.js";
export { contract as spacerContract } from "./spacer/contract.js";
export { contract as dividerContract } from "./divider/contract.js";
export { contract as skeletonContract } from "./skeleton/contract.js";
export { contract as statContract } from "./stat/contract.js";
export { contract as codeContract } from "./code/contract.js";
export { contract as listContract } from "./list/contract.js";
export { contract as descriptionListContract } from "./description-list/contract.js";
export { contract as bannerContract } from "./banner/contract.js";
export { contract as calloutContract } from "./callout/contract.js";
export { contract as inputGroupContract } from "./input-group/contract.js";
export { contract as numberInputContract } from "./number-input/contract.js";
export { contract as searchInputContract } from "./search-input/contract.js";
export { contract as stepsContract } from "./steps/contract.js";
export { contract as sheetContract } from "./sheet/contract.js";

// P1-P3 Melt-backed contracts
export { contract as alertDialogContract } from "./alert-dialog/contract.js";
export { contract as dropdownMenuContract } from "./dropdown-menu/contract.js";
export { contract as contextMenuContract } from "./context-menu/contract.js";
export { contract as menubarContract } from "./menubar/contract.js";
export { contract as tagsInputContract } from "./tags-input/contract.js";
export { contract as linkPreviewContract } from "./link-preview/contract.js";
export { contract as paginationContract } from "./pagination/contract.js";
export { contract as calendarContract } from "./calendar/contract.js";
export { contract as dateFieldContract } from "./date-field/contract.js";
export { contract as datePickerContract } from "./date-picker/contract.js";
export { contract as dateRangeFieldContract } from "./date-range-field/contract.js";
export { contract as dateRangePickerContract } from "./date-range-picker/contract.js";
export { contract as rangeCalendarContract } from "./range-calendar/contract.js";
export { contract as commandPaletteContract } from "./command-palette/contract.js";

// P1-P3 ColdLight-owned contracts
export { contract as scrollAreaContract } from "./scroll-area/contract.js";
export { contract as tableOfContentsContract } from "./table-of-contents/contract.js";
export { contract as cardContract } from "./card/contract.js";
export { contract as tableContract } from "./table/contract.js";
export { contract as dataTableContract } from "./data-table/contract.js";
export { contract as emptyStateContract } from "./empty-state/contract.js";
export { contract as loadingOverlayContract } from "./loading-overlay/contract.js";
export { contract as colorInputContract } from "./color-input/contract.js";
export { contract as sidebarContract } from "./sidebar/contract.js";
export { contract as notificationCenterContract } from "./notification-center/contract.js";
export { contract as kbdContract } from "./kbd/contract.js";
export { contract as proseContract } from "./prose/contract.js";
export { contract as aspectRatioContract } from "./aspect-ratio/contract.js";
export { contract as stickyContract } from "./sticky/contract.js";
