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
