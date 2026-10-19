/**
 * @file SizeName — central sizing tokens
 * @package @devpulse/coldlight
 *
 * Structural sizing applied via Tailwind class maps in components.
 * NOT a visual axis — size affects height, padding, font-size, gap.
 */

/** Standard size scale */
export type SizeName = "xs" | "sm" | "md" | "lg" | "xl";

/** Runtime array for VPB size selector */
export const SIZE_NAMES: readonly SizeName[] = ["xs", "sm", "md", "lg", "xl"] as const;

/** Size labels for VPB */
export const SIZE_LABELS: Record<SizeName, string> = {
	xs: "Extra Small",
	sm: "Small",
	md: "Medium",
	lg: "Large",
	xl: "Extra Large",
} as const;
