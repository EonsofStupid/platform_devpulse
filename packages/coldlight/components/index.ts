/**
 * @file components/index.ts
 * @layer components
 *
 * Component exports. Components will be added as they are built
 * against taxonomy contracts with proper ARIA enforcement.
 */

// ============================================
// COMPONENTS
// ============================================

export {
	BUTTON_DEFAULTS,
	BUTTON_SIZES,
	BUTTON_VARIANTS,
	Button,
	type ButtonProps,
	type ButtonSize,
	type ButtonType,
	type ButtonVariant,
} from "./button/index.js";

// ============================================
// TYPOGRAPHY
// ============================================

export {
	Heading,
	type HeadingLevel,
	type HeadingProps,
	type HeadingSize,
} from "./heading/index.js";
export {
	Text,
	type TextAs,
	type TextProps,
	type TextSize,
	type TextWeight,
} from "./text/index.js";

// ============================================
// DATA DISPLAY
// ============================================

export {
	Avatar,
	type AvatarLoadStatus,
	type AvatarProps,
	type AvatarStatusChangeDetails,
} from "./avatar/index.js";
export {
	Badge,
	type BadgeFillStyle,
	type BadgeProps,
	type BadgeSize,
	type BadgeVariant,
} from "./badge/index.js";
export {
	Card,
	type CardAs,
	type CardOrientation,
	type CardProps,
	type CardVariant,
} from "./card/index.js";
export {
	Separator,
	type SeparatorOrientation,
	type SeparatorProps,
} from "./separator/index.js";
export {
	Stat,
	type StatProps,
	type StatSize,
} from "./stat/index.js";

// ============================================
// NAVIGATION + MENUS
// ============================================

export {
	Breadcrumbs,
	BreadcrumbsItem,
	type BreadcrumbsItemProps,
	BreadcrumbsLink,
	type BreadcrumbsLinkProps,
	BreadcrumbsList,
	type BreadcrumbsListProps,
	BreadcrumbsPage,
	type BreadcrumbsPageProps,
	type BreadcrumbsProps,
	BreadcrumbsSeparator,
	type BreadcrumbsSeparatorProps,
	type BreadcrumbsSize,
} from "./breadcrumbs/index.js";
export {
	ContextMenu,
	ContextMenuContent,
	type ContextMenuContentProps,
	ContextMenuGroup,
	type ContextMenuGroupProps,
	ContextMenuItem,
	type ContextMenuItemProps,
	ContextMenuLabel,
	type ContextMenuLabelProps,
	type ContextMenuProps,
	ContextMenuSeparator,
	type ContextMenuSeparatorProps,
	type ContextMenuSize,
	ContextMenuTrigger,
	type ContextMenuTriggerProps,
	type ContextMenuVariant,
} from "./context-menu/index.js";
export {
	DropdownMenu,
	DropdownMenuContent,
	type DropdownMenuContentProps,
	DropdownMenuGroup,
	type DropdownMenuGroupProps,
	DropdownMenuItem,
	type DropdownMenuItemProps,
	DropdownMenuLabel,
	type DropdownMenuLabelProps,
	type DropdownMenuProps,
	DropdownMenuSeparator,
	type DropdownMenuSeparatorProps,
	type DropdownMenuSize,
	DropdownMenuTrigger,
	type DropdownMenuTriggerProps,
	type DropdownMenuVariant,
} from "./dropdown-menu/index.js";
export {
	NavItem,
	type NavItemComponentProps,
	type NavItemSize,
} from "./nav-item/index.js";

// ============================================
// LAYOUT
// ============================================

export {
	Panel,
	PanelBody,
	type PanelBodyProps,
	PanelFooter,
	type PanelFooterProps,
	PanelHeader,
	type PanelHeaderProps,
	type PanelPadding,
	type PanelProps,
	type PanelTone,
	type PanelVariant,
} from "./panel/index.js";

// ============================================
// FORM
// ============================================

export {
	TextField,
	type TextFieldProps,
	type TextFieldSize,
	type TextFieldType,
} from "./text-field/index.js";

// ============================================
// FEEDBACK
// ============================================

export {
	Progress,
	type ProgressProps,
	type ProgressSize,
} from "./progress/index.js";
