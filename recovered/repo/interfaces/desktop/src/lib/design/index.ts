/**
 * @file ColdLight Design System
 * @package @devpulse/coldlight
 *
 * Public API — every component is default-styled via useColdLight + recipes.
 * Import from here. Never import from primitives/ or internal/ directly.
 */

// ── Interactive ──
export {
	Button, BUTTON_INTENT_PRESETS,
	type ButtonProps, type ButtonIntent,
} from "./components/button/index.js";
export type { ButtonSize } from "./components/button/index.js";
export { Checkbox, type CheckboxProps, type CheckboxIntent, type CheckboxSize } from "./components/checkbox/index.js";
export { Switch, type SwitchProps, type SwitchSize } from "./components/switch/index.js";
export { Toggle, type ToggleProps, type ToggleSize } from "./components/toggle/index.js";

// ── Form ──
export { Input, type InputProps, type InputSize } from "./components/input/index.js";
export { Textarea, type TextareaProps, type TextareaSize } from "./components/textarea/index.js";
export { Label, type LabelProps, type LabelSize } from "./components/label/index.js";

// ── Typography ──
export { Text, type TextProps, type TextSize, type TextWeight, type TextColor, type TextAs } from "./components/text/index.js";
export { Heading, type HeadingProps, type HeadingLevel, type HeadingSize } from "./components/heading/index.js";

// ── Data Display ──
export { Stat, type StatProps, type StatSize } from "./components/stat/index.js";
export {
	Badge, BADGE_INTENT_PRESETS,
	type BadgeProps, type BadgeIntent, type BadgeSize,
} from "./components/badge/index.js";
export {
	Card, CARD_VARIANT_PRESETS,
	type CardProps, type CardVariant, type CardSize,
} from "./components/card/index.js";
export { Separator, type SeparatorProps, type SeparatorOrientation, type SeparatorVariant } from "./components/separator/index.js";
export { Code, type CodeProps, type CodeLanguage } from "./components/code/index.js";
export { Kbd, type KbdProps, type KbdSize } from "./components/kbd/index.js";
export { InlineMessage, type InlineMessageProps, type InlineMessageTone } from "./components/inline-message/index.js";
export { Avatar, type AvatarProps, type AvatarSize } from "./components/avatar/index.js";

// ── Feedback ──
export {
	Alert, ALERT_INTENT_PRESETS,
	type AlertProps, type AlertIntent,
} from "./components/alert/index.js";
export { Spinner, type SpinnerProps, type SpinnerSize } from "./components/spinner/index.js";
export { Skeleton, type SkeletonProps, type SkeletonVariant } from "./components/skeleton/index.js";
export { EmptyState, type EmptyStateProps, type EmptyStateSize } from "./components/empty-state/index.js";
export {
	Callout, CALLOUT_VARIANT_PRESETS,
	type CalloutProps, type CalloutVariant,
} from "./components/callout/index.js";
export {
	Banner, BANNER_INTENT_PRESETS,
	type BannerProps, type BannerIntent,
} from "./components/banner/index.js";
export { Progress, type ProgressProps, type ProgressSize } from "./components/progress/index.js";

// ── Layout ──
export { Grid, type GridProps, type GridColumns, type GridGap, type GridRows } from "./components/grid/index.js";
export { Stack, type StackProps, type StackGap, type StackAlign } from "./components/stack/index.js";
export { HStack, type HStackProps, type HStackGap, type HStackAlign, type HStackJustify } from "./components/hstack/index.js";
export { Box, type BoxProps, type BoxPadding, type BoxRadius } from "./components/box/index.js";
export { Container, type ContainerProps, type ContainerSize } from "./components/container/index.js";

export type { ComponentSurfaceProps } from "./components/types.js";

// ── SVG Neuromorphism (premium tier surfaces) ──
export { default as NeuPanel } from "./svg/surfaces/NeuPanel.svelte";
export { default as NeuGauge } from "./svg/surfaces/NeuGauge.svelte";
export { default as NeuFrame } from "./svg/surfaces/NeuFrame.svelte";

// ── Blocks ──
export { Widget, WidgetHeader, WidgetTabs, WidgetContent, WidgetFooter } from "./blocks/widgets/index.js";
export type { WidgetProps, WidgetTab, WidgetSize } from "./blocks/widgets/index.js";

// Block infrastructure
export { BlockNodeSchema, BlockDocumentSchema, createBlockNode, createBlockDocument, BLOCK_CATEGORIES } from "./blocks/index.js";
export type { BlockNode, BlockDocument, BlockCategory } from "./blocks/index.js";

// ── Renderers ──
export { BlockRenderer, resolveClasses } from "./renderers/index.js";
export type { RendererContext } from "./renderers/index.js";

// ── Recipes ──
export { getRecipe, getRecipesForKind, registerRecipe } from "./recipes/index.js";
export type { DsSurfaceProps, RecipeDefinition } from "./recipes/types.js";

// Recipe registration (side-effect imports — triggers registerRecipe calls)
import "./recipes/layouts/shell/index.js";
import "./recipes/blocks/widget/index.js";
import "./recipes/components/index.js";

// ── Blueprints ──
export { getBlueprint, getBlueprintsForKind, registerBlueprint } from "./blueprints/index.js";
export type { BlueprintDefinition } from "./blueprints/types.js";

// ── Token Types (SSOT: recipes/_base/schema.ts → recipes/types.ts) ──
export {
	SizeTokens, type SizeToken, SizeSchema,
	RadiusTokens, type RadiusToken, RadiusSchema,
} from "./recipes/types.js";
