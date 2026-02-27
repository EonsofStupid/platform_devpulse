/**
 * @file builders/index.ts
 * @package @devpulse/coldlight
 *
 * Master barrel — re-exports all ColdLight builders.
 * Components import from here or from individual builder barrels.
 */

// ─── Form Controls ────────────────────────────────────────────────────────────

export { Checkbox, createCheckbox } from "./checkbox/index.js";
export type { CheckboxProps } from "./checkbox/index.js";

export { Switch, createSwitch } from "./switch/index.js";
export type { SwitchProps } from "./switch/index.js";

export { Input, createInput } from "./input/index.js";
export type { InputProps } from "./input/index.js";

export { Textarea, createTextarea } from "./textarea/index.js";
export type { TextareaProps } from "./textarea/index.js";

export { NumberInput, createNumberInput } from "./number-input/index.js";
export type { NumberInputProps } from "./number-input/index.js";

export { ColorInput, createColorInput } from "./color-input/index.js";
export type { ColorInputProps } from "./color-input/index.js";

export { SearchInput, createSearchInput } from "./search-input/index.js";
export type { SearchInputProps } from "./search-input/index.js";

export { InputGroup, createInputGroup } from "./input-group/index.js";
export type { InputGroupProps } from "./input-group/index.js";

export { Button, createButton } from "./button/index.js";
export type { ButtonProps } from "./button/index.js";

// ─── Interactive Widgets ──────────────────────────────────────────────────────

export { ToggleGroup, createToggleGroup } from "./toggle-group/index.js";
export type { ToggleGroupProps } from "./toggle-group/index.js";

export { Toolbar, createToolbar } from "./toolbar/index.js";
export type { ToolbarProps } from "./toolbar/index.js";

export { Steps, createSteps } from "./steps/index.js";
export type { StepsProps } from "./steps/index.js";

export { Sheet, createSheet } from "./sheet/index.js";
export type { SheetProps } from "./sheet/index.js";

export { Sidebar, createSidebar } from "./sidebar/index.js";
export type { SidebarProps } from "./sidebar/index.js";

export { ScrollArea, createScrollArea } from "./scroll-area/index.js";
export type { ScrollAreaProps } from "./scroll-area/index.js";

// ─── Form Structure ──────────────────────────────────────────────────────────

export { Form, createForm } from "./form/index.js";
export type { FormProps } from "./form/index.js";

export { FormField, createFormField } from "./form-field/index.js";
export type { FormFieldProps } from "./form-field/index.js";

export { Label, createLabel } from "./label/index.js";
export type { LabelProps } from "./label/index.js";

// ─── Feedback / Status ───────────────────────────────────────────────────────

export { Alert, createAlert } from "./alert/index.js";
export type { AlertProps } from "./alert/index.js";

export { Banner, createBanner } from "./banner/index.js";
export type { BannerProps } from "./banner/index.js";

export { Callout, createCallout } from "./callout/index.js";
export type { CalloutProps } from "./callout/index.js";

export { InlineMessage, createInlineMessage } from "./inline-message/index.js";
export type { InlineMessageProps } from "./inline-message/index.js";

export { NotificationCenter, createNotificationCenter } from "./notification-center/index.js";
export type { NotificationCenterProps } from "./notification-center/index.js";

export { Spinner, createSpinner } from "./spinner/index.js";
export type { SpinnerProps } from "./spinner/index.js";

export { Skeleton, createSkeleton } from "./skeleton/index.js";
export type { SkeletonProps } from "./skeleton/index.js";

export { LoadingOverlay, createLoadingOverlay } from "./loading-overlay/index.js";
export type { LoadingOverlayProps } from "./loading-overlay/index.js";

// ─── Navigation ──────────────────────────────────────────────────────────────

export { Nav, createNav } from "./nav/index.js";
export type { NavProps } from "./nav/index.js";

export { NavItem, createNavItem } from "./nav-item/index.js";
export type { NavItemProps } from "./nav-item/index.js";

export { Breadcrumb, createBreadcrumb } from "./breadcrumb/index.js";
export type { BreadcrumbProps } from "./breadcrumb/index.js";

export { SkipLink, createSkipLink } from "./skip-link/index.js";
export type { SkipLinkProps } from "./skip-link/index.js";

export { TableOfContents, createTableOfContents } from "./table-of-contents/index.js";
export type { TableOfContentsProps } from "./table-of-contents/index.js";

// ─── Display ─────────────────────────────────────────────────────────────────

export { Badge, createBadge } from "./badge/index.js";
export type { BadgeProps } from "./badge/index.js";

export { EmptyState, createEmptyState } from "./empty-state/index.js";
export type { EmptyStateProps } from "./empty-state/index.js";

export { Stat, createStat } from "./stat/index.js";
export type { StatProps } from "./stat/index.js";

export { Card, createCard } from "./card/index.js";
export type { CardProps } from "./card/index.js";

// ─── Data ────────────────────────────────────────────────────────────────────

export { Table, createTable } from "./table/index.js";
export type { TableProps } from "./table/index.js";

export { DataTable, createDataTable } from "./data-table/index.js";
export type { DataTableProps } from "./data-table/index.js";

export { List, createList } from "./list/index.js";
export type { ListProps } from "./list/index.js";

export { DescriptionList, createDescriptionList } from "./description-list/index.js";
export type { DescriptionListProps } from "./description-list/index.js";

export { Separator, createSeparator } from "./separator/index.js";
export type { SeparatorProps } from "./separator/index.js";

export { Divider, createDivider } from "./divider/index.js";
export type { DividerProps } from "./divider/index.js";

// ─── Layout ──────────────────────────────────────────────────────────────────

export { Box, createBox } from "./box/index.js";
export type { BoxProps } from "./box/index.js";

export { Flex, createFlex } from "./flex/index.js";
export type { FlexProps } from "./flex/index.js";

export { Grid, createGrid } from "./grid/index.js";
export type { GridProps } from "./grid/index.js";

export { Stack, createStack } from "./stack/index.js";
export type { StackProps } from "./stack/index.js";

export { HStack, createHStack } from "./hstack/index.js";
export type { HStackProps } from "./hstack/index.js";

export { Spacer, createSpacer } from "./spacer/index.js";
export type { SpacerProps } from "./spacer/index.js";

export { Center, createCenter } from "./center/index.js";
export type { CenterProps } from "./center/index.js";

export { Container, createContainer } from "./container/index.js";
export type { ContainerProps } from "./container/index.js";

export { Sticky, createSticky } from "./sticky/index.js";
export type { StickyProps } from "./sticky/index.js";

// ─── Typography ──────────────────────────────────────────────────────────────

export { Text, createText } from "./text/index.js";
export type { TextProps } from "./text/index.js";

export { Heading, createHeading } from "./heading/index.js";
export type { HeadingProps } from "./heading/index.js";

export { Prose, createProse } from "./prose/index.js";
export type { ProseProps } from "./prose/index.js";

export { Code, createCode } from "./code/index.js";
export type { CodeProps } from "./code/index.js";

export { Kbd, createKbd } from "./kbd/index.js";
export type { KbdProps } from "./kbd/index.js";

export { AspectRatio, createAspectRatio } from "./aspect-ratio/index.js";
export type { AspectRatioProps } from "./aspect-ratio/index.js";

// ─── Internal utilities (for advanced usage / testing) ───────────────────────

export {
	Synced,
	SelectionState,
	createBuilderMetadata,
	mergeAttrs,
	extract,
	kbd,
	getNextKey,
	getPrevKey,
	dataAttr,
	disabledAttr,
	createId,
	resetIdCounter,
} from "../builders/index.js";

export type {
	MaybeGetter,
	SlotAttrs,
	DataState,
	Direction,
	Orientation,
	BuilderMetadata,
	SyncedArgs,
	SelectionStateProps,
} from "../builders/index.js";
