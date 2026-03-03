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
	buttonComponentContract,
	buttonRecipe,
	type ButtonProps,
	type ButtonSize,
} from "./button/index.js";

// ============================================
// LAYOUT
// ============================================

export {
	Grid,
	gridRecipe,
	type GridProps,
	type GridColumns,
	type GridGap,
} from "./grid/index.js";

export {
	Stack,
	stackRecipe,
	type StackProps,
	type StackGap,
	type StackAlign,
} from "./stack/index.js";

export {
	HStack,
	hstackRecipe,
	type HStackProps,
	type HStackGap,
	type HStackAlign,
	type HStackJustify,
} from "./hstack/index.js";

export {
	Box,
	boxRecipe,
	type BoxProps,
	type BoxPadding,
} from "./box/index.js";

export {
	Container,
	containerRecipe,
	type ContainerProps,
	type ContainerSize,
} from "./container/index.js";

// ============================================
// TYPOGRAPHY
// ============================================

export {
	Text,
	textRecipe,
	type TextProps,
	type TextSize,
	type TextWeight,
	type TextColor,
	type TextAs,
} from "./text/index.js";

export {
	Heading,
	headingRecipe,
	type HeadingProps,
	type HeadingLevel,
	type HeadingSize,
} from "./heading/index.js";

// ============================================
// DATA DISPLAY
// ============================================

export {
	Stat,
	statRecipe,
	type StatProps,
	type StatSize,
} from "./stat/index.js";

export {
	Badge,
	badgeRecipe,
	type BadgeProps,
	type BadgeIntent,
	type BadgeSize,
} from "./badge/index.js";

export {
	Card,
	cardRecipe,
	type CardProps,
	type CardVariant,
	type CardSize,
} from "./card/index.js";

export {
	Separator,
	separatorRecipe,
	type SeparatorProps,
	type SeparatorOrientation,
} from "./separator/index.js";
