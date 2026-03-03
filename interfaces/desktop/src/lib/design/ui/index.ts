/**
 * @file ui/index.ts
 * @layer ui
 *
 * PUBLIC API — styled components. Users import from here.
 * Each ui/{kind}/ wraps components/{kind}/ + recipe + ColdLight visual.
 */

// Interactive
export {
	Button,
	BUTTON_INTENT_PRESETS,
	type ButtonUIProps,
	type ButtonIntent,
	type ButtonSize,
} from "./button/index.js";
export { Checkbox, type CheckboxUIProps, type CheckboxIntent, type CheckboxSize } from "./checkbox/index.js";
export { Switch, type SwitchUIProps, type SwitchSize } from "./switch/index.js";

// Form
export { Input, type InputUIProps, type InputSize } from "./input/index.js";
export { Textarea, type TextareaUIProps, type TextareaSize } from "./textarea/index.js";
export { Label, type LabelUIProps, type LabelSize } from "./label/index.js";

// Typography
export { Text, type TextUIProps, type TextSize, type TextWeight, type TextColor, type TextAs } from "./text/index.js";
export { Heading, type HeadingUIProps, type HeadingLevel, type HeadingSize } from "./heading/index.js";

// Data display
export { Stat, type StatUIProps, type StatSize } from "./stat/index.js";
export {
	Badge,
	BADGE_INTENT_PRESETS,
	type BadgeUIProps,
	type BadgeIntent,
	type BadgeSize,
} from "./badge/index.js";
export {
	Card,
	CARD_VARIANT_PRESETS,
	type CardUIProps,
	type CardVariant,
	type CardSize,
} from "./card/index.js";
export {
	Separator,
	type SeparatorUIProps,
	type SeparatorOrientation,
	type SeparatorVariant,
} from "./separator/index.js";
export { Code, type CodeUIProps, type CodeLanguage } from "./code/index.js";
export { Kbd, type KbdUIProps, type KbdSize } from "./kbd/index.js";
export { InlineMessage, type InlineMessageUIProps, type InlineMessageTone } from "./inline-message/index.js";

// Feedback
export {
	Alert,
	ALERT_INTENT_PRESETS,
	type AlertUIProps,
	type AlertIntent,
} from "./alert/index.js";
export { Spinner, type SpinnerUIProps, type SpinnerSize } from "./spinner/index.js";
export { Skeleton, type SkeletonUIProps, type SkeletonVariant } from "./skeleton/index.js";
export { EmptyState, type EmptyStateUIProps, type EmptyStateSize } from "./empty-state/index.js";
export {
	Callout,
	CALLOUT_VARIANT_PRESETS,
	type CalloutUIProps,
	type CalloutVariant,
} from "./callout/index.js";
export {
	Banner,
	BANNER_INTENT_PRESETS,
	type BannerUIProps,
	type BannerIntent,
} from "./banner/index.js";
export { Progress, type ProgressUIProps, type ProgressSize } from "./progress/index.js";
export { Toggle, type ToggleUIProps, type ToggleSize } from "./toggle/index.js";
export { Avatar, type AvatarUIProps, type AvatarSize } from "./avatar/index.js";

// Layout
export { Grid, type GridUIProps, type GridColumns, type GridGap, type GridRows } from "./grid/index.js";
export { Stack, type StackUIProps, type StackGap, type StackAlign } from "./stack/index.js";
export { HStack, type HStackUIProps, type HStackGap, type HStackAlign, type HStackJustify } from "./hstack/index.js";
export { Box, type BoxUIProps, type BoxPadding, type BoxRadius } from "./box/index.js";
export { Container, type ContainerUIProps, type ContainerSize } from "./container/index.js";
