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
	type ButtonComponentProps,
	type ButtonIntent,
	type ButtonSize,
} from "./button/index.js";

// ============================================
// LAYOUT
// ============================================

export {
	Grid,
	gridRecipe,
	type GridComponentProps,
	type GridColumns,
	type GridGap,
} from "./grid/index.js";

export {
	Stack,
	stackRecipe,
	type StackComponentProps,
	type StackGap,
	type StackAlign,
} from "./stack/index.js";

export {
	HStack,
	hstackRecipe,
	type HStackComponentProps,
	type HStackGap,
	type HStackAlign,
	type HStackJustify,
} from "./hstack/index.js";

export {
	Box,
	boxRecipe,
	type BoxComponentProps,
	type BoxPadding,
} from "./box/index.js";

export {
	Container,
	containerRecipe,
	type ContainerComponentProps,
	type ContainerSize,
} from "./container/index.js";

// ============================================
// TYPOGRAPHY
// ============================================

export {
	Text,
	textRecipe,
	type TextComponentProps,
	type TextSize,
	type TextWeight,
	type TextColor,
	type TextAs,
} from "./text/index.js";

export {
	Heading,
	headingRecipe,
	type HeadingComponentProps,
	type HeadingLevel,
	type HeadingSize,
} from "./heading/index.js";

// ============================================
// DATA DISPLAY
// ============================================

export {
	Stat,
	statRecipe,
	type StatComponentProps,
	type StatSize,
} from "./stat/index.js";

export {
	Badge,
	badgeRecipe,
	type BadgeComponentProps,
	type BadgeIntent,
	type BadgeSize,
} from "./badge/index.js";

export {
	Card,
	cardRecipe,
	type CardComponentProps,
	type CardVariant,
	type CardSize,
} from "./card/index.js";

export {
	Separator,
	separatorRecipe,
	type SeparatorComponentProps,
	type SeparatorOrientation,
} from "./separator/index.js";
