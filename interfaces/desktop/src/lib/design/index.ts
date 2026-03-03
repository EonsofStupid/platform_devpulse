/**
 * @file ColdLight Design System
 * @package @devpulse/coldlight
 *
 * Only exports what actually exists and compiles.
 * Components added here as they are built against taxonomy contracts.
 */

// UI (styled) — public API
export {
	// Interactive
	Button, type ButtonUIProps, type ButtonIntent, type ButtonSize,
	Checkbox, type CheckboxUIProps, type CheckboxIntent, type CheckboxSize,
	Switch, type SwitchUIProps, type SwitchSize,
	// Form
	Input, type InputUIProps, type InputSize,
	Textarea, type TextareaUIProps, type TextareaSize,
	Label, type LabelUIProps, type LabelSize,
	// Typography
	Text, type TextUIProps, type TextSize, type TextWeight, type TextColor, type TextAs,
	Heading, type HeadingUIProps, type HeadingLevel, type HeadingSize,
	// Data display
	Stat, type StatUIProps, type StatSize,
	Badge, BADGE_INTENT_PRESETS, type BadgeUIProps, type BadgeIntent, type BadgeSize,
	Card, CARD_VARIANT_PRESETS, type CardUIProps, type CardVariant, type CardSize,
	Separator, type SeparatorUIProps, type SeparatorOrientation, type SeparatorVariant,
	Code, type CodeUIProps, type CodeLanguage,
	Kbd, type KbdUIProps, type KbdSize,
	InlineMessage, type InlineMessageUIProps, type InlineMessageTone,
	Avatar, type AvatarUIProps, type AvatarSize,
	// Feedback
	Alert, ALERT_INTENT_PRESETS, type AlertUIProps, type AlertIntent,
	Spinner, type SpinnerUIProps, type SpinnerSize,
	Skeleton, type SkeletonUIProps, type SkeletonVariant,
	EmptyState, type EmptyStateUIProps, type EmptyStateSize,
	Callout, CALLOUT_VARIANT_PRESETS, type CalloutUIProps, type CalloutVariant,
	Banner, BANNER_INTENT_PRESETS, type BannerUIProps, type BannerIntent,
	Progress, type ProgressUIProps, type ProgressSize,
	Toggle, type ToggleUIProps, type ToggleSize,
	// Layout
	Grid, type GridUIProps, type GridColumns, type GridGap, type GridRows,
	Stack, type StackUIProps, type StackGap, type StackAlign,
	HStack, type HStackUIProps, type HStackGap, type HStackAlign, type HStackJustify,
	Box, type BoxUIProps, type BoxPadding, type BoxRadius,
	Container, type ContainerUIProps, type ContainerSize,
} from "./ui/index.js";

export type { ComponentSurfaceProps } from "./components/types.js";

// Blocks
export { Widget, WidgetHeader, WidgetTabs, WidgetContent, WidgetFooter } from "./blocks/widgets/index.js";
export type { WidgetProps, WidgetTab, WidgetSize } from "./blocks/widgets/index.js";

// Block infrastructure
export { BlockNodeSchema, BlockDocumentSchema, createBlockNode, createBlockDocument, BLOCK_CATEGORIES } from "./blocks/index.js";
export type { BlockNode, BlockDocument, BlockCategory } from "./blocks/index.js";

// Renderers
export { BlockRenderer, resolveClasses } from "./renderers/index.js";
export type { RendererContext } from "./renderers/index.js";

// Recipes
export { getRecipe, getRecipesForKind, registerRecipe } from "./recipes/index.js";
export type { DsSurfaceProps, RecipeDefinition } from "./recipes/types.js";

// Recipe registration (side-effect imports — triggers registerRecipe calls)
import "./recipes/layouts/shell/index.js";
import "./recipes/blocks/widget/index.js";

// Blueprints
export { getBlueprint, getBlueprintsForKind, registerBlueprint } from "./blueprints/index.js";
export type { BlueprintDefinition } from "./blueprints/types.js";

// Tokens
export * from "./tokens/index.js";
