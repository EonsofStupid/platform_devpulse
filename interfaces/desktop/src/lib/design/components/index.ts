/**
 * @file components/index.ts
 * @layer components
 *
 * Component exports. Components will be added as they are built
 * against taxonomy contracts with proper ARIA enforcement.
 */

export type { ComponentSurfaceProps } from "./types.js";

// ============================================
// COMPONENTS
// ============================================

export {
	Button,
	useButton,
	type ButtonIntent,
	type ButtonProps,
	type ButtonSize,
	type ButtonType,
	type UseButtonProps,
	type UseButtonReturn,
	BUTTON_INTENT_PRESETS,
} from "./button/index.js";

// ============================================
// LAYOUT
// ============================================

export {
	Box,
	type BoxPadding,
	type BoxProps,
	boxRecipe,
} from "./box/index.js";
export {
	Container,
	type ContainerProps,
	type ContainerSize,
	containerRecipe,
} from "./container/index.js";
export {
	Grid,
	type GridColumns,
	type GridGap,
	type GridProps,
	gridRecipe,
} from "./grid/index.js";
export {
	HStack,
	type HStackAlign,
	type HStackGap,
	type HStackJustify,
	type HStackProps,
	hstackRecipe,
} from "./hstack/index.js";
export {
	Stack,
	type StackAlign,
	type StackGap,
	type StackProps,
	stackRecipe,
} from "./stack/index.js";

// ============================================
// TYPOGRAPHY
// ============================================

export {
	Heading,
	type HeadingLevel,
	type HeadingProps,
	type HeadingSize,
	headingRecipe,
} from "./heading/index.js";
export {
	Text,
	type TextAs,
	type TextColor,
	type TextProps,
	type TextSize,
	type TextWeight,
	textRecipe,
} from "./text/index.js";

// ============================================
// DATA DISPLAY
// ============================================

export {
	Badge,
	type BadgeProps,
	type BadgeSize,
	type BadgeVariant,
	type BadgeFillStyle,
} from "./badge/index.js";
export * as Card from "./card/index.js";
export {
	Separator,
	type SeparatorOrientation,
	type SeparatorProps,
	separatorRecipe,
} from "./separator/index.js";
export {
	Stat,
	type StatProps,
	type StatSize,
	statRecipe,
} from "./stat/index.js";
