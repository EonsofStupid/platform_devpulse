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
	Button,
	type ButtonIntent,
	type ButtonProps,
	type ButtonSize,
	type ButtonType,
} from "./button/index.js";

// ============================================
// LAYOUT
// ============================================

export {
	Box,
	type BoxPadding,
	type BoxProps,
	boxComposition,
} from "./box/index.js";
export {
	Container,
	type ContainerProps,
	type ContainerSize,
	containerComposition,
} from "./container/index.js";
export {
	Grid,
	type GridColumns,
	type GridGap,
	type GridProps,
	gridComposition,
} from "./grid/index.js";
export {
	HStack,
	type HStackAlign,
	type HStackGap,
	type HStackJustify,
	type HStackProps,
	hstackComposition,
} from "./hstack/index.js";
export {
	Stack,
	type StackAlign,
	type StackGap,
	type StackProps,
	stackComposition,
} from "./stack/index.js";

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
	type AvatarProps,
	type AvatarLoadStatus,
	type AvatarStatusChangeDetails,
} from "./avatar/index.js";
export {
	Badge,
	type BadgeProps,
	type BadgeSize,
	type BadgeVariant,
	type BadgeFillStyle,
} from "./badge/index.js";
export {
	Card,
	type CardProps,
	type CardVariant,
	type CardAs,
	type CardOrientation,
} from "./card/index.js";
export {
	Separator,
	type SeparatorOrientation,
	type SeparatorProps,
	separatorComposition,
} from "./separator/index.js";
export {
	Stat,
	type StatProps,
	type StatSize,
	statComposition,
} from "./stat/index.js";

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
